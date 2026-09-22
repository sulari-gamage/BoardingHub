import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../components/HeaderBar';
import api from '../../services/api';

export default function OwnerHomeScreen({
    onNavigateTab,
    onOpenNotifications,
    onViewAllRequests,
    onReviewRequest,
    onViewPropertyDetails,
    activeTab = 'Dashboard',
    currentUser
}) {
    const [properties, setProperties] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'Dashboard' || activeTab === 'Home' || activeTab === 'HOME' || !activeTab) {
            loadOwnerDashboardData();
        }
    }, [activeTab]);

    const loadOwnerDashboardData = async () => {
        try {
            setLoading(true);
            const [propsData, reqsData] = await Promise.all([
                api.properties.getMyProperties().catch(() => []),
                api.bookings.getOwnerRequests().catch(() => [])
            ]);
            if (propsData) setProperties(propsData);
            if (reqsData) setRequests(reqsData);
        } catch (error) {
            console.log('Error loading owner dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const ownerName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Owner';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return `Good morning, ${ownerName}! `;
        if (hour >= 12 && hour < 17) return `Good afternoon, ${ownerName}! `;
        if (hour >= 17 && hour < 22) return `Good evening, ${ownerName}! `;
        return `Good night, ${ownerName}! `;
    };

    const totalProperties = properties.length;
    const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;

    // Accurately calculate available vacancies across rooms or whole property/annex listings
    const availableSpaces = properties.reduce((acc, p) => {
        if (p.rooms && p.rooms.length > 0) {
            return acc + p.rooms.reduce((rAcc, r) => rAcc + Math.max(0, r.remainingSpaces !== undefined && r.remainingSpaces !== null ? r.remainingSpaces : ((r.totalSpaces || r.capacity || 1) - (r.occupied || 0))), 0);
        }
        const totalCap = p.totalCapacity || p.capacity || 0;
        const occupied = p.totalOccupied || 0;
        return acc + Math.max(0, totalCap - occupied);
    }, 0);

    // Accurately calculate live approved occupants from booking requests AND property room occupancy data
    const approvedBookingsOccupants = requests
        .filter(r => r.status === 'APPROVED')
        .reduce((sum, r) => sum + (r.occupantsCount || 1), 0);

    const propertyOccupants = properties.reduce((acc, p) => {
        if (p.rooms && p.rooms.length > 0) {
            return acc + p.rooms.reduce((rAcc, r) => {
                const cap = r.totalCapacity || r.totalSpaces || r.capacity || 0;
                const rem = r.remainingSpaces !== undefined && r.remainingSpaces !== null ? r.remainingSpaces : cap;
                const occ = r.occupied !== undefined && r.occupied !== null ? r.occupied : Math.max(0, cap - rem);
                return rAcc + occ;
            }, 0);
        }
        const cap = p.totalCapacity || p.capacity || 0;
        const occ = p.totalOccupied !== undefined && p.totalOccupied !== null ? p.totalOccupied : Math.max(0, cap - (p.availableSpaces !== undefined ? p.availableSpaces : cap));
        return acc + Math.max(0, occ);
    }, 0);

    const totalOccupants = Math.max(approvedBookingsOccupants, propertyOccupants);

    const recentRequests = requests.slice(0, 3);

    return (
        <View style={styles.container}>
            {/* Standard Dark Emerald Header Bar with Logo */}
            <HeaderBar
                title="BoardingHub"
                userAvatar={currentUser?.avatarUrl}
                onOpenNotifications={onOpenNotifications}
                onOpenProfile={() => onNavigateTab && onNavigateTab('Profile')}
            />

            {/* Main Scroll Content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Greeting Section */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingTitle}>{getGreeting()}</Text>
                    <Text style={styles.greetingSubtitle}>
                        Here's an overview of your property operations today.
                    </Text>
                </View>

                {/* 2x2 Metric Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Stat Card 1: Properties */}
                    <View style={styles.statCard}>
                        <View style={styles.iconCircleLight}>
                            <Ionicons name="home-outline" size={22} color="#133E32" />
                        </View>
                        <Text style={styles.statLabel}>PROPERTIES</Text>
                        <Text style={styles.statValue}>{totalProperties}</Text>
                    </View>

                    {/* Stat Card 2: Pending Requests */}
                    <View style={styles.statCard}>
                        <View style={styles.iconCircleLight}>
                            <Ionicons name="clipboard-outline" size={22} color="#133E32" />
                        </View>
                        <Text style={styles.statLabel}>PENDING REQS</Text>
                        <Text style={styles.statValue}>{pendingRequestsCount}</Text>
                    </View>

                    {/* Stat Card 3: Available Spaces */}
                    <View style={styles.statCard}>
                        <View style={styles.iconCircleLight}>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#133E32" />
                        </View>
                        <Text style={styles.statLabel}>AVAILABLE SPACES</Text>
                        <Text style={styles.statValue}>{availableSpaces}</Text>
                    </View>

                    {/* Stat Card 4: Occupants */}
                    <View style={styles.statCard}>
                        <View style={styles.iconCircleLight}>
                            <Ionicons name="people-outline" size={22} color="#133E32" />
                        </View>
                        <Text style={styles.statLabel}>OCCUPANTS</Text>
                        <Text style={styles.statValue}>{totalOccupants}</Text>
                    </View>
                </View>

                {/* Recent Requests Section Card */}
                <View style={styles.requestsSectionCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Requests</Text>
                        <TouchableOpacity onPress={onViewAllRequests} activeOpacity={0.8} style={styles.viewAllBtn}>
                            <Text style={styles.viewAllText}>View All</Text>
                            <Ionicons name="arrow-forward" size={14} color="#133E32" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    {loading ? (
                        <ActivityIndicator color="#133E32" style={{ marginVertical: 20 }} />
                    ) : recentRequests.length > 0 ? (
                        recentRequests.map((req, idx) => {
                            const name = req.seekerName || 'Applicant';
                            const initial = name.charAt(0).toUpperCase();

                            let seekerAvatar = req.seekerAvatarUrl || req.avatar;
                            if (seekerAvatar && typeof seekerAvatar === 'string' && seekerAvatar.startsWith('/')) {
                                const baseUrl = api.getBaseUrl ? api.getBaseUrl() : 'http://192.168.1.100:8080';
                                seekerAvatar = `${baseUrl}${seekerAvatar}`;
                            }

                            return (
                                <React.Fragment key={req.id || idx}>
                                    <View style={styles.requestItemRow}>
                                        {seekerAvatar ? (
                                            <Image source={{ uri: seekerAvatar }} style={styles.avatarCircle} />
                                        ) : (
                                            <View style={styles.avatarCircle}>
                                                <Text style={styles.avatarInitial}>{initial}</Text>
                                            </View>
                                        )}

                                        <View style={styles.requestMainInfo}>
                                            <Text style={styles.tenantName}>{name}</Text>
                                            <View style={styles.roomTypeRow}>
                                                <Ionicons name="business-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                                <Text style={styles.roomTypeText}>{req.propertyTitle || 'Property'}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.requestActionsRow}>
                                        <View
                                            style={
                                                req.status === 'APPROVED'
                                                    ? styles.approvedBadge
                                                    : req.status === 'REJECTED'
                                                        ? styles.rejectedBadge
                                                        : styles.pendingBadge
                                            }
                                        >
                                            <View
                                                style={
                                                    req.status === 'APPROVED'
                                                        ? styles.greenDot
                                                        : req.status === 'REJECTED'
                                                            ? styles.redDot
                                                            : styles.yellowDot
                                                }
                                            />
                                            <Text
                                                style={
                                                    req.status === 'APPROVED'
                                                        ? styles.approvedBadgeText
                                                        : req.status === 'REJECTED'
                                                            ? styles.rejectedBadgeText
                                                            : styles.pendingBadgeText
                                                }
                                            >
                                                {req.status}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.reviewReqBtn}
                                            onPress={() => onReviewRequest && onReviewRequest(req)}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={styles.reviewReqBtnText}>Review Request</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {idx < recentRequests.length - 1 && <View style={styles.itemSeparator} />}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <View style={{ paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                                <Ionicons name="clipboard-outline" size={24} color="#133E32" />
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>No booking requests received yet.</Text>
                            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>New requests submitted by seekers will be displayed here.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Owner 4-Tab Bottom Navigation Bar */}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    /* Main Scroll Content */
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Greeting Section */
    greetingSection: {
        marginBottom: 20,
    },
    greetingTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#133E32',
        marginBottom: 6,
    },
    greetingSubtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },

    /* 2x2 Stats Grid */
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 14,
        marginBottom: 24,
    },
    statCard: {
        width: '47.5%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#B5D8CD',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    iconCircleLight: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#133E32',
    },

    /* Earnings Dark Card */
    earningsCard: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    iconCircleDark: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    statLabelLight: {
        fontSize: 11,
        fontWeight: '800',
        color: '#A3E635',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    statValueLight: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    watermarkBgIcon: {
        position: 'absolute',
        right: -10,
        bottom: -15,
    },

    /* Recent Requests Card */
    requestsSectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#133E32',
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#133E32',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },

    /* Request Item */
    requestItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '800',
        color: '#133E32',
    },
    requestMainInfo: {
        flex: 1,
    },
    tenantName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    roomTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roomTypeText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },

    /* Request Actions & Status Row */
    requestActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 60,
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    yellowDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D97706',
        marginRight: 6,
    },
    pendingBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#B45309',
    },
    approvedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    greenDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#16A34A',
        marginRight: 6,
    },
    approvedBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#15803D',
    },
    rejectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    redDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#DC2626',
        marginRight: 6,
    },
    rejectedBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#B91C1C',
    },
    reviewReqBtn: {
        backgroundColor: '#133E32',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    reviewReqBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFD700',
    },

    itemSeparator: {
        height: 1,
        backgroundColor: '#F8FAFC',
        marginVertical: 16,
    },

    reviewedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    greyDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#94A3B8',
        marginRight: 6,
    },
    reviewedBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    viewDetailsBtn: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    viewDetailsBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#334155',
    },

    /* Bottom Nav Bar */
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
