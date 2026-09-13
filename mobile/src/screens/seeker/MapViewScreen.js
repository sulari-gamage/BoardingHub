import React, { useState, useEffect } from 'react';
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
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function MapViewScreen({ onSelectBoarding, onBack, onToggleListView }) {
    const [properties, setProperties] = useState([]);
    const [selectedBoarding, setSelectedBoarding] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('ALL');
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        loadProperties();
        fetchUserLocation();
    }, []);

    const fetchUserLocation = async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (loc?.coords) {
                    setUserLocation({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                    });
                }
            }
        } catch (err) {
            console.log('[MapViewScreen] User location error:', err.message);
        }
    };

    const loadProperties = async () => {
        try {
            const data = await api.properties.getAll();
            if (data && data.length > 0) {
                const mappedPromises = data.map(async (p) => {
                    let lat = p.latitude || (p.raw && p.raw.latitude);
                    let lng = p.longitude || (p.raw && p.raw.longitude);

                    // Geocode address asynchronously if lat/lng are missing
                    if (!lat || !lng) {
                        let fullAddr = `${p.address || ''} ${p.city || ''}`.trim() || p.title || '';
                        if (fullAddr) {
                            try {
                                fullAddr = fullAddr.replace(/[\r\n]+/g, ', ').replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
                                const fullQuery = fullAddr.toLowerCase().includes('sri lanka') ? fullAddr : `${fullAddr}, Sri Lanka`;
                                const results = await Location.geocodeAsync(fullQuery);
                                if (results && results.length > 0) {
                                    lat = results[0].latitude;
                                    lng = results[0].longitude;
                                }
                            } catch (e) {
                                console.log('[MapViewScreen] Geocode item error:', e.message);
                            }
                        }
                    }

                    // Fallback to Colombo/Kandy range if still null
                    lat = lat || 6.9271;
                    lng = lng || 79.8612;

                    return {
                        id: p.id ? p.id.toString() : Math.random().toString(),
                        title: p.title || 'Boarding Property',
                        location: (p.city || '') + (p.address ? ' • ' + p.address : ''),
                        latitude: lat,
                        longitude: lng,
                        price: p.monthlyRent || 0,
                        rating: p.rating != null ? p.rating : null,
                        imageUrl: (p.imageUrls && p.imageUrls.length > 0)
                            ? p.imageUrls[0]
                            : (p.images && p.images.length > 0)
                                ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].imageUrl)
                                : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
                    };
                });

                const resolvedProperties = await Promise.all(mappedPromises);
                setProperties(resolvedProperties);
                if (resolvedProperties.length > 0) {
                    setSelectedBoarding(resolvedProperties[0]);
                }
            } else {
                setProperties([]);
                setSelectedBoarding(null);
            }
        } catch (err) {
            console.log('Error loading map properties:', err);
            setProperties([]);
        }
    };

    const initialRegion = selectedBoarding ? {
        latitude: selectedBoarding.latitude,
        longitude: selectedBoarding.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    } : {
        latitude: userLocation?.latitude || 6.9271,
        longitude: userLocation?.longitude || 79.8612,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
    };

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

            {/* Interactive Map View Container */}
            <View style={styles.mapContainer}>
                <MapView
                    style={StyleSheet.absoluteFillObject}
                    initialRegion={initialRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                >
                    {properties.map((p) => (
                        <Marker
                            key={p.id}
                            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                            onPress={() => setSelectedBoarding(p)}
                        >
                            <View style={[
                                styles.mapPin,
                                selectedBoarding?.id === p.id && styles.activePin
                            ]}>
                                <Ionicons name="location" size={16} color="#FFFFFF" />
                                <Text style={styles.pinPriceText}>Rs.{p.price?.toLocaleString() || '0'}</Text>
                            </View>
                        </Marker>
                    ))}
                </MapView>

                {/* Map Overlay Filter Chips */}
                <View style={styles.filterChipOverlay}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {['ALL', 'Colombo', 'Kandy', 'Malabe', 'Moratuwa', 'Under 20k'].map((chip) => (
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

                {/* User Current Location Floating Button */}
                <TouchableOpacity
                    style={styles.myLocationBtn}
                    onPress={fetchUserLocation}
                    activeOpacity={0.8}
                >
                    <Ionicons name="locate" size={22} color="#1B4D3E" />
                </TouchableOpacity>
            </View>

            {/* Bottom Card Preview Carousel */}
            {selectedBoarding ? (
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
                                    <Text style={styles.ratingVal}>{selectedBoarding.rating ? Number(selectedBoarding.rating).toFixed(1) : 'New'}</Text>
                                </View>
                            </View>

                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginRight: 3 }} />
                                <Text style={styles.locationText}>{selectedBoarding.location}</Text>
                            </View>

                            <View style={styles.priceFooterRow}>
                                <Text style={styles.cardPrice}>
                                    Rs. {(selectedBoarding.price || 0).toLocaleString()}{' '}
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
            ) : null}
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
