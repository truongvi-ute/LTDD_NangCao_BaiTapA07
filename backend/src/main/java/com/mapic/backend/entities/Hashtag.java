package com.mapic.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "hashtags", indexes = {
    @Index(name = "idx_hashtag_name", columnList = "name", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hashtag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private Long usageCount = 0L;

    private LocalDateTime lastUsedAt;

    public void incrementUsage() {
        if (this.usageCount == null) this.usageCount = 0L;
        this.usageCount++;
        this.lastUsedAt = LocalDateTime.now();
    }

    public void decrementUsage() {
        if (this.usageCount != null && this.usageCount > 0) {
            this.usageCount--;
        }
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        if (lastUsedAt == null) {
            lastUsedAt = LocalDateTime.now();
        }
    }
}
