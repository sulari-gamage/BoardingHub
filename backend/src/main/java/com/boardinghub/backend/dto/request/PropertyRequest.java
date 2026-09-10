package com.boardinghub.backend.dto.request;

import com.boardinghub.backend.enums.GenderPreference;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    private String district;

    @NotNull(message = "Gender preference is required (ANY, MALE_ONLY, or FEMALE_ONLY)")
    private GenderPreference genderPreference;

    @NotNull(message = "Monthly rent is required")
    @Positive(message = "Monthly rent must be greater than zero")
    private Double monthlyRent;

    private Double latitude;
    private Double longitude;

    private List<Long> amenityIds;
    private List<String> amenities;
    private List<String> imageUrls;
    private List<RoomRequest> rooms;
    private String propertyNature;
    private Integer roomsCount;
    private Integer bedsCount;
    private Integer bathsCount;
    private Integer totalCapacity;
    private Integer totalOccupied;
    private Boolean hasKitchen;
    private Boolean isFurnished;
    private Boolean isElectricityIncluded;
    private Boolean isWaterIncluded;

    private Boolean hasWifi;
    private Boolean hasWater;
    private Boolean hasElectricity;
    private Boolean hasGas;
    private Boolean hasLaundry;
    private Boolean hasParking;
    private Boolean hasKitchenAmenity;
    private Boolean hasCommonArea;
    private Boolean hasPool;
    private Boolean hasFitness;
    private Boolean hasCctv;
    private Boolean hasGate;
    private Boolean hasFireExtinguisher;
    private Boolean hasFirstAid;
    private Boolean hasAc;
    private Boolean hasGenerator;
    private Boolean hasAttachedBathroom;
    private Boolean hasBalcony;
    private String customAmenities;
}
