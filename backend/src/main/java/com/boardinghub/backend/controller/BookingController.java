package com.boardinghub.backend.controller;

import com.boardinghub.backend.dto.request.BookingRequestCreateDTO;
import com.boardinghub.backend.dto.request.BookingStatusUpdateDTO;
import com.boardinghub.backend.dto.response.BookingResponse;
import com.boardinghub.backend.service.BookingService;
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
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<BookingResponse> createBookingRequest(
            @Valid @RequestBody BookingRequestCreateDTO request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BookingResponse response = bookingService.createBookingRequest(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("hasRole('SEEKER')")
    public ResponseEntity<List<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<BookingResponse> bookings = bookingService.getSeekerBookings(userDetails.getUsername());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/owner-requests")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<BookingResponse>> getOwnerRequests(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<BookingResponse> requests = bookingService.getOwnerBookingRequests(userDetails.getUsername());
        return ResponseEntity.ok(requests);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SEEKER', 'OWNER', 'ADMIN')")
    public ResponseEntity<BookingResponse> updateBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody BookingStatusUpdateDTO dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BookingResponse response = bookingService.updateBookingStatus(id, dto, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
