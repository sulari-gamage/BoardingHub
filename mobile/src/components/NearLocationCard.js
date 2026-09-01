import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function NearLocationCard({ item, onPress }) {
    const [isSaved, setIsSaved] = useState(item.isSaved || false);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            {/* Image & Favorite Heart Button */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
                <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => setIsSaved(!isSaved)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.heartIcon}>{isSaved ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
            </View>

            {/* Details */}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={styles.price}>
                    <Text style={styles.priceVal}>Rs. {item.price.toLocaleString()}</Text>
                    <Text style={styles.pricePeriod}> / month</Text>
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 220,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    imageContainer: {
        position: 'relative',
        height: 130,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    heartBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    heartIcon: {
        fontSize: 14,
    },
    content: {
        padding: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    price: {
        fontSize: 13,
    },
    priceVal: {
        fontWeight: '800',
        color: '#1B4D3E',
    },
    pricePeriod: {
        fontWeight: '500',
        color: '#64748B',
        fontSize: 12,
    },
});
