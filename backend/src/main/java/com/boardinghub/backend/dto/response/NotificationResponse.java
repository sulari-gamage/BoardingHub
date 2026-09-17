package com.boardinghub.backend.dto.response;

import com.boardinghub.backend.enums.NotificationType;
import com.boardinghub.backend.enums.Role;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("isRead")
    private boolean isRead;

    @JsonProperty("isRead")
    public boolean getIsRead() {
        return isRead;
    }

    private Long bookingId;
    private Long propertyId;
    private Long reviewId;
    private LocalDateTime createdAt;
}
