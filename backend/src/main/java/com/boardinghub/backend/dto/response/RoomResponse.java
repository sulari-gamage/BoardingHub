package com.boardinghub.backend.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {

    private Long id;
    private String roomName;
    private String roomType;
    private Double monthlyPrice;
    private Integer totalCapacity;
    private Integer remainingSpaces;
    private Integer occupied;
    private Integer beds;
    private Integer washrooms;
    private String washroomType;
    private String amenities;
    private String rentType;
    private String imageUrl;
    private Boolean isElectricityIncluded;
    private Boolean isWaterIncluded;
}
