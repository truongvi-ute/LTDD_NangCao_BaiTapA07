package com.mapic.backend.repositories;

import com.mapic.backend.entities.Comment;
import com.mapic.backend.entities.CommentReaction;
import com.mapic.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {
    
    Optional<CommentReaction> findTopByCommentAndUserOrderByCreatedAtDesc(Comment comment, User user);
    
    Optional<CommentReaction> findByCommentAndUser(Comment comment, User user);
    
    List<CommentReaction> findByComment(Comment comment);
    
    Long countByComment(Comment comment);
}
