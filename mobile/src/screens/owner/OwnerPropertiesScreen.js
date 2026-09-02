import React, { useState } from 'react';
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

export default function OwnerPropertiesScreen({
    onNavigateTab,
    onAddNewProperty,
    onSelectProperty,
    onOpenNotifications,
    activeTab = 'Properties'
}) {
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [properties, setProperties] = useState([
        {
            id: 'p1',
            title: 'Green Valley Boarding',
            location: 'Moratuwa, Sri Lanka',
            price: 15000,
            type: 'Shared & Single Rooms',
            totalRooms: 6,
            occupiedRooms: 4,
            availableRooms: 2,
            status: 'ACTIVE',
            rating: 4.8,
            imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'p2',
            title: 'Sunrise Student Annex',
            location: 'Katubedda, Moratuwa',
            price: 18000,
            type: 'Single Rooms',
            totalRooms: 4,
            occupiedRooms: 3,
            availableRooms: 1,
            status: 'ACTIVE',
            rating: 4.9,
            imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'p3',
            title: 'Royal Villa Boarding',
            location: 'Rawatawatta, Moratuwa',
            price: 22000,
            type: 'Luxury Suite',
            totalRooms: 5,
            occupiedRooms: 0,
            availableRooms: 5,
            status: 'DRAFT',
            rating: 4.7,
            imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
        }
    ]);

    const filteredProperties = properties.filter((p) => {
        if (filterStatus === 'ACTIVE') return p.status === 'ACTIVE';
        if (filterStatus === 'DRAFT') return p.status === 'DRAFT';
        return true;
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Standardized HeaderBar */}
            <HeaderBar
                title="BoardingHub"
                onOpenNotifications={onOpenNotifications}
                onOpenProfile={() => onNavigateTab && onNavigateTab('Profile')}
            />

            {/* Sub-Header Title & Add Button */}
            <View style={styles.subHeader}>
                <View>
                    <Text style={styles.headerTitle}>My Properties</Text>
                    <Text style={styles.headerSubtitle}>{properties.length} Listings Managed</Text>
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

            {/* Filter Tabs */}
            <View style={styles.filterBar}>
                {['ALL', 'ACTIVE', 'DRAFT'].map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.filterChip, filterStatus === cat && styles.filterChipActive]}
                        onPress={() => setFilterStatus(cat)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterChipText, filterStatus === cat && styles.filterChipTextActive]}>
                            {cat === 'ALL' ? 'All (3)' : cat === 'ACTIVE' ? 'Active (2)' : 'Draft (1)'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Properties Feed */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {filteredProperties.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.propertyCard}
                        onPress={() => onSelectProperty && onSelectProperty(item)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.imageWrapper}>
                            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

                            <View style={[styles.statusTag, item.status === 'ACTIVE' ? styles.statusActive : styles.statusDraft]}>
                                <Text style={styles.statusTagText}>{item.status}</Text>
                            </View>

                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 3 }} />
                                <Text style={styles.ratingText}>{item.rating}</Text>
                            </View>
                        </View>

                        <View style={styles.cardContent}>
                            <Text style={styles.propertyTitle}>{item.title}</Text>

                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                <Text style={styles.locationText}>{item.location}</Text>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statBoxNum}>{item.totalRooms}</Text>
                                    <Text style={styles.statBoxLabel}>Total</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={[styles.statBoxNum, { color: '#D97706' }]}>{item.occupiedRooms}</Text>
                                    <Text style={styles.statBoxLabel}>Occupied</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={[styles.statBoxNum, { color: '#133E32' }]}>{item.availableRooms}</Text>
                                    <Text style={styles.statBoxLabel}>Available</Text>
                                </View>
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.priceText}>
                                    Rs. {item.price.toLocaleString()}{' '}
                                    <Text style={styles.pricePeriod}>/ month</Text>
                                </Text>

                                <TouchableOpacity style={styles.manageBtn}>
                                    <Text style={styles.manageBtnText}>Manage</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#133E32" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
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
    propertyTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
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
