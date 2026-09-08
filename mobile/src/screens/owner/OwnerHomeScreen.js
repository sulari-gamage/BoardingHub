import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
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
        loadOwnerDashboardData();
    }, []);

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
    const totalProperties = properties.length;
    const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;
    const availableSpaces = properties.reduce((acc, p) => {
        return acc + (p.rooms ? p.rooms.reduce((rAcc, r) => rAcc + Math.max(0, r.remainingSpaces || 0), 0) : 0);
    }, 0);
    const totalOccupants = properties.reduce((acc, p) => {
        return acc + (p.rooms ? p.rooms.reduce((rAcc, r) => {
            const total = r.totalSpaces || r.capacity || 0;
            const remaining = r.remainingSpaces || 0;
            return rAcc + Math.max(0, total - remaining);
        }, 0) : 0);
    }, 0);

    const recentRequests = requests.slice(0, 3);

    return (
        <SafeAreaView style={styles.container}>
            {/* Standard Dark Emerald Header Bar with Logo */}
            <HeaderBar
                title="BoardingHub"
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
                    <Text style={styles.greetingTitle}>Good Day, {ownerName} 👋</Text>
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

                    {/* Stat Card 2: Requests */}
                    <View style={styles.statCard}>
                        <View style={styles.iconCircleLight}>
                            <Ionicons name="clipboard-outline" size={22} color="#133E32" />
                        </View>
                        <Text style={styles.statLabel}>PENDING REQS</Text>
                        <Text style={styles.statValue}>{pendingRequestsCount}</Text>
                    </View>

                    {/* Stat Card 3: Available */}
                    <View style={styles.statCard}>
                        <View style={styles.iconCircleLight}>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#133E32" />
                        </View>
                        <Text style={styles.statLabel}>AVAILABLE</Text>
                        <Text style={styles.statValue}>{availableSpaces}</Text>
                    </View>

                    {/* Stat Card 4: Occupants */}
                    <View style={[styles.statCard, styles.earningsCard]}>
                        <View style={styles.iconCircleDark}>
                            <Ionicons name="people-outline" size={22} color="#FFD700" />
                        </View>
                        <Text style={styles.statLabelLight}>OCCUPANTS</Text>
                        <Text style={styles.statValueLight}>{totalOccupants}</Text>
                        <View style={styles.watermarkBgIcon}>
                            <Ionicons name="people-outline" size={70} color="rgba(255, 255, 255, 0.07)" />
                        </View>
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
                            return (
                                <React.Fragment key={req.id || idx}>
                                    <View style={styles.requestItemRow}>
                                        <View style={styles.avatarCircle}>
                                            <Text style={styles.avatarInitial}>{initial}</Text>
                                        </View>

                                        <View style={styles.requestMainInfo}>
                                            <Text style={styles.tenantName}>{name}</Text>
                                            <View style={styles.roomTypeRow}>
                                                <Ionicons name="business-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                                <Text style={styles.roomTypeText}>{req.propertyTitle || 'Property'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.requestActionsRow}>
                                        <View style={req.status === 'PENDING' ? styles.pendingBadge : styles.reviewedBadge}>
                                            <View style={req.status === 'PENDING' ? styles.yellowDot : styles.greyDot} />
                                            <Text style={req.status === 'PENDING' ? styles.pendingBadgeText : styles.reviewedBadgeText}>
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
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 13, color: '#64748B' }}>No booking requests received yet.</Text>
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
        </SafeAreaView>
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
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
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
    reviewReqBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#133E32',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    reviewReqBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#133E32',
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
