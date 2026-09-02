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
import AdminHeader from '../../components/AdminHeader';

export default function AdminUserDetailScreen({ user, onBack }) {
    const currentUser = user || {
        id: '#USR-8492-BX',
        name: 'Eleanor Vance',
        email: 'eleanor.vance@example.com',
        role: 'Property Manager',
        location: 'Seattle, WA',
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        joined: 'Oct 12, 2022',
        lastLogin: '2 hours ago',
        phone: '+1 (555) 019-8372',
        bookingsMade: 142,
        bookingsReceived: 856,
        propertiesOwned: 3,
        activities: [
            {
                title: 'Updated Listing: "Downtown Executive Suite"',
                desc: 'Modified pricing structure and added 3 new photos.',
                time: '2 hrs ago',
                icon: 'create-outline',
            },
            {
                title: 'Approved Booking Request',
                desc: 'Booking ID #BK-9921 for "Lakeside Cabin".',
                time: 'Yesterday',
                icon: 'checkmark-circle-outline',
            },
            {
                title: 'Responded to Inquiry',
                desc: 'Message sent to user Marcus Thome.',
                time: 'Oct 24',
                icon: 'chatbubble-outline',
            }
        ]
    };

    return (
        <SafeAreaView style={styles.container}>
            <AdminHeader title="BoardingHub Admin" showProfileAvatar />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Sub Header Navigation */}
                <TouchableOpacity style={styles.backLink} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={16} color="#475569" style={{ marginRight: 4 }} />
                    <Text style={styles.backLinkText}>Back to Users</Text>
                </TouchableOpacity>

                <View style={styles.pageHeaderRow}>
                    <Text style={styles.pageTitle}>User Details</Text>
                    <View style={styles.headerBadges}>
                        <View style={styles.statusActiveBadge}>
                            <Ionicons name="checkmark-circle-outline" size={12} color="#133E32" style={{ marginRight: 4 }} />
                            <Text style={styles.statusActiveText}>{currentUser.status || 'Active'}</Text>
                        </View>
                        <Text style={styles.userIdText}>ID: {currentUser.id || '#USR-8492-BX'}</Text>
                    </View>
                </View>

                {/* 1. Main User Profile Box */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
                        <View style={styles.verifiedIconBox}>
                            <Ionicons name="shield-checkmark" size={12} color="#133E32" />
                        </View>
                    </View>

                    <Text style={styles.userName}>{currentUser.name}</Text>
                    <Text style={styles.userEmail}>{currentUser.email}</Text>

                    {/* Role & Location Badges */}
                    <View style={styles.tagsRow}>
                        <View style={styles.roleTag}>
                            <Text style={styles.roleTagText}>{currentUser.role || 'Property Manager'}</Text>
                        </View>

                        <View style={styles.locationTag}>
                            <Ionicons name="location-outline" size={12} color="#475569" style={{ marginRight: 4 }} />
                            <Text style={styles.locationTagText}>{currentUser.location || 'Seattle, WA'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Info Rows */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Joined</Text>
                            <Text style={styles.infoValue}>{currentUser.joined || 'Oct 12, 2022'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Last Login</Text>
                            <Text style={styles.infoValue}>{currentUser.lastLogin || '2 hours ago'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>{currentUser.phone || '+1 (555) 019-8372'}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Account Actions */}
                <View style={styles.sectionCard}>
                    <Text style={styles.cardHeaderTitle}>Account Actions</Text>

                    <TouchableOpacity
                        style={styles.actionBtnOutline}
                        onPress={() => Alert.alert('Reset Password', `Password reset email sent to ${currentUser.email}.`)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="refresh-outline" size={16} color="#0F172A" style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnOutlineText}>Reset Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnGrey}
                        onPress={() => Alert.alert('Audit Logs', 'Fetching account audit history...')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="document-text-outline" size={16} color="#475569" style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnGreyText}>View Audit Logs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtnRed}
                        onPress={() => Alert.alert('Suspend Account', `Are you sure you want to suspend ${currentUser.name}?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Suspend', style: 'destructive' }
                        ])}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="ban-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.actionBtnRedText}>Suspend Account</Text>
                    </TouchableOpacity>
                </View>

                {/* 3. Metric Stats Stack */}
                <View style={styles.statCard}>
                    <View style={styles.statIconBox}>
                        <Ionicons name="calendar-outline" size={20} color="#133E32" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel}>BOOKINGS MADE</Text>
                        <Text style={styles.statValue}>{currentUser.bookingsMade || 142}</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statIconBox}>
                        <Ionicons name="folder-outline" size={20} color="#133E32" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel}>BOOKINGS RECEIVED</Text>
                        <Text style={styles.statValue}>{currentUser.bookingsReceived || 856}</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statIconBox}>
                        <Ionicons name="business-outline" size={20} color="#133E32" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel}>PROPERTIES OWNED</Text>
                        <Text style={styles.statValue}>{currentUser.propertiesOwned || 3}</Text>
                    </View>
                </View>

                {/* 4. Recent Property Activity */}
                <View style={styles.sectionCard}>
                    <View style={styles.activityHeader}>
                        <Text style={styles.cardHeaderTitle}>Recent Property Activity</Text>
                        <TouchableOpacity activeOpacity={0.8}>
                            <Text style={styles.viewAllText}>View All {'->'}</Text>
                        </TouchableOpacity>
                    </View>

                    {currentUser.activities.map((act, idx, arr) => (
                        <View key={idx} style={[styles.activityRow, idx === arr.length - 1 && styles.activityRowLast]}>
                            <View style={styles.activityIconBox}>
                                <Ionicons name={act.icon} size={16} color="#133E32" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.actTitleRow}>
                                    <Text style={styles.actTitle}>{act.title}</Text>
                                    <Text style={styles.actTime}>{act.time}</Text>
                                </View>
                                <Text style={styles.actDesc}>{act.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
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
        paddingTop: 14,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },

    pageHeaderRow: {
        marginBottom: 16,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#133E32',
        marginBottom: 6,
    },
    headerBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusActiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    statusActiveText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#133E32',
    },
    userIdText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },

    /* Profile Box */
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 22,
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
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
    },
    verifiedIconBox: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#C3DCD4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 14,
    },

    tagsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    roleTag: {
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    roleTagText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#133E32',
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    locationTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },

    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 14,
    },

    infoGrid: {
        width: '100%',
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    infoValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },

    /* Account Actions */
    sectionCard: {
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
    cardHeaderTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 14,
    },
    actionBtnOutline: {
        flexDirection: 'row',
        height: 44,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionBtnOutlineText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
    },
    actionBtnGrey: {
        flexDirection: 'row',
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionBtnGreyText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#475569',
    },
    actionBtnRed: {
        flexDirection: 'row',
        height: 44,
        borderRadius: 12,
        backgroundColor: '#B91C1C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnRedText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    /* Stat Cards */
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
    },
    statIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
    },

    /* Activity List */
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    activityRowLast: {
        borderBottomWidth: 0,
    },
    activityIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    actTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    actTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        flex: 1,
        marginRight: 8,
    },
    actTime: {
        fontSize: 11,
        color: '#94A3B8',
    },
    actDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 16,
    },
});
