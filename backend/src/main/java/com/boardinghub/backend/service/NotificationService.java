package com.boardinghub.backend.service;

import com.boardinghub.backend.dto.response.NotificationResponse;
import com.boardinghub.backend.dto.response.UnreadCountResponse;
import com.boardinghub.backend.entity.Notification;
import com.boardinghub.backend.entity.User;
import com.boardinghub.backend.enums.NotificationType;
import com.boardinghub.backend.repository.NotificationRepository;
import com.boardinghub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    @Transactional
    public Notification createAndSendNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            Long bookingId,
            Long propertyId,
            Long reviewId
    ) {
        if (recipient == null) {
            return null;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .recipientRole(recipient.getRole())
                .type(type)
                .title(title)
                .message(message)
                .isRead(false)
                .bookingId(bookingId)
                .propertyId(propertyId)
                .reviewId(reviewId)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Attempt Expo push notification asynchronously/safely
        if (recipient.getPushToken() != null && !recipient.getPushToken().trim().isEmpty()) {
            sendExpoPushNotificationSafely(
                    recipient.getPushToken(),
                    title,
                    message,
                    saved.getId(),
                    type,
                    bookingId,
                    propertyId,
                    reviewId
            );
        }

        return saved;
    }

    @Async
    public void sendExpoPushNotificationSafely(
            String pushToken,
            String title,
            String message,
            Long notificationId,
            NotificationType type,
            Long bookingId,
            Long propertyId,
            Long reviewId
    ) {
        try {
            if (pushToken == null || !pushToken.startsWith("ExponentPushToken[")) {
                System.out.println("⚠️ Skipping push notification: invalid push token format " + pushToken);
                return;
            }

            Map<String, Object> dataPayload = new HashMap<>();
            dataPayload.put("notificationId", notificationId);
            dataPayload.put("type", type.name());
            if (bookingId != null) dataPayload.put("bookingId", bookingId);
            if (propertyId != null) dataPayload.put("propertyId", propertyId);
            if (reviewId != null) dataPayload.put("reviewId", reviewId);

            Map<String, Object> body = new HashMap<>();
            body.put("to", pushToken);
            body.put("sound", "default");
            body.put("title", title);
            body.put("body", message);
            body.put("data", dataPayload);
            body.put("priority", "high");
            body.put("channelId", "default");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(EXPO_PUSH_URL, requestEntity, String.class);
            System.out.println("📲 Sent Expo push notification to " + pushToken.substring(0, Math.min(25, pushToken.length())) + "... Status: " + response.getStatusCode());
        } catch (Exception e) {
            System.err.println("⚠️ Expo push notification dispatch error (DB notification preserved): " + e.getMessage());
        }
    }

    public List<NotificationResponse> getNotificationsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public UnreadCountResponse getUnreadCountForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        long count = notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
        return new UnreadCountResponse(count);
    }

    @Transactional
    public void markAsRead(Long notificationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + notificationId));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied: Notification belongs to another user.");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Notification> unread = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream().filter(n -> !n.isRead()).collect(Collectors.toList());

        for (Notification n : unread) {
            n.setRead(true);
            notificationRepository.save(n);
        }
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .recipientId(n.getRecipient() != null ? n.getRecipient().getId() : null)
                .recipientRole(n.getRecipientRole())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .isRead(n.isRead())
                .bookingId(n.getBookingId())
                .propertyId(n.getPropertyId())
                .reviewId(n.getReviewId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
