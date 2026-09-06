import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BoardingCard from '../../components/BoardingCard';
import NearLocationCard from '../../components/NearLocationCard';
import BottomNavBar from '../../components/BottomNavBar';
import HeaderBar from '../../components/HeaderBar';
import { NEAR_LOCATION_BOARDINGS, POPULAR_BOARDINGS } from '../../data/mockBoardings';
import api from '../../services/api';

export default function HomeScreen({ onSelectBoarding, onNavigateTab, onOpenNotifications, currentUser }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('ALL');
    const [activeTab, setActiveTab] = useState('HOME');
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProperties();
    }, [selectedFilter]);

    const loadProperties = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (selectedFilter === 'girls') filters.gender = 'FEMALE_ONLY';
            if (selectedFilter === 'boys') filters.gender = 'MALE_ONLY';

            const data = await api.properties.getAll(filters);
            if (data && data.length > 0) {
                setProperties(data);
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

    const displayBoardings = properties.length > 0 ? properties.map(p => ({
        id: p.id,
        title: p.title,
        location: (p.city || '') + (p.address ? ' • ' + p.address : ''),
        rent: `Rs. ${p.monthlyRent?.toLocaleString() || '25,000'}/mo`,
        rating: p.rating || 4.8,
        reviewsCount: p.reviewsCount || 12,
        genderPreference: p.genderPreference === 'MALE_ONLY' ? 'Boys Only' : p.genderPreference === 'FEMALE_ONLY' ? 'Girls Only' : 'Any Gender',
        image: p.imageUrls && p.imageUrls.length > 0 ? { uri: p.imageUrls[0] } : { uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5' },
        tags: p.amenities ? p.amenities.map(a => a.name) : ['Wi-Fi', 'Security'],
    })) : POPULAR_BOARDINGS.filter((item) => {
        const matchesSearch =
            item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            selectedFilter === 'ALL' ||
            item.genderPreference.toLowerCase().includes(selectedFilter.toLowerCase()) ||
            (item.tags && item.tags.some((t) => t.toLowerCase().includes(selectedFilter.toLowerCase())));
        return matchesSearch && matchesFilter;
    });

    const handleGoToSearch = () => {
        if (onNavigateTab) {
            onNavigateTab('SEARCH');
        }
    };

    const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';

    return (
        <SafeAreaView style={styles.container}>
            {/* Standard Dark Emerald Header Bar with BoardingHub Logo */}
            <HeaderBar
                title="BoardingHub"
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
                    <Text style={styles.greetingText}>Hello, {userName} 👋</Text>
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

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.nearLocationScroll}
                >
                    {NEAR_LOCATION_BOARDINGS.map((item) => (
                        <NearLocationCard
                            key={item.id}
                            item={item}
                            onPress={() => onSelectBoarding && onSelectBoarding(item)}
                        />
                    ))}
                </ScrollView>

                {/* "Popular Boardings" Vertical Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Popular Boardings</Text>
                </View>

                {/* Filter Chips */}
                <View style={styles.filterChipRow}>
                    {[
                        { id: 'ALL', label: 'All Places' },
                        { id: 'girls', label: 'Girls Only' },
                        { id: 'boys', label: 'Boys Only' },
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
                    ) : (
                        displayBoardings.map((item) => (
                            <BoardingCard
                                key={item.id}
                                item={item}
                                onPress={() => onSelectBoarding && onSelectBoarding(item)}
                            />
                        ))
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
});
