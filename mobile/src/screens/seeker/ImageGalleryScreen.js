import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Dimensions,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ImageGalleryScreen({ boarding = {}, onBack }) {
    // 1. Gather all property-level images
    const propertyImages = (boarding.imageUrls && boarding.imageUrls.length > 0)
        ? boarding.imageUrls
        : (boarding.images && boarding.images.length > 0)
            ? boarding.images.map(img => typeof img === 'string' ? img : img?.imageUrl).filter(Boolean)
            : boarding.imageUrl
                ? [boarding.imageUrl]
                : [];

    // 2. Gather room-level images
    const roomImages = [];
    if (boarding.rooms && Array.isArray(boarding.rooms)) {
        boarding.rooms.forEach(r => {
            if (r.imageUrl) roomImages.push(r.imageUrl);
            if (r.imageUrls && Array.isArray(r.imageUrls)) {
                r.imageUrls.forEach(url => { if (url) roomImages.push(url); });
            }
        });
    }

    // 3. Deduplicate all collected images
    const rawAllImages = [...propertyImages, ...roomImages];
    const images = Array.from(new Set(rawAllImages.filter(url => url && typeof url === 'string')));

    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="images-outline" size={64} color="#334155" />
                    <Text style={{ color: '#64748B', marginTop: 12, fontWeight: '700' }}>No pictures uploaded yet.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

            {/* Top Bar Overlay */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    {activeIndex + 1} / {images.length}
                </Text>

                <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
                    <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Main Featured Image Display */}
            <View style={styles.mainImageWrapper}>
                <Image
                    source={{ uri: images[activeIndex] }}
                    style={styles.mainImage}
                    resizeMode="contain"
                />

                {/* Left Arrow */}
                {activeIndex > 0 && (
                    <TouchableOpacity
                        style={[styles.arrowBtn, styles.leftArrow]}
                        onPress={() => setActiveIndex(activeIndex - 1)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {/* Right Arrow */}
                {activeIndex < images.length - 1 && (
                    <TouchableOpacity
                        style={[styles.arrowBtn, styles.rightArrow]}
                        onPress={() => setActiveIndex(activeIndex + 1)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Property Title & Info */}
            <View style={styles.infoSection}>
                <Text style={styles.propertyTitle}>{boarding.title || 'Green Valley Boarding'}</Text>
                <Text style={styles.propertyLocation}>{boarding.location || 'Moratuwa, Sri Lanka'}</Text>
            </View>

            {/* Horizontal Thumbnail Selector */}
            <View style={styles.thumbnailContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailScroll}>
                    {images.map((img, idx) => {
                        const isActive = idx === activeIndex;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.thumbnailWrapper, isActive && styles.activeThumbnail]}
                                onPress={() => setActiveIndex(idx)}
                                activeOpacity={0.85}
                            >
                                <Image source={{ uri: img }} style={styles.thumbnailImage} />
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
    },

    /* Main Image */
    mainImageWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    mainImage: {
        width: width,
        height: '100%',
    },
    arrowBtn: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(27, 77, 62, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    leftArrow: {
        left: 16,
    },
    rightArrow: {
        right: 16,
    },

    /* Property Info */
    infoSection: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    propertyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    propertyLocation: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },

    /* Thumbnails */
    thumbnailContainer: {
        paddingVertical: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    thumbnailScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    thumbnailWrapper: {
        width: 64,
        height: 64,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        opacity: 0.6,
    },
    activeThumbnail: {
        borderColor: '#FFD700',
        opacity: 1,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
});
