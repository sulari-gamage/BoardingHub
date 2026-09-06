package com.boardinghub.backend.dto.response;

import com.boardinghub.backend.enums.BookingStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {

    private Long id;
    private Long propertyId;
    private String propertyTitle;

    private Long roomId;
    private String roomType;

    private Long seekerId;
    private String seekerName;
    private String seekerPhone;

    private Integer occupantsCount;
    private LocalDate moveInDate;
    private Double monthlyPrice;
    private BookingStatus status;
    private String notes;

    private LocalDateTime createdAt;
}
