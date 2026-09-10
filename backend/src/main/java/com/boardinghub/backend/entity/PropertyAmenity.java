package com.boardinghub.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "property_amenities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyAmenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false, unique = true)
    private BoardingProperty property;

    @Column(name = "has_wifi")
    private Boolean hasWifi;

    @Column(name = "has_water")
    private Boolean hasWater;

    @Column(name = "has_electricity")
    private Boolean hasElectricity;

    @Column(name = "has_gas")
    private Boolean hasGas;

    @Column(name = "has_laundry")
    private Boolean hasLaundry;

    @Column(name = "has_parking")
    private Boolean hasParking;

    @Column(name = "has_kitchen")
    private Boolean hasKitchen;

    @Column(name = "has_common_area")
    private Boolean hasCommonArea;

    @Column(name = "has_pool")
    private Boolean hasPool;

    @Column(name = "has_fitness")
    private Boolean hasFitness;

    @Column(name = "has_cctv")
    private Boolean hasCctv;

    @Column(name = "has_gate")
    private Boolean hasGate;

    @Column(name = "has_fire_extinguisher")
    private Boolean hasFireExtinguisher;

    @Column(name = "has_first_aid")
    private Boolean hasFirstAid;

    @Column(name = "has_ac")
    private Boolean hasAc;

    @Column(name = "has_generator")
    private Boolean hasGenerator;

    @Column(name = "has_attached_bathroom")
    private Boolean hasAttachedBathroom;

    @Column(name = "has_balcony")
    private Boolean hasBalcony;

    @Column(name = "custom_amenities", length = 1000)
    private String customAmenities;
}
