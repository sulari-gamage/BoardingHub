import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../../components/BottomNavBar';
import FilterModal from '../../components/FilterModal';
import HeaderBar from '../../components/HeaderBar';
import BoardingCard from '../../components/BoardingCard';
import api from '../../services/api';

export default function SearchScreen({ onSelectBoarding, onNavigateTab, onOpenNotifications, currentUser, initialSearchQuery = '' }) {
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
    const [activeTab, setActiveTab] = useState('SEARCH');
    const [savedStatus, setSavedStatus] = useState({});
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [apiProperties, setApiProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    // Advanced Filter State
    const [filterConfig, setFilterConfig] = useState({
        boardingCategory: 'ALL', // 'ALL', 'ROOM_BASED', 'ANNEX'
        rentBasis: 'PER_PERSON', // 'PER_PERSON', 'PER_ROOM'
        roomTypes: { privateRoom: false, sharedRoom: false },
        gender: 'ANY', // 'ANY', 'MALE', 'FEMALE'
        priceMin: 0,
        priceMax: 100000,
        amenities: {
            wifi: false,
            parking: false,
            laundry: false,
            attachedBathroom: false,
            kitchenAccess: false,
            airConditioning: false,
        },
        sortBy: 'DEFAULT', // 'DEFAULT', 'PRICE_LOW_HIGH', 'PRICE_HIGH_LOW', 'RATING'
    });

    useEffect(() => {
        loadProperties();
    }, []);

    useEffect(() => {
        if (initialSearchQuery !== undefined) {
            setSearchQuery(initialSearchQuery);
        }
    }, [initialSearchQuery]);

    const loadProperties = async () => {
        try {
            setLoading(true);
            const data = await api.properties.getAll();
            if (data && data.length > 0) {
                setApiProperties(data);
            } else {
                setApiProperties([]);
            }
        } catch (error) {
            console.log('Error loading properties in SearchScreen:', error);
            setApiProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleSave = (id) => {
        setSavedStatus((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const mappedProperties = apiProperties.map(p => {
        const rawNature = (p.propertyNature || (p.raw && p.raw.propertyNature) || '').toUpperCase();
        const natureCategory = rawNature.includes('ANNEX') || rawNature.includes('WHOLE') ? 'ANNEX' : 'ROOM_BASED';

        return {
            ...p,
            id: p.id ? p.id.toString() : Math.random().toString(),
            title: p.title || 'Boarding Property',
            address: p.address || (p.raw && p.raw.address) || '',
            location: p.address || (p.city ? `${p.city}` : 'Location Not Set'),
            price: p.monthlyRent || p.price || 0,
            pricePeriod: 'month',
            rating: p.rating || 4.8,
            isVerified: true,
            propertyNatureCategory: natureCategory,
            genderPreference: p.genderPreference || 'ANY',
            tags: p.amenities ? p.amenities.map(a => typeof a === 'string' ? a : a.name) : ['Wi-Fi', 'Security'],
            imageUrl: (p.imageUrls && p.imageUrls.length > 0)
                ? p.imageUrls[0]
                : (p.images && p.images.length > 0)
                    ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].imageUrl)
                    : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            description: p.description || (p.raw && p.raw.description) || 'Boarding property listing',
            ownerName: p.ownerName || (p.owner && p.owner.name) || (p.raw && p.raw.ownerName) || 'Sunethra Silva',
            ownerPhone: p.ownerWhatsapp || p.ownerPhone || (p.owner && (p.owner.whatsappNumber || p.owner.phone)) || (p.raw && (p.raw.ownerWhatsapp || p.raw.ownerPhone)) || '',
            ownerAvatar: p.ownerAvatar || (p.owner && p.owner.avatarUrl) || (p.raw && p.raw.ownerAvatar) || null,
            ownerId: p.ownerId || (p.owner && p.owner.id) || (p.raw && p.raw.ownerId) || null,
            hasKitchen: p.hasKitchen,
            amenityObject: p.amenity || {},
            rooms: p.rooms || [],
        };
    });

    // Filtering Engine
    let searchResults = mappedProperties.filter((item) => {
        // 1. Text Query Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                (item.location && item.location.toLowerCase().includes(query)) ||
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.city && item.city.toLowerCase().includes(query)) ||
                (item.ownerName && item.ownerName.toLowerCase().includes(query));
            if (!matchesSearch) return false;
        }

        // 2. Boarding Category Filter (Room Based vs Annex Type)
        if (filterConfig.boardingCategory !== 'ALL') {
            if (item.propertyNatureCategory !== filterConfig.boardingCategory) {
                return false;
            }
        }

        // 3. Room Specifications (Private vs Shared)
        if (filterConfig.boardingCategory === 'ROOM_BASED' || filterConfig.boardingCategory === 'ALL') {
            if (filterConfig.roomTypes.privateRoom && !filterConfig.roomTypes.sharedRoom) {
                const hasPrivate = item.rooms && item.rooms.some(r => (r.roomType || r.type || '').toUpperCase().includes('PRIVATE') || r.totalCapacity === 1);
                if (item.rooms.length > 0 && !hasPrivate) return false;
            }
            if (filterConfig.roomTypes.sharedRoom && !filterConfig.roomTypes.privateRoom) {
                const hasShared = item.rooms && item.rooms.some(r => (r.roomType || r.type || '').toUpperCase().includes('SHARED') || r.totalCapacity > 1);
                if (item.rooms.length > 0 && !hasShared) return false;
            }
        }

        // 4. Gender Filter
        if (filterConfig.gender !== 'ANY') {
            const pref = (item.genderPreference || '').toUpperCase();
            if (filterConfig.gender === 'MALE' && pref !== 'MALE_ONLY' && pref !== 'BOYS') {
                return false;
            }
            if (filterConfig.gender === 'FEMALE' && pref !== 'FEMALE_ONLY' && pref !== 'GIRLS') {
                return false;
            }
        }

        // 5. Price Range Filter (Calculated based on effective price / basis)
        const isPerRoomFilter = filterConfig.boardingCategory === 'ROOM_BASED' && filterConfig.rentBasis === 'PER_ROOM';
        const isPerPersonFilter = filterConfig.boardingCategory === 'ROOM_BASED' && filterConfig.rentBasis === 'PER_PERSON';

        const matchesPriceRange = (priceVal) => {
            if (filterConfig.priceMin > 0 && priceVal < filterConfig.priceMin) return false;
            if (filterConfig.priceMax < 100000 && priceVal > filterConfig.priceMax) return false;
            return true;
        };

        if (item.rooms && item.rooms.length > 0) {
            // Check if ANY room in this property satisfies the selected price basis range
            const hasMatchingRoom = item.rooms.some(r => {
                let roomPrice = r.monthlyRent || r.price || item.price;
                const capacity = r.totalCapacity || 1;
                const rentType = (r.rentType || '').toUpperCase();

                if (isPerPersonFilter) {
                    // Calculate per-person monthly rent for this room
                    if (rentType === 'PER_ROOM' || rentType === 'ROOM') {
                        roomPrice = Math.round(roomPrice / capacity);
                    }
                } else if (isPerRoomFilter) {
                    // Calculate total per-room monthly rent for this room
                    if (rentType === 'PER_PERSON' || rentType === 'PERSON') {
                        roomPrice = roomPrice * capacity;
                    }
                }
                return matchesPriceRange(roomPrice);
            });

            if (!hasMatchingRoom) {
                return false;
            }
        } else {
            // Fallback for properties without nested room breakdown
            let effectivePrice = item.price;
            if (!matchesPriceRange(effectivePrice)) {
                return false;
            }
        }

        // 6. Amenities Match
        if (filterConfig.amenities.wifi && !item.tags.some(t => t.toLowerCase().includes('wifi'))) return false;
        if (filterConfig.amenities.parking && !item.tags.some(t => t.toLowerCase().includes('parking'))) return false;
        if (filterConfig.amenities.laundry && !item.tags.some(t => t.toLowerCase().includes('laundry'))) return false;
        if (filterConfig.amenities.attachedBathroom && !item.tags.some(t => t.toLowerCase().includes('bath') || t.toLowerCase().includes('attached'))) return false;

        return true;
    });

    // Sorting Engine: Default to Low Price to High Price for any search
    searchResults.sort((a, b) => a.price - b.price);

    // Active Filter Tag Pills Generator
    const getActiveFilterTags = () => {
        const tags = [];
        if (filterConfig.boardingCategory === 'ROOM_BASED') {
            const basisLabel = filterConfig.rentBasis === 'PER_ROOM' ? 'Room Based (Per Room)' : 'Room Based (Per Person)';
            tags.push({ key: 'category', label: basisLabel });
        } else if (filterConfig.boardingCategory === 'ANNEX') {
            tags.push({ key: 'category', label: 'Annex Type' });
        }

        if (filterConfig.roomTypes.privateRoom) tags.push({ key: 'privateRoom', label: 'Private Room' });
        if (filterConfig.roomTypes.sharedRoom) tags.push({ key: 'sharedRoom', label: 'Shared Room' });

        if (filterConfig.gender === 'MALE') tags.push({ key: 'gender', label: 'Boys Only' });
        if (filterConfig.gender === 'FEMALE') tags.push({ key: 'gender', label: 'Girls Only' });

        if (filterConfig.priceMin > 0 || filterConfig.priceMax < 100000) {
            tags.push({ key: 'price', label: `Rs. ${(filterConfig.priceMin / 1000).toFixed(0)}k - ${(filterConfig.priceMax / 1000).toFixed(0)}k` });
        }

        if (filterConfig.amenities.wifi) tags.push({ key: 'wifi', label: 'WiFi' });
        if (filterConfig.amenities.parking) tags.push({ key: 'parking', label: 'Parking' });
        if (filterConfig.amenities.laundry) tags.push({ key: 'laundry', label: 'Laundry' });
        if (filterConfig.amenities.attachedBathroom) tags.push({ key: 'attachedBathroom', label: 'Attached Bath' });

        if (filterConfig.sortBy === 'PRICE_LOW_HIGH') tags.push({ key: 'sortBy', label: 'Sort: Low to High' });
        if (filterConfig.sortBy === 'PRICE_HIGH_LOW') tags.push({ key: 'sortBy', label: 'Sort: High to Low' });
        if (filterConfig.sortBy === 'RATING') tags.push({ key: 'sortBy', label: 'Sort: Top Rated' });

        return tags;
    };

    const activeFilterTags = getActiveFilterTags();

    const handleRemoveFilterTag = (tagKey) => {
        setFilterConfig(prev => {
            const next = { ...prev };
            if (tagKey === 'category') next.boardingCategory = 'ALL';
            else if (tagKey === 'privateRoom') next.roomTypes = { ...next.roomTypes, privateRoom: false };
            else if (tagKey === 'sharedRoom') next.roomTypes = { ...next.roomTypes, sharedRoom: false };
            else if (tagKey === 'gender') next.gender = 'ANY';
            else if (tagKey === 'price') { next.priceMin = 0; next.priceMax = 100000; }
            else if (tagKey === 'sortBy') next.sortBy = 'DEFAULT';
            else if (next.amenities[tagKey] !== undefined) {
                next.amenities = { ...next.amenities, [tagKey]: false };
            }
            return next;
        });
    };

    const handleClearAllFilters = () => {
        setFilterConfig({
            boardingCategory: 'ALL',
            roomTypes: { privateRoom: false, sharedRoom: false },
            gender: 'ANY',
            priceMin: 0,
            priceMax: 100000,
            amenities: {
                wifi: false,
                parking: false,
                laundry: false,
                attachedBathroom: false,
                kitchenAccess: false,
                airConditioning: false,
            },
            sortBy: 'DEFAULT',
        });
    };

    const handleApplyFilters = (appliedData) => {
        if (appliedData) {
            setFilterConfig(appliedData);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Standard Dark Emerald Header Bar */}
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

            {/* Main Scroll Content */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Screen Sub-Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Search Boardings</Text>
                </View>

                {/* Search Bar Input with Always-Visible Filter Button */}
                <View style={styles.searchBarRow}>
                    <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by location, city, or keyword..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 8 }}>
                            <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[
                            styles.filterIconButton,
                            activeFilterTags.length > 0 && styles.filterIconButtonActive
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setIsFilterModalVisible(true)}
                    >
                        <Ionicons
                            name="options-outline"
                            size={18}
                            color={activeFilterTags.length > 0 ? '#FFFFFF' : '#133E32'}
                        />
                        {activeFilterTags.length > 0 && (
                            <View style={styles.filterBadgeCount}>
                                <Text style={styles.filterBadgeCountText}>{activeFilterTags.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Filter Active Chips Scroll */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipScroll}
                >
                    <TouchableOpacity
                        style={[
                            styles.filterMenuChip,
                            activeFilterTags.length > 0 && styles.filterMenuChipActive
                        ]}
                        activeOpacity={0.85}
                        onPress={() => setIsFilterModalVisible(true)}
                    >
                        <Ionicons
                            name="options-outline"
                            size={16}
                            color={activeFilterTags.length > 0 ? '#133E32' : '#1E293B'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.filterMenuText, activeFilterTags.length > 0 && styles.filterMenuTextActive]}>
                            Filters {activeFilterTags.length > 0 ? `(${activeFilterTags.length})` : ''}
                        </Text>
                    </TouchableOpacity>

                    {activeFilterTags.map((tag) => (
                        <TouchableOpacity
                            key={tag.key}
                            style={styles.activeFilterChip}
                            onPress={() => handleRemoveFilterTag(tag.key)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.activeFilterText}>{tag.label}</Text>
                            <Ionicons name="close" size={14} color="#133E32" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    ))}

                    {activeFilterTags.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearAllBtn}
                            onPress={handleClearAllFilters}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.clearAllText}>Clear All</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {/* Boardings Results Count & Sorting Header */}
                <View style={styles.resultsHeaderRow}>
                    <Text style={styles.resultsCountText}>
                        Showing <Text style={{ color: '#133E32', fontWeight: '800' }}>{searchResults.length}</Text> properties
                    </Text>

                    {filterConfig.sortBy !== 'DEFAULT' && (
                        <View style={styles.sortIndicatorBadge}>
                            <Ionicons name="swap-vertical" size={12} color="#133E32" style={{ marginRight: 4 }} />
                            <Text style={styles.sortIndicatorText}>Sorted</Text>
                        </View>
                    )}
                </View>

                {/* Boardings Results List */}
                <View style={styles.resultsContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#133E32" style={{ marginVertical: 30 }} />
                    ) : searchResults.length > 0 ? (
                        searchResults.map((item) => (
                            <BoardingCard
                                key={item.id}
                                item={item}
                                isSaved={!!savedStatus[item.id]}
                                onToggleSave={(b) => toggleSave(b.id)}
                                onPress={() => onSelectBoarding && onSelectBoarding(item)}
                            />
                        ))
                    ) : (
                        <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 10 }}>
                            <Ionicons name="search-outline" size={40} color="#CBD5E1" style={{ marginBottom: 10 }} />
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#133E32', marginBottom: 4 }}>No Results Found</Text>
                            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                                No boarding properties match your current search and filter criteria.
                            </Text>
                            <TouchableOpacity
                                style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#E6F0EC', borderRadius: 10 }}
                                onPress={handleClearAllFilters}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '800', color: '#133E32' }}>Clear All Filters</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Filter Bottom Sheet Modal */}
            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onApply={handleApplyFilters}
                initialFilters={filterConfig}
            />

            {/* Fixed Bottom Navigation Bar */}
            <BottomNavBar
                activeTab={activeTab}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    if (onNavigateTab) onNavigateTab(tab);
                }}
            />
        </SafeAreaView>
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

    /* Title Section */
    titleSection: {
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
    },

    /* Search Bar Input */
    searchBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginHorizontal: 20,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 14,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
    },
    filterIconButton: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#C3DCD4',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterIconButtonActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    filterBadgeCount: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    filterBadgeCountText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
    },

    /* Filter Chips */
    filterChipScroll: {
        paddingLeft: 20,
        paddingRight: 10,
        marginBottom: 14,
        gap: 8,
        alignItems: 'center',
    },
    filterMenuChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    filterMenuChipActive: {
        backgroundColor: '#E6F0EC',
        borderColor: '#133E32',
    },
    filterMenuText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    filterMenuTextActive: {
        color: '#133E32',
    },
    activeFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#C3DCD4',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    activeFilterText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#133E32',
    },
    clearAllBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    clearAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EF4444',
    },

    /* Results Header */
    resultsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    resultsCountText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    sortIndicatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    sortIndicatorText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#133E32',
    },

    /* Results List */
    resultsContainer: {
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
    },
    imageWrapper: {
        position: 'relative',
        height: 180,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    natureBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(19, 62, 50, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    natureText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#133E32',
    },
    heartBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    /* Body */
    cardBody: {
        padding: 16,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardTitle: {
        flex: 1,
        fontSize: 17,
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
    ratingVal: {
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

    /* Tags */
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    tagChip: {
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#C3DCD4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#133E32',
    },

    /* Footer */
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    priceText: {
        fontSize: 14,
    },
    priceVal: {
        fontSize: 17,
        fontWeight: '900',
        color: '#133E32',
    },
    pricePeriod: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    viewDetailsText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#133E32',
    },
});
