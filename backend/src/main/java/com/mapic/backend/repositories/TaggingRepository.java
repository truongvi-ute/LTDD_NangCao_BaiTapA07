package com.mapic.backend.repositories;

import com.mapic.backend.entities.Hashtag;
import com.mapic.backend.entities.Tagging;
import com.mapic.backend.entities.TaggableType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho Tagging entity
 */
@Repository
public interface TaggingRepository extends JpaRepository<Tagging, Long> {
    
    /**
     * Tìm tất cả hashtag của một thực thể
     * Use case: Hiển thị hashtags của một moment/album
     * 
     * Query sử dụng index: idx_tagging_target (target_id, target_type)
     * 
     * @param targetId ID của thực thể
     * @param targetType Loại thực thể
     * @return List<Tagging>
     */
    List<Tagging> findByTargetIdAndTargetType(Long targetId, TaggableType targetType);
    
    /**
     * Tìm tất cả thực thể có một hashtag cụ thể
     * Use case: Tìm tất cả moment có hashtag #dalat
     * 
     * Query sử dụng index: idx_tagging_hashtag (hashtag_id)
     * 
     * @param hashtag Hashtag entity
     * @param pageable Phân trang
     * @return Page<Tagging>
     */
    Page<Tagging> findByHashtag(Hashtag hashtag, Pageable pageable);
    
    /**
     * Tìm thực thể theo hashtag và loại
     * Use case: Tìm tất cả MOMENT (không phải album) có hashtag #dalat
     * 
     * Query sử dụng index: idx_tagging_hashtag_type (hashtag_id, target_type)
     * 
     * @param hashtag Hashtag entity
     * @param targetType Loại thực thể
     * @param pageable Phân trang
     * @return Page<Tagging>
     */
    Page<Tagging> findByHashtagAndTargetType(
        Hashtag hashtag, 
        TaggableType targetType, 
        Pageable pageable
    );
    
    /**
     * Check xem một thực thể đã có hashtag chưa
     * Use case: Validate trước khi tạo tagging mới
     * 
     * @param hashtag Hashtag entity
     * @param targetId ID của thực thể
     * @param targetType Loại thực thể
     * @return Optional<Tagging>
     */
    Optional<Tagging> findByHashtagAndTargetIdAndTargetType(
        Hashtag hashtag, 
        Long targetId, 
        TaggableType targetType
    );
    
    /**
     * Xóa tất cả tagging của một thực thể
     * Use case: Khi xóa moment/album, xóa luôn tất cả hashtag của nó
     * 
     * @param targetId ID của thực thể
     * @param targetType Loại thực thể
     */
    void deleteByTargetIdAndTargetType(Long targetId, TaggableType targetType);
    
    /**
     * Đếm số lượng thực thể có một hashtag
     * Use case: Hiển thị "1.2K posts" bên cạnh hashtag
     * 
     * @param hashtag Hashtag entity
     * @return Long
     */
    Long countByHashtag(Hashtag hashtag);
    
    /**
     * Đếm số lượng thực thể theo loại có một hashtag
     * Use case: Hiển thị "500 moments, 120 albums" cho hashtag #dalat
     * 
     * @param hashtag Hashtag entity
     * @param targetType Loại thực thể
     * @return Long
     */
    Long countByHashtagAndTargetType(Hashtag hashtag, TaggableType targetType);
    
    /**
     * Lấy danh sách targetId theo hashtag và loại
     * Use case: Lấy danh sách moment IDs có hashtag #dalat để query moments
     * 
     * @param hashtag Hashtag entity
     * @param targetType Loại thực thể
     * @return List<Long>
     */
    @Query("SELECT t.targetId FROM Tagging t " +
           "WHERE t.hashtag = :hashtag AND t.targetType = :targetType")
    List<Long> findTargetIdsByHashtagAndType(
        @Param("hashtag") Hashtag hashtag, 
        @Param("targetType") TaggableType targetType
    );
}
