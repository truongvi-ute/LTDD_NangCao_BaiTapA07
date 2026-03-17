package com.mapic.backend.services;

import com.mapic.backend.entities.Hashtag;
import com.mapic.backend.entities.Taggable;
import com.mapic.backend.entities.Tagging;
import com.mapic.backend.repositories.HashtagRepository;
import com.mapic.backend.repositories.TaggingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service quản lý Hashtag và Tagging
 * 
 * Nguyên lý SOLID:
 * - Single Responsibility: Chỉ quản lý logic liên quan đến hashtag
 * - Open/Closed: Có thể mở rộng cho các loại Taggable mới mà không sửa code
 * - Dependency Inversion: Phụ thuộc vào interface Taggable, không phụ thuộc vào concrete class
 */
@Service
@RequiredArgsConstructor
public class HashtagService {
    
    private final HashtagRepository hashtagRepository;
    private final TaggingRepository taggingRepository;
    
    /**
     * Regex pattern để extract hashtag từ text
     * 
     * Pattern: #[a-zA-Z0-9_]+
     * - # : Bắt đầu bằng dấu thăng
     * - [a-zA-Z0-9_]+ : Theo sau là chữ cái, số, hoặc underscore (1 hoặc nhiều ký tự)
     * 
     * Ví dụ match:
     * - "#dalat" → "dalat"
     * - "#travel2024" → "travel2024"
     * - "#food_lover" → "food_lover"
     * 
     * Không match:
     * - "# dalat" (có khoảng trắng)
     * - "#đà-lạt" (có dấu và ký tự đặc biệt)
     */
    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#([a-zA-Z0-9_]+)");
    
    /**
     * Extract hashtags từ text
     * 
     * @param text Text chứa hashtag (ví dụ: caption của moment)
     * @return List tên hashtag (không bao gồm #)
     * 
     * Ví dụ:
     * Input: "Beautiful sunset at #dalat #travel #vietnam"
     * Output: ["dalat", "travel", "vietnam"]
     */
    public List<String> extractHashtags(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        List<String> hashtags = new ArrayList<>();
        Matcher matcher = HASHTAG_PATTERN.matcher(text);
        
        while (matcher.find()) {
            String hashtag = matcher.group(1).toLowerCase(); // Chuyển về lowercase
            if (!hashtags.contains(hashtag)) { // Loại bỏ duplicate
                hashtags.add(hashtag);
            }
        }
        
        return hashtags;
    }
    
    /**
     * Tạo hoặc lấy Hashtag entity từ tên
     * 
     * Logic:
     * - Nếu hashtag đã tồn tại → Lấy từ database
     * - Nếu chưa tồn tại → Tạo mới
     * 
     * @param name Tên hashtag (không bao gồm #)
     * @return Hashtag entity
     */
    @Transactional
    public Hashtag getOrCreateHashtag(String name) {
        String normalizedName = name.toLowerCase().trim();
        
        return hashtagRepository.findByName(normalizedName)
                .orElseGet(() -> {
                    Hashtag newHashtag = new Hashtag();
                    newHashtag.setName(normalizedName);
                    newHashtag.setUsageCount(0L);
                    return hashtagRepository.save(newHashtag);
                });
    }
    
    /**
     * Gắn hashtags vào một thực thể (Moment, Album, etc.)
     * 
     * Flow:
     * 1. Extract hashtags từ text
     * 2. Tạo hoặc lấy Hashtag entities
     * 3. Tạo Tagging records
     * 4. Tăng usageCount của mỗi hashtag
     * 
     * @param taggable Thực thể implement Taggable
     * @param text Text chứa hashtag
     * @return List<Tagging> đã tạo
     */
    @Transactional
    public List<Tagging> tagEntity(Taggable taggable, String text) {
        List<String> hashtagNames = extractHashtags(text);
        List<Tagging> taggings = new ArrayList<>();
        
        for (String name : hashtagNames) {
            // 1. Tạo hoặc lấy hashtag
            Hashtag hashtag = getOrCreateHashtag(name);
            
            // 2. Check xem đã tag chưa (tránh duplicate)
            boolean alreadyTagged = taggingRepository
                    .findByHashtagAndTargetIdAndTargetType(
                            hashtag, 
                            taggable.getId(), 
                            taggable.getTaggableType()
                    )
                    .isPresent();
            
            if (!alreadyTagged) {
                // 3. Tạo tagging
                Tagging tagging = new Tagging(hashtag, taggable);
                taggings.add(taggingRepository.save(tagging));
                
                // 4. Tăng usage count
                hashtag.incrementUsage();
                hashtagRepository.save(hashtag);
            }
        }
        
        return taggings;
    }
    
    /**
     * Xóa tất cả hashtag của một thực thể
     * 
     * Use case: Khi xóa moment/album hoặc update caption (xóa cũ, tạo mới)
     * 
     * @param taggable Thực thể implement Taggable
     */
    @Transactional
    public void untagEntity(Taggable taggable) {
        List<Tagging> taggings = taggingRepository.findByTargetIdAndTargetType(
                taggable.getId(), 
                taggable.getTaggableType()
        );
        
        for (Tagging tagging : taggings) {
            // Giảm usage count
            Hashtag hashtag = tagging.getHashtag();
            hashtag.decrementUsage();
            hashtagRepository.save(hashtag);
            
            // Xóa tagging
            taggingRepository.delete(tagging);
        }
    }
    
    /**
     * Update hashtags của một thực thể
     * 
     * Logic:
     * 1. Xóa tất cả hashtag cũ
     * 2. Tạo hashtag mới từ text mới
     * 
     * @param taggable Thực thể implement Taggable
     * @param newText Text mới chứa hashtag
     * @return List<Tagging> mới
     */
    @Transactional
    public List<Tagging> updateTags(Taggable taggable, String newText) {
        untagEntity(taggable);
        return tagEntity(taggable, newText);
    }
    
    /**
     * Lấy tất cả hashtag của một thực thể
     * 
     * @param taggable Thực thể implement Taggable
     * @return List<Hashtag>
     */
    public List<Hashtag> getHashtagsForEntity(Taggable taggable) {
        List<Tagging> taggings = taggingRepository.findByTargetIdAndTargetType(
                taggable.getId(), 
                taggable.getTaggableType()
        );
        
        return taggings.stream()
                .map(Tagging::getHashtag)
                .collect(Collectors.toList());
    }
    
    /**
     * Tìm hashtag theo tên (autocomplete)
     * 
     * @param prefix Prefix để tìm kiếm
     * @param pageable Phân trang
     * @return Page<Hashtag>
     */
    public Page<Hashtag> searchHashtags(String prefix, Pageable pageable) {
        return hashtagRepository.findByNameStartingWithOrderByUsageCountDesc(
                prefix.toLowerCase(), 
                pageable
        );
    }
    
    /**
     * Lấy trending hashtags
     * 
     * @param pageable Phân trang
     * @return Page<Hashtag>
     */
    public Page<Hashtag> getTrendingHashtags(Pageable pageable) {
        return hashtagRepository.findTrendingHashtags(pageable);
    }
}
