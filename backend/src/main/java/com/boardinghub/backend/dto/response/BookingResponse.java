package com.boardinghub.backend.dto.response;

import com.boardinghub.backend.enums.BookingStatus;
import com.boardinghub.backend.enums.BookingType;
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
    private String imageUrl;

    private Long roomId;
    private String roomName;
    private String roomType;
    private BookingType bookingType;

    private Long seekerId;
    private String seekerName;
    private String seekerPhone;
    private String seekerAvatarUrl;

    private Long ownerId;
    private String ownerName;
    private String ownerPhone;
    private String ownerAvatarUrl;

    private Integer remainingSpaces;
    private Integer occupantsCount;
    private LocalDate moveInDate;
    private Double unitPrice;
    private String rentType;
    private Double monthlyPrice;
    private BookingStatus status;
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
