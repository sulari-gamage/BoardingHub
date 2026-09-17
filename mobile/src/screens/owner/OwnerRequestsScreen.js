import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../components/HeaderBar';
import api from '../../services/api';

export default function OwnerRequestsScreen({
    onNavigateTab,
    onContactTenant,
    onOpenNotifications,
    onSelectRequest,
    onApproveRequest,
    onRejectRequest,
    requestsList,
    activeTab = 'Requests',
    currentUser
}) {
    const [filterCategory, setFilterCategory] = useState('PENDING');
    const [apiRequests, setApiRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOwnerRequests();
    }, []);

    const loadOwnerRequests = async () => {
        try {
            setLoading(true);
            const data = await api.bookings.getOwnerRequests();
            if (data) {
                setApiRequests(data);
            }
        } catch (error) {
            console.log('Error loading owner booking requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const mappedRequests = apiRequests.map(r => {
        let realImageUrl = r.imageUrl;
        if (realImageUrl && typeof realImageUrl === 'string' && realImageUrl.startsWith('/')) {
            const baseUrl = api.getBaseUrl ? api.getBaseUrl() : 'http://192.168.1.100:8080';
            realImageUrl = `${baseUrl}${realImageUrl}`;
        }

        let realSeekerAvatar = r.seekerAvatarUrl;
        if (realSeekerAvatar && typeof realSeekerAvatar === 'string' && realSeekerAvatar.startsWith('/')) {
            const baseUrl = api.getBaseUrl ? api.getBaseUrl() : 'http://192.168.1.100:8080';
            realSeekerAvatar = `${baseUrl}${realSeekerAvatar}`;
        }

        const roomDisplay = r.roomName
            ? `${r.roomName} (${r.roomType || 'Room'})`
            : (r.roomType ? `${r.roomType} Room` : (r.bookingType === 'ANNEX' ? 'Entire Annex' : 'Whole Property'));

        return {
            id: r.id.toString(),
            propertyId: r.propertyId || (r.property ? r.property.id : null),
            tenantName: r.seekerName || 'Tenant Applicant',
            tenantPhone: r.seekerPhone || '',
            avatar: realSeekerAvatar || null,
            propertyTitle: r.propertyTitle || 'Boarding Property',
            roomType: roomDisplay,
            occupantsCount: r.occupantsCount || 1,
            remainingSpaces: r.remainingSpaces !== undefined && r.remainingSpaces !== null ? r.remainingSpaces : 1,
            moveInDate: r.moveInDate ? new Date(r.moveInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible',
            monthlyPrice: r.monthlyPrice || 0,
            status: r.status,
            dateRequested: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
            imageUrl: realImageUrl || null,
            notes: r.notes || null
        };
    });

    const displayRequests = mappedRequests;

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

    const handleAccept = async (item) => {
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

        Alert.alert(
            'Confirm Approval 🟢',
            `Are you sure you want to approve this booking request for ${item.tenantName} (${requestedOccupants} occupant space(s))?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve Request',
                    style: 'default',
                    onPress: async () => {
                        try {
                            await api.bookings.updateStatus(item.id, 'APPROVED');
                            Alert.alert('Request Approved 🎉', `Approved request for ${item.tenantName}!`);
                            loadOwnerRequests();
                            if (onApproveRequest) onApproveRequest(item.id);
                        } catch (error) {
                            console.log('Error approving request:', error);
                            Alert.alert('Approval Failed', error.message || 'Could not approve request.');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (id) => {
        Alert.alert(
            'Confirm Rejection 🔴',
            'Are you sure you want to decline this booking request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline Request',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.bookings.updateStatus(id, 'REJECTED');
                            Alert.alert('Request Declined', 'Booking request was declined.');
                            loadOwnerRequests();
                            if (onRejectRequest) onRejectRequest(id);
                        } catch (error) {
                            console.log('Error declining request:', error);
                            Alert.alert('Action Failed', error.message || 'Could not decline request.');
                        }
                    }
                }
            ]
        );
    };

    const handleRemoveOccupant = async (id, seekerName) => {
        Alert.alert(
            'Remove Occupant 🔴',
            `Are you sure you want to remove ${seekerName || 'this occupant'} from the property booking? This will restore property availability.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove Occupant',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.bookings.updateStatus(id, 'REMOVED');
                            Alert.alert('Occupant Removed', 'The occupant was removed and availability restored.');
                            loadOwnerRequests();
                        } catch (error) {
                            console.log('Error removing occupant:', error);
                            Alert.alert('Action Failed', error.message || 'Could not remove occupant.');
                        }
                    }
                }
            ]
        );
    };

    // Filter & Sort by highest number of requested occupants first (descending)
    const filteredRequests = displayRequests
        .filter(r => {
            if (filterCategory === 'PENDING') return r.status === 'PENDING';
            if (filterCategory === 'APPROVED') return r.status === 'APPROVED';
            if (filterCategory === 'REJECTED') return r.status === 'REJECTED';
            if (filterCategory === 'REMOVED') return r.status === 'REMOVED';
            return true;
        })
        .sort((a, b) => (b.occupantsCount || 1) - (a.occupantsCount || 1));

    return (
        <View style={styles.container}>
            {/* Standardized HeaderBar */}
            <HeaderBar
                title="BoardingHub"
                userAvatar={currentUser?.avatarUrl}
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
                {['PENDING', 'APPROVED', 'REJECTED', 'REMOVED'].map((cat) => (
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
                                {item.avatar ? (
                                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarInitialCircle}>
                                        <Text style={styles.avatarInitialText}>
                                            {(item.tenantName || 'T').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
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

                            {item.notes ? (
                                <View style={styles.notesBox}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                                    <Text style={styles.notesText}>"{item.notes}"</Text>
                                </View>
                            ) : null}

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
                            ) : item.status === 'APPROVED' ? (
                                <View style={styles.actionsRow}>
                                    <TouchableOpacity
                                        style={[styles.declineBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                                        onPress={() => handleRemoveOccupant(item.id, item.tenantName)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="trash-outline" size={15} color="#DC2626" style={{ marginRight: 6 }} />
                                        <Text style={[styles.declineText, { color: '#DC2626', fontWeight: '800' }]}>Remove Occupant</Text>
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
        </View>
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
    avatarInitialCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#A3D0C3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarInitialText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#133E32',
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
    statusApproved: { backgroundColor: '#DCFCE7' },
    statusRejected: { backgroundColor: '#FEE2E2' },
    statusText: { fontSize: 11, fontWeight: '900' },
    statusTextPending: { color: '#B45309' },
    statusTextApproved: { color: '#15803D' },
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

    /* Seeker Notes Box */
    notesBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 12,
    },
    notesText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#475569',
        flex: 1,
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
