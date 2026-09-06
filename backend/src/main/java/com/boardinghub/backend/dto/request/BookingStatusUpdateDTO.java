package com.boardinghub.backend.dto.request;

import com.boardinghub.backend.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingStatusUpdateDTO {

    @NotNull(message = "Status is required (APPROVED, REJECTED, or CANCELLED)")
    private BookingStatus status;
}
