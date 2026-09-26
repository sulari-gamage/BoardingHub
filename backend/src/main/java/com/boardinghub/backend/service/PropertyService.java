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
import com.boardinghub.backend.repository.BoardingPropertyRepository;
import com.boardinghub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.boardinghub.backend.repository.PropertyImageRepository;
import com.boardinghub.backend.repository.ReviewRepository;
import com.boardinghub.backend.repository.BookingRequestRepository;
import com.boardinghub.backend.repository.SavedPropertyRepository;
import com.boardinghub.backend.dto.response.GeocodeResponse;
import com.boardinghub.backend.service.GeocodingService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyService {

    private final BoardingPropertyRepository propertyRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final BookingRequestRepository bookingRequestRepository;
    private final SavedPropertyRepository savedPropertyRepository;
    private final GeocodingService geocodingService;

    @Transactional
    public PropertyResponse createProperty(PropertyRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Owner user not found with email: " + ownerEmail));

        Double lat = request.getLatitude();
        Double lng = request.getLongitude();

        // Auto-geocode if coordinates missing or zero
        if ((lat == null || lat == 0.0) || (lng == null || lng == 0.0)) {
            GeocodeResponse geoRes = geocodingService.geocodeAddress(request.getAddress(), request.getCity());
            if (geoRes != null && geoRes.isSuccess()) {
                lat = geoRes.getLatitude();
                lng = geoRes.getLongitude();
            }
        }

        BoardingProperty property = BoardingProperty.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .district(request.getDistrict())
                .genderPreference(request.getGenderPreference())
                .monthlyRent(request.getMonthlyRent())
                .latitude(lat)
                .longitude(lng)
                .propertyNature(request.getPropertyNature())
                .roomsCount(request.getRoomsCount())
                .bedsCount(request.getBedsCount())
                .bathsCount(request.getBathsCount())
                .totalCapacity(computeTotalCapacity(request))
                .totalOccupied(computeTotalOccupied(request))
                .hasKitchen(request.getHasKitchen())
                .isFurnished(request.getIsFurnished())
                .isElectricityIncluded(request.getIsElectricityIncluded())
                .isWaterIncluded(request.getIsWaterIncluded())
                .status(PropertyStatus.APPROVED)
                .owner(owner)
                .build();

        applyAmenities(property, request);

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
                int totCap = roomReq.getTotalCapacity() != null ? roomReq.getTotalCapacity() : 1;
                int occ = roomReq.getOccupied() != null 
                        ? roomReq.getOccupied() 
                        : (roomReq.getRemainingSpaces() != null ? Math.max(0, totCap - roomReq.getRemainingSpaces()) : 0);
                int rem = Math.max(0, totCap - occ);

                return Room.builder()
                        .property(property)
                        .roomName(roomReq.getRoomName())
                        .roomType(roomReq.getRoomType())
                        .monthlyPrice(roomReq.getMonthlyPrice())
                        .totalCapacity(totCap)
                        .occupied(occ)
                        .remainingSpaces(rem)
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

        if (!property.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to update this property");
        }

        Double lat = request.getLatitude();
        Double lng = request.getLongitude();
        if ((lat == null || lat == 0.0) || (lng == null || lng == 0.0)) {
            GeocodeResponse geoRes = geocodingService.geocodeAddress(request.getAddress(), request.getCity());
            if (geoRes != null && geoRes.isSuccess()) {
                lat = geoRes.getLatitude();
                lng = geoRes.getLongitude();
            }
        }

        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setDistrict(request.getDistrict());
        property.setGenderPreference(request.getGenderPreference());
        property.setMonthlyRent(request.getMonthlyRent());
        property.setLatitude(lat);
        property.setLongitude(lng);
        property.setPropertyNature(request.getPropertyNature());
        property.setRoomsCount(request.getRoomsCount());
        property.setBedsCount(request.getBedsCount());
        property.setBathsCount(request.getBathsCount());
        property.setTotalCapacity(computeTotalCapacity(request));
        property.setTotalOccupied(computeTotalOccupied(request));
        property.setHasKitchen(request.getHasKitchen());
        property.setIsFurnished(request.getIsFurnished());
        property.setIsElectricityIncluded(request.getIsElectricityIncluded());
        property.setIsWaterIncluded(request.getIsWaterIncluded());

        applyAmenities(property, request);

        if (request.getImageUrls() != null) {
            propertyImageRepository.deleteByPropertyId(property.getId());
            property.getImages().clear();
            List<PropertyImage> newImages = new ArrayList<>();
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                newImages.add(PropertyImage.builder()
                        .property(property)
                        .imageUrl(request.getImageUrls().get(i))
                        .isPrimary(i == 0)
                        .build());
            }
            if (!newImages.isEmpty()) {
                propertyImageRepository.saveAll(newImages);
                property.getImages().addAll(newImages);
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
                    int totCap = roomReq.getTotalCapacity() != null ? roomReq.getTotalCapacity() : (roomToUpdate.getTotalCapacity() != null ? roomToUpdate.getTotalCapacity() : 1);
                    int occ = roomReq.getOccupied() != null 
                            ? roomReq.getOccupied() 
                            : (roomReq.getRemainingSpaces() != null 
                                    ? Math.max(0, totCap - roomReq.getRemainingSpaces()) 
                                    : (roomToUpdate.getOccupied() != null ? Math.min(totCap, roomToUpdate.getOccupied()) : 0));
                    int rem = Math.max(0, totCap - occ);

                    roomToUpdate.setRoomName(roomReq.getRoomName());
                    roomToUpdate.setRoomType(roomReq.getRoomType());
                    roomToUpdate.setMonthlyPrice(roomReq.getMonthlyPrice());
                    roomToUpdate.setTotalCapacity(totCap);
                    roomToUpdate.setOccupied(occ);
                    roomToUpdate.setRemainingSpaces(rem);
                    roomToUpdate.setBeds(roomReq.getBeds());
                    roomToUpdate.setWashrooms(roomReq.getWashrooms());
                    roomToUpdate.setWashroomType(roomReq.getWashroomType());
                    roomToUpdate.setAmenities(roomReq.getAmenities());
                    roomToUpdate.setRentType(roomReq.getRentType() != null ? roomReq.getRentType() : "PER_PERSON");
                    roomToUpdate.setIsElectricityIncluded(roomReq.getIsElectricityIncluded());
                    roomToUpdate.setIsWaterIncluded(roomReq.getIsWaterIncluded());
                    roomToUpdate.setImageUrl(img);
                    processedRooms.add(roomToUpdate);
                } else {
                    // Create new room entity
                    int totCap = roomReq.getTotalCapacity() != null ? roomReq.getTotalCapacity() : 1;
                    int occ = roomReq.getOccupied() != null 
                            ? roomReq.getOccupied() 
                            : (roomReq.getRemainingSpaces() != null ? Math.max(0, totCap - roomReq.getRemainingSpaces()) : 0);
                    int rem = Math.max(0, totCap - occ);

                    Room newRoom = Room.builder()
                            .property(property)
                            .roomName(roomReq.getRoomName())
                            .roomType(roomReq.getRoomType())
                            .monthlyPrice(roomReq.getMonthlyPrice())
                            .totalCapacity(totCap)
                            .occupied(occ)
                            .remainingSpaces(rem)
                            .beds(roomReq.getBeds())
                            .washrooms(roomReq.getWashrooms())
                            .washroomType(roomReq.getWashroomType())
                            .amenities(roomReq.getAmenities())
                            .rentType(roomReq.getRentType() != null ? roomReq.getRentType() : "PER_PERSON")
                            .isElectricityIncluded(roomReq.getIsElectricityIncluded())
                            .isWaterIncluded(roomReq.getIsWaterIncluded())
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

        BoardingProperty updatedProperty = propertyRepository.saveAndFlush(property);
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

        savedPropertyRepository.deleteByPropertyId(id);
        bookingRequestRepository.deleteByPropertyId(id);
        reviewRepository.deleteByPropertyId(id);
        propertyRepository.delete(property);
    }

    @Transactional
    public PropertyResponse deleteRoom(Long propertyId, Long roomId, String userEmail) {
        BoardingProperty property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + propertyId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (!property.getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("You are not authorized to modify rooms for this property");
        }

        Room roomToDelete = property.getRooms().stream()
                .filter(r -> r.getId().equals(roomId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Room not found with ID: " + roomId));

        bookingRequestRepository.deleteByRoomId(roomId);
        property.getRooms().remove(roomToDelete);

        // Recalculate total capacity and occupied
        int totalCap = property.getRooms().stream()
                .mapToInt(r -> r.getTotalCapacity() != null ? r.getTotalCapacity() : 1)
                .sum();
        int occupiedCount = property.getRooms().stream()
                .mapToInt(r -> r.getOccupied() != null ? r.getOccupied() : Math.max(0, (r.getTotalCapacity() != null ? r.getTotalCapacity() : 1) - (r.getRemainingSpaces() != null ? r.getRemainingSpaces() : 0)))
                .sum();

        property.setTotalCapacity(totalCap);
        property.setTotalOccupied(occupiedCount);
        property.setRoomsCount(property.getRooms().size());

        BoardingProperty saved = propertyRepository.saveAndFlush(property);
        return mapToPropertyResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> searchApprovedProperties(String city, Double maxRent, GenderPreference gender) {
        List<BoardingProperty> properties = propertyRepository.searchProperties(
                PropertyStatus.APPROVED,
                (city != null && !city.isBlank()) ? city : null,
                maxRent,
                gender
        );
        return properties.stream().map(this::mapToPropertyResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PropertyResponse getPropertyById(Long id) {
        BoardingProperty property = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + id));
        return mapToPropertyResponse(property);
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> getOwnerProperties(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Owner user not found"));
        return propertyRepository.findByOwnerId(owner.getId())
                .stream().map(this::mapToPropertyResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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
        List<String> amenityNames = new ArrayList<>();
        PropertyAmenity pa = p.getAmenity();
        if (pa != null) {
            if (Boolean.TRUE.equals(pa.getHasWifi())) amenityNames.add("High-Speed WiFi");
            if (Boolean.TRUE.equals(pa.getHasWater())) amenityNames.add("Water Supply");
            if (Boolean.TRUE.equals(pa.getHasElectricity())) amenityNames.add("24/7 Electricity");
            if (Boolean.TRUE.equals(pa.getHasGas())) amenityNames.add("Gas Connection");
            if (Boolean.TRUE.equals(pa.getHasLaundry())) amenityNames.add("Laundry Room");
            if (Boolean.TRUE.equals(pa.getHasParking())) amenityNames.add("Covered Parking");
            if (Boolean.TRUE.equals(pa.getHasKitchen())) amenityNames.add("Shared Kitchen");
            if (Boolean.TRUE.equals(pa.getHasCommonArea())) amenityNames.add("Common Area");
            if (Boolean.TRUE.equals(pa.getHasPool())) amenityNames.add("Swimming Pool");
            if (Boolean.TRUE.equals(pa.getHasFitness())) amenityNames.add("Fitness Center");
            if (Boolean.TRUE.equals(pa.getHasCctv())) amenityNames.add("CCTV Security");
            if (Boolean.TRUE.equals(pa.getHasGate())) amenityNames.add("Secure Gate");
            if (Boolean.TRUE.equals(pa.getHasFireExtinguisher())) amenityNames.add("Fire Extinguisher");
            if (Boolean.TRUE.equals(pa.getHasFirstAid())) amenityNames.add("First Aid Kit");
            if (Boolean.TRUE.equals(pa.getHasAc())) amenityNames.add("Air Conditioning");
            if (Boolean.TRUE.equals(pa.getHasGenerator())) amenityNames.add("Generator Backup");
            if (Boolean.TRUE.equals(pa.getHasAttachedBathroom())) amenityNames.add("Attached Bathroom");
            if (Boolean.TRUE.equals(pa.getHasBalcony())) amenityNames.add("Private Balcony");
            if (pa.getCustomAmenities() != null && !pa.getCustomAmenities().isBlank()) {
                amenityNames.add(pa.getCustomAmenities());
            }
        }

        List<PropertyImageDTO> imageDTOs = p.getImages() != null ?
                p.getImages().stream().map(img -> PropertyImageDTO.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .isPrimary(img.isPrimary())
                        .build()).collect(Collectors.toList()) : new ArrayList<>();

        List<RoomResponse> roomResponses = p.getRooms() != null ?
                p.getRooms().stream().map(r -> {
                    int totCap = r.getTotalCapacity() != null ? r.getTotalCapacity() : 1;
                    int remSpace = r.getRemainingSpaces() != null ? r.getRemainingSpaces() : Math.max(0, totCap - (r.getOccupied() != null ? r.getOccupied() : 0));
                    int occCount = r.getOccupied() != null ? r.getOccupied() : Math.max(0, totCap - remSpace);
                    boolean isRoomFilled = (remSpace <= 0);

                    List<String> roomImgList = (r.getImageUrl() != null && !r.getImageUrl().isBlank())
                            ? List.of(r.getImageUrl())
                            : List.of();

                    return RoomResponse.builder()
                            .id(r.getId())
                            .roomName(r.getRoomName())
                            .roomType(r.getRoomType())
                            .monthlyPrice(r.getMonthlyPrice())
                            .totalCapacity(totCap)
                            .remainingSpaces(remSpace)
                            .occupied(occCount)
                            .isFilled(isRoomFilled)
                            .beds(r.getBeds())
                            .washrooms(r.getWashrooms())
                            .washroomType(r.getWashroomType())
                            .amenities(r.getAmenities())
                            .rentType(r.getRentType() != null ? r.getRentType() : "PER_PERSON")
                            .imageUrl(r.getImageUrl())
                            .imageUrls(roomImgList)
                            .isElectricityIncluded(r.getIsElectricityIncluded())
                            .isWaterIncluded(r.getIsWaterIncluded())
                            .build();
                }).collect(Collectors.toList()) : new ArrayList<>();

        List<String> imageUrlList = p.getImages() != null ?
                p.getImages().stream().map(PropertyImage::getImageUrl).collect(Collectors.toList()) : new ArrayList<>();

        Double avgRating = null;
        if (p.getId() != null) {
            List<Review> reviews = reviewRepository.findByPropertyIdOrderByCreatedAtDesc(p.getId());
            if (reviews != null && !reviews.isEmpty()) {
                double sum = reviews.stream().mapToInt(Review::getRating).sum();
                avgRating = Math.round((sum / reviews.size()) * 10.0) / 10.0;
            }
        }

        boolean isRoomBasedNature = "ROOM_BASED".equals(p.getPropertyNature());
        int finalTotCap = p.getTotalCapacity() != null ? p.getTotalCapacity() : (!roomResponses.isEmpty() ? roomResponses.stream().mapToInt(r -> r.getTotalCapacity() != null ? r.getTotalCapacity() : 1).sum() : (p.getBedsCount() != null ? p.getBedsCount() : 1));
        int finalTotOcc = p.getTotalOccupied() != null ? p.getTotalOccupied() : (!roomResponses.isEmpty() ? roomResponses.stream().mapToInt(r -> r.getOccupied() != null ? r.getOccupied() : 0).sum() : 0);

        boolean isPropFilled = false;
        if (isRoomBasedNature) {
            isPropFilled = !roomResponses.isEmpty() && roomResponses.stream().allMatch(r -> Boolean.TRUE.equals(r.getIsFilled()));
        } else {
            isPropFilled = (finalTotOcc >= finalTotCap);
        }

        return PropertyResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .address(p.getAddress())
                .city(p.getCity())
                .district(p.getDistrict())
                .genderPreference(p.getGenderPreference())
                .monthlyRent(p.getMonthlyRent())
                .status(p.getStatus())
                .ownerId(p.getOwner().getId())
                .ownerName(p.getOwner().getName())
                .ownerWhatsapp(p.getOwner().getWhatsappNumber())
                .ownerAvatar(p.getOwner().getAvatarUrl())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .propertyNature(p.getPropertyNature())
                .roomsCount(p.getRoomsCount())
                .bedsCount(p.getBedsCount())
                .bathsCount(p.getBathsCount())
                .totalCapacity(finalTotCap)
                .totalOccupied(finalTotOcc)
                .hasKitchen(p.getHasKitchen())
                .isFurnished(p.getIsFurnished())
                .isElectricityIncluded(p.getIsElectricityIncluded())
                .isWaterIncluded(p.getIsWaterIncluded())
                .amenities(amenityNames)
                .images(imageDTOs)
                .imageUrls(imageUrlList)
                .rooms(roomResponses)
                .rating(avgRating)
                .isFilled(isPropFilled)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private void applyAmenities(BoardingProperty property, PropertyRequest request) {
        PropertyAmenity pa = property.getAmenity();
        if (pa == null) {
            pa = PropertyAmenity.builder().property(property).build();
            property.setAmenity(pa);
        }

        if (request.getHasWifi() != null) pa.setHasWifi(request.getHasWifi());
        if (request.getHasWater() != null) pa.setHasWater(request.getHasWater());
        if (request.getHasElectricity() != null) pa.setHasElectricity(request.getHasElectricity());
        if (request.getHasGas() != null) pa.setHasGas(request.getHasGas());
        if (request.getHasLaundry() != null) pa.setHasLaundry(request.getHasLaundry());
        if (request.getHasParking() != null) pa.setHasParking(request.getHasParking());
        if (request.getHasKitchenAmenity() != null) pa.setHasKitchen(request.getHasKitchenAmenity());
        if (request.getHasCommonArea() != null) pa.setHasCommonArea(request.getHasCommonArea());
        if (request.getHasPool() != null) pa.setHasPool(request.getHasPool());
        if (request.getHasFitness() != null) pa.setHasFitness(request.getHasFitness());
        if (request.getHasCctv() != null) pa.setHasCctv(request.getHasCctv());
        if (request.getHasGate() != null) pa.setHasGate(request.getHasGate());
        if (request.getHasFireExtinguisher() != null) pa.setHasFireExtinguisher(request.getHasFireExtinguisher());
        if (request.getHasFirstAid() != null) pa.setHasFirstAid(request.getHasFirstAid());
        if (request.getHasAc() != null) pa.setHasAc(request.getHasAc());
        if (request.getHasGenerator() != null) pa.setHasGenerator(request.getHasGenerator());
        if (request.getHasAttachedBathroom() != null) pa.setHasAttachedBathroom(request.getHasAttachedBathroom());
        if (request.getHasBalcony() != null) pa.setHasBalcony(request.getHasBalcony());
        if (request.getCustomAmenities() != null) pa.setCustomAmenities(request.getCustomAmenities());

        if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
            List<String> list = request.getAmenities();
            pa.setHasWifi(list.contains("High-Speed WiFi") || list.contains("WiFi") ? true : null);
            pa.setHasWater(list.contains("Water Supply") || list.contains("Water") ? true : null);
            pa.setHasElectricity(list.contains("24/7 Electricity") || list.contains("Electricity") ? true : null);
            pa.setHasGas(list.contains("Gas Connection") || list.contains("Gas") ? true : null);
            pa.setHasLaundry(list.contains("Laundry Room") || list.contains("Laundry") ? true : null);
            pa.setHasParking(list.contains("Covered Parking") || list.contains("Parking") ? true : null);
            pa.setHasKitchen(list.contains("Shared Kitchen") || list.contains("Kitchen") ? true : null);
            pa.setHasCommonArea(list.contains("Common Area") ? true : null);
            pa.setHasPool(list.contains("Swimming Pool") || list.contains("Pool") ? true : null);
            pa.setHasFitness(list.contains("Fitness Center") || list.contains("Fitness") ? true : null);
            pa.setHasCctv(list.contains("CCTV Security") || list.contains("CCTV") ? true : null);
            pa.setHasGate(list.contains("Secure Gate") || list.contains("Gate") ? true : null);
            pa.setHasFireExtinguisher(list.contains("Fire Extinguisher") ? true : null);
            pa.setHasFirstAid(list.contains("First Aid Kit") ? true : null);
            pa.setHasAc(list.contains("Air Conditioning") || list.contains("AC") ? true : null);
            pa.setHasGenerator(list.contains("Generator Backup") || list.contains("Generator") ? true : null);
            pa.setHasAttachedBathroom(list.contains("Attached Bathroom") ? true : null);
            pa.setHasBalcony(list.contains("Private Balcony") ? true : null);
        }
    }

    private Integer computeTotalCapacity(PropertyRequest request) {
        if (request.getRooms() != null && !request.getRooms().isEmpty()) {
            return request.getRooms().stream()
                    .mapToInt(r -> r.getTotalCapacity() != null ? r.getTotalCapacity() : 1)
                    .sum();
        }
        if (request.getTotalCapacity() != null && request.getTotalCapacity() > 0) {
            return request.getTotalCapacity();
        }
        return request.getBedsCount() != null ? request.getBedsCount() : 1;
    }

    private Integer computeTotalOccupied(PropertyRequest request) {
        if (request.getRooms() != null && !request.getRooms().isEmpty()) {
            return request.getRooms().stream()
                    .mapToInt(r -> r.getOccupied() != null ? r.getOccupied() : Math.max(0, (r.getTotalCapacity() != null ? r.getTotalCapacity() : 1) - (r.getRemainingSpaces() != null ? r.getRemainingSpaces() : 0)))
                    .sum();
        }
        return request.getTotalOccupied() != null ? request.getTotalOccupied() : 0;
    }
}
