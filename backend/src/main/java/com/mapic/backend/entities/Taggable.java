package com.mapic.backend.entities;

/**
 * Interface Taggable - Định nghĩa contract cho các thực thể có thể được gắn hashtag
 * 
 * Nguyên lý SOLID:
 * - Interface Segregation: Chỉ định nghĩa các phương thức cần thiết
 * - Open/Closed: Mở rộng bằng cách implement, không cần sửa code hiện tại
 * 
 * Các thực thể muốn hỗ trợ hashtag chỉ cần implement interface này
 * Ví dụ: Moment, Album, Video, Location, Story (future)
 */
public interface Taggable {
    
    /**
     * Lấy ID của thực thể
     * @return ID duy nhất của thực thể
     */
    Long getId();
    
    /**
     * Lấy loại thực thể (MOMENT, ALBUM, VIDEO, LOCATION)
     * @return TaggableType enum value
     */
    TaggableType getTaggableType();
}
