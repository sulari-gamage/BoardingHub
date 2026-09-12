import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../components/HeaderBar';
import api from '../../services/api';

export default function OwnerPropertiesScreen({
    onNavigateTab,
    onAddNewProperty,
    onSelectProperty,
    onOpenNotifications,
    activeTab = 'Properties',
    currentUser
}) {
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [apiProperties, setApiProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'Properties' || activeTab === 'PROPERTIES' || !activeTab) {
            loadOwnerProperties();
        }
    }, [activeTab]);

    const loadOwnerProperties = async () => {
        try {
            setLoading(true);
            const data = await api.properties.getMyProperties();
            if (data) {
                setApiProperties(data);
            }
        } catch (error) {
            console.log('Error loading owner properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const properties = apiProperties.map(p => {
        const totalCap = p.rooms && p.rooms.length > 0
            ? Math.max(0, p.rooms.reduce((acc, r) => acc + (r.totalCapacity || r.totalSpaces || 0), 0))
            : Math.max(0, (p.totalCapacity || p.bedsCount || p.totalSpaces || 1));
        const occCap = p.rooms && p.rooms.length > 0
            ? Math.max(0, p.rooms.reduce((acc, r) => acc + (r.occupied != null ? r.occupied : Math.max(0, (r.totalCapacity || 1) - (r.remainingSpaces != null ? r.remainingSpaces : 0))), 0))
            : Math.max(0, (p.totalOccupied != null ? p.totalOccupied : 0));
        const availCap = Math.max(0, totalCap - occCap);

        const extractedImageUrls = (p.imageUrls && p.imageUrls.length > 0)
            ? p.imageUrls
            : (p.images && p.images.length > 0)
                ? p.images.map(i => typeof i === 'string' ? i : i?.imageUrl).filter(Boolean)
                : (p.imageUrl ? [p.imageUrl] : []);

        return {
            id: p.id ? p.id.toString() : Math.random().toString(),
            title: p.title || 'Boarding Property',
            location: (p.city || '') + (p.address ? ' • ' + p.address : ''),
            price: p.monthlyRent || 0,
            type: (p.propertyNature === 'ROOM_BASED' || (p.rooms && p.rooms.length > 0 && !p.rooms.some(r => r.roomType === 'Whole House / Annex' || r.roomType === 'Entire Boarding House')))
                ? `Room Based Boarding`
                : (p.propertyNature === 'WHOLE_HOUSE' || (p.rooms && p.rooms.length > 0 && p.rooms.some(r => r.roomType === 'Whole House / Annex' || r.roomType === 'Entire Boarding House')) ? 'Annex / Whole House' : 'Boarding House'),
            roomsCount: p.rooms ? p.rooms.length : 0,
            totalRooms: totalCap,
            occupiedRooms: occCap,
            availableRooms: availCap,
            status: p.status || 'APPROVED',
            rating: p.rating || 4.8,
            rooms: p.rooms || [],
            raw: p,
            imageUrls: extractedImageUrls,
            images: p.images || [],
            imageUrl: extractedImageUrls.length > 0 ? extractedImageUrls[0] : null
        };
    });

    const totalCount = properties.length;
    const vacanciesCount = properties.filter(p => p.availableRooms > 0).length;
    const fullyOccupiedCount = properties.filter(p => p.availableRooms === 0).length;

    const filteredProperties = properties.filter((p) => {
        if (filterStatus === 'VACANCIES') return p.availableRooms > 0;
        if (filterStatus === 'FULLY_OCCUPIED') return p.availableRooms === 0;
        return true;
    });

    const filterCategories = [
        { id: 'ALL', label: `All (${totalCount})` },
        { id: 'VACANCIES', label: `Vacancies Available (${vacanciesCount})` },
        { id: 'FULLY_OCCUPIED', label: `Fully Occupied (${fullyOccupiedCount})` }
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Standardized HeaderBar */}
            <HeaderBar
                title="BoardingHub"
                userAvatar={currentUser?.avatarUrl}
                onOpenNotifications={onOpenNotifications}
                onOpenProfile={() => onNavigateTab && onNavigateTab('Profile')}
            />

            {/* Sub-Header Title & Add Button */}
            <View style={styles.subHeader}>
                <View>
                    <Text style={styles.headerTitle}>My Properties</Text>
                    <Text style={styles.headerSubtitle}>{totalCount} Listing{totalCount === 1 ? '' : 's'} Managed</Text>
                </View>

                <TouchableOpacity
                    style={styles.addBtnHeader}
                    onPress={onAddNewProperty}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.addBtnText}>Add Property</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Tabs Bar */}
            <View style={styles.filterBarWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
                    {filterCategories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.filterChip, filterStatus === cat.id && styles.filterChipActive]}
                            onPress={() => setFilterStatus(cat.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.filterChipText, filterStatus === cat.id && styles.filterChipTextActive]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Properties Feed / Empty State */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {filteredProperties.length > 0 ? (
                    filteredProperties.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.propertyCard}
                            onPress={() => onSelectProperty && onSelectProperty(item)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.imageWrapper}>
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                                ) : (
                                    <View style={[styles.cardImage, { backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Ionicons name="home-outline" size={40} color="#133E32" />
                                    </View>
                                )}

                                <View style={[styles.statusTag, item.availableRooms > 0 ? styles.statusActive : styles.statusFull]}>
                                    <Text style={styles.statusTagText}>{item.availableRooms > 0 ? 'VACANCIES' : 'FULLY OCCUPIED'}</Text>
                                </View>

                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 3 }} />
                                    <Text style={styles.ratingText}>{item.rating}</Text>
                                </View>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.propertyTitle} numberOfLines={1}>{item.title}</Text>
                                    {(item.roomsCount > 0 || (item.rooms && item.rooms.length > 0)) && (
                                        <View style={styles.roomBadgeRight}>
                                            <Ionicons name="bed-outline" size={12} color="#D97706" style={{ marginRight: 4 }} />
                                            <Text style={styles.roomBadgeRightText}>
                                                {(item.roomsCount || item.rooms.length)} {(item.roomsCount || item.rooms.length) === 1 ? 'Room' : 'Rooms'}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                    <Text style={[styles.locationText, { flex: 1 }]} numberOfLines={1}>{item.location}</Text>
                                </View>

                                <View style={[styles.infoRow, { marginBottom: 16 }]}>
                                    <Ionicons name="business-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                    <Text style={[styles.locationText, { color: '#0F172A', fontWeight: '600', flex: 1 }]} numberOfLines={1}>{item.type}</Text>
                                </View>

                                <View style={styles.statsRow}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statBoxNum}>{item.totalRooms}</Text>
                                        <Text style={styles.statBoxLabel}>Total Spaces</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={[styles.statBoxNum, { color: '#D97706' }]}>{item.occupiedRooms}</Text>
                                        <Text style={styles.statBoxLabel}>Occupied</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={[styles.statBoxNum, { color: item.availableRooms > 0 ? '#133E32' : '#DC2626' }]}>{item.availableRooms}</Text>
                                        <Text style={styles.statBoxLabel}>Available</Text>
                                    </View>
                                </View>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.priceText}>
                                        Rs. {item.price.toLocaleString()}{' '}
                                        <Text style={styles.pricePeriod}>/ month</Text>
                                    </Text>

                                    <TouchableOpacity
                                        style={styles.manageBtn}
                                        onPress={() => onSelectProperty && onSelectProperty(item)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.manageBtnText}>Manage</Text>
                                        <Ionicons name="chevron-forward" size={14} color="#133E32" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyContainerCard}>
                        <View style={styles.emptyHeaderBadgeRow}>
                            <View style={styles.emptyHeaderBadge}>
                                <Text style={styles.emptyHeaderBadgeText}>✦ OWNER DASHBOARD</Text>
                            </View>
                        </View>

                        <View style={styles.emptyIconOuterRing}>
                            <View style={styles.emptyIconInnerBadge}>
                                <Ionicons name="home" size={30} color="#FFD700" />
                            </View>
                        </View>

                        <Text style={styles.emptyTitle}>
                            {properties.length === 0 ? 'No Boarding Properties Listed Yet' : 'No Matching Properties'}
                        </Text>

                        <Text style={styles.emptySubtitle}>
                            {properties.length === 0
                                ? 'Publish your boarding houses, annexes, or rooms to start receiving tenant booking requests and managing your room vacancies effortlessly.'
                                : filterStatus === 'VACANCIES'
                                    ? 'None of your properties currently have open vacancies available for booking.'
                                    : 'None of your properties are currently fully occupied.'}
                        </Text>

                        {properties.length === 0 && (
                            <>
                                <View style={styles.emptyFeaturesBox}>
                                    <View style={styles.featureItemRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#133E32" style={{ marginRight: 8 }} />
                                        <Text style={styles.featureItemText}>Receive direct WhatsApp & call inquiries from seekers</Text>
                                    </View>
                                    <View style={styles.featureItemRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#133E32" style={{ marginRight: 8 }} />
                                        <Text style={styles.featureItemText}>Track real-time room occupancy & remaining spaces</Text>
                                    </View>
                                    <View style={styles.featureItemRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#133E32" style={{ marginRight: 8 }} />
                                        <Text style={styles.featureItemText}>Full control over monthly rental prices & rules</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.emptyPrimaryBtn}
                                    onPress={onAddNewProperty}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="add-circle" size={20} color="#FFD700" style={{ marginRight: 6 }} />
                                    <Text style={styles.emptyPrimaryBtnText}>Create New Property Listing</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Bottom Nav Bar */}
            <View style={styles.bottomNav}>
                {[
                    { id: 'Dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
                    { id: 'Properties', label: 'Properties', icon: 'home-outline', activeIcon: 'home' },
                    { id: 'Requests', label: 'Requests', icon: 'clipboard-outline', activeIcon: 'clipboard' },
                    { id: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={styles.navItem}
                            onPress={() => onNavigateTab && onNavigateTab(tab.id)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isActive ? tab.activeIcon : tab.icon}
                                size={22}
                                color={isActive ? '#133E32' : '#64748B'}
                            />
                            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    subHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#133E32',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    addBtnHeader: {
        backgroundColor: '#133E32',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    addBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    filterBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    filterChipActive: {
        backgroundColor: '#133E32',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#FFD700',
        fontWeight: '800',
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    propertyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
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
    imageWrapper: {
        height: 160,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    statusTag: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusActive: {
        backgroundColor: '#133E32',
    },
    statusDraft: {
        backgroundColor: '#64748B',
    },
    statusTagText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    ratingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#FFFBEB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#B45309',
    },

    cardContent: {
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    propertyTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        marginRight: 8,
    },
    roomBadgeRight: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FEF08A',
    },
    roomBadgeRightText: {
        fontSize: 11.5,
        fontWeight: '800',
        color: '#B45309',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        fontSize: 13,
        color: '#64748B',
    },
    roomCountPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    roomCountPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#133E32',
    },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
        justifyContent: 'space-around',
        marginBottom: 14,
    },
    statBox: {
        alignItems: 'center',
    },
    statBoxNum: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    statBoxLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#133E32',
    },
    pricePeriod: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    manageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    manageBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
        marginRight: 4,
    },

    /* Empty State Luxury Card Styling */
    emptyContainerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 3,
    },
    emptyHeaderBadgeRow: {
        marginBottom: 16,
    },
    emptyHeaderBadge: {
        backgroundColor: '#F0F7F4',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#C3E6D8',
    },
    emptyHeaderBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#133E32',
        letterSpacing: 0.6,
    },
    emptyIconOuterRing: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyIconInnerBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
        maxWidth: 320,
    },
    emptyFeaturesBox: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    featureItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    featureItemText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#334155',
        flex: 1,
    },
    emptyPrimaryBtn: {
        width: '100%',
        backgroundColor: '#133E32',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
        borderRadius: 14,
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyPrimaryBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },

    bottomNav: {
        flexDirection: 'row',
        height: 64,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 10,
    },
    navItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 4,
    },
    navLabelActive: {
        color: '#133E32',
        fontWeight: '900',
    },
});
