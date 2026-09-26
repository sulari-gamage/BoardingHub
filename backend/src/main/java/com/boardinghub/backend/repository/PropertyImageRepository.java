package com.boardinghub.backend.repository;

import com.boardinghub.backend.entity.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {

    List<PropertyImage> findByPropertyId(Long propertyId);

    @Modifying
    @Transactional
    @Query("DELETE FROM PropertyImage pi WHERE pi.property.id = :propertyId")
    void deleteByPropertyId(@Param("propertyId") Long propertyId);
}

