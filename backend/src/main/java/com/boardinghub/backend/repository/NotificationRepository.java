package com.boardinghub.backend.repository;

import com.boardinghub.backend.entity.Notification;
import com.boardinghub.backend.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndIsReadFalse(Long recipientId);

    boolean existsByRecipientIdAndTypeAndBookingId(Long recipientId, NotificationType type, Long bookingId);
}
