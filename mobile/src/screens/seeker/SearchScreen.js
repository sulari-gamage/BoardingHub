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
import api from '../../services/api';

export default function SearchScreen({ onSelectBoarding, onNavigateTab, onOpenNotifications, currentUser }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState([]);
    const [activeTab, setActiveTab] = useState('SEARCH');
    const [savedStatus, setSavedStatus] = useState({});
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [apiProperties, setApiProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProperties();
    }, []);

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

    const mappedProperties = apiProperties.map(p => ({
        id: p.id ? p.id.toString() : Math.random().toString(),
        title: p.title || 'Boarding Property',
        location: (p.city || '') + (p.address ? ' • ' + p.address : ''),
        price: p.monthlyRent || 0,
        pricePeriod: 'month',
        rating: p.rating || 4.8,
        isVerified: true,
        tags: p.amenities ? p.amenities.map(a => typeof a === 'string' ? a : a.name) : ['Wi-Fi', 'Security'],
        imageUrl: (p.imageUrls && p.imageUrls.length > 0)
            ? p.imageUrls[0]
            : (p.images && p.images.length > 0)
                ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].imageUrl)
                : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        description: p.description || 'Boarding property listing',
        ownerName: p.ownerName || 'Owner',
        ownerPhone: p.ownerPhone || ''
    }));

    const searchResults = mappedProperties.filter((item) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            item.location.toLowerCase().includes(query) ||
            item.title.toLowerCase().includes(query);
        return matchesSearch;
    });

    const removeFilter = (filterName) => {
        setActiveFilters(activeFilters.filter((f) => f !== filterName));
    };

    const handleApplyFilters = (appliedData) => {
        if (appliedData && appliedData.gender) {
            const newFilters = ['Colombo', `${appliedData.gender} Only`, `Under Rs. ${appliedData.priceMax.toLocaleString()}`];
            setActiveFilters(newFilters);
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

                {/* Search Bar Input */}
                <View style={styles.searchBarRow}>
                    <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by location, university, or keyword..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filter Chips Scroll */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipScroll}
                >
                    <TouchableOpacity
                        style={styles.filterMenuChip}
                        activeOpacity={0.85}
                        onPress={() => setIsFilterModalVisible(true)}
                    >
                        <Ionicons name="options-outline" size={14} color="#133E32" style={{ marginRight: 5 }} />
                        <Text style={styles.filterMenuText}>Filters</Text>
                    </TouchableOpacity>

                    {activeFilters.map((filter, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.activeFilterChip}
                            onPress={() => removeFilter(filter)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.activeFilterText}>{filter}</Text>
                            <Ionicons name="close" size={14} color="#133E32" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Boardings Results List */}
                <View style={styles.resultsContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#133E32" style={{ marginVertical: 30 }} />
                    ) : searchResults.length > 0 ? (
                        searchResults.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.card}
                                onPress={() => onSelectBoarding && onSelectBoarding(item)}
                                activeOpacity={0.9}
                            >
                                {/* Image Container with Badges & Favorite Heart */}
                                <View style={styles.imageWrapper}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />

                                    {item.isVerified && (
                                        <View style={styles.verifiedBadge}>
                                            <Ionicons name="checkmark-circle" size={12} color="#133E32" style={{ marginRight: 3 }} />
                                            <Text style={styles.verifiedText}>Verified</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={styles.heartBtn}
                                        onPress={() => toggleSave(item.id)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name={savedStatus[item.id] ? 'heart' : 'heart-outline'}
                                            size={18}
                                            color={savedStatus[item.id] ? '#EF4444' : '#64748B'}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Card Body */}
                                <View style={styles.cardBody}>
                                    {/* Title & Star Rating */}
                                    <View style={styles.cardTitleRow}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <View style={styles.ratingBadge}>
                                            <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 3 }} />
                                            <Text style={styles.ratingVal}>{item.rating}</Text>
                                        </View>
                                    </View>

                                    {/* Location */}
                                    <View style={styles.locationRow}>
                                        <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                        <Text style={styles.locationText}>{item.location}</Text>
                                    </View>

                                    {/* Tags */}
                                    <View style={styles.tagsRow}>
                                        {item.tags && item.tags.map((tag, idx) => (
                                            <View key={idx} style={styles.tagChip}>
                                                <Text style={styles.tagText}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Footer Price & View Details Link */}
                                    <View style={styles.cardFooter}>
                                        <Text style={styles.priceText}>
                                            <Text style={styles.priceVal}>Rs. {item.price.toLocaleString()}</Text>
                                            <Text style={styles.pricePeriod}> / month</Text>
                                        </Text>
                                        <TouchableOpacity onPress={() => onSelectBoarding && onSelectBoarding(item)}>
                                            <Text style={styles.viewDetailsText}>View Details</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 10 }}>
                            <Ionicons name="search-outline" size={40} color="#CBD5E1" style={{ marginBottom: 10 }} />
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#133E32', marginBottom: 4 }}>No Results Found</Text>
                            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 }}>No boarding properties match your current search query.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Filter Bottom Sheet Modal */}
            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onApply={handleApplyFilters}
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
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
    },

    /* Filter Chips */
    filterChipScroll: {
        paddingLeft: 20,
        paddingRight: 10,
        marginBottom: 20,
        gap: 8,
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
    filterMenuText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    activeFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#C3DCD4',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    activeFilterText: {
        fontSize: 13,
        fontWeight: '700',
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
