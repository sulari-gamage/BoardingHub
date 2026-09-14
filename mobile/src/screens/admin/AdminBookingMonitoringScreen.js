import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../components/AdminHeader';

export default function AdminBookingMonitoringScreen({
    onNavigateTab,
    activeTab = 'Bookings'
}) {
    const [selectedFilter, setSelectedFilter] = useState('ALL');

    const bookings = [
        {
            id: '#BKG-8992',
            tenantName: 'Sarah Jenkins',
            tenantEmail: 'sarah.j@example.com',
            propertyTitle: 'The Evergreen Loft',
            ownerName: 'Michael T. (Owner)',
            dates: 'Oct 12 - Oct 15',
            nights: '3 Nights',
            status: 'Confirmed',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        },
        {
            id: '#BKG-8993',
            tenantName: 'David Chen',
            tenantEmail: 'd.chen@example.com',
            propertyTitle: 'Riverside Cabin Retreat',
            ownerName: 'Elena R. (Owner)',
            dates: 'Oct 20 - Oct 25',
            nights: '5 Nights',
            status: 'Pending',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        },
        {
            id: '#BKG-8990',
            tenantName: 'Alicia Lopez',
            tenantEmail: 'alicia.l@example.com',
            propertyTitle: 'Downtown Executive Suite',
            ownerName: 'Corporate Housing LLC',
            dates: 'Oct 01 - Nov 01',
            nights: '31 Nights',
            status: 'Paid',
            initials: 'AL',
            avatar: null,
        },
        {
            id: '#BKG-8985',
            tenantName: 'Marcus Vance',
            tenantEmail: 'm.vance@example.com',
            propertyTitle: 'Pine Ridge Studio',
            ownerName: 'Sam K. (Owner)',
            dates: 'Oct 15 - Oct 18',
            nights: '3 Nights',
            status: 'Cancelled',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        }
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Confirmed':
                return { badge: styles.statusConfirmed, text: styles.statusTextConfirmed };
            case 'Pending':
                return { badge: styles.statusPending, text: styles.statusTextPending };
            case 'Paid':
                return { badge: styles.statusPaid, text: styles.statusTextPaid };
            case 'Cancelled':
                return { badge: styles.statusCancelled, text: styles.statusTextCancelled };
            default:
                return { badge: styles.statusPending, text: styles.statusTextPending };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <AdminHeader title="BoardingHub Admin" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.pageTitle}>Booking Monitoring</Text>
                    <Text style={styles.pageSubtitle}>Live monitoring of booking activity across the network.</Text>
                </View>

                {/* Filter Controls */}
                <View style={styles.controlBar}>
                    <TouchableOpacity style={styles.dateFilterBtn} activeOpacity={0.8}>
                        <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
                        <Text style={styles.dateFilterText}>Filter by Date Range</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.filterBtn} activeOpacity={0.85}>
                        <Ionicons name="options-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.filterBtnText}>Filters</Text>
                    </TouchableOpacity>
                </View>

                {/* 2x2 Status Counters Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Ionicons name="time-outline" size={16} color="#B45309" style={{ marginBottom: 4 }} />
                        <Text style={styles.statBoxLabel}>Pending</Text>
                        <Text style={styles.statBoxValue}>24</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#133E32" style={{ marginBottom: 4 }} />
                        <Text style={styles.statBoxLabel}>Confirmed</Text>
                        <Text style={styles.statBoxValue}>156</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Ionicons name="wallet-outline" size={16} color="#133E32" style={{ marginBottom: 4 }} />
                        <Text style={styles.statBoxLabel}>Paid</Text>
                        <Text style={styles.statBoxValue}>892</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Ionicons name="close-circle-outline" size={16} color="#DC2626" style={{ marginBottom: 4 }} />
                        <Text style={styles.statBoxLabel}>Cancelled</Text>
                        <Text style={[styles.statBoxValue, { color: '#DC2626' }]}>12</Text>
                    </View>
                </View>

                {/* Booking List Cards */}
                {bookings.map((item) => {
                    const stStyle = getStatusStyle(item.status);
                    return (
                        <View key={item.id} style={styles.bookingCard}>
                            <View style={styles.bookingHeader}>
                                <Text style={styles.bookingIdLabel}>BOOKING ID</Text>
                                <Text style={styles.bookingIdVal}>{item.id}</Text>
                            </View>

                            <View style={styles.tenantRow}>
                                {item.avatar ? (
                                    <Image source={{ uri: item.avatar }} style={styles.tenantAvatar} />
                                ) : (
                                    <View style={styles.initialsBox}>
                                        <Text style={styles.initialsText}>{item.initials}</Text>
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tenantName}>{item.tenantName}</Text>
                                    <Text style={styles.tenantEmail}>{item.tenantEmail}</Text>
                                </View>
                            </View>

                            <View style={styles.propertyBox}>
                                <Text style={styles.propertyTitle}>{item.propertyTitle}</Text>
                                <View style={styles.ownerRow}>
                                    <Ionicons name="person-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
                                    <Text style={styles.ownerText}>{item.ownerName}</Text>
                                </View>
                            </View>

                            <View style={styles.dateRow}>
                                <Text style={styles.dateText}>{item.dates}</Text>
                                <Text style={styles.nightsText}>{item.nights}</Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.statusLabel}>STATUS</Text>
                                <View style={[styles.statusBadge, stStyle.badge]}>
                                    <Text style={[styles.statusText, stStyle.text]}>{item.status}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
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
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },

    /* Controls */
    controlBar: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    dateFilterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAEFEF',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    dateFilterText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#133E32',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 44,
    },
    filterBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    /* 2x2 Stats Grid */
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 18,
    },
    statBox: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    statBoxLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 2,
    },
    statBoxValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
    },

    /* Booking Cards */
    bookingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bookingIdLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    bookingIdVal: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },

    tenantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tenantAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginRight: 12,
    },
    initialsBox: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#C3DCD4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    initialsText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#133E32',
    },
    tenantName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    tenantEmail: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 1,
    },

    propertyBox: {
        marginBottom: 10,
    },
    propertyTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ownerText: {
        fontSize: 12,
        color: '#64748B',
    },

    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 12,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    nightsText: {
        fontSize: 12,
        color: '#64748B',
    },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
    },
    statusConfirmed: { backgroundColor: '#E6F0EC' },
    statusPending: { backgroundColor: '#FEF3C7' },
    statusPaid: { backgroundColor: '#133E32' },
    statusCancelled: { backgroundColor: '#FEE2E2' },

    statusText: { fontSize: 12, fontWeight: '800' },
    statusTextConfirmed: { color: '#133E32' },
    statusTextPending: { color: '#B45309' },
    statusTextPaid: { color: '#FFFFFF' },
    statusTextCancelled: { color: '#991B1B' },

    /* Bottom Nav Bar */
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
