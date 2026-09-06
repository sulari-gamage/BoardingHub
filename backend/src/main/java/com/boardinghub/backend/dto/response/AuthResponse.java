package com.boardinghub.backend.dto.response;

import com.boardinghub.backend.enums.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private Long id;
    private String name;
    private String email;
    private String whatsappNumber;
    private Role role;
    private String avatarUrl;
}
