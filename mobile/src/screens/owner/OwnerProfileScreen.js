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
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../components/HeaderBar';

export default function OwnerProfileScreen({
    onNavigateTab,
    onSwitchToSeeker,
    onLogout,
    onOpenNotifications,
    activeTab = 'Profile'
}) {
    return (
        <SafeAreaView style={styles.container}>
            {/* Standardized HeaderBar */}
            <HeaderBar
                title="BoardingHub"
                onOpenNotifications={onOpenNotifications}
                onOpenProfile={() => onNavigateTab && onNavigateTab('Profile')}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* 1. Main Profile Card */}
                <View style={styles.profileCard}>
                    {/* Avatar with Verified Badge Overlay */}
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80' }}
                            style={styles.avatar}
                        />
                        <View style={styles.verifiedBadgeCircle}>
                            <Ionicons name="shield-checkmark" size={14} color="#133E32" />
                        </View>
                    </View>

                    {/* Name & Join Date */}
                    <Text style={styles.userName}>Sunethra Silva</Text>
                    <Text style={styles.joinDate}>Joined October 2021</Text>

                    {/* Property & Verification Badges */}
                    <View style={styles.badgeRow}>
                        <View style={styles.propertyTag}>
                            <Ionicons name="business-outline" size={14} color="#133E32" style={{ marginRight: 6 }} />
                            <Text style={styles.propertyTagText}>3 Properties</Text>
                        </View>

                        <View style={styles.verifiedTag}>
                            <Ionicons name="trophy-outline" size={14} color="#B45309" style={{ marginRight: 6 }} />
                            <Text style={styles.verifiedTagText}>Verified Owner</Text>
                        </View>
                    </View>

                    {/* Edit Profile Button */}
                    <TouchableOpacity
                        style={styles.editProfileBtn}
                        onPress={() => Alert.alert('Edit Profile', 'Opening profile settings...')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* 2. Metrics Card (YTD Earnings & Avg Rating) */}
                <View style={styles.metricsCard}>
                    <View style={styles.metricColumn}>
                        <Ionicons name="wallet-outline" size={20} color="#133E32" style={{ marginBottom: 6 }} />
                        <Text style={styles.metricLabel}>YTD Earnings</Text>
                        <Text style={styles.metricValue}>Rs. 1,245,000</Text>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricColumn}>
                        <Ionicons name="star-outline" size={20} color="#133E32" style={{ marginBottom: 6 }} />
                        <Text style={styles.metricLabel}>Avg Rating</Text>
                        <Text style={styles.metricValue}>4.9 / 5</Text>
                    </View>
                </View>

                {/* 3. Settings Menu List Card */}
                <View style={styles.menuCard}>
                    {[
                        {
                            title: 'Personal Details',
                            subtitle: 'Update your name, contact info, and address',
                            icon: 'person-outline',
                            action: () => Alert.alert('Personal Details', 'Manage personal information.')
                        },
                        {
                            title: 'Bank Information',
                            subtitle: 'Manage payouts and earning accounts',
                            icon: 'business-outline',
                            action: () => Alert.alert('Bank Information', 'Manage payout accounts.')
                        },
                        {
                            title: 'Notification Preferences',
                            subtitle: 'Control alerts for bookings and requests',
                            icon: 'notifications-outline',
                            action: () => Alert.alert('Notifications', 'Notification preferences.')
                        },
                        {
                            title: 'Security Settings',
                            subtitle: 'Password, 2FA, and active sessions',
                            icon: 'shield-outline',
                            action: () => Alert.alert('Security', 'Security settings.')
                        },
                    ].map((item, idx, arr) => (
                        <TouchableOpacity
                            key={item.title}
                            style={[styles.menuRow, idx === arr.length - 1 && styles.menuRowLast]}
                            onPress={item.action}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconBox}>
                                <Ionicons name={item.icon} size={20} color="#475569" />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>

                            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Switch View Banner */}
                {onSwitchToSeeker && (
                    <TouchableOpacity
                        style={styles.switchBanner}
                        onPress={onSwitchToSeeker}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="swap-horizontal" size={18} color="#133E32" style={{ marginRight: 8 }} />
                        <Text style={styles.switchBannerText}>Switch to Seeker View</Text>
                    </TouchableOpacity>
                )}

                {/* 4. Red Outlined Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
                    <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Nav Bar */}
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
        paddingTop: 18,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Profile Header Card */
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
    },
    verifiedBadgeCircle: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },

    userName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 2,
    },
    joinDate: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 14,
    },

    badgeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18,
    },
    propertyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    propertyTagText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
    },
    verifiedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    verifiedTagText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#B45309',
    },

    editProfileBtn: {
        width: '100%',
        height: 46,
        borderRadius: 12,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    editProfileBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    /* Metrics Card */
    metricsCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    metricColumn: {
        flex: 1,
        alignItems: 'flex-start',
        paddingHorizontal: 8,
    },
    metricLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#133E32',
    },
    metricDivider: {
        width: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 4,
    },

    /* Menu List Card */
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuRowLast: {
        borderBottomWidth: 0,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },

    /* Switch Banner */
    switchBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F0EC',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#C3DCD4',
        marginBottom: 16,
    },
    switchBannerText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#133E32',
    },

    /* Logout Button */
    logoutBtn: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#FCA5A5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#DC2626',
    },

    /* Bottom Nav Bar */
    bottomNav: {
        flexDirection: 'row',
        height: 64,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 12,
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
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    navLabelActive: {
        color: '#133E32',
        fontWeight: '900',
    },
});
