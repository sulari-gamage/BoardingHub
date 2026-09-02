import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TextInput,
    Image,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RoomManagementScreen({ onBack, onAddRoom, propertyName = 'Green Valley Boarding' }) {
    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, AVAILABLE, OCCUPIED
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Rooms list matching Image 1 mockup
    const [rooms, setRooms] = useState([
        {
            id: 'r101',
            number: 'Room 101',
            type: 'Single Type',
            price: 15000,
            occupants: '1 Occupant',
            area: '150 sqft',
            status: 'AVAILABLE',
            imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'r102',
            number: 'Room 102',
            type: 'Shared Type',
            price: 22000,
            occupants: '2 Occupants',
            area: '280 sqft',
            status: 'OCCUPIED',
            imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'r201',
            number: 'Suite 201',
            type: 'Executive',
            price: 35000,
            occupants: '1-2 Occupants',
            area: '450 sqft',
            status: 'AVAILABLE',
            imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        },
    ]);

    const filteredRooms = rooms.filter((r) => {
        const matchesFilter =
            activeFilter === 'ALL' ||
            (activeFilter === 'AVAILABLE' && r.status === 'AVAILABLE') ||
            (activeFilter === 'OCCUPIED' && r.status === 'OCCUPIED');

        const matchesQuery =
            r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.type.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesQuery;
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Top Navigation Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#133E32" />
                </TouchableOpacity>
                <View style={styles.breadcrumbRow}>
                    <Text style={styles.breadcrumbLink}>Properties</Text>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginHorizontal: 4 }} />
                    <Text style={styles.breadcrumbCurrent} numberOfLines={1}>{propertyName}</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Title & Add Room Action */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>Room Management</Text>
                    <Text style={styles.subtitle}>
                        Manage units, availability, and pricing for {propertyName}.
                    </Text>

                    <TouchableOpacity style={styles.addRoomBtn} onPress={onAddRoom} activeOpacity={0.85}>
                        <Ionicons name="add" size={20} color="#FFD700" style={{ marginRight: 6 }} />
                        <Text style={styles.addRoomBtnText}>Add New Room</Text>
                    </TouchableOpacity>
                </View>

                {/* Filter & Search Bar Container Card */}
                <View style={styles.filterCard}>
                    {/* Status Pill Filters */}
                    <View style={styles.filterPillRow}>
                        <TouchableOpacity
                            style={[styles.filterPill, activeFilter === 'ALL' && styles.filterPillActive]}
                            onPress={() => setActiveFilter('ALL')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.filterPillText, activeFilter === 'ALL' && styles.filterPillTextActive]}>
                                All Rooms
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterPill, activeFilter === 'AVAILABLE' && styles.filterPillActive]}
                            onPress={() => setActiveFilter('AVAILABLE')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.dotIndicator, { backgroundColor: '#10B981' }]} />
                            <Text style={[styles.filterPillText, activeFilter === 'AVAILABLE' && styles.filterPillTextActive]}>
                                Available
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterPill, activeFilter === 'OCCUPIED' && styles.filterPillActive]}
                            onPress={() => setActiveFilter('OCCUPIED')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.dotIndicator, { backgroundColor: '#EF4444' }]} />
                            <Text style={[styles.filterPillText, activeFilter === 'OCCUPIED' && styles.filterPillTextActive]}>
                                Occupied
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search rooms..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {/* Room Cards List */}
                {filteredRooms.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bed-outline" size={48} color="#94A3B8" />
                        <Text style={styles.emptyTitle}>No Rooms Found</Text>
                        <Text style={styles.emptySubtitle}>Try adjusting your filters or add a new room.</Text>
                    </View>
                ) : (
                    filteredRooms.map((room) => {
                        const isAvailable = room.status === 'AVAILABLE';
                        return (
                            <View key={room.id} style={styles.roomCard}>
                                {/* Room Image Box with Status Badge */}
                                <View style={styles.roomImageWrapper}>
                                    <Image source={{ uri: room.imageUrl }} style={styles.roomImage} resizeMode="cover" />

                                    <View style={[
                                        styles.statusBadge,
                                        isAvailable ? styles.statusBadgeAvailable : styles.statusBadgeOccupied
                                    ]}>
                                        <View style={[
                                            styles.badgeDot,
                                            { backgroundColor: isAvailable ? '#059669' : '#DC2626' }
                                        ]} />
                                        <Text style={[
                                            styles.statusBadgeText,
                                            { color: isAvailable ? '#065F46' : '#991B1B' }
                                        ]}>
                                            {isAvailable ? 'Available' : 'Occupied'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Room Details */}
                                <View style={styles.roomContent}>
                                    <View style={styles.titlePriceRow}>
                                        <View>
                                            <Text style={styles.roomNumber}>{room.number}</Text>
                                            <Text style={styles.roomType}>{room.type}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.roomPrice}>Rs.{room.price.toLocaleString()}</Text>
                                            <Text style={styles.perMonthText}>/ month</Text>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    {/* Occupants & Area Specs */}
                                    <View style={styles.specsRow}>
                                        <View style={styles.specItem}>
                                            <Ionicons name="people-outline" size={16} color="#64748B" style={{ marginRight: 4 }} />
                                            <Text style={styles.specText}>{room.occupants}</Text>
                                        </View>

                                        <View style={styles.specItem}>
                                            <Ionicons name="expand-outline" size={16} color="#64748B" style={{ marginRight: 4 }} />
                                            <Text style={styles.specText}>{room.area}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? 35 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    breadcrumbRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    breadcrumbLink: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    breadcrumbCurrent: {
        fontSize: 13,
        fontWeight: '800',
        color: '#133E32',
        maxWidth: 160,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    titleSection: {
        marginBottom: 16,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#133E32',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 16,
    },
    addRoomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#133E32',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    addRoomBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    /* Filter & Search Card */
    filterCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 18,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    filterPillRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    filterPillActive: {
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#133E32',
    },
    dotIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    filterPillTextActive: {
        color: '#133E32',
        fontWeight: '900',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 42,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
    },

    /* Room Card */
    roomCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    roomImageWrapper: {
        position: 'relative',
        height: 170,
        backgroundColor: '#E2E8F0',
    },
    roomImage: {
        width: '100%',
        height: '100%',
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
    },
    statusBadgeAvailable: {
        backgroundColor: '#D1FAE5',
    },
    statusBadgeOccupied: {
        backgroundColor: '#FEE2E2',
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },

    roomContent: {
        padding: 16,
    },
    titlePriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    roomNumber: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 2,
    },
    roomType: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    roomPrice: {
        fontSize: 18,
        fontWeight: '900',
        color: '#133E32',
    },
    perMonthText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    specsRow: {
        flexDirection: 'row',
        gap: 20,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    specText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 4,
    },
});
