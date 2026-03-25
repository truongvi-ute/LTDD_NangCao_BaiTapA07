package com.mapic.backend.repositories;

import com.mapic.backend.entities.Moderator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ModeratorRepository extends JpaRepository<Moderator, Long> {
    Optional<Moderator> findByUsername(String username);
    Optional<Moderator> findByEmail(String email);
}
