package com.boardinghub.backend.scheduler;

import com.boardinghub.backend.entity.BookingRequest;
import com.boardinghub.backend.entity.User;
import com.boardinghub.backend.enums.BookingStatus;
import com.boardinghub.backend.enums.NotificationType;
import com.boardinghub.backend.repository.BookingRequestRepository;
import com.boardinghub.backend.repository.NotificationRepository;
import com.boardinghub.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MoveInReminderScheduler {

    private final BookingRequestRepository bookingRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    private static final String SRI_LANKA_TIMEZONE = "Asia/Colombo";

    // Scheduled to run every day at 08:00 AM Sri Lanka time
    @Scheduled(cron = "0 0 8 * * ?", zone = SRI_LANKA_TIMEZONE)
    public void sendMoveInReminders() {
        processMoveInReminders();
    }

    // Run once on application startup to process any pending reminders for tomorrow
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        processMoveInReminders();
    }

    private void processMoveInReminders() {
        try {
            LocalDate tomorrow = LocalDate.now(ZoneId.of(SRI_LANKA_TIMEZONE)).plusDays(1);
            List<BookingRequest> bookings = bookingRepository.findAll();

            if (bookings == null || bookings.isEmpty()) {
                return;
            }

            for (BookingRequest booking : bookings) {
                // Check if booking is APPROVED and moveInDate matches tomorrow
                if (booking.getStatus() == BookingStatus.APPROVED && booking.getMoveInDate() != null) {
                    if (booking.getMoveInDate().equals(tomorrow)) {
                        sendReminderForBooking(booking);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error during MoveInReminderScheduler execution: " + e.getMessage());
        }
    }

    private void sendReminderForBooking(BookingRequest booking) {
        User seeker = booking.getSeeker();
        User owner = (booking.getProperty() != null) ? booking.getProperty().getOwner() : null;
        String propertyTitle = (booking.getProperty() != null) ? booking.getProperty().getTitle() : "Boarding Place";
        String unitName = (booking.getRoom() != null) ? booking.getRoom().getRoomName() : "Boarding";

        // 1. Notify Seeker idempotently
        if (seeker != null) {
            boolean seekerAlreadyNotified = notificationRepository.existsByRecipientIdAndTypeAndBookingId(
                    seeker.getId(), NotificationType.MOVE_IN_REMINDER, booking.getId()
            );

            if (!seekerAlreadyNotified) {
                String title = "Move-in Reminder 🗓️";
                String message = "Your move-in date for " + unitName + " at " + propertyTitle + " is tomorrow (" + booking.getMoveInDate() + ").";
                notificationService.createAndSendNotification(
                        seeker,
                        NotificationType.MOVE_IN_REMINDER,
                        title,
                        message,
                        booking.getId(),
                        booking.getProperty() != null ? booking.getProperty().getId() : null,
                        null
                );
            }
        }

        // 2. Notify Owner idempotently
        if (owner != null) {
            boolean ownerAlreadyNotified = notificationRepository.existsByRecipientIdAndTypeAndBookingId(
                    owner.getId(), NotificationType.MOVE_IN_REMINDER, booking.getId()
            );

            if (!ownerAlreadyNotified) {
                String seekerName = (seeker != null && seeker.getName() != null) ? seeker.getName() : "Tenant";
                String title = "Move-in Reminder 🗓️";
                String message = seekerName + " is scheduled to move into " + unitName + " at " + propertyTitle + " tomorrow (" + booking.getMoveInDate() + ").";
                notificationService.createAndSendNotification(
                        owner,
                        NotificationType.MOVE_IN_REMINDER,
                        title,
                        message,
                        booking.getId(),
                        booking.getProperty() != null ? booking.getProperty().getId() : null,
                        null
                );
            }
        }
    }
}
