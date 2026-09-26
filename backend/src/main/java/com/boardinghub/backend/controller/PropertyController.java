package com.boardinghub.backend.controller;

import com.boardinghub.backend.dto.request.PropertyRequest;
import com.boardinghub.backend.dto.response.PropertyResponse;
import com.boardinghub.backend.enums.GenderPreference;
import com.boardinghub.backend.dto.response.GeocodeResponse;
import com.boardinghub.backend.service.GeocodingService;
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
    private final GeocodingService geocodingService;

    @GetMapping("/geocode")
    public ResponseEntity<GeocodeResponse> geocodePropertyAddress(
            @RequestParam String address,
            @RequestParam(required = false) String city
    ) {
        GeocodeResponse response = geocodingService.geocodeAddress(address, city);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @RequestBody PropertyRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PropertyResponse response = propertyService.createProperty(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<PropertyResponse> updateProperty(
            @PathVariable Long id,
            @Valid @RequestBody PropertyRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PropertyResponse response = propertyService.updateProperty(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        propertyService.deleteProperty(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<PropertyResponse>> getMyProperties(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<PropertyResponse> properties = propertyService.getOwnerProperties(userDetails.getUsername());
        return ResponseEntity.ok(properties);
    }

    @DeleteMapping("/{propertyId}/rooms/{roomId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<PropertyResponse> deleteRoom(
            @PathVariable Long propertyId,
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        PropertyResponse updated = propertyService.deleteRoom(propertyId, roomId, userDetails.getUsername());
        return ResponseEntity.ok(updated);
    }
}
