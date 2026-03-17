package com.mapic.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity Tagging - Thực thể trung gian đa hình (Polymorphic Join Table)
 * 
 * Thiết kế Polymorphic Association:
 * - Thay vì tạo nhiều bảng: moment_hashtags, album_hashtags, video_hashtags...
 * - Chỉ cần 1 bảng taggings với 2 cột: targetId + targetType
 * 
 * Ưu điểm:
 * - Dễ mở rộng: Thêm thực thể mới không cần tạo bảng mới
 * - Dễ query: "Tìm tất cả hashtag của một moment" hoặc "Tìm tất cả moment có hashtag #dalat"
 * - Tiết kiệm: Chỉ 1 bảng thay vì N bảng
 * 
 * Nhược điểm:
 * - Không có Foreign Key constraint trực tiếp (phải validate ở application layer)
 * - Cần composite index để performance tốt
 * 
 * Ví dụ data:
 * | id | hashtag_id | target_id | target_type | created_at          |
 * |----|------------|-----------|-------------|---------------------|
 * | 1  | 10         | 123       | MOMENT      | 2026-03-12 10:00:00 |
 * | 2  | 11         | 123       | MOMENT      | 2026-03-12 10:00:00 |
 * | 3  | 10         | 456       | ALBUM       | 2026-03-12 11:00:00 |
 * 
 * Giải thích:
 * - Row 1: Moment #123 có hashtag #10 (ví dụ: #dalat)
 * - Row 2: Moment #123 có hashtag #11 (ví dụ: #travel)
 * - Row 3: Album #456 có hashtag #10 (ví dụ: #dalat)
 */
@Entity
@Table(
    name = "taggings",
    indexes = {
        // Composite Index: Tìm tất cả hashtag của một thực thể
        // Query: SELECT * FROM taggings WHERE target_id = ? AND target_type = ?
        // Use case: Hiển thị hashtags của một moment/album
        @Index(
            name = "idx_tagging_target", 
            columnList = "target_id, target_type"
        ),
        
        // Index: Tìm tất cả thực thể có một hashtag
        // Query: SELECT * FROM taggings WHERE hashtag_id = ?
        // Use case: Tìm tất cả moment có hashtag #dalat
        @Index(
            name = "idx_tagging_hashtag", 
            columnList = "hashtag_id"
        ),
        
        // Composite Index: Tìm thực thể theo hashtag và loại
        // Query: SELECT * FROM taggings WHERE hashtag_id = ? AND target_type = ?
        // Use case: Tìm tất cả MOMENT (không phải album) có hashtag #dalat
        @Index(
            name = "idx_tagging_hashtag_type", 
            columnList = "hashtag_id, target_type"
        ),
        
        // Index: Sắp xếp theo thời gian (trending, recent)
        @Index(
            name = "idx_tagging_created_at", 
            columnList = "created_at DESC"
        )
    },
    uniqueConstraints = {
        // Đảm bảo không duplicate: 1 thực thể không thể có cùng 1 hashtag 2 lần
        // Ví dụ: Moment #123 không thể có 2 lần hashtag #dalat
        @UniqueConstraint(
            name = "uk_tagging_unique", 
            columnNames = {"hashtag_id", "target_id", "target_type"}
        )
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tagging {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Hashtag được gắn
     * ManyToOne: Nhiều tagging có thể tham chiếu đến cùng 1 hashtag
     * 
     * Ví dụ:
     * - Tagging #1 → Hashtag "dalat"
     * - Tagging #2 → Hashtag "dalat"
     * - Tagging #3 → Hashtag "travel"
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hashtag_id", nullable = false)
    private Hashtag hashtag;
    
    /**
     * ID của thực thể được gắn hashtag
     * 
     * Ví dụ:
     * - targetId = 123, targetType = MOMENT → Moment có id=123
     * - targetId = 456, targetType = ALBUM → Album có id=456
     * 
     * Lưu ý: Không có Foreign Key constraint vì target có thể là nhiều bảng khác nhau
     * Phải validate ở application layer (Service)
     */
    @Column(name = "target_id", nullable = false)
    private Long targetId;
    
    /**
     * Loại thực thể được gắn hashtag
     * 
     * Giá trị: MOMENT, ALBUM, VIDEO, LOCATION
     * 
     * Lưu dưới dạng String trong database để dễ đọc và debug
     * Ví dụ: "MOMENT", "ALBUM" thay vì 0, 1
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private TaggableType targetType;
    
    /**
     * Thời điểm gắn hashtag
     * Dùng để:
     * - Sắp xếp theo thời gian
     * - Tính trending (hashtag được dùng nhiều gần đây)
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    /**
     * Constructor tiện lợi để tạo Tagging từ Taggable object
     * 
     * @param hashtag Hashtag entity
     * @param taggable Thực thể implement Taggable (Moment, Album, etc.)
     */
    public Tagging(Hashtag hashtag, Taggable taggable) {
        this.hashtag = hashtag;
        this.targetId = taggable.getId();
        this.targetType = taggable.getTaggableType();
    }
}
