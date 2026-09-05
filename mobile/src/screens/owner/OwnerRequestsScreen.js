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
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../components/HeaderBar';

export default function OwnerRequestsScreen({
    onNavigateTab,
    onContactTenant,
    onOpenNotifications,
    onSelectRequest,
    onApproveRequest,
    onRejectRequest,
    requestsList,
    activeTab = 'Requests'
}) {
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [localRequests, setLocalRequests] = useState([
        {
            id: 'req_1',
            tenantName: 'Sulari Gamage',
            tenantPhone: '+94 77 987 6543',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
            propertyTitle: 'Green Valley Boarding',
            roomType: 'Shared Room (Room 101)',
            occupantsCount: 2,
            remainingSpaces: 2,
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
            roomType: 'Single Room (Room 204)',
            occupantsCount: 1,
            remainingSpaces: 0, // Already Filled
            moveInDate: 'Sep 15, 2026',
            monthlyPrice: 18000,
            status: 'PENDING',
            dateRequested: 'Yesterday'
        },
        {
            id: 'req_3',
            tenantName: 'Anjali Perera',
            tenantPhone: '+94 76 555 4321',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
            propertyTitle: 'Royal Villa Boarding',
            roomType: 'Whole House / Annex',
            occupantsCount: 3,
            remainingSpaces: 1,
            moveInDate: 'Oct 01, 2026',
            monthlyPrice: 45000,
            status: 'PENDING',
            dateRequested: '3 days ago'
        }
    ]);

    const displayRequests = requestsList && requestsList.length > 0 ? requestsList : localRequests;

    const handleWhatsAppApplicant = (phone) => {
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        const url = `https://wa.me/${cleanPhone}`;
        Linking.openURL(url).catch(() => Alert.alert('WhatsApp Error', 'Could not launch WhatsApp.'));
    };

    const handleCallApplicant = (phone) => {
        const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
        const url = `tel:${cleanPhone}`;
        Linking.openURL(url).catch(() => Alert.alert('Phone Error', 'Could not open phone dialer.'));
    };

    const handleAccept = (item) => {
        const remaining = item.remainingSpaces !== undefined ? item.remainingSpaces : 1;
        const requestedOccupants = item.occupantsCount || 1;

        if (remaining <= 0) {
            Alert.alert('Already Filled ❌', 'There are no spaces available for this room or house. You cannot approve this request.');
            return;
        }

        if (requestedOccupants > remaining) {
            Alert.alert('Insufficient Spaces ❌', `Only ${remaining} space(s) available, but applicant requested ${requestedOccupants} occupant space(s).`);
            return;
        }

        if (onApproveRequest) {
            onApproveRequest(item.id || item);
        } else {
            setLocalRequests(localRequests.map(r => {
                if (r.id === item.id) {
                    const newRemaining = Math.max(0, remaining - requestedOccupants);
                    return { ...r, status: 'APPROVED', remainingSpaces: newRemaining };
                }
                return r;
            }));
        }
        Alert.alert('Request Approved 🎉', `Approved ${requestedOccupants} space(s)! Remaining spaces automatically updated.`);
    };

    const handleReject = (id) => {
        if (onRejectRequest) {
            onRejectRequest(id);
        } else {
            setLocalRequests(localRequests.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
        }
        Alert.alert('Request Declined', 'Booking request declined.');
    };

    // Filter & Sort by highest number of requested occupants first (descending)
    const filteredRequests = displayRequests
        .filter(r => {
            if (filterCategory === 'PENDING') return r.status === 'PENDING';
            if (filterCategory === 'APPROVED') return r.status === 'APPROVED';
            if (filterCategory === 'REJECTED') return r.status === 'REJECTED';
            return true;
        })
        .sort((a, b) => (b.occupantsCount || 1) - (a.occupantsCount || 1));

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
                <Text style={styles.headerSubtitle}>{displayRequests.length} Total Tenant Requests (Sorted by Occupants)</Text>
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
                {filteredRequests.map((item) => {
                    const remaining = item.remainingSpaces !== undefined ? item.remainingSpaces : 1;
                    const isFilled = remaining <= 0;

                    return (
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
                                    <Ionicons name="people-outline" size={14} color="#133E32" style={{ marginRight: 4 }} />
                                    <Text style={[styles.infoText, { fontWeight: '800', color: '#133E32' }]}>
                                        {item.occupantsCount || 1} Occupant(s)
                                    </Text>
                                </View>

                                {/* Remaining Spaces Indicator Badge */}
                                <View style={styles.spacesBadgeRow}>
                                    <View style={[styles.spacesChip, isFilled ? styles.spacesChipRed : styles.spacesChipGreen]}>
                                        <Ionicons
                                            name={isFilled ? "alert-circle" : "checkmark-circle"}
                                            size={13}
                                            color={isFilled ? "#DC2626" : "#166534"}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={[styles.spacesChipText, isFilled ? styles.spacesChipTextRed : styles.spacesChipTextGreen]}>
                                            {isFilled ? 'Already Filled (0 Spaces)' : `${remaining} Space(s) Remaining`}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.priceVal}>Rs. {item.monthlyPrice.toLocaleString()} / month</Text>
                            </View>

                            {/* Direct Contact Buttons for Applicant */}
                            <View style={styles.applicantContactRow}>
                                <TouchableOpacity
                                    style={styles.applicantWhatsappBtn}
                                    onPress={() => handleWhatsAppApplicant(item.tenantPhone)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="logo-whatsapp" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.applicantWhatsappText}>WhatsApp</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.applicantCallBtn}
                                    onPress={() => handleCallApplicant(item.tenantPhone)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="call-outline" size={15} color="#133E32" style={{ marginRight: 6 }} />
                                    <Text style={styles.applicantCallText}>Call ({item.tenantPhone})</Text>
                                </TouchableOpacity>
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
                                        style={[styles.acceptBtn, isFilled && styles.acceptBtnDisabled]}
                                        onPress={() => handleAccept(item)}
                                        activeOpacity={isFilled ? 1 : 0.85}
                                    >
                                        <Text style={styles.acceptText}>
                                            {isFilled ? 'Already Filled' : 'Approve Request'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
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
        marginTop: 4,
    },

    /* Remaining Spaces Chip */
    spacesBadgeRow: {
        marginTop: 6,
        marginBottom: 4,
    },
    spacesChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    spacesChipGreen: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    spacesChipRed: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    spacesChipText: {
        fontSize: 12,
        fontWeight: '800',
    },
    spacesChipTextGreen: {
        color: '#166534',
    },
    spacesChipTextRed: {
        color: '#DC2626',
    },

    /* Applicant Contact Row */
    applicantContactRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    applicantWhatsappBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 38,
        borderRadius: 10,
        backgroundColor: '#25D366', // WhatsApp Green
    },
    applicantWhatsappText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    applicantCallBtn: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 38,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    applicantCallText: {
        fontSize: 12,
        fontWeight: '800',
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
    acceptBtnDisabled: {
        backgroundColor: '#94A3B8',
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
