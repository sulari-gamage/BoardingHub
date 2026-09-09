package com.boardinghub.backend.service;

import com.boardinghub.backend.dto.request.PropertyRequest;
import com.boardinghub.backend.dto.request.RoomRequest;
import com.boardinghub.backend.dto.response.PropertyImageDTO;
import com.boardinghub.backend.dto.response.PropertyResponse;
import com.boardinghub.backend.dto.response.RoomResponse;
import com.boardinghub.backend.entity.*;
import com.boardinghub.backend.enums.GenderPreference;
import com.boardinghub.backend.enums.PropertyStatus;
import com.boardinghub.backend.enums.Role;
import com.boardinghub.backend.repository.AmenityRepository;
import com.boardinghub.backend.repository.BoardingPropertyRepository;
import com.boardinghub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final BoardingPropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AmenityRepository amenityRepository;

    @Transactional
    public PropertyResponse createProperty(PropertyRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Owner user not found with email: " + ownerEmail));

        BoardingProperty property = BoardingProperty.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .genderPreference(request.getGenderPreference())
                .monthlyRent(request.getMonthlyRent())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .propertyNature(request.getPropertyNature())
                .status(PropertyStatus.APPROVED)
                .owner(owner)
                .build();

        List<Amenity> amenities = resolveAmenities(request);
        if (!amenities.isEmpty()) {
            property.setAmenities(amenities);
        }

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<PropertyImage> images = new ArrayList<>();
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                images.add(PropertyImage.builder()
                        .property(property)
                        .imageUrl(request.getImageUrls().get(i))
                        .isPrimary(i == 0)
                        .build());
            }
            property.setImages(images);
        }

        if (request.getRooms() != null && !request.getRooms().isEmpty()) {
            List<Room> rooms = request.getRooms().stream().map(roomReq -> {
                String img = (roomReq.getImageUrls() != null && !roomReq.getImageUrls().isEmpty()) 
                        ? roomReq.getImageUrls().get(0) 
                        : roomReq.getImageUrl();
                return Room.builder()
                        .property(property)
                        .roomName(roomReq.getRoomName())
                        .roomType(roomReq.getRoomType())
                        .monthlyPrice(roomReq.getMonthlyPrice())
                        .totalCapacity(roomReq.getTotalCapacity())
                        .remainingSpaces(roomReq.getRemainingSpaces() != null ? roomReq.getRemainingSpaces() : roomReq.getTotalCapacity())
                        .beds(roomReq.getBeds())
                        .washrooms(roomReq.getWashrooms())
                        .washroomType(roomReq.getWashroomType())
                        .amenities(roomReq.getAmenities())
                        .rentType(roomReq.getRentType() != null ? roomReq.getRentType() : "PER_PERSON")
                        .imageUrl(img)
                        .build();
            }).collect(Collectors.toList());
            property.setRooms(rooms);
        }

        BoardingProperty savedProperty = propertyRepository.save(property);
        return mapToPropertyResponse(savedProperty);
    }

    @Transactional
    public PropertyResponse updateProperty(Long id, PropertyRequest request, String userEmail) {
        BoardingProperty property = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (!property.getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("You are not authorized to update this property");
        }

        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setGenderPreference(request.getGenderPreference());
        property.setMonthlyRent(request.getMonthlyRent());
        property.setLatitude(request.getLatitude());
        property.setLongitude(request.getLongitude());
        property.setPropertyNature(request.getPropertyNature());

        List<Amenity> amenities = resolveAmenities(request);
        property.setAmenities(amenities);

        if (request.getImageUrls() != null) {
            property.getImages().clear();
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                property.getImages().add(PropertyImage.builder()
                        .property(property)
                        .imageUrl(request.getImageUrls().get(i))
                        .isPrimary(i == 0)
                        .build());
            }
        }

        if (request.getRooms() != null) {
            List<Room> existingRooms = property.getRooms();
            List<RoomRequest> newRoomReqs = request.getRooms();
            List<Room> processedRooms = new ArrayList<>();

            for (RoomRequest roomReq : newRoomReqs) {
                String img = (roomReq.getImageUrls() != null && !roomReq.getImageUrls().isEmpty())
                        ? roomReq.getImageUrls().get(0)
                        : roomReq.getImageUrl();

                Room roomToUpdate = null;
                if (roomReq.getId() != null) {
                    roomToUpdate = existingRooms.stream()
                            .filter(r -> r.getId().equals(roomReq.getId()))
                            .findFirst()
                            .orElse(null);
                }

                if (roomToUpdate != null) {
                    // Update existing entity in-place
                    roomToUpdate.setRoomName(roomReq.getRoomName());
                    roomToUpdate.setRoomType(roomReq.getRoomType());
                    roomToUpdate.setMonthlyPrice(roomReq.getMonthlyPrice());
                    roomToUpdate.setTotalCapacity(roomReq.getTotalCapacity());
                    roomToUpdate.setRemainingSpaces(roomReq.getRemainingSpaces() != null ? roomReq.getRemainingSpaces() : roomReq.getTotalCapacity());
                    roomToUpdate.setBeds(roomReq.getBeds());
                    roomToUpdate.setWashrooms(roomReq.getWashrooms());
                    roomToUpdate.setWashroomType(roomReq.getWashroomType());
                    roomToUpdate.setAmenities(roomReq.getAmenities());
                    roomToUpdate.setRentType(roomReq.getRentType() != null ? roomReq.getRentType() : "PER_PERSON");
                    roomToUpdate.setImageUrl(img);
                    processedRooms.add(roomToUpdate);
                } else {
                    // Create new room entity
                    Room newRoom = Room.builder()
                            .property(property)
                            .roomName(roomReq.getRoomName())
                            .roomType(roomReq.getRoomType())
                            .monthlyPrice(roomReq.getMonthlyPrice())
                            .totalCapacity(roomReq.getTotalCapacity())
                            .remainingSpaces(roomReq.getRemainingSpaces() != null ? roomReq.getRemainingSpaces() : roomReq.getTotalCapacity())
                            .beds(roomReq.getBeds())
                            .washrooms(roomReq.getWashrooms())
                            .washroomType(roomReq.getWashroomType())
                            .amenities(roomReq.getAmenities())
                            .rentType(roomReq.getRentType() != null ? roomReq.getRentType() : "PER_PERSON")
                            .imageUrl(img)
                            .build();
                    processedRooms.add(newRoom);
                }
            }

            // Remove existing rooms that are no longer part of the updated list
            existingRooms.retainAll(processedRooms);
            // Add any newly created room entities
            for (Room r : processedRooms) {
                if (!existingRooms.contains(r)) {
                    existingRooms.add(r);
                }
            }
        }

        BoardingProperty updatedProperty = propertyRepository.save(property);
        return mapToPropertyResponse(updatedProperty);
    }

    @Transactional
    public void deleteProperty(Long id, String userEmail) {
        BoardingProperty property = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (!property.getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("You are not authorized to delete this property");
        }

        propertyRepository.delete(property);
    }

    public List<PropertyResponse> searchApprovedProperties(String city, Double maxRent, GenderPreference gender) {
        List<BoardingProperty> properties = propertyRepository.searchProperties(
                PropertyStatus.APPROVED,
                (city != null && !city.isBlank()) ? city : null,
                maxRent,
                gender
        );
        return properties.stream().map(this::mapToPropertyResponse).collect(Collectors.toList());
    }

    public PropertyResponse getPropertyById(Long id) {
        BoardingProperty property = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + id));
        return mapToPropertyResponse(property);
    }

    public List<PropertyResponse> getOwnerProperties(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Owner user not found"));
        return propertyRepository.findByOwnerId(owner.getId())
                .stream().map(this::mapToPropertyResponse).collect(Collectors.toList());
    }

    public List<PropertyResponse> getPendingProperties() {
        return propertyRepository.findByStatus(PropertyStatus.PENDING)
                .stream().map(this::mapToPropertyResponse).collect(Collectors.toList());
    }

    @Transactional
    public PropertyResponse updatePropertyStatus(Long propertyId, PropertyStatus status) {
        BoardingProperty property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + propertyId));
        property.setStatus(status);
        BoardingProperty updated = propertyRepository.save(property);
        return mapToPropertyResponse(updated);
    }

    private PropertyResponse mapToPropertyResponse(BoardingProperty p) {
        List<String> amenityNames = p.getAmenities() != null ?
                p.getAmenities().stream().map(Amenity::getName).collect(Collectors.toList()) : new ArrayList<>();

        List<PropertyImageDTO> imageDTOs = p.getImages() != null ?
                p.getImages().stream().map(img -> PropertyImageDTO.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .isPrimary(img.isPrimary())
                        .build()).collect(Collectors.toList()) : new ArrayList<>();

        List<RoomResponse> roomResponses = p.getRooms() != null ?
                p.getRooms().stream().map(r -> RoomResponse.builder()
                        .id(r.getId())
                        .roomName(r.getRoomName())
                        .roomType(r.getRoomType())
                        .monthlyPrice(r.getMonthlyPrice())
                        .totalCapacity(r.getTotalCapacity())
                        .remainingSpaces(r.getRemainingSpaces())
                        .beds(r.getBeds())
                        .washrooms(r.getWashrooms())
                        .washroomType(r.getWashroomType())
                        .amenities(r.getAmenities())
                        .rentType(r.getRentType() != null ? r.getRentType() : "PER_PERSON")
                        .imageUrl(r.getImageUrl())
                        .build()).collect(Collectors.toList()) : new ArrayList<>();

        List<String> imageUrlList = p.getImages() != null ?
                p.getImages().stream().map(PropertyImage::getImageUrl).collect(Collectors.toList()) : new ArrayList<>();

        return PropertyResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .address(p.getAddress())
                .city(p.getCity())
                .genderPreference(p.getGenderPreference())
                .monthlyRent(p.getMonthlyRent())
                .status(p.getStatus())
                .ownerId(p.getOwner().getId())
                .ownerName(p.getOwner().getName())
                .ownerWhatsapp(p.getOwner().getWhatsappNumber())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .propertyNature(p.getPropertyNature())
                .amenities(amenityNames)
                .images(imageDTOs)
                .imageUrls(imageUrlList)
                .rooms(roomResponses)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private List<Amenity> resolveAmenities(PropertyRequest request) {
        List<Amenity> result = new ArrayList<>();
        if (request.getAmenityIds() != null && !request.getAmenityIds().isEmpty()) {
            result.addAll(amenityRepository.findAllById(request.getAmenityIds()));
        }
        if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
            for (String aName : request.getAmenities()) {
                if (aName != null && !aName.isBlank()) {
                    Amenity amenity = amenityRepository.findByName(aName)
                            .orElseGet(() -> amenityRepository.save(Amenity.builder().name(aName).build()));
                    if (!result.contains(amenity)) {
                        result.add(amenity);
                    }
                }
            }
        }
        return result;
    }
}
