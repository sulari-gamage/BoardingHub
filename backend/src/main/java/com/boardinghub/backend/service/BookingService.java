package com.boardinghub.backend.service;

import com.boardinghub.backend.dto.request.BookingRequestCreateDTO;
import com.boardinghub.backend.dto.request.BookingStatusUpdateDTO;
import com.boardinghub.backend.dto.response.BookingResponse;
import com.boardinghub.backend.entity.BoardingProperty;
import com.boardinghub.backend.entity.BookingRequest;
import com.boardinghub.backend.entity.Room;
import com.boardinghub.backend.entity.User;
import com.boardinghub.backend.enums.BookingStatus;
import com.boardinghub.backend.enums.BookingType;
import com.boardinghub.backend.enums.Role;
import com.boardinghub.backend.repository.BoardingPropertyRepository;
import com.boardinghub.backend.repository.BookingRequestRepository;
import com.boardinghub.backend.repository.RoomRepository;
import com.boardinghub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.boardinghub.backend.enums.NotificationType;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRequestRepository bookingRepository;
    private final BoardingPropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse createBookingRequest(BookingRequestCreateDTO request, String seekerEmail) {
        User seeker = userRepository.findByEmail(seekerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Seeker user not found"));

        BoardingProperty property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + request.getPropertyId()));

        Room room = null;
        if (request.getRoomId() != null) {
            room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new IllegalArgumentException("Room not found with ID: " + request.getRoomId()));

            if (room.getRemainingSpaces() < request.getOccupantsCount()) {
                throw new IllegalArgumentException("Selected room only has " + room.getRemainingSpaces() +
                        " remaining spaces, but " + request.getOccupantsCount() + " occupants were requested.");
            }
        }

        BookingType bookingType = request.getBookingType();
        if (bookingType == null) {
            bookingType = (room != null) ? BookingType.ROOM_BASED : BookingType.WHOLE_HOUSE;
        }

        BookingRequest booking = BookingRequest.builder()
                .property(property)
                .room(room)
                .seeker(seeker)
                .bookingType(bookingType)
                .occupantsCount(request.getOccupantsCount())
                .moveInDate(request.getMoveInDate())
                .status(BookingStatus.PENDING)
                .notes(request.getNotes())
                .build();

        BookingRequest savedBooking = bookingRepository.save(booking);

        // Notify property owner of new booking request
        if (property.getOwner() != null) {
            String unitInfo = (room != null) ? room.getRoomName() + " (" + (room.getRoomType() != null ? room.getRoomType() : "Room") + ")" : "Property";
            String title = "New Booking Request 📩";
            String message = seeker.getName() + " has requested to book " + unitInfo + " at " + property.getTitle() + ".";
            notificationService.createAndSendNotification(
                    property.getOwner(),
                    NotificationType.BOOKING_REQUEST,
                    title,
                    message,
                    savedBooking.getId(),
                    property.getId(),
                    null
            );
        }

        return mapToBookingResponse(savedBooking);
    }

    public List<BookingResponse> getSeekerBookings(String seekerEmail) {
        User seeker = userRepository.findByEmail(seekerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Seeker user not found"));
        return bookingRepository.findBySeekerId(seeker.getId())
                .stream().map(this::mapToBookingResponse).collect(Collectors.toList());
    }

    public List<BookingResponse> getOwnerBookingRequests(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Owner user not found"));
        return bookingRepository.findByOwnerIdSortedByOccupants(owner.getId())
                .stream().map(this::mapToBookingResponse).collect(Collectors.toList());
    }

    public List<BookingResponse> getBookingsByPropertyId(Long propertyId) {
        return bookingRepository.findByPropertyId(propertyId)
                .stream().map(this::mapToBookingResponse).collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, BookingStatusUpdateDTO dto, String userEmail) {
        BookingRequest booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking request not found with ID: " + bookingId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isOwner = booking.getProperty() != null
                && booking.getProperty().getOwner() != null
                && booking.getProperty().getOwner().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isSeekerOwnerOfBooking = booking.getSeeker() != null
                && booking.getSeeker().getId().equals(user.getId());

        BookingStatus oldStatus = booking.getStatus();
        BookingStatus newStatus = dto.getStatus();

        if (!isOwner && !isAdmin && !(isSeekerOwnerOfBooking && newStatus == BookingStatus.CANCELLED)) {
            throw new IllegalArgumentException("Access denied: you do not have permission to perform this action.");
        }

        // If status is being updated to APPROVED, enforce capacity check & deduct remaining spaces
        if (newStatus == BookingStatus.APPROVED && oldStatus != BookingStatus.APPROVED) {
            Room room = booking.getRoom();
            BoardingProperty prop = booking.getProperty();

            if (room != null) {
                if (room.getRemainingSpaces() < booking.getOccupantsCount()) {
                    throw new IllegalArgumentException("Cannot approve request: Only " + room.getRemainingSpaces() +
                            " spaces remaining in room, but request requires " + booking.getOccupantsCount());
                }
                int newRem = room.getRemainingSpaces() - booking.getOccupantsCount();
                int currentOcc = room.getOccupied() != null ? room.getOccupied() : Math.max(0, room.getTotalCapacity() - room.getRemainingSpaces());
                int newOcc = currentOcc + booking.getOccupantsCount();
                room.setRemainingSpaces(newRem);
                room.setOccupied(newOcc);
                roomRepository.save(room);

                // Also sync property totalOccupied
                if (prop != null && prop.getRooms() != null) {
                    int totalOcc = prop.getRooms().stream()
                            .mapToInt(r -> r.getId().equals(room.getId()) ? newOcc : (r.getOccupied() != null ? r.getOccupied() : Math.max(0, (r.getTotalCapacity() != null ? r.getTotalCapacity() : 1) - (r.getRemainingSpaces() != null ? r.getRemainingSpaces() : 0))))
                            .sum();
                    prop.setTotalOccupied(totalOcc);
                    propertyRepository.save(prop);
                }

                // Auto-reject other PENDING requests if this room is now fully occupied
                autoRejectPendingRequestsForFilledUnit(room, prop, booking.getId());
            } else if (prop != null) {
                // Whole house or property-level booking
                int currentOcc = prop.getTotalOccupied() != null ? prop.getTotalOccupied() : 0;
                prop.setTotalOccupied(currentOcc + booking.getOccupantsCount());
                propertyRepository.save(prop);

                // Auto-reject other PENDING requests if this property is now fully occupied
                autoRejectPendingRequestsForFilledUnit(null, prop, booking.getId());
            }
        }

        // If status was APPROVED and is now being REJECTED or CANCELLED, restore capacity
        if (oldStatus == BookingStatus.APPROVED && newStatus != BookingStatus.APPROVED) {
            Room room = booking.getRoom();
            BoardingProperty prop = booking.getProperty();

            if (room != null) {
                int newRem = (room.getRemainingSpaces() != null ? room.getRemainingSpaces() : 0) + booking.getOccupantsCount();
                int newOcc = Math.max(0, (room.getOccupied() != null ? room.getOccupied() : 0) - booking.getOccupantsCount());
                room.setRemainingSpaces(newRem);
                room.setOccupied(newOcc);
                roomRepository.save(room);

                if (prop != null && prop.getRooms() != null) {
                    int totalOcc = Math.max(0, (prop.getTotalOccupied() != null ? prop.getTotalOccupied() : 0) - booking.getOccupantsCount());
                    prop.setTotalOccupied(totalOcc);
                    propertyRepository.save(prop);
                }
            } else if (prop != null) {
                int currentOcc = prop.getTotalOccupied() != null ? prop.getTotalOccupied() : 0;
                prop.setTotalOccupied(Math.max(0, currentOcc - booking.getOccupantsCount()));
                propertyRepository.save(prop);
            }
        }

        booking.setStatus(newStatus);
        BookingRequest updatedBooking = bookingRepository.save(booking);

        // Trigger notification based on status change
        if (newStatus == BookingStatus.APPROVED && booking.getSeeker() != null) {
            String unitInfo = (booking.getRoom() != null) ? booking.getRoom().getRoomName() : "Boarding Place";
            String title = "Booking Approved 🎉";
            String message = "Your booking request for " + unitInfo + " at " + (booking.getProperty() != null ? booking.getProperty().getTitle() : "Boarding Place") + " has been approved.";
            notificationService.createAndSendNotification(
                    booking.getSeeker(),
                    NotificationType.BOOKING_APPROVED,
                    title,
                    message,
                    booking.getId(),
                    booking.getProperty() != null ? booking.getProperty().getId() : null,
                    null
            );
        } else if (newStatus == BookingStatus.REJECTED && booking.getSeeker() != null) {
            String title = "Booking Request Update";
            String message = "Your booking request for " + (booking.getProperty() != null ? booking.getProperty().getTitle() : "Boarding Place") + " was not accepted at this time.";
            notificationService.createAndSendNotification(
                    booking.getSeeker(),
                    NotificationType.BOOKING_REJECTED,
                    title,
                    message,
                    booking.getId(),
                    booking.getProperty() != null ? booking.getProperty().getId() : null,
                    null
            );
        } else if (newStatus == BookingStatus.CANCELLED) {
            User targetUser = isSeekerOwnerOfBooking
                    ? (booking.getProperty() != null ? booking.getProperty().getOwner() : null)
                    : booking.getSeeker();
            if (targetUser != null) {
                String title = "Booking Cancelled ⚠️";
                String message = "The booking for " + (booking.getProperty() != null ? booking.getProperty().getTitle() : "Boarding Place") + " has been cancelled.";
                notificationService.createAndSendNotification(
                        targetUser,
                        NotificationType.BOOKING_CANCELLED,
                        title,
                        message,
                        booking.getId(),
                        booking.getProperty() != null ? booking.getProperty().getId() : null,
                        null
                );
            }
        }

        return mapToBookingResponse(updatedBooking);
    }

    @Transactional
    public void deleteBookingRequest(Long bookingId, String userEmail) {
        BookingRequest booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking request not found with ID: " + bookingId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isOwner = booking.getProperty() != null
                && booking.getProperty().getOwner() != null
                && booking.getProperty().getOwner().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isSeekerOwnerOfBooking = booking.getSeeker() != null
                && booking.getSeeker().getId().equals(user.getId());

        if (!isOwner && !isAdmin && !isSeekerOwnerOfBooking) {
            throw new IllegalArgumentException("Access denied: you do not have permission to delete this booking request.");
        }

        // If booking was APPROVED, restore capacity prior to deletion
        if (booking.getStatus() == BookingStatus.APPROVED) {
            Room room = booking.getRoom();
            BoardingProperty prop = booking.getProperty();

            if (room != null) {
                int newRem = (room.getRemainingSpaces() != null ? room.getRemainingSpaces() : 0) + booking.getOccupantsCount();
                int newOcc = Math.max(0, (room.getOccupied() != null ? room.getOccupied() : 0) - booking.getOccupantsCount());
                room.setRemainingSpaces(newRem);
                room.setOccupied(newOcc);
                roomRepository.save(room);

                if (prop != null && prop.getRooms() != null) {
                    int totalOcc = Math.max(0, (prop.getTotalOccupied() != null ? prop.getTotalOccupied() : 0) - booking.getOccupantsCount());
                    prop.setTotalOccupied(totalOcc);
                    propertyRepository.save(prop);
                }
            } else if (prop != null) {
                int currentOcc = prop.getTotalOccupied() != null ? prop.getTotalOccupied() : 0;
                prop.setTotalOccupied(Math.max(0, currentOcc - booking.getOccupantsCount()));
                propertyRepository.save(prop);
            }
        }

        bookingRepository.delete(booking);
    }

    private BookingResponse mapToBookingResponse(BookingRequest b) {
        Double unitPrice = null;
        String rentType = "PER_PERSON";
        Double monthlyPrice = 0.0;
        int count = b.getOccupantsCount() != null ? b.getOccupantsCount() : 1;

        if (b.getRoom() != null) {
            unitPrice = b.getRoom().getMonthlyPrice();
            rentType = b.getRoom().getRentType() != null ? b.getRoom().getRentType() : "PER_PERSON";
            if ("PER_PERSON".equalsIgnoreCase(rentType)) {
                monthlyPrice = (unitPrice != null ? unitPrice : 0.0) * count;
            } else {
                monthlyPrice = unitPrice != null ? unitPrice : 0.0;
            }
        } else if (b.getProperty() != null) {
            unitPrice = b.getProperty().getMonthlyRent();
            rentType = "PER_ROOM";
            monthlyPrice = unitPrice != null ? unitPrice : 0.0;
        }

        String propImageUrl = null;
        if (b.getProperty() != null) {
            try {
                if (b.getProperty().getImages() != null && !b.getProperty().getImages().isEmpty()) {
                    propImageUrl = b.getProperty().getImages().get(0).getImageUrl();
                }
            } catch (Exception e) {
                // Ignore lazy loading exception if uninitialized
            }
        }

        Integer remainingSpaces = null;
        if (b.getRoom() != null) {
            remainingSpaces = b.getRoom().getRemainingSpaces();
        } else if (b.getProperty() != null) {
            int capacity = b.getProperty().getTotalCapacity() != null ? b.getProperty().getTotalCapacity() : 0;
            int occupied = b.getProperty().getTotalOccupied() != null ? b.getProperty().getTotalOccupied() : 0;
            remainingSpaces = Math.max(0, capacity - occupied);
        }

        User owner = b.getProperty() != null ? b.getProperty().getOwner() : null;

        return BookingResponse.builder()
                .id(b.getId())
                .propertyId(b.getProperty() != null ? b.getProperty().getId() : null)
                .propertyTitle(b.getProperty() != null ? b.getProperty().getTitle() : null)
                .imageUrl(propImageUrl)
                .roomId(b.getRoom() != null ? b.getRoom().getId() : null)
                .roomName(b.getRoom() != null ? b.getRoom().getRoomName() : null)
                .roomType(b.getRoom() != null ? b.getRoom().getRoomType() : null)
                .bookingType(b.getBookingType())
                .seekerId(b.getSeeker() != null ? b.getSeeker().getId() : null)
                .seekerName(b.getSeeker() != null ? b.getSeeker().getName() : null)
                .seekerPhone(b.getSeeker() != null ? b.getSeeker().getWhatsappNumber() : null)
                .seekerAvatarUrl(b.getSeeker() != null ? b.getSeeker().getAvatarUrl() : null)
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getName() : null)
                .ownerPhone(owner != null ? owner.getWhatsappNumber() : null)
                .ownerAvatarUrl(owner != null ? owner.getAvatarUrl() : null)
                .remainingSpaces(remainingSpaces)
                .occupantsCount(b.getOccupantsCount())
                .moveInDate(b.getMoveInDate())
                .unitPrice(unitPrice)
                .rentType(rentType)
                .monthlyPrice(monthlyPrice)
                .status(b.getStatus())
                .notes(b.getNotes())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }

    private void autoRejectPendingRequestsForFilledUnit(Room room, BoardingProperty prop, Long currentBookingId) {
        if (room != null) {
            // If room remaining spaces <= 0, auto reject all other pending requests for this room
            if (room.getRemainingSpaces() != null && room.getRemainingSpaces() <= 0) {
                List<BookingRequest> pendingRoomReqs = bookingRepository.findByRoomIdAndStatus(room.getId(), BookingStatus.PENDING);
                for (BookingRequest req : pendingRoomReqs) {
                    if (!req.getId().equals(currentBookingId)) {
                        req.setStatus(BookingStatus.REJECTED);
                        bookingRepository.save(req);
                    }
                }
            }
            // If all rooms in property are now filled, auto reject any remaining pending property requests
            if (prop != null && prop.getRooms() != null) {
                boolean allFilled = prop.getRooms().stream()
                        .allMatch(r -> r.getRemainingSpaces() != null && r.getRemainingSpaces() <= 0);
                if (allFilled) {
                    List<BookingRequest> pendingPropReqs = bookingRepository.findByPropertyIdAndStatus(prop.getId(), BookingStatus.PENDING);
                    for (BookingRequest req : pendingPropReqs) {
                        if (!req.getId().equals(currentBookingId)) {
                            req.setStatus(BookingStatus.REJECTED);
                            bookingRepository.save(req);
                        }
                    }
                }
            }
        } else if (prop != null) {
            int cap = prop.getTotalCapacity() != null ? prop.getTotalCapacity() : 1;
            int occ = prop.getTotalOccupied() != null ? prop.getTotalOccupied() : 0;
            if ((cap - occ) <= 0) {
                List<BookingRequest> pendingPropReqs = bookingRepository.findByPropertyIdAndStatus(prop.getId(), BookingStatus.PENDING);
                for (BookingRequest req : pendingPropReqs) {
                    if (!req.getId().equals(currentBookingId)) {
                        req.setStatus(BookingStatus.REJECTED);
                        bookingRepository.save(req);
                    }
                }
            }
        }
    }
}
