package com.mapic.backend.repositories;

import com.mapic.backend.entities.Notification;
import com.mapic.backend.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findAllByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);
    
    long countByRecipientAndIsReadFalse(User recipient);
    
    Optional<Notification> findByIdAndRecipient(Long id, User recipient);
}
