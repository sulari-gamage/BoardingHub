import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BoardingCard from '../components/BoardingCard';
import NearLocationCard from '../components/NearLocationCard';
import BottomNavBar from '../components/BottomNavBar';
import { NEAR_LOCATION_BOARDINGS, POPULAR_BOARDINGS } from '../data/mockBoardings';

export default function HomeScreen({ onSelectBoarding, onNavigateTab }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('ALL');
    const [activeTab, setActiveTab] = useState('HOME');

    const filteredPopularBoardings = POPULAR_BOARDINGS.filter((item) => {
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Main Scrollable Screen Content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Top Header: Logo + Bell Notification Icon */}
                <View style={styles.header}>
                    <View style={styles.brandRow}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.brandName}>BoardingHub</Text>
                    </View>

                    <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
                        <Ionicons name="notifications-outline" size={20} color="#1E293B" />
                        <View style={styles.bellDot} />
                    </TouchableOpacity>
                </View>

                {/* Greeting Banner */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingText}>Hello, Sulari 👋</Text>
                    <Text style={styles.subGreetingText}>Find your perfect home 🏠</Text>
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
                    {filteredPopularBoardings.map((item) => (
                        <BoardingCard
                            key={item.id}
                            item={item}
                            onPress={() => onSelectBoarding && onSelectBoarding(item)}
                        />
                    ))}
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
    },

    /* Header */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 36,
        height: 28,
        marginRight: 8,
    },
    brandName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1B4D3E',
        letterSpacing: -0.3,
    },
    bellBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    bellDot: {
        position: 'absolute',
        top: 9,
        right: 9,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },

    /* Greeting Section */
    greetingSection: {
        paddingHorizontal: 20,
        marginTop: 8,
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
        backgroundColor: '#1B4D3E',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1B4D3E',
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
        color: '#1B4D3E',
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
        backgroundColor: '#1B4D3E',
        borderColor: '#1B4D3E',
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
