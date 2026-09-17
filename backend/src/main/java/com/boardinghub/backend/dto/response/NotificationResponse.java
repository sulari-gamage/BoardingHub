package com.boardinghub.backend.dto.response;

import com.boardinghub.backend.enums.NotificationType;
import com.boardinghub.backend.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private Long recipientId;
    private Role recipientRole;
    private NotificationType type;
    private String title;
    private String message;
    private boolean isRead;
    private Long bookingId;
    private Long propertyId;
    private Long reviewId;
    private LocalDateTime createdAt;
}
