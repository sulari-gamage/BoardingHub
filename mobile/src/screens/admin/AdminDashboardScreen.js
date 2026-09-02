import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../components/AdminHeader';

export default function AdminDashboardScreen({
    onNavigateTab,
    onOpenPendingReview,
    activeTab = 'Dashboard'
}) {
    const metrics = [
        {
            id: 'users',
            label: 'Total Users',
            value: '1,250',
            trend: '+12%',
            icon: 'people-outline',
            isPositive: true,
        },
        {
            id: 'listings',
            label: 'Active Listings',
            value: '340',
            trend: '+5%',
            icon: 'list-outline',
            isPositive: true,
        },
        {
            id: 'bookings',
            label: 'Total Bookings',
            value: '780',
            trend: '+18%',
            icon: 'calendar-outline',
            isPositive: true,
        },
        {
            id: 'pending',
            label: 'Pending Approvals',
            value: '8 Properties',
            badge: 'Requires Attention',
            icon: 'briefcase-outline',
            isAlert: true,
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <AdminHeader title="BoardingHub Admin" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.pageTitle}>Admin Dashboard</Text>
                    <Text style={styles.pageSubtitle}>Overview of platform metrics and recent activity.</Text>
                </View>

                {/* Metric Cards Stack */}
                {metrics.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.metricCard, item.isAlert && styles.metricCardAlert]}
                        onPress={() => item.isAlert && onOpenPendingReview && onOpenPendingReview()}
                        activeOpacity={item.isAlert ? 0.85 : 1}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, item.isAlert && styles.iconBoxAlert]}>
                                <Ionicons
                                    name={item.icon}
                                    size={20}
                                    color={item.isAlert ? '#991B1B' : '#133E32'}
                                />
                            </View>

                            {item.trend ? (
                                <View style={styles.trendBadge}>
                                    <Ionicons name="trending-up-outline" size={14} color="#133E32" style={{ marginRight: 4 }} />
                                    <Text style={styles.trendText}>{item.trend}</Text>
                                </View>
                            ) : item.badge ? (
                                <View style={styles.alertBadge}>
                                    <Text style={styles.alertBadgeText}>{item.badge}</Text>
                                </View>
                            ) : null}
                        </View>

                        <Text style={styles.metricLabel}>{item.label}</Text>
                        <Text style={[styles.metricValue, item.isAlert && styles.metricValueAlert]}>
                            {item.value}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Bottom 5-Tab Admin Navigation */}
            <View style={styles.bottomNav}>
                {[
                    { id: 'Dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
                    { id: 'Listings', label: 'Listings', icon: 'list-outline', activeIcon: 'list' },
                    { id: 'Users', label: 'Users', icon: 'people-outline', activeIcon: 'people' },
                    { id: 'Bookings', label: 'Bookings', icon: 'calendar-outline', activeIcon: 'calendar' },
                    { id: 'Analytics', label: 'Analytics', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
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
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },

    /* Metric Cards */
    metricCard: {
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    metricCardAlert: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBoxAlert: {
        backgroundColor: '#FEE2E2',
    },

    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
    },

    alertBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
    },
    alertBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#991B1B',
    },

    metricLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
    },
    metricValueAlert: {
        fontSize: 24,
        color: '#991B1B',
    },

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
