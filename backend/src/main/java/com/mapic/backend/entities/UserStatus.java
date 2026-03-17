package com.mapic.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatus {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private Double lastLat;

    private Double lastLng;

    private LocalDateTime lastSeenAt;

    private Integer batteryLevel;

    @Column(nullable = false)
    private Boolean isSharingLocation = true;

    private String statusMessage;
}
