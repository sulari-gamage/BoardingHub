import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Dimensions,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { uploadImage } from '../../services/uploadService';

const { width } = Dimensions.get('window');

export default function ImageGalleryScreen({
    boarding = {},
    isOwner = false,
    onBack,
    onPropertyUpdated
}) {
    // 1. Initial image gathering
    const getInitialImages = () => {
        const propImgs = (boarding.imageUrls && boarding.imageUrls.length > 0)
            ? boarding.imageUrls
            : (boarding.images && boarding.images.length > 0)
                ? boarding.images.map(img => typeof img === 'string' ? img : img?.imageUrl).filter(Boolean)
                : boarding.imageUrl
                    ? [boarding.imageUrl]
                    : [];

        const roomImgs = [];
        if (boarding.rooms && Array.isArray(boarding.rooms)) {
            boarding.rooms.forEach(r => {
                if (r.imageUrl) roomImgs.push(r.imageUrl);
                if (r.imageUrls && Array.isArray(r.imageUrls)) {
                    r.imageUrls.forEach(url => { if (url) roomImgs.push(url); });
                }
            });
        }
        return Array.from(new Set([...propImgs, ...roomImgs].filter(url => url && typeof url === 'string')));
    };

    const [images, setImages] = useState(getInitialImages());
    const [activeIndex, setActiveIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        setImages(getInitialImages());
        setActiveIndex(0);
        setHasUnsavedChanges(false);
    }, [boarding]);

    // Device Photo Gallery Picker
    const openDeviceGalleryPicker = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant photo library access to select new images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newUri = result.assets[0].uri;
                if (newUri && !images.includes(newUri)) {
                    setImages(prev => [...prev, newUri]);
                    setActiveIndex(images.length);
                    setHasUnsavedChanges(true);
                }
            }
        } catch (err) {
            console.log('Native picker fallback to web:', err);
            if (typeof document !== 'undefined') {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const newUri = e.target?.result || URL.createObjectURL(file);
                            if (newUri && !images.includes(newUri)) {
                                setImages(prev => [...prev, newUri]);
                                setActiveIndex(images.length);
                                setHasUnsavedChanges(true);
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                };
                fileInput.click();
            }
        }
    };

    // Delete image at specified index
    const handleRemoveImage = (indexToRemove) => {
        Alert.alert(
            'Delete Photo',
            'Remove this photo from your property listing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const nextImages = images.filter((_, idx) => idx !== indexToRemove);
                        setImages(nextImages);
                        setHasUnsavedChanges(true);
                        if (activeIndex >= nextImages.length) {
                            setActiveIndex(Math.max(0, nextImages.length - 1));
                        }
                    }
                }
            ]
        );
    };

    // Save All Images to Backend
    const handleSaveImages = async () => {
        if (!boarding.id) {
            Alert.alert('Error', 'Property ID not found.');
            return;
        }

        setIsSaving(true);
        try {
            const uploadedUrls = [];
            for (const uri of images) {
                if (uri.startsWith('http://') || uri.startsWith('https://')) {
                    uploadedUrls.push(uri);
                } else {
                    const remoteUrl = await uploadImage(uri);
                    if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
                        uploadedUrls.push(remoteUrl);
                    }
                }
            }

            const existingProp = boarding.raw || boarding;

            const roomPayloads = (existingProp.rooms || []).map(r => ({
                id: r.id,
                roomName: r.roomName,
                roomType: r.roomType,
                monthlyPrice: r.monthlyPrice,
                totalCapacity: r.totalCapacity,
                remainingSpaces: r.remainingSpaces,
                occupied: r.occupied,
                beds: r.beds,
                washrooms: r.washrooms,
                washroomType: r.washroomType,
                amenities: r.amenities,
                rentType: r.rentType,
                imageUrl: r.imageUrl,
                isElectricityIncluded: r.isElectricityIncluded,
                isWaterIncluded: r.isWaterIncluded
            }));

            const updatePayload = {
                title: existingProp.title || existingProp.name,
                description: existingProp.description || 'Boarding Property',
                address: existingProp.address,
                city: existingProp.city,
                district: existingProp.district || 'Colombo',
                genderPreference: existingProp.genderPreference || 'ANY',
                monthlyRent: existingProp.monthlyRent || existingProp.price || 0,
                latitude: existingProp.latitude || 6.9271,
                longitude: existingProp.longitude || 79.8612,
                propertyNature: existingProp.propertyNature || 'ROOM_BASED',
                totalCapacity: existingProp.totalCapacity || 1,
                totalOccupied: existingProp.totalOccupied || 0,
                roomsCount: existingProp.roomsCount || roomPayloads.length,
                bedsCount: existingProp.bedsCount,
                bathsCount: existingProp.bathsCount,
                hasKitchen: existingProp.hasKitchen,
                isFurnished: existingProp.isFurnished,
                isElectricityIncluded: existingProp.isElectricityIncluded,
                isWaterIncluded: existingProp.isWaterIncluded,
                amenities: Array.isArray(existingProp.amenities) ? existingProp.amenities : [],
                imageUrls: uploadedUrls,
                rooms: roomPayloads
            };

            const updatedProp = await api.properties.update(boarding.id, updatePayload);

            const freshUrls = (updatedProp && updatedProp.imageUrls && updatedProp.imageUrls.length > 0)
                ? updatedProp.imageUrls
                : (updatedProp && updatedProp.images && updatedProp.images.length > 0)
                    ? updatedProp.images.map(i => typeof i === 'string' ? i : i?.imageUrl).filter(Boolean)
                    : uploadedUrls;

            setImages(freshUrls);
            setHasUnsavedChanges(false);

            if (onPropertyUpdated) {
                onPropertyUpdated(updatedProp || { ...boarding, imageUrls: freshUrls });
            }

            Alert.alert('Saved', 'Property photos updated successfully!');
        } catch (err) {
            console.error('Failed to save gallery images:', err);
            Alert.alert('Save Failed', err.message || 'Could not save gallery images.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Clean Minimal Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} disabled={isSaving}>
                    <Ionicons name="arrow-back" size={22} color="#0F172A" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    {images.length > 0 ? `Photo ${activeIndex + 1} of ${images.length}` : 'Property Photos'}
                </Text>

                <View style={{ width: 36 }} />
            </View>

            {/* Main Featured Photo Section */}
            {images.length > 0 ? (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: images[activeIndex] }}
                        style={styles.featuredImage}
                        resizeMode="contain"
                    />

                    {/* Nav Arrows */}
                    {activeIndex > 0 && (
                        <TouchableOpacity
                            style={[styles.arrowBtn, styles.leftArrow]}
                            onPress={() => setActiveIndex(activeIndex - 1)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}

                    {activeIndex < images.length - 1 && (
                        <TouchableOpacity
                            style={[styles.arrowBtn, styles.rightArrow]}
                            onPress={() => setActiveIndex(activeIndex + 1)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}

                    {/* Save Changes Overlay Button for Owner */}
                    {isOwner && (
                        <TouchableOpacity
                            style={[
                                styles.saveOverlayBtn,
                                hasUnsavedChanges ? styles.saveOverlayBtnActive : styles.saveOverlayBtnInactive
                            ]}
                            onPress={handleSaveImages}
                            activeOpacity={0.85}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#FFD700" />
                            ) : (
                                <>
                                    <Ionicons
                                        name={hasUnsavedChanges ? "checkmark-circle" : "cloud-done-outline"}
                                        size={18}
                                        color="#FFD700"
                                        style={{ marginRight: 5 }}
                                    />
                                    <Text style={styles.saveOverlayText}>
                                        {hasUnsavedChanges ? "Save Changes" : "Saved"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="images-outline" size={54} color="#94A3B8" />
                    <Text style={styles.emptyText}>No property photos yet.</Text>
                    {isOwner && (
                        <TouchableOpacity style={styles.addFirstBtn} onPress={openDeviceGalleryPicker} activeOpacity={0.85}>
                            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.addFirstText}>Add Photo</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Clean Property Info */}
            <View style={styles.infoBar}>
                <Text style={styles.titleText}>{boarding.title || 'Boarding Property'}</Text>
                <Text style={styles.locationText}>
                    {boarding.city ? `${boarding.address || ''}, ${boarding.city}` : (boarding.location || 'Sri Lanka')}
                </Text>
            </View>

            {/* Thumbnail Navigation & Photo Actions Bar */}
            <View style={styles.footerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailList}>
                    {images.map((img, idx) => {
                        const isActive = idx === activeIndex;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.thumbBox, isActive && styles.thumbBoxActive]}
                                onPress={() => setActiveIndex(idx)}
                                activeOpacity={0.85}
                            >
                                <Image source={{ uri: img }} style={styles.thumbImage} />
                                {isOwner && (
                                    <TouchableOpacity
                                        style={styles.thumbDeleteBadge}
                                        onPress={() => handleRemoveImage(idx)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons name="close" size={12} color="#FFFFFF" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    {/* Add Photo Card at End of Thumbnails */}
                    {isOwner && (
                        <TouchableOpacity style={styles.addThumbCard} onPress={openDeviceGalleryPicker} activeOpacity={0.85}>
                            <Ionicons name="add" size={24} color="#1B4D3E" />
                            <Text style={styles.addThumbText}>Add</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? 24 : 0,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    saveBtn: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 18,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },

    /* Main Featured Photo */
    imageContainer: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    featuredImage: {
        width: width,
        height: '100%',
    },
    arrowBtn: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    leftArrow: {
        left: 14,
    },
    rightArrow: {
        right: 14,
    },
    saveOverlayBtn: {
        position: 'absolute',
        top: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    saveOverlayBtnActive: {
        backgroundColor: '#1B4D3E',
        borderWidth: 1.5,
        borderColor: '#FFD700',
    },
    saveOverlayBtnInactive: {
        backgroundColor: 'rgba(27, 77, 62, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.5)',
    },
    saveOverlayText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },

    /* Empty state */
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        fontSize: 15,
        color: '#64748B',
        marginTop: 10,
        fontWeight: '600',
    },
    addFirstBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1B4D3E',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 16,
    },
    addFirstText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    /* Info Bar */
    infoBar: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    titleText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    locationText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },

    /* Footer & Thumbnails */
    footerContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
    },
    thumbnailList: {
        paddingHorizontal: 16,
        gap: 10,
        alignItems: 'center',
    },
    thumbBox: {
        width: 58,
        height: 58,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        position: 'relative',
    },
    thumbBoxActive: {
        borderColor: '#1B4D3E',
    },
    thumbImage: {
        width: '100%',
        height: '100%',
    },
    thumbDeleteBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#E11D48',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addThumbCard: {
        width: 58,
        height: 58,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#1B4D3E',
        borderStyle: 'dashed',
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addThumbText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1B4D3E',
    },
});
