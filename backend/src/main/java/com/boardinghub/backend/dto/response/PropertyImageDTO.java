package com.boardinghub.backend.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyImageDTO {

    private Long id;
    private String imageUrl;
    private boolean isPrimary;
}
