package com.mapic.backend.entities;

/**
 * Enum TaggableType - Định nghĩa các loại thực thể có thể được gắn hashtag
 * 
 * Nguyên lý SOLID - Open/Closed:
 * - Khi thêm thực thể mới (ví dụ: STORY, EVENT), chỉ cần thêm vào enum này
 * - Không cần thay đổi cấu trúc database hoặc logic core
 * 
 * Lưu ý: Khi thêm giá trị mới, cần đảm bảo thực thể tương ứng implement Taggable
 */
public enum TaggableType {
    /**
     * Moment - Bài viết chia sẻ khoảnh khắc với ảnh và địa điểm
     */
    MOMENT,
    
    /**
     * Album - Bộ sưu tập các moment theo chủ đề
     */
    ALBUM,
    
    /**
     * Video - Video chia sẻ (future feature)
     */
    VIDEO,
    
    /**
     * Location - Địa điểm check-in (future feature)
     */
    LOCATION
    
    // Future extensions:
    // STORY,    // Story 24h (Instagram-like)
    // EVENT,    // Sự kiện du lịch
    // REVIEW,   // Đánh giá địa điểm
}
