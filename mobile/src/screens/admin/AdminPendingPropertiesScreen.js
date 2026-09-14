import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    StatusBar,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../components/AdminHeader';
import api from '../../services/api';

export default function AdminPendingPropertiesScreen({
    onNavigateTab,
    onOpenNotifications,
    onSelectProperty,
    activeTab = 'Listings'
}) {
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [apiProperties, setApiProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPendingProperties();
    }, []);

    const loadPendingProperties = async () => {
        try {
            setLoading(true);
            const data = await api.admin.getPendingProperties();
            if (data) {
                setApiProperties(data);
            }
        } catch (error) {
            console.log('Error loading pending properties for admin:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, title) => {
        try {
            await api.admin.approveProperty(id);
            Alert.alert('Approved 🎉', `Property "${title}" has been approved and listed!`);
            loadPendingProperties();
        } catch (error) {
            console.log('Error approving property:', error);
            Alert.alert('Action Failed', error.message || 'Could not approve property.');
        }
    };

    const handleReject = async (id, title) => {
        try {
            await api.admin.rejectProperty(id);
            Alert.alert('Rejected ❌', `Property "${title}" was rejected.`);
            loadPendingProperties();
        } catch (error) {
            console.log('Error rejecting property:', error);
            Alert.alert('Action Failed', error.message || 'Could not reject property.');
        }
    };

    const pendingProperties = apiProperties.map(p => ({
        id: p.id.toString(),
        title: p.title,
        location: (p.city || '') + (p.address ? ' • ' + p.address : ''),
        price: `Rs. ${(p.monthlyRent || 0).toLocaleString()} / mo`,
        owner: p.ownerName || 'Property Owner',
        submittedTime: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recently',
        priority: 'Submitted Today',
        image: (p.imageUrls && p.imageUrls.length > 0)
            ? p.imageUrls[0]
            : (p.images && p.images.length > 0)
                ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].imageUrl)
                : 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
        roomsText: p.rooms ? `${p.rooms.length} ${p.rooms.length === 1 ? 'Room' : 'Rooms'} Added` : '1 Room Added',
    }));

    const filtered = pendingProperties.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.owner.toLowerCase().includes(searchQuery.toLowerCase());
        if (selectedFilter === 'High Priority') return matchesSearch && p.priority === 'High Priority';
        if (selectedFilter === 'Submitted Today') return matchesSearch && p.priority === 'Submitted Today';
        return matchesSearch;
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#133E32" />
            <AdminHeader
                title="BoardingHub Admin"
                onOpenNotifications={onOpenNotifications}
                onOpenProfile={() => onNavigateTab && onNavigateTab('Users')}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.pageTitle}>Pending Properties</Text>
                    <Text style={styles.pageSubtitle}>8 property listings waiting for verification & approval.</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by title, location, or owner..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filter Pills */}
                <View style={styles.filterRow}>
                    {['All', 'High Priority', 'Submitted Today'].map((filter) => {
                        const isSel = selectedFilter === filter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterChip, isSel && styles.filterChipActive]}
                                onPress={() => setSelectedFilter(filter)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.filterText, isSel && styles.filterTextActive]}>{filter}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Pending Property Cards */}
                {filtered.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.propertyCard}
                        onPress={() => onSelectProperty && onSelectProperty(item)}
                        activeOpacity={0.9}
                    >
                        <Image source={{ uri: item.image }} style={styles.cardImage} />

                        <View style={styles.cardContent}>
                            <View style={styles.badgeRow}>
                                <View style={styles.statusBadge}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusBadgeText}>Pending Review</Text>
                                </View>
                                <Text style={styles.submittedTime}>{item.submittedTime}</Text>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={[styles.propertyTitle, { flex: 1, marginBottom: 0 }]} numberOfLines={1}>{item.title}</Text>
                                {item.roomsText ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FEF08A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 }}>
                                        <Ionicons name="bed-outline" size={11} color="#D97706" style={{ marginRight: 3 }} />
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#B45309' }}>{item.roomsText}</Text>
                                    </View>
                                ) : null}
                            </View>

                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                <Text style={styles.locationText}>{item.location}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.cardFooter}>
                                <View>
                                    <Text style={styles.priceText}>{item.price}</Text>
                                    <Text style={styles.ownerText}>Owner: {item.owner}</Text>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    <TouchableOpacity
                                        style={[styles.reviewBtn, { backgroundColor: '#FEE2E2' }]}
                                        onPress={() => handleReject(item.id, item.title)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.reviewBtnText, { color: '#991B1B' }]}>Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.reviewBtn, { backgroundColor: '#133E32' }]}
                                        onPress={() => handleApprove(item.id, item.title)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.reviewBtnText, { color: '#FFD700' }]}>Approve</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Bottom 4-Tab Admin Navigation */}
            <View style={styles.bottomNav}>
                {[
                    { id: 'Dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
                    { id: 'Listings', label: 'Listings', icon: 'home-outline', activeIcon: 'home' },
                    { id: 'Users', label: 'Users', icon: 'people-outline', activeIcon: 'people' },
                    { id: 'More', label: 'More', icon: 'options-outline', activeIcon: 'options' },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.navItem, isActive && styles.navItemActive]}
                            onPress={() => onNavigateTab && onNavigateTab(tab.id)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isActive ? tab.activeIcon : tab.icon}
                                size={20}
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    titleSection: {
        marginBottom: 16,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#133E32',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAEFEF',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 46,
        marginBottom: 14,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
    },

    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 18,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterChipActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },

    /* Property Cards */
    propertyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    cardImage: {
        width: '100%',
        height: 160,
    },
    cardContent: {
        padding: 16,
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D97706',
        marginRight: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#B45309',
    },
    submittedTime: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },

    propertyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        fontSize: 13,
        color: '#64748B',
    },

    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 12,
    },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#133E32',
    },
    ownerText: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    reviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    reviewBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
    },

    /* Bottom Nav */
    bottomNav: {
        flexDirection: 'row',
        height: 64,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    navItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 12,
    },
    navItemActive: {
        backgroundColor: '#E6F0EC',
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    navLabelActive: {
        color: '#133E32',
        fontWeight: '900',
    },
});
