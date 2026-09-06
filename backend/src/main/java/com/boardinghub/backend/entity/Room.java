package com.boardinghub.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private BoardingProperty property;

    @NotBlank
    @Column(name = "room_type", nullable = false)
    private String roomType;

    @NotNull
    @Column(name = "monthly_price", nullable = false)
    private Double monthlyPrice;

    @NotNull
    @Column(name = "total_capacity", nullable = false)
    private Integer totalCapacity;

    @NotNull
    @Column(name = "remaining_spaces", nullable = false)
    private Integer remainingSpaces;
}
