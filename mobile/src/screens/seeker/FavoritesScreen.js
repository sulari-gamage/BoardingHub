import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavBar from '../../components/BottomNavBar';
import HeaderBar from '../../components/HeaderBar';

export default function FavoritesScreen({ onSelectBoarding, onNavigateTab, onOpenNotifications, currentUser, savedBoardings = [], onToggleSaveBoarding }) {
    const favorites = savedBoardings;

    const removeFavorite = (item) => {
        if (onToggleSaveBoarding) onToggleSaveBoarding(item);
    };

    return (
        <SafeAreaView style={styles.container}>
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
                        <TouchableOpacity
                            key={item.id}
                            style={styles.card}
                            onPress={() => onSelectBoarding && onSelectBoarding(item)}
                            activeOpacity={0.9}
                        >
                            {/* Cover Image & Heart Button */}
                            <View style={styles.imageWrapper}>
                                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />

                                <TouchableOpacity
                                    style={styles.heartBtn}
                                    onPress={() => removeFavorite(item)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="heart" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>

                            {/* Card Details */}
                            <View style={styles.cardBody}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <View style={styles.ratingBadge}>
                                        <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 3 }} />
                                        <Text style={styles.ratingVal}>{item.rating || 4.8}</Text>
                                    </View>
                                </View>

                                <View style={styles.locationRow}>
                                    <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                    <Text style={styles.locationText}>{item.location}</Text>
                                </View>

                                {/* Tags */}
                                {item.tags && (
                                    <View style={styles.tagsRow}>
                                        {item.tags.map((tag, idx) => (
                                            <View key={idx} style={styles.tagChip}>
                                                <Text style={styles.tagText}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.cardFooter}>
                                    <Text style={styles.priceVal}>
                                        Rs. {(item.price || 15000).toLocaleString()}{' '}
                                        <Text style={styles.pricePeriod}>/ month</Text>
                                    </Text>

                                    <TouchableOpacity
                                        style={styles.viewBtn}
                                        onPress={() => onSelectBoarding && onSelectBoarding(item)}
                                    >
                                        <Text style={styles.viewBtnText}>View Details</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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

    /* Card */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    imageWrapper: {
        position: 'relative',
        height: 160,
        backgroundColor: '#E2E8F0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    heartBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    /* Body */
    cardBody: {
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        marginRight: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    ratingVal: {
        fontSize: 12,
        fontWeight: '800',
        color: '#B45309',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    locationText: {
        fontSize: 13,
        color: '#64748B',
    },

    /* Tags */
    tagsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 12,
    },
    tagChip: {
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#133E32',
    },

    /* Footer */
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    priceVal: {
        fontSize: 17,
        fontWeight: '900',
        color: '#133E32',
    },
    pricePeriod: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    viewBtn: {
        backgroundColor: '#133E32',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    viewBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
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
