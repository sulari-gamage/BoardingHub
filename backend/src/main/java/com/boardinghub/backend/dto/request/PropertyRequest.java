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
}
