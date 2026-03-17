package com.mapic.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "attachment_messages")
@Getter
@Setter
@NoArgsConstructor
public class AttachmentMessage extends Message {

    @Column(nullable = false)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatAttachmentType fileType;

    private String fileName;

    private Long fileSize;
}
