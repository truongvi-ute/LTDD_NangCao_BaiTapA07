package com.mapic.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "share_messages")
@Getter
@Setter
@NoArgsConstructor
public class ShareMessage extends Message {

    @Column(nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShareType shareType;

    private String previewTitle;

    private String previewImageUrl;
}
