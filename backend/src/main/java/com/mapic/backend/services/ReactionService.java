package com.mapic.backend.services;

import com.mapic.backend.dtos.ReactionDto;
import com.mapic.backend.entities.*;
import com.mapic.backend.repositories.CommentReactionRepository;
import com.mapic.backend.repositories.CommentRepository;
import com.mapic.backend.repositories.MomentReactionRepository;
import com.mapic.backend.repositories.MomentRepository;
import com.mapic.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReactionService {
    
    private final MomentReactionRepository momentReactionRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final MomentRepository momentRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public ReactionDto toggleReaction(Long momentId, Long userId, ReactionType type) {
        Moment moment = momentRepository.findById(momentId)
                .orElseThrow(() -> new RuntimeException("Moment not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<MomentReaction> existingReaction = momentReactionRepository.findTopByMomentAndUserOrderByCreatedAtDesc(moment, user);
        
        if (existingReaction.isPresent()) {
            MomentReaction reaction = existingReaction.get();
            
            // If same type, remove reaction (unlike)
            if (reaction.getType() == type) {
                momentReactionRepository.delete(reaction);
                updateMomentReactionCount(moment);
                return null;
            } else {
                // Change reaction type
                reaction.setType(type);
                MomentReaction saved = momentReactionRepository.save(reaction);
                return convertToDto(saved);
            }
        } else {
            // Create new reaction
            MomentReaction reaction = new MomentReaction();
            reaction.setMoment(moment);
            reaction.setUser(user);
            reaction.setType(type);
            
            MomentReaction saved = momentReactionRepository.save(reaction);
            updateMomentReactionCount(moment);
            
            return convertToDto(saved);
        }
    }
    
    @Transactional
    public ReactionDto toggleCommentReaction(Long commentId, Long userId, ReactionType type) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<CommentReaction> existingReaction = commentReactionRepository.findTopByCommentAndUserOrderByCreatedAtDesc(comment, user);
        
        if (existingReaction.isPresent()) {
            CommentReaction reaction = existingReaction.get();
            
            if (reaction.getType() == type) {
                commentReactionRepository.delete(reaction);
                updateCommentReactionCount(comment);
                return null;
            } else {
                reaction.setType(type);
                CommentReaction saved = commentReactionRepository.save(reaction);
                return convertToDto(saved);
            }
        } else {
            CommentReaction reaction = new CommentReaction();
            reaction.setComment(comment);
            reaction.setUser(user);
            reaction.setType(type);
            
            CommentReaction saved = commentReactionRepository.save(reaction);
            updateCommentReactionCount(comment);
            
            return convertToDto(saved);
        }
    }
    
    public List<ReactionDto> getMomentReactions(Long momentId) {
        Moment moment = momentRepository.findById(momentId)
                .orElseThrow(() -> new RuntimeException("Moment not found"));
        
        List<MomentReaction> reactions = momentReactionRepository.findByMoment(moment);
        
        return reactions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ReactionDto> getCommentReactions(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        List<CommentReaction> reactions = commentReactionRepository.findByComment(comment);
        
        return reactions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public ReactionDto getUserReaction(Long momentId, Long userId) {
        Moment moment = momentRepository.findById(momentId)
                .orElseThrow(() -> new RuntimeException("Moment not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<MomentReaction> reaction = momentReactionRepository.findTopByMomentAndUserOrderByCreatedAtDesc(moment, user);
        
        return reaction.map(this::convertToDto).orElse(null);
    }
    
    public ReactionDto getUserCommentReaction(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<CommentReaction> reaction = commentReactionRepository.findTopByCommentAndUserOrderByCreatedAtDesc(comment, user);
        
        return reaction.map(this::convertToDto).orElse(null);
    }
    
    private void updateMomentReactionCount(Moment moment) {
        Long count = momentReactionRepository.countByMoment(moment);
        moment.setReactionCount(count != null ? count : 0L);
        momentRepository.save(moment);
    }
    
    private void updateCommentReactionCount(Comment comment) {
        Long count = commentReactionRepository.countByComment(comment);
        comment.setReactionCount(count != null ? count : 0L);
        commentRepository.save(comment);
    }
    
    private ReactionDto convertToDto(MomentReaction reaction) {
        ReactionDto dto = new ReactionDto();
        dto.setId(reaction.getId());
        dto.setMomentId(reaction.getMoment().getId());
        dto.setUserId(reaction.getUser().getId());
        dto.setUserName(reaction.getUser().getName());
        
        if (reaction.getUser().getProfile() != null) {
            dto.setUserAvatarUrl(reaction.getUser().getProfile().getAvatarUrl());
        }
        
        dto.setType(reaction.getType());
        dto.setCreatedAt(reaction.getCreatedAt());
        
        return dto;
    }
    
    private ReactionDto convertToDto(CommentReaction reaction) {
        ReactionDto dto = new ReactionDto();
        dto.setId(reaction.getId());
        dto.setCommentId(reaction.getComment().getId());
        dto.setUserId(reaction.getUser().getId());
        dto.setUserName(reaction.getUser().getName());
        
        if (reaction.getUser().getProfile() != null) {
            dto.setUserAvatarUrl(reaction.getUser().getProfile().getAvatarUrl());
        }
        
        dto.setType(reaction.getType());
        dto.setCreatedAt(reaction.getCreatedAt());
        
        return dto;
    }
}
