package com.boardinghub.backend.service;

import com.boardinghub.backend.dto.response.GeocodeResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class GeocodingService {

    @Value("${google.maps.api.key:}")
    private String googleApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Known Sri Lanka landmark/city fallbacks for offline or fallback resolution
    private static final Map<String, double[]> SRI_LANKA_LOCATIONS = new HashMap<>();

    static {
        SRI_LANKA_LOCATIONS.put("colombo", new double[]{6.9271, 79.8612});
        SRI_LANKA_LOCATIONS.put("bambalapitiya", new double[]{6.8887, 79.8576});
        SRI_LANKA_LOCATIONS.put("wellawatte", new double[]{6.8741, 79.8604});
        SRI_LANKA_LOCATIONS.put("kollupitiya", new double[]{6.9117, 79.8517});
        SRI_LANKA_LOCATIONS.put("malabe", new double[]{6.9061, 79.9647});
        SRI_LANKA_LOCATIONS.put("moratuwa", new double[]{6.7730, 79.8816});
        SRI_LANKA_LOCATIONS.put("katubedda", new double[]{6.7972, 79.9018});
        SRI_LANKA_LOCATIONS.put("kandy", new double[]{7.2906, 80.6337});
        SRI_LANKA_LOCATIONS.put("galle", new double[]{6.0535, 80.2210});
        SRI_LANKA_LOCATIONS.put("nugegoda", new double[]{6.8715, 79.8965});
        SRI_LANKA_LOCATIONS.put("maharagama", new double[]{6.8480, 79.9265});
        SRI_LANKA_LOCATIONS.put("dehiwala", new double[]{6.8516, 79.8659});
        SRI_LANKA_LOCATIONS.put("mount lavinia", new double[]{6.8301, 79.8650});
        SRI_LANKA_LOCATIONS.put("battaramulla", new double[]{6.8974, 79.9221});
        SRI_LANKA_LOCATIONS.put("rajagiriya", new double[]{6.9096, 79.8943});
        SRI_LANKA_LOCATIONS.put("gampaha", new double[]{7.0840, 79.9939});
        SRI_LANKA_LOCATIONS.put("negombo", new double[]{7.2008, 79.8737});
        SRI_LANKA_LOCATIONS.put("jaffna", new double[]{9.6615, 80.0255});
        SRI_LANKA_LOCATIONS.put("kurunegala", new double[]{7.4863, 80.3647});
        SRI_LANKA_LOCATIONS.put("matara", new double[]{5.9549, 80.5550});

        // Hambantota District & Southern Province
        SRI_LANKA_LOCATIONS.put("hambantota", new double[]{6.1246, 81.1185});
        SRI_LANKA_LOCATIONS.put("tangalle", new double[]{6.0243, 80.7941});
        SRI_LANKA_LOCATIONS.put("tissamaharama", new double[]{6.2804, 81.2858});
        SRI_LANKA_LOCATIONS.put("ambalantota", new double[]{6.1228, 81.0252});
        SRI_LANKA_LOCATIONS.put("beliatta", new double[]{6.0460, 80.7423});
        SRI_LANKA_LOCATIONS.put("kataragama", new double[]{6.4136, 81.3323});
        SRI_LANKA_LOCATIONS.put("walasmulla", new double[]{6.1438, 80.6976});
        SRI_LANKA_LOCATIONS.put("suriyawewa", new double[]{6.3267, 81.0003});
        SRI_LANKA_LOCATIONS.put("ranna", new double[]{6.0694, 80.8841});
        SRI_LANKA_LOCATIONS.put("weeraketiya", new double[]{6.1444, 80.7601});
    }

    public GeocodeResponse geocodeAddress(String address, String city) {
        if (address == null || address.trim().isEmpty()) {
            return GeocodeResponse.builder()
                    .success(false)
                    .message("Please enter a valid property address.")
                    .build();
        }

        String fullQuery = address.trim();
        if (city != null && !city.trim().isEmpty() && !fullQuery.toLowerCase().contains(city.trim().toLowerCase())) {
            fullQuery += ", " + city.trim();
        }
        if (!fullQuery.toLowerCase().contains("sri lanka")) {
            fullQuery += ", Sri Lanka";
        }

        // 1. Try Google Geocoding API if key configured
        if (googleApiKey != null && !googleApiKey.trim().isEmpty()) {
            try {
                URI uri = UriComponentsBuilder.fromHttpUrl("https://maps.googleapis.com/maps/api/geocode/json")
                        .queryParam("address", fullQuery)
                        .queryParam("components", "country:LK")
                        .queryParam("key", googleApiKey)
                        .build()
                        .toUri();

                String jsonResult = restTemplate.getForObject(uri, String.class);
                JsonNode root = objectMapper.readTree(jsonResult);
                String status = root.path("status").asText();

                if ("OK".equalsIgnoreCase(status)) {
                    JsonNode result = root.path("results").get(0);
                    JsonNode location = result.path("geometry").path("location");
                    double lat = location.path("lat").asDouble();
                    double lng = location.path("lng").asDouble();
                    String formattedAddress = result.path("formatted_address").asText();

                    return GeocodeResponse.builder()
                            .success(true)
                            .latitude(lat)
                            .longitude(lng)
                            .formattedAddress(formattedAddress)
                            .message("Location resolved successfully via Google Maps.")
                            .build();
                } else {
                    log.warn("Google Geocoding API returned status: {}", status);
                }
            } catch (Exception e) {
                log.error("Google Geocoding API error: {}", e.getMessage());
            }
        }

        // 2. Fallback to OpenStreetMap Nominatim API
        try {
            String encodedQuery = URLEncoder.encode(fullQuery, StandardCharsets.UTF_8);
            String osmUrl = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodedQuery + "&countrycodes=lk&limit=1";

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "BoardingHub-Application/1.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            org.springframework.http.ResponseEntity<String> response = restTemplate.exchange(
                    osmUrl,
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                if (rootNode.isArray() && rootNode.size() > 0) {
                    JsonNode firstResult = rootNode.get(0);
                    double lat = Double.parseDouble(firstResult.path("lat").asText());
                    double lng = Double.parseDouble(firstResult.path("lon").asText());
                    String display = firstResult.path("display_name").asText();

                    return GeocodeResponse.builder()
                            .success(true)
                            .latitude(lat)
                            .longitude(lng)
                            .formattedAddress(display)
                            .message("Location resolved successfully.")
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("OSM Nominatim Geocoding fallback error: {}", e.getMessage());
        }

        // 3. Fallback to city/landmark keyword matching
        String queryLower = fullQuery.toLowerCase();
        for (Map.Entry<String, double[]> entry : SRI_LANKA_LOCATIONS.entrySet()) {
            if (queryLower.contains(entry.getKey())) {
                double[] coords = entry.getValue();
                return GeocodeResponse.builder()
                        .success(true)
                        .latitude(coords[0])
                        .longitude(coords[1])
                        .formattedAddress(fullQuery)
                        .message("Approximate city center location set for " + entry.getKey() + ". You can drag the map pin to pinpoint exact location.")
                        .build();
            }
        }

        return GeocodeResponse.builder()
                .success(false)
                .message("Could not automatically locate specified Sri Lankan address. Please check address spelling or drag the map marker pin manually.")
                .build();
    }
}
