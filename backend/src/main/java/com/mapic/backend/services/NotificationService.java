package com.mapic.backend.services;

import com.mapic.backend.entities.*;
import com.mapic.backend.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(User recipient, User actor, NotificationType type, Long targetId, TaggableType targetType, String metadata) {
        // Don't notify yourself
        if (recipient.getId().equals(actor.getId())) {
            return;
        }

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setActor(actor);
        notification.setType(type);
        notification.setTargetId(targetId);
        notification.setTargetType(targetType);
        notification.setMetadata(metadata);
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }

    public Page<Notification> getNotificationsForUser(User user, Pageable pageable) {
        return notificationRepository.findAllByRecipientOrderByCreatedAtDesc(user, pageable);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long notificationId, User user) {
        notificationRepository.findByIdAndRecipient(notificationId, user)
                .ifPresent(notification -> {
                    notification.setIsRead(true);
                    notificationRepository.save(notification);
                });
    }

    @Transactional
    public void markAllAsRead(User user) {
        // Simple implementation for now
        notificationRepository.findAllByRecipientOrderByCreatedAtDesc(user, Pageable.unpaged())
                .forEach(notification -> {
                    if (!notification.getIsRead()) {
                        notification.setIsRead(true);
                        notificationRepository.save(notification);
                    }
                });
    }
}
