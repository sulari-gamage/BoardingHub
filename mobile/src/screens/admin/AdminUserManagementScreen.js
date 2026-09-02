import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    TextInput,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../components/AdminHeader';

export default function AdminUserManagementScreen({
    onNavigateTab,
    onSelectUser,
    activeTab = 'Users'
}) {
    const [searchQuery, setSearchQuery] = useState('');

    const users = [
        {
            id: 'usr_1',
            name: 'Jonathan Doe',
            email: 'jonathan.d@example.com',
            role: 'Seeker',
            initials: 'JD',
            avatar: null,
            status: 'Active',
        },
        {
            id: 'usr_2',
            name: 'Eleanor Vance',
            email: 'e.vance@logistics.net',
            role: 'Owner',
            initials: 'EV',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
            status: 'Active',
        },
        {
            id: 'usr_3',
            name: 'Marcus Ray',
            email: 'mray_temp@domain.com',
            role: 'Seeker',
            initials: 'MR',
            avatar: null,
            status: 'Active',
        },
        {
            id: 'usr_4',
            name: 'Sunethra Silva',
            email: 'sunethra.silva@email.com',
            role: 'Owner',
            initials: 'SS',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
            status: 'Active',
        }
    ];

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <AdminHeader title="BoardingHub Admin" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.pageTitle}>User Management</Text>
                    <Text style={styles.pageSubtitle}>Manage all system users, roles, and access statuses.</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users by name, email, or ID..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Users List Container */}
                <View style={styles.tableCard}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={styles.tableHeaderLabel}>USER DETAILS</Text>
                        <Text style={styles.tableHeaderLabel}>ROLE</Text>
                    </View>

                    {filteredUsers.map((item, idx) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.userRow, idx === filteredUsers.length - 1 && styles.userRowLast]}
                            onPress={() => onSelectUser && onSelectUser(item)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.userInfoLeft}>
                                {item.avatar ? (
                                    <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.initialsBox}>
                                        <Text style={styles.initialsText}>{item.initials}</Text>
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.userName}>{item.name}</Text>
                                    <Text style={styles.userEmail}>{item.email}</Text>
                                </View>
                            </View>

                            <View style={[styles.roleBadge, item.role === 'Owner' ? styles.roleOwner : styles.roleSeeker]}>
                                <Text style={[styles.roleText, item.role === 'Owner' ? styles.roleTextOwner : styles.roleTextSeeker]}>
                                    {item.role}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
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

    /* Search Input */
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAEFEF',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 46,
        marginBottom: 18,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
    },

    /* Table Container */
    tableCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tableHeaderLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },

    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    userRowLast: {
        borderBottomWidth: 0,
    },
    userInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 12,
    },
    avatarImage: {
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
    userName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },

    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleSeeker: {
        backgroundColor: '#F1F5F9',
    },
    roleOwner: {
        backgroundColor: '#E6F0EC',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '700',
    },
    roleTextSeeker: {
        color: '#475569',
    },
    roleTextOwner: {
        color: '#133E32',
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
