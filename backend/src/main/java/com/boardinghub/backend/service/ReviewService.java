package com.boardinghub.backend.service;

import com.boardinghub.backend.dto.request.ReviewRequest;
import com.boardinghub.backend.dto.response.ReviewResponse;
import com.boardinghub.backend.entity.BoardingProperty;
import com.boardinghub.backend.entity.Review;
import com.boardinghub.backend.entity.User;
import com.boardinghub.backend.repository.BoardingPropertyRepository;
import com.boardinghub.backend.repository.ReviewRepository;
import com.boardinghub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BoardingPropertyRepository propertyRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse createReview(ReviewRequest request, String userEmail) {
        User seeker = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BoardingProperty property = null;
        if (request.getPropertyId() != null && request.getPropertyId() > 0) {
            property = propertyRepository.findById(request.getPropertyId())
                    .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + request.getPropertyId()));
        }

        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars");
        }

        String type = (property != null) ? "PROPERTY" : "APP";

        Review review = Review.builder()
                .property(property)
                .seeker(seeker)
                .rating(request.getRating())
                .comment(request.getComment())
                .type(type)
                .build();

        Review savedReview = reviewRepository.save(review);
        return mapToReviewResponse(savedReview);
    }

    public List<ReviewResponse> getPropertyReviews(Long propertyId) {
        return reviewRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId)
                .stream().map(this::mapToReviewResponse).collect(Collectors.toList());
    }

    public List<ReviewResponse> getMyReviews(String userEmail) {
        User seeker = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return reviewRepository.findBySeekerIdOrderByCreatedAtDesc(seeker.getId())
                .stream().map(this::mapToReviewResponse).collect(Collectors.toList());
    }

    private ReviewResponse mapToReviewResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .propertyId(r.getProperty() != null ? r.getProperty().getId() : null)
                .propertyTitle(r.getProperty() != null ? r.getProperty().getTitle() : "BoardingHub Platform (App Review)")
                .seekerId(r.getSeeker().getId())
                .seekerName(r.getSeeker().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .type(r.getType() != null ? r.getType() : (r.getProperty() != null ? "PROPERTY" : "APP"))
                .createdAt(r.getCreatedAt())
                .build();
    }
}
