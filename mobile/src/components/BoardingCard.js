import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BoardingCard({ item, onPress, isSaved, onToggleSave }) {
    const isAnnex = item.propertyNature === 'WHOLE_HOUSE';
    const totalRooms = item.roomsCount || (item.rooms ? item.rooms.length : 1);
    const availableRooms = item.rooms ? item.rooms.filter(r => (r.remainingSpaces != null ? r.remainingSpaces : (r.totalCapacity - r.occupied)) > 0).length : totalRooms;
    const totalSpaces = item.totalSpaces != null ? item.totalSpaces : (item.rooms ? item.rooms.reduce((sum, r) => sum + (r.remainingSpaces != null ? r.remainingSpaces : Math.max(0, (r.totalCapacity || 1) - (r.occupied || 0))), 0) : (item.remainingSpaces || 1));

    return (
        <View style={styles.card}>
            {/* Cover Image */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
                <View style={styles.natureBadgeOverlay}>
                    <Ionicons name={isAnnex ? 'home' : 'business'} size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                    <Text style={styles.natureBadgeOverlayText}>
                        {isAnnex ? 'Annex / Whole House' : 'Room-Based'}
                    </Text>
                </View>

                {/* Heart Button (Top Right) */}
                <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => onToggleSave && onToggleSave(item)}
                    activeOpacity={0.8}
                >
                    <Ionicons name={isSaved ? "heart" : "heart-outline"} size={16} color={isSaved ? "#EF4444" : "#64748B"} />
                </TouchableOpacity>
            </View>

            {/* Card Content */}
            <View style={styles.content}>
                {/* Title & Rating */}
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 3 }} />
                        <Text style={styles.ratingText}>{item.rating || 4.8}</Text>
                    </View>
                </View>

                {/* Location Pin & Proximity Distance */}
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {item.location} {item.distanceText ? `• 📍 ${item.distanceText}` : ''}
                    </Text>
                </View>

                {/* Room / Capacity Status Row */}
                <View style={styles.statusBadgeRow}>
                    {isAnnex ? (
                        <View style={styles.annexBadge}>
                            <Ionicons name="home-outline" size={13} color="#1B4D3E" style={{ marginRight: 4 }} />
                            <Text style={styles.annexBadgeText}>
                                Whole House • {totalRooms} {totalRooms === 1 ? 'Room' : 'Rooms'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.roomBadgeContainer}>
                            <View style={styles.roomBadge}>
                                <Ionicons name="bed-outline" size={13} color="#1B4D3E" style={{ marginRight: 4 }} />
                                <Text style={styles.roomBadgeText}>
                                    {availableRooms} {availableRooms === 1 ? 'Room' : 'Rooms'} Avail.
                                </Text>
                            </View>
                            <View style={styles.spaceBadge}>
                                <Ionicons name="people-outline" size={13} color="#065F46" style={{ marginRight: 4 }} />
                                <Text style={styles.spaceBadgeText}>
                                    {totalSpaces} {totalSpaces === 1 ? 'Space Left' : 'Spaces Left'}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Price & Action Row */}
                <View style={styles.priceRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={styles.priceVal}>Rs. {item.price?.toLocaleString() || '0'}</Text>
                        <Text style={styles.pricePeriod}>
                            {isAnnex ? ' / month' : ' / room / mon.'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={onPress}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.viewBtnText}>View</Text>
                        <Ionicons name="chevron-forward" size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    imageContainer: {
        position: 'relative',
        height: 160,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    natureBadgeOverlay: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(27, 77, 62, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    natureBadgeOverlayText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
    },
    heartBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        padding: 14,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginRight: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FEF08A',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#B45309',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
    },
    statusBadgeRow: {
        marginBottom: 10,
    },
    annexBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    annexBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    roomBadgeContainer: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    roomBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    roomBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    spaceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    spaceBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#065F46',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    priceVal: {
        fontSize: 17,
        fontWeight: '900',
        color: '#1B4D3E',
    },
    pricePeriod: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#133E32',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        elevation: 1,
    },
    viewBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
