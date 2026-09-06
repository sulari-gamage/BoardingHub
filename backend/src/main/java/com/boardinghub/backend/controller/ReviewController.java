package com.boardinghub.backend.controller;

import com.boardinghub.backend.dto.request.ReviewRequest;
import com.boardinghub.backend.dto.response.ReviewResponse;
import com.boardinghub.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/api/reviews")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ReviewResponse response = reviewService.createReview(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/properties/{propertyId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getPropertyReviews(@PathVariable Long propertyId) {
        List<ReviewResponse> reviews = reviewService.getPropertyReviews(propertyId);
        return ResponseEntity.ok(reviews);
    }
}
