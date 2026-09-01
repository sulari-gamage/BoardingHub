import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BoardingCard({ item, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            {/* Cover Image */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            </View>

            {/* Card Content */}
            <View style={styles.content}>
                {/* Title & Rating Badge Row */}
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 3 }} />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                </View>

                {/* Location Pin */}
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.locationText}>{item.location}</Text>
                </View>

                {/* Feature Tags */}
                <View style={styles.tagRow}>
                    {(item.tags || [item.genderPreference]).map((tag, idx) => (
                        <View key={idx} style={styles.tagChip}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>

                {/* Price Tag */}
                <View style={styles.priceRow}>
                    <Text style={styles.priceVal}>Rs. {item.price.toLocaleString()}</Text>
                    <Text style={styles.pricePeriod}> / month</Text>
                </View>
            </View>
        </TouchableOpacity>
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
        height: 160,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    content: {
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
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
        marginBottom: 12,
    },
    locationText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 14,
    },
    tagChip: {
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1B4D3E',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceVal: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1B4D3E',
    },
    pricePeriod: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
});
