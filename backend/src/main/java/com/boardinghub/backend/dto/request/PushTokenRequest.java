package com.boardinghub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PushTokenRequest {
    @NotBlank(message = "Push token cannot be blank")
    private String pushToken;
}
