package com.mapic.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "taggings", indexes = {
    @Index(name = "idx_tagging_target", columnList = "target_id, target_type"),
    @Index(name = "idx_tagging_hashtag", columnList = "hashtag_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tagging {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hashtag_id", nullable = false)
    private Hashtag hashtag;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private TaggableType targetType;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Tagging(Hashtag hashtag, Taggable taggable) {
        this.hashtag = hashtag;
        this.targetId = taggable.getId();
        this.targetType = taggable.getTaggableType();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
