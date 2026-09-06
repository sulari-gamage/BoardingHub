package com.boardinghub.backend.repository;

import com.boardinghub.backend.entity.BoardingProperty;
import com.boardinghub.backend.enums.GenderPreference;
import com.boardinghub.backend.enums.PropertyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardingPropertyRepository extends JpaRepository<BoardingProperty, Long> {

    List<BoardingProperty> findByStatus(PropertyStatus status);

    List<BoardingProperty> findByOwnerId(Long ownerId);

    List<BoardingProperty> findByCityIgnoreCaseAndStatus(String city, PropertyStatus status);

    @Query("SELECT p FROM BoardingProperty p WHERE p.status = :status " +
           "AND (CAST(:city AS string) IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', CAST(:city AS string), '%'))) " +
           "AND (:maxRent IS NULL OR p.monthlyRent <= :maxRent) " +
           "AND (:gender IS NULL OR p.genderPreference = :gender OR p.genderPreference = com.boardinghub.backend.enums.GenderPreference.ANY)")
    List<BoardingProperty> searchProperties(
            @Param("status") PropertyStatus status,
            @Param("city") String city,
            @Param("maxRent") Double maxRent,
            @Param("gender") GenderPreference gender
    );
}
