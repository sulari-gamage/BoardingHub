package com.boardinghub.backend.controller;

import com.boardinghub.backend.dto.response.PropertyResponse;
import com.boardinghub.backend.enums.PropertyStatus;
import com.boardinghub.backend.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/properties")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPropertyController {

    private final PropertyService propertyService;

    @GetMapping("/pending")
    public ResponseEntity<List<PropertyResponse>> getPendingProperties() {
        List<PropertyResponse> properties = propertyService.getPendingProperties();
        return ResponseEntity.ok(properties);
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<PropertyResponse> approveProperty(@PathVariable Long id) {
        PropertyResponse response = propertyService.updatePropertyStatus(id, PropertyStatus.APPROVED);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<PropertyResponse> rejectProperty(@PathVariable Long id) {
        PropertyResponse response = propertyService.updatePropertyStatus(id, PropertyStatus.REJECTED);
        return ResponseEntity.ok(response);
    }
}
