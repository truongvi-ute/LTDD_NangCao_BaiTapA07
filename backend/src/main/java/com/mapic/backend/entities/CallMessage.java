package com.mapic.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "call_messages")
@Getter
@Setter
@NoArgsConstructor
public class CallMessage extends Message {

    private Integer duration; // in seconds

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CallStatus status;

    private Boolean isVideo = false;
}
