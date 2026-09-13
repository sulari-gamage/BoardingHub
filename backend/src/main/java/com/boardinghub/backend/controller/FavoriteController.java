package com.boardinghub.backend.controller;

import com.boardinghub.backend.dto.response.PropertyResponse;
import com.boardinghub.backend.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PropertyResponse>> getSavedProperties(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<PropertyResponse> favorites = favoriteService.getSavedProperties(userDetails.getUsername());
        return ResponseEntity.ok(favorites);
    }

    @PostMapping("/{propertyId}/toggle")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean isSaved = favoriteService.toggleFavorite(propertyId, userDetails.getUsername());
        return ResponseEntity.ok(Map.of(
                "propertyId", propertyId,
                "isSaved", isSaved,
                "message", isSaved ? "Property saved to favorites" : "Property removed from favorites"
        ));
    }
}
