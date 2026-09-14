package com.boardinghub.backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Integer rating;
    private String comment;
    private String type; // "PROPERTY" or "APP"
    private LocalDateTime createdAt;
}
