package com.boardinghub.backend.repository;

import com.boardinghub.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);

    List<Review> findBySeekerIdOrderByCreatedAtDesc(Long seekerId);
}
