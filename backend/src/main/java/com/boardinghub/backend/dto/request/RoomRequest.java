package com.boardinghub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomRequest {

    @NotBlank(message = "Room type is required (e.g., Single Room, Shared Room)")
    private String roomType;

    @NotNull(message = "Monthly price is required")
    @Positive(message = "Monthly price must be greater than zero")
    private Double monthlyPrice;

    @NotNull(message = "Total capacity is required")
    @Positive(message = "Total capacity must be at least 1")
    private Integer totalCapacity;

    @NotNull(message = "Remaining spaces is required")
    private Integer remainingSpaces;

    private String rentType; // PER_PERSON or PER_ROOM
}
