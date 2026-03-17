package com.mapic.backend.repositories;

import com.mapic.backend.entities.Moment;
import com.mapic.backend.entities.MomentReaction;
import com.mapic.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MomentReactionRepository extends JpaRepository<MomentReaction, Long> {
    
    Optional<MomentReaction> findTopByMomentAndUserOrderByCreatedAtDesc(Moment moment, User user);
    
    Optional<MomentReaction> findByMomentAndUser(Moment moment, User user);
    
    List<MomentReaction> findByMoment(Moment moment);
    
    Long countByMoment(Moment moment);
    
    void deleteByMomentAndUser(Moment moment, User user);
}
