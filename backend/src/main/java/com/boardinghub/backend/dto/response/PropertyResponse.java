package com.boardinghub.backend.dto.response;

import com.boardinghub.backend.enums.GenderPreference;
import com.boardinghub.backend.enums.PropertyStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyResponse {

    private Long id;
    private String title;
    private String description;
    private String address;
    private String city;
    private GenderPreference genderPreference;
    private Double monthlyRent;
    private PropertyStatus status;

    private Long ownerId;
    private String ownerName;
    private String ownerWhatsapp;

    private Double latitude;
    private Double longitude;

    private List<String> amenities;
    private List<PropertyImageDTO> images;
    private List<RoomResponse> rooms;

    private LocalDateTime createdAt;
}
