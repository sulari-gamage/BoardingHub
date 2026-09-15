import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../../components/BottomNavBar';
import HeaderBar from '../../components/HeaderBar';
import BoardingCard from '../../components/BoardingCard';

export default function FavoritesScreen({ onSelectBoarding, onNavigateTab, onOpenNotifications, currentUser, savedBoardings = [], onToggleSaveBoarding }) {
    const favorites = savedBoardings;

    return (
        <View style={styles.container}>
            {/* Standardized HeaderBar */}
            <HeaderBar
                title="BoardingHub"
                userAvatar={currentUser?.avatarUrl}
                onOpenNotifications={() => {
                    if (onOpenNotifications) onOpenNotifications();
                    else if (onNavigateTab) onNavigateTab('NOTIFICATIONS');
                }}
                onOpenProfile={() => {
                    if (onNavigateTab) onNavigateTab('PROFILE');
                }}
            />

            {/* Sub-Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Favorites</Text>
                <Text style={styles.favoriteCount}>{favorites.length} saved</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {favorites.length > 0 ? (
                    favorites.map((item) => (
                        <BoardingCard
                            key={item.id}
                            item={item}
                            isSaved={true}
                            onToggleSave={(b) => onToggleSaveBoarding && onToggleSaveBoarding(b)}
                            onPress={() => onSelectBoarding && onSelectBoarding(item)}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="heart-dislike-outline" size={40} color="#94A3B8" />
                        </View>
                        <Text style={styles.emptyTitle}>No Saved Boardings</Text>
                        <Text style={styles.emptySubtitle}>
                            Tap the heart icon on any boarding card to save it to your favorites.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Nav Bar */}
            <BottomNavBar
                activeTab="FAVORITES"
                onTabChange={(tab) => onNavigateTab && onNavigateTab(tab)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#133E32',
        letterSpacing: -0.4,
    },
    favoriteCount: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 24,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Empty State */
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        paddingHorizontal: 30,
        lineHeight: 20,
    },
});
