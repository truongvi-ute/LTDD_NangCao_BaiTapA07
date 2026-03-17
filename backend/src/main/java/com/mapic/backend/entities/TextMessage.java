package com.mapic.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "text_messages")
@Getter
@Setter
@NoArgsConstructor
public class TextMessage extends Message {

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
}
