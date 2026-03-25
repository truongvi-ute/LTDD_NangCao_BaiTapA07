package com.mapic.backend.repositories;

import com.mapic.backend.entities.Hashtag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho Hashtag entity
 */
@Repository
public interface HashtagRepository extends JpaRepository<Hashtag, Long> {
    
    /**
     * Tìm hashtag theo tên (exact match)
     * @param name Tên hashtag (không bao gồm #)
     * @return Optional<Hashtag>
     */
    Optional<Hashtag> findByName(String name);
    
    /**
     * Tìm hashtag theo tên (case-insensitive)
     * @param name Tên hashtag
     * @return Optional<Hashtag>
     */
    Optional<Hashtag> findByNameIgnoreCase(String name);
    
    /**
     * Autocomplete: Tìm hashtag bắt đầu với prefix
     * Use case: User gõ "#da" → Gợi ý "#dalat", "#danang"
     * 
     * @param prefix Prefix để tìm kiếm
     * @param pageable Phân trang
     * @return Page<Hashtag>
     */
    @Query("SELECT h FROM Hashtag h WHERE LOWER(h.name) LIKE LOWER(CONCAT(:prefix, '%')) " +
           "ORDER BY h.usageCount DESC")
    Page<Hashtag> findByNameStartingWithOrderByUsageCountDesc(
        @Param("prefix") String prefix, 
        Pageable pageable
    );
    
    /**
     * Trending hashtags: Top hashtag được dùng nhiều nhất
     * Use case: Hiển thị "Trending hashtags" trên Explore page
     * 
     * @param pageable Phân trang (ví dụ: top 10, top 20)
     * @return Page<Hashtag>
     */
    Page<Hashtag> findAllByOrderByUsageCountDesc(Pageable pageable);
    
    /**
     * Trending hashtags gần đây: Kết hợp usageCount và lastUsedAt
     * Use case: "Trending now" - hashtag hot trong 7 ngày gần đây
     * 
     * @param threshold Ngày giới hạn (ví dụ: 7 ngày trước)
     * @param pageable Phân trang
     * @return Page<Hashtag>
     */
    @Query("SELECT h FROM Hashtag h " +
           "WHERE h.lastUsedAt >= :threshold " +
           "ORDER BY h.usageCount DESC, h.lastUsedAt DESC")
    Page<Hashtag> findTrendingHashtags(@Param("threshold") java.time.LocalDateTime threshold, Pageable pageable);
    
    /**
     * Tìm hashtag theo danh sách tên
     * Use case: Bulk query khi parse nhiều hashtag từ caption
     * 
     * @param names Danh sách tên hashtag
     * @return List<Hashtag>
     */
    List<Hashtag> findByNameIn(List<String> names);
}
