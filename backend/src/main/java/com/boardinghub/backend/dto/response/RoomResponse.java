package com.boardinghub.backend.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {

    private Long id;
    private String roomType;
    private Double monthlyPrice;
    private Integer totalCapacity;
    private Integer remainingSpaces;
}
