import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import BoardingCard from '../components/BoardingCard';
import { MOCK_BOARDINGS } from '../data/mockBoardings';

export default function HomeScreen({ onSelectBoarding }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('ALL');

    const filteredBoardings = MOCK_BOARDINGS.filter(item => {
        const matchesSearch = item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGender = selectedFilter === 'ALL' || item.genderPreference.includes(selectedFilter);
        return matchesSearch && matchesGender;
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Find your stay 🏠</Text>
                    <Text style={styles.title}>BoardingHub</Text>
                </View>
                <TouchableOpacity style={styles.profileBtn}>
                    <Text style={styles.profileInitial}>S</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search location (e.g. Moratuwa, Colombo)..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#94A3B8"
                />
            </View>

            {/* Filter Chips */}
            <View style={styles.filterRow}>
                {['ALL', 'BOYS', 'GIRLS'].map(filter => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                        onPress={() => setSelectedFilter(filter)}
                    >
                        <Text style={[styles.filterChipText, selectedFilter === filter && styles.filterChipTextActive]}>
                            {filter === 'ALL' ? 'All Places' : filter === 'BOYS' ? 'Boys Only' : 'Girls Only'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Boardings List */}
            <FlatList
                data={filteredBoardings}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <BoardingCard item={item} onPress={() => onSelectBoarding(item)} />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No boarding places match your search.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    greeting: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
    },
    profileBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginVertical: 10,
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchIcon: {
        marginRight: 8,
        fontSize: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#E2E8F0',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#2563EB',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    filterChipTextActive: {
        color: '#FFF',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 14,
    },
});
