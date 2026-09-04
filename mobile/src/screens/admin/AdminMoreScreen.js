import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    Alert,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../components/AdminHeader';

export default function AdminMoreScreen({
    onNavigateTab,
    onNavigateScreen,
    onOpenNotifications,
    onLogout,
    activeTab = 'More'
}) {
    const adminTools = [
        {
            id: 'bookings',
            title: 'Booking Monitoring',
            desc: 'Monitor all guest reservations, statuses, and payment states',
            icon: 'calendar-outline',
            badge: '39',
            screen: 'ADMIN_BOOKING_MONITORING',
            color: '#133E32',
        },
        {
            id: 'analytics',
            title: 'Platform Analytics',
            desc: 'View user growth, listing metrics, and revenue charts',
            icon: 'stats-chart-outline',
            badge: '40',
            screen: 'ADMIN_ANALYTICS',
            color: '#133E32',
        },
        {
            id: 'pending',
            title: 'Pending Properties',
            desc: 'Verify and approve owner property listings',
            icon: 'home-outline',
            badge: '35',
            screen: 'ADMIN_PENDING_PROPERTIES',
            color: '#133E32',
        },
        {
            id: 'users',
            title: 'User Management',
            desc: 'Manage Seekers, Owners, roles, and account access',
            icon: 'people-outline',
            badge: '37',
            screen: 'ADMIN_USER_MANAGEMENT',
            color: '#133E32',
        }
    ];

    const systemTools = [
        {
            id: 'audit',
            title: 'System Audit Logs',
            desc: 'View detailed security & administrative logs',
            icon: 'document-text-outline',
            action: () => Alert.alert('System Audit Logs', 'Fetching latest system event logs...'),
        },
        {
            id: 'settings',
            title: 'Platform Configuration',
            desc: 'Commission rates, verification parameters & rules',
            icon: 'settings-outline',
            action: () => Alert.alert('Platform Settings', 'BoardingHub v2.4.0 System Config.'),
        },
    ];

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
                    <Text style={styles.pageTitle}>Admin Tools & Settings</Text>
                    <Text style={styles.pageSubtitle}>Extended management options & system operations.</Text>
                </View>

                {/* Admin Profile Summary Card */}
                <View style={styles.profileCard}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' }}
                        style={styles.avatar}
                    />
                    <View style={{ flex: 1 }}>
                        <View style={styles.adminBadgeRow}>
                            <Text style={styles.adminName}>Super Administrator</Text>
                            <View style={styles.activeTag}>
                                <Text style={styles.activeTagText}>ACTIVE</Text>
                            </View>
                        </View>
                        <Text style={styles.adminEmail}>admin.control@boardinghub.lk</Text>
                        <Text style={styles.adminRole}>System & Content Moderation</Text>
                    </View>
                </View>

                {/* Management Features Grid */}
                <Text style={styles.sectionHeader}>CORE MANAGEMENT</Text>
                <View style={styles.toolsStack}>
                    {adminTools.map((tool) => (
                        <TouchableOpacity
                            key={tool.id}
                            style={styles.toolCard}
                            onPress={() => onNavigateScreen && onNavigateScreen(tool.screen)}
                            activeOpacity={0.85}
                        >
                            <View style={styles.toolIconBox}>
                                <Ionicons name={tool.icon} size={22} color="#133E32" />
                            </View>

                            <View style={{ flex: 1 }}>
                                <View style={styles.toolTitleRow}>
                                    <Text style={styles.toolTitle}>{tool.title}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                                </View>
                                <Text style={styles.toolDesc}>{tool.desc}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* System Settings Section */}
                <Text style={styles.sectionHeader}>SYSTEM & SECURITY</Text>
                <View style={styles.toolsStack}>
                    {systemTools.map((tool) => (
                        <TouchableOpacity
                            key={tool.id}
                            style={styles.toolCard}
                            onPress={tool.action}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.toolIconBox, { backgroundColor: '#F1F5F9' }]}>
                                <Ionicons name={tool.icon} size={20} color="#475569" />
                            </View>

                            <View style={{ flex: 1 }}>
                                <View style={styles.toolTitleRow}>
                                    <Text style={styles.toolTitle}>{tool.title}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                                </View>
                                <Text style={styles.toolDesc}>{tool.desc}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => {
                        Alert.alert('Sign Out', 'Are you sure you want to sign out of Admin Portal?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Sign Out', style: 'destructive', onPress: () => onLogout && onLogout() }
                        ]);
                    }}
                    activeOpacity={0.85}
                >
                    <Ionicons name="log-out-outline" size={18} color="#991B1B" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Sign Out of Admin Portal</Text>
                </TouchableOpacity>
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

    /* Profile Card */
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        marginRight: 14,
    },
    adminBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    adminName: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    activeTag: {
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    activeTagText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#133E32',
    },
    adminEmail: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 2,
    },
    adminRole: {
        fontSize: 11,
        fontWeight: '700',
        color: '#133E32',
    },

    sectionHeader: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    toolsStack: {
        gap: 12,
        marginBottom: 22,
    },
    toolCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    toolIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    toolTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    toolTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    toolDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 16,
    },

    logoutBtn: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 16,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#991B1B',
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
