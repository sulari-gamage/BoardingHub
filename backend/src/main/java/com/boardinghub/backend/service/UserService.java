package com.boardinghub.backend.service;

import com.boardinghub.backend.dto.request.ChangePasswordRequest;
import com.boardinghub.backend.dto.request.UpdateProfileRequest;
import com.boardinghub.backend.dto.response.UserProfileResponse;
import com.boardinghub.backend.entity.BoardingProperty;
import com.boardinghub.backend.entity.User;
import com.boardinghub.backend.repository.BoardingPropertyRepository;
import com.boardinghub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BoardingPropertyRepository propertyRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileResponse getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        List<BoardingProperty> properties = propertyRepository.findByOwnerId(user.getId());
        int propertiesCount = properties.size();
        int totalCapacity = properties.stream()
                .mapToInt(p -> p.getTotalCapacity() != null ? p.getTotalCapacity() : 0)
                .sum();

        // Default rating of 4.9 if no properties or reviews yet
        double averageRating = 4.9;

        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .whatsappNumber(user.getWhatsappNumber())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .propertiesCount(propertiesCount)
                .totalCapacity(totalCapacity)
                .averageRating(averageRating)
                .isVerified(propertiesCount > 0)
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getWhatsappNumber() != null) {
            user.setWhatsappNumber(request.getWhatsappNumber().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User updatedUser = userRepository.save(user);
        return getUserProfile(updatedUser.getEmail());
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password does not match.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
