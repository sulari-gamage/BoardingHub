import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavBar({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'HOME', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
        { id: 'SEARCH', label: 'Search', activeIcon: 'search', inactiveIcon: 'search-outline' },
        { id: 'BOOKINGS', label: 'Bookings', activeIcon: 'journal', inactiveIcon: 'journal-outline' },
        { id: 'PROFILE', label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
    ];

    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const iconName = isActive ? tab.activeIcon : tab.inactiveIcon;
                const iconColor = isActive ? '#1B4D3E' : '#64748B';

                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tabItem, isActive && styles.tabItemActive]}
                        onPress={() => onTabChange && onTabChange(tab.id)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={iconName} size={20} color={iconColor} style={styles.tabIcon} />
                        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        justifyContent: 'space-around',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        borderRadius: 18,
        marginHorizontal: 2,
    },
    tabItemActive: {
        backgroundColor: '#E6F0EC',
    },
    tabIcon: {
        marginBottom: 2,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    tabLabelActive: {
        color: '#1B4D3E',
        fontWeight: '800',
    },
});
