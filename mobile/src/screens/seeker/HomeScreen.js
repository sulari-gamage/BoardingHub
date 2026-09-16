import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import BoardingCard from '../../components/BoardingCard';
import NearLocationCard from '../../components/NearLocationCard';
import BottomNavBar from '../../components/BottomNavBar';
import HeaderBar from '../../components/HeaderBar';
import api from '../../services/api';

export default function HomeScreen({ onSelectBoarding, onNavigateTab, onOpenNotifications, currentUser, onUserUpdated, savedBoardings = [], onToggleSaveBoarding }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('ALL');
    const [activeTab, setActiveTab] = useState('HOME');
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    // Auto-Scroll Ref for Near Location Cards
    const nearLocationScrollRef = useRef(null);
    const nearLocationIndexRef = useRef(0);

    // Location Check & Tracking State
    const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
    const [isEnablingLocation, setIsEnablingLocation] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        loadUserProfile();
        loadProperties();
        checkDeviceLocationStatus();
    }, [selectedFilter]);

    const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const fetchCurrentDeviceLocation = async () => {
        try {
            const isServicesEnabled = await Location.hasServicesEnabledAsync();
            const { status } = await Location.getForegroundPermissionsAsync();
            if (isServicesEnabled && status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (loc?.coords) {
                    setUserLocation({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                    });
                }
            }
        } catch (e) {
            console.log('[HomeScreen] Location fetch error:', e.message);
        }
    };

    const checkDeviceLocationStatus = async () => {
        try {
            const isServicesEnabled = await Location.hasServicesEnabledAsync();
            const { status } = await Location.getForegroundPermissionsAsync();
            if (!isServicesEnabled || status !== 'granted') {
                setIsLocationModalVisible(true);
            } else {
                fetchCurrentDeviceLocation();
            }
        } catch (err) {
            console.log('[HomeScreen] Location check error:', err.message);
        }
    };

    const handleEnableLocation = async () => {
        try {
            setIsEnablingLocation(true);
            const { status } = await Location.requestForegroundPermissionsAsync();

            const isServicesEnabled = await Location.hasServicesEnabledAsync();
            if (!isServicesEnabled) {
                try {
                    await Location.enableNetworkProviderAsync();
                } catch (e) {
                    console.log('Network provider enable error:', e.message);
                }
            }

            const updatedServices = await Location.hasServicesEnabledAsync();
            const updatedPerm = await Location.getForegroundPermissionsAsync();

            if (updatedServices && updatedPerm.status === 'granted') {
                setIsLocationModalVisible(false);
                fetchCurrentDeviceLocation();
                Alert.alert('Location Enabled 📍', 'Device location active! Showing properties within 5 km.');
                loadProperties();
            } else if (updatedPerm.status === 'granted') {
                setIsLocationModalVisible(false);
                fetchCurrentDeviceLocation();
                Alert.alert('Permission Granted 🎉', 'Location permission granted.');
            }
        } catch (err) {
            Alert.alert('Location Request', 'Please enable location services in your device settings.');
        } finally {
            setIsEnablingLocation(false);
        }
    };

    const loadUserProfile = async () => {
        try {
            const data = await api.user.getProfile();
            if (data && onUserUpdated) {
                onUserUpdated(data);
            }
        } catch (err) {
            console.log('[HomeScreen] Error loading user profile:', err.message);
        }
    };

    const CITY_COORDINATES = {
        'moratuwa': { latitude: 6.7951, longitude: 79.9009 },
        'katubedda': { latitude: 6.7981, longitude: 79.9025 },
        'colombo': { latitude: 6.9271, longitude: 79.8612 },
        'kandy': { latitude: 7.2906, longitude: 80.6337 },
        'galle': { latitude: 6.0535, longitude: 80.2210 },
        'nugegoda': { latitude: 6.8649, longitude: 79.8997 },
        'dehiwala': { latitude: 6.8511, longitude: 79.8650 },
        'kelaniya': { latitude: 6.9553, longitude: 79.9221 },
        'battaramulla': { latitude: 6.8974, longitude: 79.9221 },
        'maharagama': { latitude: 6.8480, longitude: 79.9265 },
        'malabe': { latitude: 6.9061, longitude: 79.9647 },
        'homagama': { latitude: 6.8444, longitude: 80.0025 },
        'gampaha': { latitude: 7.0840, longitude: 79.9925 },
        'negombo': { latitude: 7.2008, longitude: 79.8737 },
        'kurunegala': { latitude: 7.4863, longitude: 80.3647 },
        'jaffna': { latitude: 9.6615, longitude: 80.0255 },
        'matara': { latitude: 5.9549, longitude: 80.5550 },
    };

    const cleanAddressForGeocoding = (addressStr, cityStr) => {
        let raw = `${addressStr || ''} ${cityStr || ''}`.trim();
        if (!raw) return '';
        raw = raw.replace(/[\r\n]+/g, ', ')
            .replace(/\s+/g, ' ')
            .replace(/,\s*,/g, ',')
            .replace(/\.\s*$/, '')
            .trim();
        if (!raw.toLowerCase().includes('sri lanka')) {
            raw = `${raw}, Sri Lanka`;
        }
        return raw;
    };

    const safeGeocodeWithTimeout = async (query, cityStr) => {
        const cleanCity = (cityStr || '').toLowerCase().trim();
        if (cleanCity && CITY_COORDINATES[cleanCity]) {
            return CITY_COORDINATES[cleanCity];
        }

        for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
            if (query.toLowerCase().includes(key)) {
                return coords;
            }
        }

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Geocode Timeout')), 1500)
            );
            const results = await Promise.race([
                Location.geocodeAsync(query),
                timeoutPromise
            ]);
            if (results && results.length > 0) {
                return { latitude: results[0].latitude, longitude: results[0].longitude };
            }
        } catch (e) {
            // Silently fall back if native geocoding times out or fails
        }

        return { latitude: 6.7951, longitude: 79.9009 };
    };

    const loadProperties = async () => {
        try {
            setLoading(true);
            const data = await api.properties.getAll();
            if (data && data.length > 0) {
                // LIFO Sorting: Last added properties (higher IDs) displayed first
                const sortedData = [...data].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

                const updatedData = await Promise.all(sortedData.map(async (p) => {
                    let lat = p.latitude || (p.raw && p.raw.latitude);
                    let lng = p.longitude || (p.raw && p.raw.longitude);

                    if (!lat || !lng || (Math.abs(lat - 6.9271) < 0.0001 && Math.abs(lng - 79.8612) < 0.0001)) {
                        const query = cleanAddressForGeocoding(p.address, p.city);
                        if (query) {
                            const coords = await safeGeocodeWithTimeout(query, p.city);
                            if (coords) {
                                lat = coords.latitude;
                                lng = coords.longitude;
                            }
                        }
                    }

                    return { ...p, latitude: lat, longitude: lng };
                }));

                setProperties(updatedData);
            } else {
                setProperties([]);
            }
        } catch (error) {
            console.log('Error loading properties from API:', error);
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const displayBoardings = properties.map(p => {
        const lat = p.latitude || (p.raw && p.raw.latitude);
        const lng = p.longitude || (p.raw && p.raw.longitude);
        let distanceKm = null;
        let distanceText = null;

        if (userLocation && lat != null && lng != null) {
            distanceKm = calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lng);
            if (distanceKm !== null) {
                distanceText = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`;
            }
        }

        return {
            ...p,
            id: p.id,
            title: p.title || 'Boarding Property',
            address: p.address || (p.raw && p.raw.address) || '',
            description: p.description || (p.raw && p.raw.description) || '',
            ownerName: p.ownerName || (p.owner && p.owner.name) || (p.raw && p.raw.ownerName) || (p.ownerName || 'Sunethra Silva'),
            ownerPhone: p.ownerWhatsapp || p.ownerPhone || (p.owner && (p.owner.whatsappNumber || p.owner.phone)) || (p.raw && (p.raw.ownerWhatsapp || p.raw.ownerPhone)) || '',
            ownerAvatar: p.ownerAvatar || (p.owner && p.owner.avatarUrl) || (p.raw && p.raw.ownerAvatar) || null,
            ownerId: p.ownerId || (p.owner && p.owner.id) || (p.raw && p.raw.ownerId) || null,
            location: p.address || (p.city ? `${p.city}` : 'Location Not Set'),
            latitude: lat,
            longitude: lng,
            distanceKm: distanceKm,
            distanceText: distanceText,
            price: p.monthlyRent || p.price || 0,
            rent: `Rs. ${(p.monthlyRent || p.price || 0).toLocaleString()}/mo`,
            rating: p.rating != null ? p.rating : null,
            reviewsCount: p.reviewsCount || 0,
            roomsCount: p.roomsCount || (p.rooms ? p.rooms.length : 0),
            rooms: p.rooms || [],
            propertyNature: p.propertyNature || 'ROOM_BASED',
            totalSpaces: p.totalCapacity || (p.rooms ? p.rooms.reduce((acc, r) => acc + (r.totalCapacity || 1), 0) : 1),
            remainingSpaces: p.remainingSpaces != null ? p.remainingSpaces : (p.rooms ? p.rooms.reduce((acc, r) => acc + (r.remainingSpaces != null ? r.remainingSpaces : Math.max(0, (r.totalCapacity || 1) - (r.occupied || 0))), 0) : 1),
            rawGender: p.genderPreference,
            genderPreference: p.genderPreference === 'MALE_ONLY' ? 'Boys Only' : p.genderPreference === 'FEMALE_ONLY' ? 'Girls Only' : 'Any Gender / Mixed',
            image: (p.imageUrls && p.imageUrls.length > 0)
                ? { uri: p.imageUrls[0] }
                : (p.images && p.images.length > 0)
                    ? { uri: typeof p.images[0] === 'string' ? p.images[0] : p.images[0].imageUrl }
                    : { uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5' },
            imageUrl: (p.imageUrls && p.imageUrls.length > 0)
                ? p.imageUrls[0]
                : (p.images && p.images.length > 0)
                    ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].imageUrl)
                    : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5',
        };
    }).filter((item) => {
        // Property Type filter
        if (selectedFilter === 'ROOM_BASED' && item.propertyNature !== 'ROOM_BASED') {
            return false;
        }
        if (selectedFilter === 'ANNEX' && item.propertyNature !== 'WHOLE_HOUSE') {
            return false;
        }

        // Search query filter
        if (!searchQuery) return true;
        return (
            item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    // "Near Your Location": Filtered within 5 km radius and sorted in ASCENDING order of distance
    const nearLocationBoardings = [...displayBoardings]
        .filter((item) => {
            if (userLocation && item.distanceKm !== null) {
                return item.distanceKm <= 5.0; // 5 km radius limit
            }
            return true;
        })
        .sort((a, b) => {
            if (a.distanceKm !== null && b.distanceKm !== null) {
                return a.distanceKm - b.distanceKm; // Ascending order
            }
            if (a.distanceKm !== null) return -1;
            if (b.distanceKm !== null) return 1;
            return 0;
        });

    // Auto-scroll Near Location Cards loop
    useEffect(() => {
        if (nearLocationBoardings.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (nearLocationIndexRef.current + 1) % nearLocationBoardings.length;
            nearLocationIndexRef.current = nextIndex;

            const screenWidth = Dimensions.get('window').width;
            const cardWidth = 270;
            const cardMargin = 16;
            const cardStep = cardWidth + cardMargin; // 286
            const paddingLeft = 20; // contentContainerStyle paddingLeft

            let targetX = 0;
            if (nextIndex === 0) {
                targetX = 0; // First card starts at left
            } else {
                // Center card horizontally on screen: (paddingLeft + cardLeft) - screenCenterOffset
                const cardLeftInContent = paddingLeft + (nextIndex * cardStep);
                const screenCenterOffset = (screenWidth - cardWidth) / 2;
                targetX = Math.max(0, cardLeftInContent - screenCenterOffset);
            }

            nearLocationScrollRef.current?.scrollTo({
                x: targetX,
                animated: true,
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [nearLocationBoardings.length]);

    const handleGoToSearch = () => {
        if (onNavigateTab) {
            onNavigateTab('SEARCH');
        }
    };

    const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return `Good morning, ${userName}! ☀️`;
        if (hour >= 12 && hour < 17) return `Good afternoon, ${userName}! ☀️`;
        if (hour >= 17 && hour < 22) return `Good evening, ${userName}! 🌙`;
        return `Good night, ${userName}! 🌙`;
    };

    return (
        <View style={styles.container}>
            {/* Standard Dark Emerald Header Bar with BoardingHub Logo */}
            <HeaderBar
                title="BoardingHub"
                userAvatar={currentUser?.avatarUrl}
                onOpenNotifications={() => {
                    if (onOpenNotifications) onOpenNotifications();
                    else if (onNavigateTab) onNavigateTab('NOTIFICATIONS');
                }}
                onOpenProfile={() => {
                    if (onNavigateTab) onNavigateTab('PROFILE');
                }}
            />

            {/* Main Scrollable Screen Content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Greeting Banner */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingText}>{getGreeting()}</Text>
                    <Text style={styles.subGreetingText}>Find your perfect home</Text>
                </View>

                {/* Search Bar & Filter Action Button */}
                <View style={styles.searchRow}>
                    <TouchableOpacity
                        style={styles.searchInputContainer}
                        activeOpacity={0.9}
                        onPress={handleGoToSearch}
                    >
                        <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search boarding..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={handleGoToSearch}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.filterBtn}
                        activeOpacity={0.85}
                        onPress={handleGoToSearch}
                    >
                        <Ionicons name="options-outline" size={20} color="#FFD700" />
                    </TouchableOpacity>
                </View>

                {/* "Near Your Location" Horizontal Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Near Your Location</Text>
                    <TouchableOpacity onPress={handleGoToSearch}>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                {nearLocationBoardings.length > 0 ? (
                    <ScrollView
                        ref={nearLocationScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.nearLocationScroll}
                    >
                        {nearLocationBoardings.map((item) => (
                            <NearLocationCard
                                key={item.id}
                                item={item}
                                isSaved={savedBoardings.some((b) => String(b.id) === String(item.id))}
                                onToggleSave={onToggleSaveBoarding}
                                onPress={() => onSelectBoarding && onSelectBoarding(item)}
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <View style={{ paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 14, marginVertical: 6, marginHorizontal: 20, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                        <Ionicons name="location-outline" size={24} color="#64748B" style={{ marginBottom: 4 }} />
                        <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '700', marginBottom: 2 }}>No Properties Within 5 km</Text>
                        <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>There are currently no boarding houses within 5 km of your device location.</Text>
                    </View>
                )}

                {/* "Popular Boardings" Vertical Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Registered Boardings</Text>
                </View>

                {/* Filter Chips */}
                <View style={styles.filterChipRow}>
                    {[
                        { id: 'ALL', label: 'All Places' },
                        { id: 'ROOM_BASED', label: 'Room-Based' },
                        { id: 'ANNEX', label: 'Annex / Whole House' },
                    ].map((chip) => (
                        <TouchableOpacity
                            key={chip.id}
                            style={[styles.chip, selectedFilter === chip.id && styles.chipActive]}
                            onPress={() => setSelectedFilter(chip.id)}
                        >
                            <Text style={[styles.chipText, selectedFilter === chip.id && styles.chipTextActive]}>
                                {chip.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* List of Popular Boardings */}
                <View style={styles.popularList}>
                    {loading ? (
                        <ActivityIndicator color="#133E32" size="large" style={{ marginVertical: 20 }} />
                    ) : displayBoardings.length > 0 ? (
                        displayBoardings.map((item) => (
                            <BoardingCard
                                key={item.id}
                                item={item}
                                isSaved={savedBoardings.some((b) => String(b.id) === String(item.id))}
                                onToggleSave={onToggleSaveBoarding}
                                onPress={() => onSelectBoarding && onSelectBoarding(item)}
                            />
                        ))
                    ) : (
                        <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 10 }}>
                            <Ionicons name="home-outline" size={40} color="#CBD5E1" style={{ marginBottom: 10 }} />
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#133E32', marginBottom: 4 }}>No Properties Available</Text>
                            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 }}>There are no boarding properties listed at the moment. Please check back later.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Fixed Bottom Navigation Bar */}
            <BottomNavBar
                activeTab={activeTab}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    if (onNavigateTab) {
                        onNavigateTab(tab);
                    }
                }}
            />

            {/* In-App Location Prompt Modal */}
            <Modal
                visible={isLocationModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsLocationModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.locationModalCard}>
                        <View style={styles.locationIconBadge}>
                            <Ionicons name="location" size={32} color="#133E32" />
                        </View>

                        <Text style={styles.locationModalTitle}>Enable Device Location</Text>
                        <Text style={styles.locationModalMessage}>
                            Your device location is currently turned off. Turn on location to discover boarding properties near your exact position in real time.
                        </Text>

                        <TouchableOpacity
                            style={styles.enableLocationBtn}
                            onPress={handleEnableLocation}
                            activeOpacity={0.85}
                            disabled={isEnablingLocation}
                        >
                            {isEnablingLocation ? (
                                <ActivityIndicator color="#133E32" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="navigate-circle" size={20} color="#133E32" style={{ marginRight: 8 }} />
                                    <Text style={styles.enableLocationBtnText}>Turn On Location</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dismissLocationBtn}
                            onPress={() => setIsLocationModalVisible(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dismissLocationBtnText}>Not Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingBottom: 24,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Greeting Section */
    greetingSection: {
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 16,
    },
    greetingText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    subGreetingText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },

    /* Search & Filter Row */
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        alignItems: 'center',
        gap: 10,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        paddingHorizontal: 14,
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
    },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },

    /* Section Header */
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    seeAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#133E32',
    },

    /* Horizontal Scroll */
    nearLocationScroll: {
        paddingLeft: 20,
        paddingRight: 6,
        paddingBottom: 20,
    },

    /* Filter Chips */
    filterChipRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chipActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    chipTextActive: {
        color: '#FFD700',
        fontWeight: '800',
    },

    /* Popular List */
    popularList: {
        paddingHorizontal: 20,
    },

    /* Location Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    locationModalCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    locationIconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#C3DCD4',
    },
    locationModalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    locationModalMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    enableLocationBtn: {
        width: '100%',
        height: 50,
        borderRadius: 14,
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    enableLocationBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#133E32',
    },
    dismissLocationBtn: {
        width: '100%',
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dismissLocationBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
    },
});
