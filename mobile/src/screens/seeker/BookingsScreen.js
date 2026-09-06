import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../../components/BottomNavBar';
import HeaderBar from '../../components/HeaderBar';
import api from '../../services/api';

export default function BookingsScreen({ bookings = [], onSelectBoarding, onViewBookingDetails, onNavigateTab, onOpenNotifications }) {
    const [activeTabFilter, setActiveTabFilter] = useState('Pending');
    const [activeNavTab, setActiveNavTab] = useState('BOOKINGS');
    const [apiBookings, setApiBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMyBookings();
    }, []);

    const loadMyBookings = async () => {
        try {
            setLoading(true);
            const data = await api.bookings.getMyBookings();
            if (data && data.length > 0) {
                setApiBookings(data);
            }
        } catch (error) {
            console.log('Error fetching seeker bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial mock bookings list if none passed via state
    const defaultBookings = [
        {
            id: "b1",
            title: "Green Valley Boarding",
            location: "Moratuwa, Sri Lanka",
            date: "Sep 10, 2026",
            roomType: "Shared Room",
            status: "PENDING",
            price: 15000,
            imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
            description: "Quiet and peaceful boarding for female students & workers in Moratuwa.",
            ownerName: "Sunethra Silva",
            ownerPhone: "+94 77 123 4567"
        },
        {
            id: "b2",
            title: "Sunrise Apartments",
            location: "Dehiwala, Sri Lanka",
            date: "Aug 15, 2026",
            roomType: "Private Room",
            status: "ACCEPTED",
            price: 22000,
            imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
            description: "Modern annex in Dehiwala close to high street and university campuses.",
            ownerName: "Kamal Fernando",
            ownerPhone: "+94 71 987 6543"
        },
        {
            id: "b3",
            title: "Royal Campus Haven",
            location: "Katubedda, Sri Lanka",
            date: "Jul 01, 2026",
            roomType: "Single Room",
            status: "PAST",
            price: 18000,
            imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            description: "Comfortable room close to University of Moratuwa.",
            ownerName: "Nimal Perera",
            ownerPhone: "+94 77 555 1234"
        }
    ];

    const mappedApiBookings = apiBookings.map(b => ({
        id: b.id.toString(),
        title: b.propertyTitle || 'Boarding Request',
        location: b.roomType ? `${b.roomType} Room` : 'Property Room',
        date: b.moveInDate ? new Date(b.moveInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        roomType: b.roomType || 'Room Request',
        status: b.status === 'APPROVED' ? 'ACCEPTED' : b.status,
        price: b.monthlyPrice || 0,
        imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        description: b.notes || 'Booking Request',
        ownerName: 'Owner',
        ownerPhone: ''
    }));

    const allBookings = mappedApiBookings.length > 0 ? mappedApiBookings : bookings;

    const filteredBookings = allBookings.filter((b) => {
        if (activeTabFilter === 'Pending') return b.status === 'PENDING';
        if (activeTabFilter === 'Accepted') return b.status === 'ACCEPTED' || b.status === 'APPROVED';
        if (activeTabFilter === 'Past') return b.status === 'PAST' || b.status === 'REJECTED' || b.status === 'CANCELLED';
        return true;
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Standard Dark Emerald Header Bar */}
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

            {/* Screen Sub-Title */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            {/* Segmented Filter Tabs */}
            <View style={styles.tabsContainer}>
                {['Pending', 'Accepted', 'Past'].map((tab) => {
                    const isActive = activeTabFilter === tab;
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabBtn, isActive && styles.activeTabBtn]}
                            onPress={() => setActiveTabFilter(tab)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Bookings Card List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((item) => (
                        <View key={item.id} style={styles.bookingCard}>
                            {/* Image & Status Badge */}
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />

                                <View
                                    style={[
                                        styles.statusBadge,
                                        item.status === 'PENDING'
                                            ? styles.pendingBadge
                                            : item.status === 'ACCEPTED'
                                                ? styles.acceptedBadge
                                                : styles.pastBadge
                                    ]}
                                >
                                    <Ionicons
                                        name={
                                            item.status === 'PENDING'
                                                ? 'time-outline'
                                                : item.status === 'ACCEPTED'
                                                    ? 'checkmark-circle-outline'
                                                    : 'archive-outline'
                                        }
                                        size={12}
                                        color={item.status === 'ACCEPTED' ? '#FFD700' : '#FFFFFF'}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text
                                        style={[
                                            styles.statusBadgeText,
                                            item.status === 'ACCEPTED' && { color: '#FFD700' }
                                        ]}
                                    >
                                        {item.status}
                                    </Text>
                                </View>
                            </View>

                            {/* Booking Body Details */}
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle}>{item.title}</Text>

                                {/* Date Row */}
                                <View style={styles.infoRow}>
                                    <Ionicons name="calendar-outline" size={16} color="#475569" style={{ marginRight: 8 }} />
                                    <Text style={styles.infoText}>{item.date || 'Sep 10, 2026'}</Text>
                                </View>

                                {/* Room Type Row */}
                                <View style={styles.infoRow}>
                                    <Ionicons name="bed-outline" size={16} color="#475569" style={{ marginRight: 8 }} />
                                    <Text style={styles.infoText}>{item.roomType || 'Shared Room'}</Text>
                                </View>

                                <View style={styles.divider} />

                                {/* Action Button: View Details */}
                                <TouchableOpacity
                                    style={styles.viewDetailsBtn}
                                    onPress={() => {
                                        if (onViewBookingDetails) onViewBookingDetails(item);
                                        else if (onSelectBoarding) onSelectBoarding(item);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.viewDetailsBtnText}>View Details</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-clear-outline" size={48} color="#94A3B8" />
                        <Text style={styles.emptyTitle}>No {activeTabFilter} Bookings</Text>
                        <Text style={styles.emptySubtitle}>
                            You don't have any {activeTabFilter.toLowerCase()} boarding requests at the moment.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Fixed Bottom Navigation Bar */}
            <BottomNavBar
                activeTab={activeNavTab}
                onTabChange={(tab) => {
                    setActiveNavTab(tab);
                    if (onNavigateTab) onNavigateTab(tab);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#133E32',
        letterSpacing: -0.4,
    },

    /* Segmented Filter Tabs */
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: 20,
        marginTop: 4,
    },
    tabBtn: {
        paddingVertical: 12,
        marginRight: 28,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabBtn: {
        borderBottomColor: '#133E32',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#133E32',
        fontWeight: '800',
    },

    /* Scroll Content */
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Booking Card */
    bookingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    imageContainer: {
        position: 'relative',
        height: 180,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    statusBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
    },
    pendingBadge: {
        backgroundColor: '#78350F',
    },
    acceptedBadge: {
        backgroundColor: '#133E32',
    },
    pastBadge: {
        backgroundColor: '#64748B',
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    /* Body */
    cardBody: {
        padding: 18,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 14,
    },
    viewDetailsBtn: {
        height: 46,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    viewDetailsBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#133E32',
    },

    /* Empty State */
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 12,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        paddingHorizontal: 30,
    },
});
