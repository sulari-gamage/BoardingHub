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
    private Long seekerId;
    private String seekerName;
    private Integer rating;
    private String comment;
    private String type; // "PROPERTY" or "APP"
    private LocalDateTime createdAt;
}
