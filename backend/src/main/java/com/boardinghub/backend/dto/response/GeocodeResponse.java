package com.boardinghub.backend.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeocodeResponse {
    private boolean success;
    private Double latitude;
    private Double longitude;
    private String formattedAddress;
    private String message;
}
