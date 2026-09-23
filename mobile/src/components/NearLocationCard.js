import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NearLocationCard({ item, onPress, isSaved, onToggleSave }) {
    const isAnnex = item.propertyNature === 'WHOLE_HOUSE';
    const totalRooms = item.roomsCount || (item.rooms ? item.rooms.length : 1);
    const availableRooms = item.rooms ? item.rooms.filter(r => (r.remainingSpaces != null ? r.remainingSpaces : (r.totalCapacity - r.occupied)) > 0).length : totalRooms;
    const totalSpaces = item.totalSpaces != null ? item.totalSpaces : (item.rooms ? item.rooms.reduce((sum, r) => sum + (r.remainingSpaces != null ? r.remainingSpaces : Math.max(0, (r.totalCapacity || 1) - (r.occupied || 0))), 0) : (item.remainingSpaces || 1));

    const annexCapacity = item.totalCapacity || item.capacity || item.totalSpaces || (item.rooms && item.rooms.length > 0 ? item.rooms.reduce((sum, r) => sum + (r.totalCapacity || r.capacity || 1), 0) : (item.bedsCount || 1));

    const getGenderInfo = () => {
        const raw = item.genderPreference || item.genderType || item.gender || item.genderPref || item.genderPre;
        if (!raw) {
            return { label: 'Any Gender / Mixed', color: '#1B4D3E', bg: '#E6F0EC', border: '#C3DCD4' };
        }
        const s = String(raw).toUpperCase();
        if (s.includes('GIRL') || s.includes('FEMALE') || s.includes('WOMEN') || s === 'GIRLS') {
            return { label: 'Girls Only', color: '#BE185D', bg: '#FCE7F3', border: '#FBCFE8' };
        }
        if (s.includes('BOY') || s.includes('MALE') || s.includes('MEN') || s === 'BOYS') {
            return { label: 'Boys Only', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
        }
        return { label: 'Any Gender / Mixed', color: '#1B4D3E', bg: '#E6F0EC', border: '#C3DCD4' };
    };

    const genderInfo = getGenderInfo();

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            {/* Image Container with Badges */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />

                {/* Property Nature Tag (Top Left) */}
                <View style={styles.natureOverlay}>
                    <Ionicons name={isAnnex ? 'home' : 'business'} size={10} color="#FFD700" style={{ marginRight: 3 }} />
                    <Text style={styles.natureOverlayText}>{isAnnex ? 'Annex' : 'Room-Based'}</Text>
                </View>

                {/* Top Right: Heart Button & Rating Badge */}
                <View style={styles.topRightOverlay}>
                    <TouchableOpacity
                        style={styles.heartBtn}
                        onPress={() => onToggleSave && onToggleSave(item)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={isSaved ? "heart" : "heart-outline"} size={14} color={isSaved ? "#EF4444" : "#64748B"} />
                    </TouchableOpacity>

                    <View style={styles.ratingBadgeOverlay}>
                        <Ionicons name="star" size={10} color="#D97706" style={{ marginRight: 2 }} />
                        <Text style={styles.ratingTextOverlay}>
                            {item.rating ? Number(item.rating).toFixed(1) : 'New'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Details Section */}
            <View style={styles.content}>
                {/* Title & Gender Badge */}
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <View style={[styles.genderBadge, { backgroundColor: genderInfo.bg, borderColor: genderInfo.border }]}>
                        <Text style={[styles.genderBadgeText, { color: genderInfo.color }]}>{genderInfo.label}</Text>
                    </View>
                </View>

                {/* Distance from Device Location (only if available) */}
                {item.distanceText ? (
                    <View style={styles.locationRow}>
                        <Ionicons name="navigate-outline" size={11} color="#64748B" style={{ marginRight: 3 }} />
                        <Text style={styles.locationText}>📍 {item.distanceText}</Text>
                    </View>
                ) : null}

                {/* Capacity & Room Info */}
                <View style={styles.infoRow}>
                    {isAnnex ? (
                        <View style={styles.capacityPill}>
                            <Ionicons name="home-outline" size={12} color="#133E32" style={{ marginRight: 4 }} />
                            <Text style={styles.infoText}>Whole House • Capacity: {annexCapacity}</Text>
                        </View>
                    ) : (
                        <View style={styles.capacityPill}>
                            <Ionicons name="bed-outline" size={12} color="#133E32" style={{ marginRight: 4 }} />
                            <Text style={styles.infoText}>{availableRooms} {availableRooms === 1 ? 'Room' : 'Rooms'}</Text>
                            <Text style={styles.dotSeparator}>•</Text>
                            <Ionicons name="people-outline" size={12} color="#133E32" style={{ marginRight: 4 }} />
                            <Text style={styles.infoText}>{totalSpaces} {totalSpaces === 1 ? 'Space' : 'Spaces'}</Text>
                        </View>
                    )}
                </View>

                {/* Price Row */}
                <View style={styles.priceRow}>
                    <Text style={styles.priceVal}>Rs. {item.price?.toLocaleString() || '0'}</Text>
                    <Text style={styles.pricePeriod}>/ mo</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 270,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    imageContainer: {
        position: 'relative',
        height: 145,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    natureOverlay: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(19, 62, 50, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    natureOverlayText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    topRightOverlay: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    heartBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    ratingBadgeOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 28,
        paddingHorizontal: 8,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    ratingTextOverlay: {
        fontSize: 11,
        fontWeight: '800',
        color: '#B45309',
    },
    content: {
        padding: 12,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        flex: 1,
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        marginRight: 6,
    },
    genderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        alignSelf: 'center',
        flexShrink: 0,
    },
    genderBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    locationText: {
        fontSize: 11.5,
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
    },
    infoRow: {
        marginBottom: 8,
    },
    capacityPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    infoText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1E293B',
    },
    dotSeparator: {
        marginHorizontal: 5,
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '800',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceVal: {
        fontSize: 15,
        fontWeight: '800',
        color: '#133E32',
        marginRight: 4,
    },
    pricePeriod: {
        fontWeight: '600',
        color: '#64748B',
        fontSize: 12,
    },
});
