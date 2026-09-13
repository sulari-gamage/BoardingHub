package com.boardinghub.backend.service;

import com.boardinghub.backend.dto.response.PropertyResponse;
import com.boardinghub.backend.entity.BoardingProperty;
import com.boardinghub.backend.entity.SavedProperty;
import com.boardinghub.backend.entity.User;
import com.boardinghub.backend.repository.BoardingPropertyRepository;
import com.boardinghub.backend.repository.SavedPropertyRepository;
import com.boardinghub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final SavedPropertyRepository savedPropertyRepository;
    private final BoardingPropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PropertyService propertyService;

    public List<PropertyResponse> getSavedProperties(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + userEmail));

        List<SavedProperty> savedList = savedPropertyRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return savedList.stream()
                .map(sp -> propertyService.getPropertyById(sp.getProperty().getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean toggleFavorite(Long propertyId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + userEmail));

        BoardingProperty property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + propertyId));

        Optional<SavedProperty> existing = savedPropertyRepository.findByUserIdAndPropertyId(user.getId(), property.getId());

        if (existing.isPresent()) {
            savedPropertyRepository.delete(existing.get());
            savedPropertyRepository.flush();
            return false; // Now unsaved
        } else {
            SavedProperty savedProperty = SavedProperty.builder()
                    .user(user)
                    .property(property)
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            savedPropertyRepository.saveAndFlush(savedProperty);
            return true; // Now saved
        }
    }
}
