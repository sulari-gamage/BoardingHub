import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../components/HeaderBar';

export default function OwnerRequestsScreen({
    onNavigateTab,
    onContactTenant,
    onOpenNotifications,
    onSelectRequest,
    activeTab = 'Requests'
}) {
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [requests, setRequests] = useState([
        {
            id: 'req_1',
            tenantName: 'Sulari Gamage',
            tenantPhone: '+94 77 987 6543',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
            propertyTitle: 'Green Valley Boarding',
            roomType: 'Shared Room',
            moveInDate: 'Sep 10, 2026',
            monthlyPrice: 15000,
            status: 'PENDING',
            dateRequested: 'Today, 09:30 AM'
        },
        {
            id: 'req_2',
            tenantName: 'Kamal Fernando',
            tenantPhone: '+94 71 234 5678',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            propertyTitle: 'Sunrise Student Annex',
            roomType: 'Single Room',
            moveInDate: 'Sep 15, 2026',
            monthlyPrice: 18000,
            status: 'APPROVED',
            dateRequested: 'Yesterday'
        },
        {
            id: 'req_3',
            tenantName: 'Anjali Perera',
            tenantPhone: '+94 76 555 4321',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
            propertyTitle: 'Royal Villa Boarding',
            roomType: 'Luxury Suite',
            moveInDate: 'Oct 01, 2026',
            monthlyPrice: 22000,
            status: 'REJECTED',
            dateRequested: '3 days ago'
        }
    ]);

    const handleAccept = (id) => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
        Alert.alert('Request Approved', 'Tenant has been notified.');
    };

    const handleReject = (id) => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
        Alert.alert('Request Declined', 'Booking request declined.');
    };

    const filteredRequests = requests.filter(r => {
        if (filterCategory === 'PENDING') return r.status === 'PENDING';
        if (filterCategory === 'APPROVED') return r.status === 'APPROVED';
        if (filterCategory === 'REJECTED') return r.status === 'REJECTED';
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

            {/* Sub-Header Title */}
            <View style={styles.subHeader}>
                <Text style={styles.headerTitle}>Booking Requests</Text>
                <Text style={styles.headerSubtitle}>{requests.length} Total Tenant Requests</Text>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterBar}>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                        onPress={() => setFilterCategory(cat)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Requests Feed */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {filteredRequests.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.requestCard}
                        onPress={() => onSelectRequest && onSelectRequest(item)}
                        activeOpacity={0.88}
                    >
                        <View style={styles.cardHeader}>
                            <Image source={{ uri: item.avatar }} style={styles.avatar} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.tenantName}>{item.tenantName}</Text>
                                <Text style={styles.dateRequested}>{item.dateRequested}</Text>
                            </View>
                            <View
                                style={[
                                    styles.statusBadge,
                                    item.status === 'APPROVED'
                                        ? styles.statusApproved
                                        : item.status === 'REJECTED'
                                            ? styles.statusRejected
                                            : styles.statusPending
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        item.status === 'APPROVED'
                                            ? styles.statusTextApproved
                                            : item.status === 'REJECTED'
                                                ? styles.statusTextRejected
                                                : styles.statusTextPending
                                    ]}
                                >
                                    {item.status}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailsBox}>
                            <Text style={styles.propertyTitle}>{item.propertyTitle}</Text>
                            <View style={styles.infoRow}>
                                <Ionicons name="bed-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                <Text style={styles.infoText}>{item.roomType}</Text>
                                <Text style={styles.dotSeparator}>•</Text>
                                <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                <Text style={styles.infoText}>Move-in: {item.moveInDate}</Text>
                            </View>
                            <Text style={styles.priceVal}>Rs. {item.monthlyPrice.toLocaleString()} / month</Text>
                        </View>

                        {/* Action Buttons */}
                        {item.status === 'PENDING' ? (
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={styles.declineBtn}
                                    onPress={() => handleReject(item.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.declineText}>Decline</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.acceptBtn}
                                    onPress={() => handleAccept(item.id)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.acceptText}>Approve Request</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Bottom Nav Bar */}
            <View style={styles.bottomNav}>
                {
                    [
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
                    })
                }
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
        marginTop: 2,
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
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    filterChipActive: {
        backgroundColor: '#133E32',
    },
    filterChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#FFD700',
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 14,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    tenantName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    dateRequested: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },

    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusPending: { backgroundColor: '#FEF3C7' },
    statusApproved: { backgroundColor: '#E6F0EC' },
    statusRejected: { backgroundColor: '#FEE2E2' },
    statusText: { fontSize: 11, fontWeight: '900' },
    statusTextPending: { color: '#B45309' },
    statusTextApproved: { color: '#133E32' },
    statusTextRejected: { color: '#991B1B' },

    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },

    detailsBox: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginBottom: 14,
    },
    propertyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
    },
    dotSeparator: {
        marginHorizontal: 6,
        color: '#CBD5E1',
    },
    priceVal: {
        fontSize: 14,
        fontWeight: '900',
        color: '#133E32',
    },

    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    declineBtn: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748B',
    },
    acceptBtn: {
        flex: 2,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    contactBtn: {
        flexDirection: 'row',
        height: 42,
        borderRadius: 12,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#133E32',
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
