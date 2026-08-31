import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function BoardingCard({ item, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.badgeContainer}>
                <Text style={[
                    styles.badgeText,
                    item.genderPreference === 'BOYS ONLY' ? styles.boysBadge :
                        item.genderPreference === 'GIRLS ONLY' ? styles.girlsBadge : styles.anyBadge
                ]}>
                    {item.genderPreference}
                </Text>
            </View>

            <View style={styles.content}>
                <View style={styles.ratingRow}>
                    <Text style={styles.location}>{item.location}</Text>
                    <Text style={styles.rating}>★ {item.rating} ({item.reviewsCount})</Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.distance}>📍 {item.distance}</Text>

                <View style={styles.footer}>
                    <Text style={styles.price}>
                        Rs. {item.price.toLocaleString()} <Text style={styles.period}>/ {item.pricePeriod}</Text>
                    </Text>
                    <View style={styles.detailsBtn}>
                        <Text style={styles.detailsBtnText}>View Details</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 18,
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    image: {
        width: '100%',
        height: 180,
    },
    badgeContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    badgeText: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
        overflow: 'hidden',
    },
    boysBadge: { backgroundColor: '#2563EB' },
    girlsBadge: { backgroundColor: '#EC4899' },
    anyBadge: { backgroundColor: '#10B981' },
    content: {
        padding: 14,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    location: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    rating: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D97706',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    distance: {
        fontSize: 13,
        color: '#475569',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 10,
    },
    price: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1E40AF',
    },
    period: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '400',
    },
    detailsBtn: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    detailsBtnText: {
        color: '#2563EB',
        fontWeight: '700',
        fontSize: 12,
    },
});
