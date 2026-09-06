package com.boardinghub.backend.controller;

import com.boardinghub.backend.dto.request.PropertyRequest;
import com.boardinghub.backend.dto.response.PropertyResponse;
import com.boardinghub.backend.enums.GenderPreference;
import com.boardinghub.backend.enums.PropertyStatus;
import com.boardinghub.backend.service.PropertyService;
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
@RequestMapping("/api/properties")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @RequestBody PropertyRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PropertyResponse response = propertyService.createProperty(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PropertyResponse>> searchProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double maxRent,
            @RequestParam(required = false) GenderPreference gender
    ) {
        List<PropertyResponse> properties = propertyService.searchApprovedProperties(city, maxRent, gender);
        return ResponseEntity.ok(properties);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getPropertyById(@PathVariable Long id) {
        PropertyResponse property = propertyService.getPropertyById(id);
        return ResponseEntity.ok(property);
    }

    @GetMapping("/my-properties")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<PropertyResponse>> getMyProperties(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<PropertyResponse> properties = propertyService.getOwnerProperties(userDetails.getUsername());
        return ResponseEntity.ok(properties);
    }

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PropertyResponse>> getPendingProperties() {
        List<PropertyResponse> properties = propertyService.getPendingProperties();
        return ResponseEntity.ok(properties);
    }

    @PatchMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PropertyResponse> approveProperty(@PathVariable Long id) {
        PropertyResponse response = propertyService.updatePropertyStatus(id, PropertyStatus.APPROVED);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PropertyResponse> rejectProperty(@PathVariable Long id) {
        PropertyResponse response = propertyService.updatePropertyStatus(id, PropertyStatus.REJECTED);
        return ResponseEntity.ok(response);
    }
}
