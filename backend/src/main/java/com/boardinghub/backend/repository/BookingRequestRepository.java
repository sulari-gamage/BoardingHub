package com.boardinghub.backend.repository;

import com.boardinghub.backend.entity.BookingRequest;
import com.boardinghub.backend.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRequestRepository extends JpaRepository<BookingRequest, Long> {

    List<BookingRequest> findBySeekerId(Long seekerId);

    List<BookingRequest> findByPropertyId(Long propertyId);

    @Query("SELECT b FROM BookingRequest b WHERE b.property.owner.id = :ownerId ORDER BY b.occupantsCount DESC, b.createdAt DESC")
    List<BookingRequest> findByOwnerIdSortedByOccupants(@Param("ownerId") Long ownerId);

    List<BookingRequest> findByPropertyIdAndStatus(Long propertyId, BookingStatus status);

    List<BookingRequest> findByRoomIdAndStatus(Long roomId, BookingStatus status);
}
