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

import com.boardinghub.backend.enums.NotificationType;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BoardingPropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ReviewResponse createReview(ReviewRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
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
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .type(type)
                .build();

        Review savedReview = reviewRepository.save(review);

        // Notify property owner if this is a property review
        if (property != null && property.getOwner() != null) {
            String title = "New Review ⭐";
            String commentExcerpt = request.getComment() != null
                    ? (request.getComment().length() > 60 ? request.getComment().substring(0, 57) + "..." : request.getComment())
                    : "No comment";
            String message = user.getName() + " submitted a " + request.getRating() + "-star review for " + property.getTitle() + ": \"" + commentExcerpt + "\"";

            notificationService.createAndSendNotification(
                    property.getOwner(),
                    NotificationType.NEW_REVIEW,
                    title,
                    message,
                    null,
                    property.getId(),
                    savedReview.getId()
            );
        }

        return mapToReviewResponse(savedReview);
    }

    public List<ReviewResponse> getPropertyReviews(Long propertyId) {
        return reviewRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId)
                .stream().map(this::mapToReviewResponse).collect(Collectors.toList());
    }

    public List<ReviewResponse> getMyReviews(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        List<Review> userOwnReviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<Review> propertyReviewsForOwner = reviewRepository.findByPropertyOwnerIdOrderByCreatedAtDesc(user.getId());
        
        java.util.Set<Long> seenIds = new java.util.HashSet<>();
        List<Review> combined = new java.util.ArrayList<>();
        
        if (propertyReviewsForOwner != null) {
            for (Review r : propertyReviewsForOwner) {
                if (r != null && r.getId() != null && seenIds.add(r.getId())) {
                    combined.add(r);
                }
            }
        }
        if (userOwnReviews != null) {
            for (Review r : userOwnReviews) {
                if (r != null && r.getId() != null && seenIds.add(r.getId())) {
                    combined.add(r);
                }
            }
        }
        
        return combined.stream().map(this::mapToReviewResponse).collect(Collectors.toList());
    }

    private ReviewResponse mapToReviewResponse(Review r) {
        ReviewResponse response = new ReviewResponse();
        response.setId(r.getId());
        response.setPropertyId(r.getProperty() != null ? r.getProperty().getId() : null);
        response.setPropertyTitle(r.getProperty() != null ? r.getProperty().getTitle() : "BoardingHub Platform (App Review)");
        response.setUserId(r.getUser().getId());
        response.setUserName(r.getUser().getName());
        response.setUserAvatar(r.getUser().getAvatarUrl());
        response.setRating(r.getRating());
        response.setComment(r.getComment());
        response.setType(r.getType() != null ? r.getType() : (r.getProperty() != null ? "PROPERTY" : "APP"));
        response.setCreatedAt(r.getCreatedAt());
        return response;
    }
}
