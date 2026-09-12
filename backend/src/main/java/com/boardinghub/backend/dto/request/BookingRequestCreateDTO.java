package com.boardinghub.backend.dto.request;

import com.boardinghub.backend.enums.BookingType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequestCreateDTO {

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    private Long roomId;

    private BookingType bookingType;

    @NotNull(message = "Occupants count is required")
    @Positive(message = "Occupants count must be at least 1")
    private Integer occupantsCount;

    @NotNull(message = "Move-in date is required")
    @FutureOrPresent(message = "Move-in date must be today or in the future")
    private LocalDate moveInDate;

    private String notes;
}
