package com.boardinghub.backend.dto.response;

import com.boardinghub.backend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String whatsappNumber;
    private Role role;
    private String avatarUrl;
    private Integer propertiesCount;
    private Integer totalCapacity;
    private Double averageRating;
    private Integer totalReviews;
    private Boolean isVerified;
    private LocalDateTime createdAt;
}
