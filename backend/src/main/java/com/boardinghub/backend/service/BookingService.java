package com.boardinghub.backend.service;

import com.boardinghub.backend.dto.request.BookingRequestCreateDTO;
import com.boardinghub.backend.dto.request.BookingStatusUpdateDTO;
import com.boardinghub.backend.dto.response.BookingResponse;
import com.boardinghub.backend.entity.BoardingProperty;
import com.boardinghub.backend.entity.BookingRequest;
import com.boardinghub.backend.entity.Room;
import com.boardinghub.backend.entity.User;
import com.boardinghub.backend.enums.BookingStatus;
import com.boardinghub.backend.enums.Role;
import com.boardinghub.backend.repository.BoardingPropertyRepository;
import com.boardinghub.backend.repository.BookingRequestRepository;
import com.boardinghub.backend.repository.RoomRepository;
import com.boardinghub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRequestRepository bookingRepository;
    private final BoardingPropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

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

        BookingRequest booking = BookingRequest.builder()
                .property(property)
                .room(room)
                .seeker(seeker)
                .occupantsCount(request.getOccupantsCount())
                .moveInDate(request.getMoveInDate())
                .status(BookingStatus.PENDING)
                .notes(request.getNotes())
                .build();

        BookingRequest savedBooking = bookingRepository.save(booking);
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

    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, BookingStatusUpdateDTO dto, String userEmail) {
        BookingRequest booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking request not found with ID: " + bookingId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!booking.getProperty().getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("You are not authorized to update this booking request");
        }

        BookingStatus newStatus = dto.getStatus();

        // If status is being updated to APPROVED, enforce room capacity check & deduct remaining spaces
        if (newStatus == BookingStatus.APPROVED && booking.getStatus() != BookingStatus.APPROVED) {
            Room room = booking.getRoom();
            if (room != null) {
                if (room.getRemainingSpaces() < booking.getOccupantsCount()) {
                    throw new IllegalArgumentException("Cannot approve request: Only " + room.getRemainingSpaces() +
                            " spaces remaining in room, but request requires " + booking.getOccupantsCount());
                }
                room.setRemainingSpaces(room.getRemainingSpaces() - booking.getOccupantsCount());
                roomRepository.save(room);
            }
        }

        booking.setStatus(newStatus);
        BookingRequest updatedBooking = bookingRepository.save(booking);
        return mapToBookingResponse(updatedBooking);
    }

    private BookingResponse mapToBookingResponse(BookingRequest b) {
        Double monthlyPrice = b.getRoom() != null ? b.getRoom().getMonthlyPrice() : b.getProperty().getMonthlyRent();

        return BookingResponse.builder()
                .id(b.getId())
                .propertyId(b.getProperty().getId())
                .propertyTitle(b.getProperty().getTitle())
                .roomId(b.getRoom() != null ? b.getRoom().getId() : null)
                .roomType(b.getRoom() != null ? b.getRoom().getRoomType() : null)
                .seekerId(b.getSeeker().getId())
                .seekerName(b.getSeeker().getName())
                .seekerPhone(b.getSeeker().getWhatsappNumber())
                .occupantsCount(b.getOccupantsCount())
                .moveInDate(b.getMoveInDate())
                .monthlyPrice(monthlyPrice)
                .status(b.getStatus())
                .notes(b.getNotes())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
