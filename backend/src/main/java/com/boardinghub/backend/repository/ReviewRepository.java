package com.boardinghub.backend.repository;

import com.boardinghub.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);

    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Review r WHERE r.property IS NOT NULL AND r.property.owner.id = :ownerId ORDER BY r.createdAt DESC")
    List<Review> findByPropertyOwnerIdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("ownerId") Long ownerId);
}
