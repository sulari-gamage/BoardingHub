import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Image,
    ScrollView,
    Dimensions,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { POPULAR_BOARDINGS, NEAR_LOCATION_BOARDINGS } from '../../data/mockBoardings';

const { width } = Dimensions.get('window');

export default function MapViewScreen({ onSelectBoarding, onBack, onToggleListView }) {
    const allBoardings = [...NEAR_LOCATION_BOARDINGS, ...POPULAR_BOARDINGS];
    const [selectedBoarding, setSelectedBoarding] = useState(allBoardings[0]);
    const [selectedFilter, setSelectedFilter] = useState('ALL');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Top Search & Filter Bar */}
            <View style={styles.topHeader}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#0F172A" />
                </TouchableOpacity>

                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.searchText}>Search map area...</Text>
                </View>

                <TouchableOpacity
                    style={styles.toggleListBtn}
                    onPress={onToggleListView || onBack}
                    activeOpacity={0.85}
                >
                    <Ionicons name="list" size={20} color="#1B4D3E" />
                </TouchableOpacity>
            </View>

            {/* Simulated Map View Container */}
            <View style={styles.mapContainer}>
                {/* Map Graphic Background */}
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80' }}
                    style={styles.mapImage}
                    resizeMode="cover"
                />

                {/* Map Overlay Filter Chips */}
                <View style={styles.filterChipOverlay}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {['ALL', 'Moratuwa', 'Nugegoda', 'Under 20k', 'Girls Only'].map((chip) => (
                            <TouchableOpacity
                                key={chip}
                                style={[styles.mapChip, selectedFilter === chip && styles.mapChipActive]}
                                onPress={() => setSelectedFilter(chip)}
                            >
                                <Text style={[styles.mapChipText, selectedFilter === chip && styles.mapChipTextActive]}>
                                    {chip}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Interactive Map Pins */}
                <TouchableOpacity
                    style={[styles.mapPin, selectedBoarding.id === 'n1' && styles.activePin, { top: '32%', left: '25%' }]}
                    onPress={() => setSelectedBoarding(allBoardings[0])}
                    activeOpacity={0.8}
                >
                    <Ionicons name="location" size={18} color="#FFFFFF" />
                    <Text style={styles.pinPriceText}>Rs.14,500</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.mapPin, selectedBoarding.id === 'n2' && styles.activePin, { top: '22%', right: '28%' }]}
                    onPress={() => setSelectedBoarding(allBoardings[1] || allBoardings[0])}
                    activeOpacity={0.8}
                >
                    <Ionicons name="location" size={18} color="#FFFFFF" />
                    <Text style={styles.pinPriceText}>Rs.18,000</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.mapPin, selectedBoarding.id === 'p1' && styles.activePin, { top: '48%', left: '45%' }]}
                    onPress={() => setSelectedBoarding(allBoardings[2] || allBoardings[0])}
                    activeOpacity={0.8}
                >
                    <Ionicons name="location" size={18} color="#FFFFFF" />
                    <Text style={styles.pinPriceText}>Rs.16,000</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.mapPin, selectedBoarding.id === 'p2' && styles.activePin, { top: '65%', right: '20%' }]}
                    onPress={() => setSelectedBoarding(allBoardings[3] || allBoardings[0])}
                    activeOpacity={0.8}
                >
                    <Ionicons name="location" size={18} color="#FFFFFF" />
                    <Text style={styles.pinPriceText}>Rs.22,000</Text>
                </TouchableOpacity>

                {/* User Current Location Floating Button */}
                <TouchableOpacity style={styles.myLocationBtn} activeOpacity={0.8}>
                    <Ionicons name="locate" size={22} color="#1B4D3E" />
                </TouchableOpacity>
            </View>

            {/* Bottom Card Preview Carousel */}
            {selectedBoarding && (
                <View style={styles.bottomCardWrapper}>
                    <TouchableOpacity
                        style={styles.boardingPreviewCard}
                        onPress={() => onSelectBoarding && onSelectBoarding(selectedBoarding)}
                        activeOpacity={0.9}
                    >
                        <Image source={{ uri: selectedBoarding.imageUrl }} style={styles.cardImage} />

                        <View style={styles.cardInfo}>
                            <View style={styles.titleRow}>
                                <Text style={styles.cardTitle} numberOfLines={1}>
                                    {selectedBoarding.title}
                                </Text>
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 2 }} />
                                    <Text style={styles.ratingVal}>{selectedBoarding.rating || 4.8}</Text>
                                </View>
                            </View>

                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginRight: 3 }} />
                                <Text style={styles.locationText}>{selectedBoarding.location}</Text>
                            </View>

                            <View style={styles.priceFooterRow}>
                                <Text style={styles.cardPrice}>
                                    Rs. {(selectedBoarding.price || 15000).toLocaleString()}{' '}
                                    <Text style={styles.pricePeriod}>/ month</Text>
                                </Text>

                                <TouchableOpacity
                                    style={styles.viewDetailsBtn}
                                    onPress={() => onSelectBoarding && onSelectBoarding(selectedBoarding)}
                                >
                                    <Text style={styles.viewDetailsText}>View Details</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },

    /* Header */
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        zIndex: 10,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 40,
    },
    searchText: {
        fontSize: 13,
        color: '#64748B',
    },
    toggleListBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Map */
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    filterChipOverlay: {
        position: 'absolute',
        top: 14,
        left: 16,
        right: 16,
    },
    mapChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    mapChipActive: {
        backgroundColor: '#1B4D3E',
        borderColor: '#1B4D3E',
    },
    mapChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    mapChipTextActive: {
        color: '#FFD700',
    },

    /* Pins */
    mapPin: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1B4D3E',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
        gap: 4,
    },
    activePin: {
        backgroundColor: '#D97706',
        transform: [{ scale: 1.15 }],
        borderColor: '#FFD700',
    },
    pinPriceText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    myLocationBtn: {
        position: 'absolute',
        bottom: 120,
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },

    /* Bottom Preview Card */
    bottomCardWrapper: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    boardingPreviewCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
    },
    cardImage: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: '#E2E8F0',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginRight: 6,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingVal: {
        fontSize: 11,
        fontWeight: '800',
        color: '#B45309',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationText: {
        fontSize: 12,
        color: '#64748B',
    },
    priceFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    cardPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1B4D3E',
    },
    pricePeriod: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    viewDetailsBtn: {
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    viewDetailsText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1B4D3E',
    },
});
