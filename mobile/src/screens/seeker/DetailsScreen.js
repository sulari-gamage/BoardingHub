import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    Platform,
    Linking,
    Dimensions,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import BookingRequestModal from '../../components/BookingRequestModal';
import api from '../../services/api';

export default function DetailsScreen({
    boarding = {},
    isSaved: isSavedProp = false,
    onToggleSave,
    onBack,
    onBookSuccess,
    onOpenGallery,
    onOpenReviews,
    onOpenMap,
    onViewOwnerProperties
}) {
    const [isSaved, setIsSaved] = useState(isSavedProp);

    useEffect(() => {
        setIsSaved(isSavedProp);
    }, [isSavedProp]);

    const [propertyReviews, setPropertyReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    useEffect(() => {
        if (boarding?.id) {
            setLoadingReviews(true);
            api.reviews.getByPropertyId(boarding.id)
                .then(res => {
                    if (res && Array.isArray(res)) {
                        setPropertyReviews(res);
                    }
                })
                .catch(err => console.log('[DetailsScreen] Reviews load error:', err))
                .finally(() => setLoadingReviews(false));
        }
    }, [boarding?.id]);
    const [selectedRoom, setSelectedRoom] = useState('shared');
    const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
    const [selectedRoomModalData, setSelectedRoomModalData] = useState(null);
    const [isRoomModalVisible, setIsRoomModalVisible] = useState(false);
    const [activeRoomModalImgIndex, setActiveRoomModalImgIndex] = useState(0);
    const [modalHeroWidth, setModalHeroWidth] = useState(380);
    const roomImageScrollViewRef = useRef(null);

    const handleOpenRoomModal = (roomItem) => {
        setSelectedRoomModalData(roomItem);
        setActiveRoomModalImgIndex(0);
        setIsRoomModalVisible(true);
    };
    const [calculatedDistance, setCalculatedDistance] = useState(boarding.distanceText || null);
    const [mapCoords, setMapCoords] = useState({
        lat: boarding.latitude || 6.9271,
        lng: boarding.longitude || 79.8612,
    });

    const ownerName =
        boarding.ownerName ||
        (boarding.owner && boarding.owner.name) ||
        (boarding.raw && boarding.raw.ownerName) ||
        (boarding.user && (boarding.user.fullName || boarding.user.name)) ||
        'Sunethra Silva';

    const ownerPhone =
        boarding.ownerWhatsapp ||
        boarding.ownerPhone ||
        boarding.whatsappNumber ||
        (boarding.owner && (boarding.owner.whatsappNumber || boarding.owner.phone || boarding.owner.whatsapp)) ||
        (boarding.raw && (boarding.raw.ownerWhatsapp || boarding.raw.ownerPhone || boarding.raw.whatsappNumber || boarding.raw.phone)) ||
        (boarding.user && (boarding.user.whatsappNumber || boarding.user.phone)) ||
        '';

    const [avatarLoadError, setAvatarLoadError] = useState(false);

    const ownerAvatarRaw =
        boarding.ownerAvatar ||
        boarding.ownerAvatarUrl ||
        (boarding.owner && (boarding.owner.avatarUrl || boarding.owner.avatar)) ||
        (boarding.raw && (boarding.raw.ownerAvatar || boarding.raw.avatarUrl)) ||
        (boarding.user && (boarding.user.avatarUrl || boarding.user.avatar)) ||
        null;

    const ownerAvatar = typeof ownerAvatarRaw === 'string' ? ownerAvatarRaw.trim() : (ownerAvatarRaw?.uri || null);
    const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : 'O';

    const isAnnexType =
        boarding.propertyNature === 'WHOLE_HOUSE' ||
        boarding.propertyNature === 'ANNEX' ||
        boarding.propertyType === 'ANNEX' ||
        boarding.raw?.propertyNature === 'WHOLE_HOUSE' ||
        boarding.raw?.propertyNature === 'ANNEX' ||
        (boarding.title && (boarding.title.toLowerCase().includes('annex') || boarding.title.toLowerCase().includes('house') || boarding.title.toLowerCase().includes('apartment')));

    const formatWhatsAppPhone = (phoneStr) => {
        if (!phoneStr) return '94771234567';
        let digits = phoneStr.toString().replace(/[^0-9]/g, '');
        if (!digits) return '94771234567';

        if (digits.startsWith('0') && digits.length === 10) {
            digits = '94' + digits.substring(1);
        } else if (digits.startsWith('7') && digits.length === 9) {
            digits = '94' + digits;
        } else if (digits.startsWith('0094')) {
            digits = digits.substring(2);
        }
        return digits;
    };

    const handleWhatsAppPress = () => {
        const cleanPhone = formatWhatsAppPhone(ownerPhone);
        const message = encodeURIComponent(`Hi ${ownerName}, I am interested in your property "${boarding.title || 'Boarding'}" listed on BoardingHub.`);

        const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${message}`;
        const webUrl = `https://wa.me/${cleanPhone}?text=${message}`;

        Linking.canOpenURL(appUrl).then((supported) => {
            if (supported) {
                return Linking.openURL(appUrl);
            } else {
                return Linking.openURL(webUrl);
            }
        }).catch(() => {
            Linking.openURL(webUrl).catch(() => {
                Alert.alert('Error', 'Unable to open WhatsApp. Please ensure WhatsApp is installed on your device.');
            });
        });
    };

    const handleOtherPropertiesPress = () => {
        if (onViewOwnerProperties) {
            onViewOwnerProperties(ownerName, boarding.ownerId || boarding.owner?.id);
        }
    };

    const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        const fetchLocationAndDistance = async (targetLat, targetLng) => {
            try {
                const isServicesEnabled = await Location.hasServicesEnabledAsync();
                const { status } = await Location.getForegroundPermissionsAsync();
                if (isServicesEnabled && status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    if (loc?.coords && targetLat && targetLng) {
                        const distKm = getHaversineDistance(
                            loc.coords.latitude,
                            loc.coords.longitude,
                            targetLat,
                            targetLng
                        );
                        const formatted = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
                        setCalculatedDistance(formatted);
                    }
                }
            } catch (e) {
                console.log('[DetailsScreen] Distance calculation error:', e.message);
            }
        };

        if (boarding.latitude && boarding.longitude) {
            setMapCoords({ lat: boarding.latitude, lng: boarding.longitude });
            fetchLocationAndDistance(boarding.latitude, boarding.longitude);
        } else {
            let addressToGeocode = `${boarding.address || ''} ${boarding.city || ''}`.trim() || boarding.location || '';
            if (addressToGeocode) {
                addressToGeocode = addressToGeocode.replace(/[\r\n]+/g, ', ').replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
                const fullQuery = addressToGeocode.toLowerCase().includes('sri lanka') ? addressToGeocode : `${addressToGeocode}, Sri Lanka`;
                Location.geocodeAsync(fullQuery)
                    .then((results) => {
                        if (results && results.length > 0) {
                            const { latitude, longitude } = results[0];
                            if (latitude && longitude) {
                                setMapCoords({ lat: latitude, lng: longitude });
                                fetchLocationAndDistance(latitude, longitude);
                            }
                        }
                    })
                    .catch((err) => console.log('[DetailsScreen] Geocode error:', err.message));
            }
        }
    }, [boarding]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const imageGalleryScrollRef = useRef(null);

    // Extract full normalized array of property images
    const imagesList = useMemo(() => {
        let list = [];
        if (boarding.images && boarding.images.length > 0) {
            list = boarding.images.map(img => (typeof img === 'string' ? img : (img.imageUrl || img.uri)));
        } else if (boarding.imageUrls && boarding.imageUrls.length > 0) {
            list = boarding.imageUrls.map(img => (typeof img === 'string' ? img : (img.imageUrl || img.uri)));
        } else if (boarding.imageUrl) {
            list = [boarding.imageUrl];
        } else if (boarding.image) {
            list = [typeof boarding.image === 'string' ? boarding.image : boarding.image.uri];
        }

        list = list.filter(Boolean);

        if (list.length === 0) {
            list = [
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
            ];
        }
        return list;
    }, [boarding]);

    // Auto-scroll images left every 3 seconds if there are multiple images
    useEffect(() => {
        if (imagesList.length <= 1) return;

        const interval = setInterval(() => {
            setActiveImageIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % imagesList.length;
                if (imageGalleryScrollRef.current) {
                    imageGalleryScrollRef.current.scrollTo({
                        x: nextIndex * Dimensions.get('window').width,
                        animated: true,
                    });
                }
                return nextIndex;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [imagesList]);

    const title = boarding.title || 'Green Valley Boarding';
    const location = boarding.address || boarding.location || boarding.city || 'Location Not Set';
    const price = boarding.price ? boarding.price.toLocaleString() : '15,000';
    const rating = boarding.rating ? Number(boarding.rating).toFixed(1) : 'New';
    const screenWidth = Dimensions.get('window').width;

    const handleBookNowPress = () => {
        setIsBookingModalVisible(true);
    };

    const handleMapPress = () => {
        const lat = boarding.latitude || 6.9271;
        const lng = boarding.longitude || 79.8612;
        const label = encodeURIComponent(boarding.title || 'Boarding Location');

        let url = Platform.select({
            ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
            android: `geo:0,0?q=${lat},${lng}(${label})`
        });

        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(fallbackUrl);
            }
        }).catch(() => {
            Linking.openURL(fallbackUrl);
        });
    };

    const handleShare = () => {
        Alert.alert("Share Property", `Share link for "${title}" copied to clipboard!`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Cover Hero Image & Floating Navigation Bar */}
                <View style={styles.imageContainer}>
                    <ScrollView
                        ref={imageGalleryScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const contentOffset = e.nativeEvent.contentOffset.x;
                            const viewSize = e.nativeEvent.layoutMeasurement.width;
                            if (viewSize > 0) {
                                const pageNum = Math.round(contentOffset / viewSize);
                                if (pageNum !== activeImageIndex && pageNum >= 0 && pageNum < imagesList.length) {
                                    setActiveImageIndex(pageNum);
                                }
                            }
                        }}
                        scrollEventThrottle={16}
                    >
                        {imagesList.map((imgUri, idx) => (
                            <TouchableOpacity
                                key={idx}
                                activeOpacity={0.95}
                                onPress={() => onOpenGallery && onOpenGallery(boarding)}
                                style={{ width: screenWidth, height: 260 }}
                            >
                                <Image source={{ uri: imgUri }} style={styles.heroImage} resizeMode="cover" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Top Action Overlay Bar */}
                    <View style={styles.topBarOverlay} pointerEvents="box-none">
                        <TouchableOpacity
                            style={styles.circleBtn}
                            onPress={() => {
                                if (onBack) {
                                    onBack();
                                }
                            }}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={20} color="#0F172A" />
                        </TouchableOpacity>

                        <View style={styles.topRightActions}>
                            <TouchableOpacity
                                style={styles.circleBtn}
                                onPress={() => {
                                    setIsSaved(!isSaved);
                                    if (onToggleSave) {
                                        onToggleSave(boarding);
                                    }
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={isSaved ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color={isSaved ? '#EF4444' : '#0F172A'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.circleBtn} onPress={handleShare} activeOpacity={0.8}>
                                <Ionicons name="share-social-outline" size={20} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Image Pagination Dots */}
                    {imagesList.length > 1 && (
                        <View style={styles.paginationDots}>
                            {imagesList.map((_, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.dot,
                                        activeImageIndex === idx && styles.activeDot
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Content Details */}
                <View style={styles.content}>
                    {/* Title & Top-Right Rating Row */}
                    <View style={styles.titleRatingRow}>
                        <Text style={styles.mainTitle} numberOfLines={2}>{title}</Text>
                        <TouchableOpacity
                            style={styles.headerRatingBadge}
                            onPress={() => onOpenReviews && onOpenReviews(boarding)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="star" size={13} color="#D97706" style={{ marginRight: 3 }} />
                            <Text style={styles.headerRatingScore}>{rating}</Text>
                            <Text style={styles.headerReviewsCount}>(124)</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Location Pin Header */}
                    <View style={styles.locationHeaderRow}>
                        <Ionicons name="location-outline" size={16} color="#1B4D3E" style={{ marginRight: 4 }} />
                        <Text style={styles.locationHeaderText}>{location}</Text>
                    </View>

                    {/* Distance Badge under Address */}
                    {(calculatedDistance || boarding.distanceText) && (
                        <View style={styles.distanceBadgeRow}>
                            <Ionicons name="navigate-circle" size={14} color="#133E32" style={{ marginRight: 5 }} />
                            <Text style={styles.distanceBadgeText}>
                                {calculatedDistance || boarding.distanceText} away from your location
                            </Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* About This Property */}
                    <Text style={styles.sectionHeading}>About this property</Text>
                    <Text style={styles.aboutParagraph}>
                        {boarding.description || boarding.desc || 'No description provided by the owner for this property.'}
                    </Text>

                    {/* Amenities Section */}
                    <Text style={styles.sectionHeading}>Amenities</Text>
                    <View style={styles.compactAmenitiesGrid}>
                        {(() => {
                            let baseList = (boarding.amenities && boarding.amenities.length > 0)
                                ? [...boarding.amenities]
                                : (boarding.tags && boarding.tags.length > 0
                                    ? [...boarding.tags]
                                    : ['High-Speed WiFi', 'Laundry Facilities', 'Attached Bath', 'Secure Parking']);

                            const rawNames = baseList.map(a => (typeof a === 'string' ? a : (a.name || a.title || '')).toLowerCase());

                            // Dynamically add Furnished / Unfurnished if not present
                            if (!rawNames.some(n => n.includes('furnish'))) {
                                baseList.push(boarding.isFurnished ? 'Fully Furnished' : 'Unfurnished');
                            }

                            // Dynamically add Kitchen status if not present
                            if (!rawNames.some(n => n.includes('kitchen'))) {
                                baseList.push(boarding.hasKitchen ? 'Kitchen Facilities' : 'No Kitchen');
                            }

                            return baseList.map((amenity, index) => {
                                const name = typeof amenity === 'string' ? amenity : (amenity.name || amenity.title || 'Amenity');
                                const lower = name.toLowerCase();
                                let iconName = 'checkmark-circle-outline';
                                if (lower.includes('wifi') || lower.includes('internet')) iconName = 'wifi-outline';
                                else if (lower.includes('laundry') || lower.includes('wash')) iconName = 'shirt-outline';
                                else if (lower.includes('park')) iconName = 'car-outline';
                                else if (lower.includes('secur') || lower.includes('cctv') || lower.includes('shield')) iconName = 'shield-checkmark-outline';
                                else if (lower.includes('ac') || lower.includes('air') || lower.includes('cool')) iconName = 'snow-outline';
                                else if (lower.includes('fridge') || lower.includes('oven') || lower.includes('kitchen') || lower.includes('cook')) iconName = 'restaurant-outline';
                                else if (lower.includes('bath') || lower.includes('water') || lower.includes('shower')) iconName = 'water-outline';
                                else if (lower.includes('desk') || lower.includes('study') || lower.includes('table')) iconName = 'easel-outline';
                                else if (lower.includes('meal') || lower.includes('food') || lower.includes('breakfast')) iconName = 'fast-food-outline';
                                else if (lower.includes('furnish')) iconName = 'home-outline';
                                else if (lower.includes('bed') || lower.includes('room')) iconName = 'bed-outline';

                                return (
                                    <View key={index} style={styles.compactAmenityCard}>
                                        <Ionicons name={iconName} size={16} color="#1B4D3E" style={{ marginRight: 6 }} />
                                        <Text style={styles.compactAmenityText} numberOfLines={1}>{name}</Text>
                                    </View>
                                );
                            });
                        })()}
                    </View>

                    {/* Annex / Whole House Property Overview Card */}
                    {isAnnexType && (
                        <>
                            <Text style={styles.sectionHeading}>Annex Overview</Text>
                            <View style={styles.annexCard}>
                                {/* Rooms, Capacity, Beds & Bathroom Specifications */}

                                {/* Rooms, Capacity, Beds & Bathroom Specifications */}
                                <View style={styles.annexGrid}>
                                    <View style={styles.annexBadge}>
                                        <Ionicons name="cube-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                        <Text style={styles.annexBadgeText}>
                                            {boarding.roomsCount || (boarding.rooms ? boarding.rooms.length : 1)} Room(s)
                                        </Text>
                                    </View>

                                    <View style={styles.annexBadge}>
                                        <Ionicons name="people-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                        <Text style={styles.annexBadgeText}>
                                            {boarding.totalCapacity || boarding.totalSpaces || (boarding.rooms ? boarding.rooms.reduce((acc, r) => acc + (r.totalCapacity || 1), 0) : 1)} Total Capacity
                                        </Text>
                                    </View>

                                    <View style={styles.annexBadge}>
                                        <Ionicons name="bed-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                        <Text style={styles.annexBadgeText}>
                                            {boarding.bedsCount || (boarding.rooms ? boarding.rooms.reduce((acc, r) => acc + (r.beds || 1), 0) : 1)} Bed(s)
                                        </Text>
                                    </View>

                                    <View style={styles.annexBadge}>
                                        <Ionicons name="water-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                        <Text style={styles.annexBadgeText}>
                                            {boarding.bathsCount || 1} Bath ({boarding.hasAttachedBathroom || boarding.washroomType ? (boarding.washroomType || 'Attached') : 'Attached/Private'})
                                        </Text>
                                    </View>
                                </View>

                                {/* Monthly Rent Display */}
                                <View style={styles.annexPriceBox}>
                                    <Text style={styles.annexPriceLabel}>Monthly Rent</Text>
                                    <Text style={styles.annexPriceVal}>
                                        Rs. {(boarding.price || boarding.monthlyRent || 0).toLocaleString()} / month
                                    </Text>
                                </View>

                                {/* Utility Bills Breakdown */}
                                <View style={styles.annexUtilitySection}>
                                    <Text style={styles.annexUtilityHeading}>Utility Bills Inclusion</Text>
                                    <View style={styles.annexUtilityRow}>
                                        <View style={styles.annexUtilityChip}>
                                            <Ionicons
                                                name={boarding.isElectricityIncluded ? "flash" : "flash-outline"}
                                                size={14}
                                                color={boarding.isElectricityIncluded ? "#15803D" : "#D97706"}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={styles.annexUtilityChipText}>
                                                Electricity: <Text style={{ fontWeight: '800', color: boarding.isElectricityIncluded ? '#15803D' : '#D97706' }}>{boarding.isElectricityIncluded ? 'Included in Rent' : 'Separate Bill'}</Text>
                                            </Text>
                                        </View>

                                        <View style={styles.annexUtilityChip}>
                                            <Ionicons
                                                name={boarding.isWaterIncluded ? "water" : "water-outline"}
                                                size={14}
                                                color={boarding.isWaterIncluded ? "#15803D" : "#D97706"}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={styles.annexUtilityChipText}>
                                                Water: <Text style={{ fontWeight: '800', color: boarding.isWaterIncluded ? '#15803D' : '#D97706' }}>{boarding.isWaterIncluded ? 'Included in Rent' : 'Separate Bill'}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}

                    {/* Available Rooms Section (Room-Based Boardings Only) */}
                    {!isAnnexType && (
                        <>
                            <Text style={styles.sectionHeading}>Available Rooms</Text>
                            {boarding.rooms && boarding.rooms.length > 0 ? (
                                <ScrollView
                                    horizontal={true}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingRight: 10, paddingBottom: 6 }}
                                    style={{ marginBottom: 20 }}
                                >
                                    {boarding.rooms.map((roomItem, index) => {
                                        const isSelected = selectedRoom === (roomItem.id || `room_${index}`);
                                        const rawRoomPrice = roomItem.monthlyPrice || roomItem.monthlyRent || roomItem.price || price;
                                        const capacity = roomItem.totalCapacity || 1;
                                        const rentType = (roomItem.rentType || '').toUpperCase();

                                        // Calculate total per-room monthly rent for this room
                                        let perRoomPrice = rawRoomPrice;
                                        if (rentType === 'PER_PERSON' || rentType === 'PERSON') {
                                            perRoomPrice = Math.round(rawRoomPrice * capacity);
                                        }

                                        const roomPriceFormatted = perRoomPrice.toLocaleString();
                                        const roomImgUri = roomItem.imageUrl || roomItem.image || (imagesList && imagesList.length > 0 ? imagesList[index % imagesList.length] : 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600');

                                        // Formatted Title: Room Name (Room Type)
                                        const baseRoomName = roomItem.roomName || roomItem.roomNumber || roomItem.name || `Room ${index + 1}`;

                                        // Build special feature pills list
                                        const featurePills = [];
                                        const bathCount = roomItem.washrooms || (roomItem.washroomType || roomItem.hasAttachedBathroom ? 1 : null);
                                        if (bathCount != null) {
                                            featurePills.push({ icon: 'water-outline', label: `${bathCount} ${bathCount === 1 ? 'Bath' : 'Baths'}` });
                                        }
                                        if (roomItem.isAirConditioned != null) {
                                            featurePills.push({ icon: 'snow-outline', label: roomItem.isAirConditioned ? 'AC' : 'Non-AC' });
                                        }
                                        if (roomItem.isFurnished != null) {
                                            featurePills.push({ icon: 'cube-outline', label: roomItem.isFurnished ? 'Furnished' : 'Unfurnished' });
                                        }
                                        if (roomItem.beds) {
                                            featurePills.push({ icon: 'bed-outline', label: `${roomItem.beds} Bed(s)` });
                                        }
                                        if (roomItem.totalCapacity) {
                                            featurePills.push({ icon: 'people-outline', label: `Cap: ${roomItem.totalCapacity}` });
                                        }

                                        return (
                                            <View key={roomItem.id || index} style={styles.horizontalRoomCard}>
                                                {/* Room Header Image */}
                                                <View style={styles.roomImageContainer}>
                                                    <Image
                                                        source={{ uri: roomImgUri }}
                                                        style={styles.roomCardImage}
                                                        resizeMode="cover"
                                                    />
                                                    <View style={styles.roomImageBadge}>
                                                        <Ionicons name="people-outline" size={11} color="#1B4D3E" style={{ marginRight: 3 }} />
                                                        <Text style={styles.roomImageBadgeText}>
                                                            {roomItem.remainingSpaces != null ? `${roomItem.remainingSpaces} Left` : `Cap: ${roomItem.totalCapacity || 1}`}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Room Details Content Body */}
                                                <View style={styles.roomCardContentBody}>
                                                    {/* Room Title */}
                                                    <Text style={styles.roomTypeTitle} numberOfLines={1}>
                                                        {baseRoomName}
                                                        {roomItem.roomType ? (
                                                            <Text style={{ fontWeight: '500', fontSize: 12, color: '#64748B' }}>
                                                                {` (${roomItem.roomType})`}
                                                            </Text>
                                                        ) : null}
                                                    </Text>

                                                    {/* Special Room Features Pills */}
                                                    {featurePills.length > 0 && (
                                                        <View style={styles.roomFeaturePillsRow}>
                                                            {featurePills.map((pill, pIdx) => (
                                                                <View key={pIdx} style={styles.roomFeaturePill}>
                                                                    <Ionicons name={pill.icon} size={10} color="#133E32" style={{ marginRight: 3 }} />
                                                                    <Text style={styles.roomFeaturePillText}>{pill.label}</Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}

                                                    <View style={styles.roomCardDivider} />

                                                    {/* Price Row */}
                                                    <View style={styles.roomPriceContainer}>
                                                        <Text style={styles.roomPriceText}>Rs.{roomPriceFormatted}</Text>
                                                        <Text style={styles.roomPricePeriod}> / room / month</Text>
                                                    </View>

                                                    {/* Buttons Row: Swapped Order -> [Select Room] then [View >] */}
                                                    <View style={styles.roomActionButtonsRow}>
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.selectRoomCardBtn,
                                                                selectedRoom === (roomItem.id || roomItem.roomNumber) && styles.selectRoomCardBtnActive
                                                            ]}
                                                            onPress={() => {
                                                                const rId = roomItem.id || roomItem.roomNumber;
                                                                setSelectedRoom(rId);
                                                                setIsBookingModalVisible(true);
                                                            }}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Ionicons
                                                                name={selectedRoom === (roomItem.id || roomItem.roomNumber) ? "checkmark-circle" : "add-circle-outline"}
                                                                size={13}
                                                                color={selectedRoom === (roomItem.id || roomItem.roomNumber) ? "#FFFFFF" : "#1B4D3E"}
                                                                style={{ marginRight: 4 }}
                                                            />
                                                            <Text style={[
                                                                styles.selectRoomCardBtnText,
                                                                selectedRoom === (roomItem.id || roomItem.roomNumber) && styles.selectRoomCardBtnTextActive
                                                            ]}>
                                                                {selectedRoom === (roomItem.id || roomItem.roomNumber) ? 'Selected' : 'Select'}
                                                            </Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={styles.viewRoomBtn}
                                                            onPress={() => handleOpenRoomModal(roomItem)}
                                                            activeOpacity={0.85}
                                                        >
                                                            <Text style={styles.viewRoomBtnText}>View</Text>
                                                            <Ionicons name="chevron-forward" size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            ) : (
                                <View style={styles.roomCard}>
                                    <View style={styles.roomHeaderRow}>
                                        <Text style={styles.roomTypeTitle}>Entire Property / Shared Room</Text>
                                        <View style={styles.roomCardBadge}>
                                            <Ionicons name="people-outline" size={13} color="#1B4D3E" style={{ marginRight: 4 }} />
                                            <Text style={styles.roomBadgeText}>Available</Text>
                                        </View>
                                    </View>
                                    <View style={styles.roomCardDivider} />
                                    <View style={styles.roomFooterRow}>
                                        <View>
                                            <Text style={styles.roomPriceText}>Rs.{price}</Text>
                                            <Text style={styles.roomPricePeriod}>/ Month</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.selectRoomBtn}
                                            onPress={() => setSelectedRoom('default')}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={selectedRoom === 'default' ? 'radio-button-on' : 'radio-button-off'}
                                                size={18}
                                                color="#1B4D3E"
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={styles.selectRoomText}>Select Room</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </>
                    )}

                    {/* Owner Details Card */}
                    <Text style={styles.sectionHeading}>Property Owner</Text>
                    <View style={styles.ownerCard}>
                        <View style={styles.ownerInfoRow}>
                            {!avatarLoadError && ownerAvatar && ownerAvatar.length > 0 ? (
                                <Image
                                    source={{ uri: ownerAvatar }}
                                    style={styles.ownerAvatarImage}
                                    onError={() => setAvatarLoadError(true)}
                                />
                            ) : (
                                <View style={styles.ownerAvatarFallback}>
                                    <Text style={styles.ownerAvatarInitial}>{ownerInitial}</Text>
                                </View>
                            )}
                            <View style={styles.ownerTextContainer}>
                                <Text style={styles.ownerNameText}>{ownerName}</Text>
                                <Text style={styles.ownerRoleText}>Property Owner</Text>
                            </View>
                        </View>

                        <View style={styles.ownerActionsRow}>
                            <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppPress} activeOpacity={0.8}>
                                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.whatsappBtnText}>Chat on WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.otherPropertiesBtn} onPress={handleOtherPropertiesPress} activeOpacity={0.8}>
                                <Ionicons name="grid-outline" size={15} color="#1B4D3E" style={{ marginRight: 5 }} />
                                <Text style={styles.otherPropertiesBtnText}>Other Properties</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Golden Star Rating & Reviews Section */}
                    <Text style={styles.sectionHeading}>Ratings & Reviews</Text>
                    <View style={styles.ratingBadgeCard}>
                        <View style={styles.ratingBadgeHeader}>
                            <View style={styles.goldenStarContainer}>
                                <Ionicons name="star" size={26} color="#D97706" />
                            </View>
                            <View style={styles.ratingBadgeTextCol}>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                    <Text style={styles.ratingBadgeScore}>{boarding.rating ? Number(boarding.rating).toFixed(1) : 'New'}</Text>
                                    {boarding.rating != null && <Text style={styles.ratingBadgeMax}> / 5.0</Text>}
                                </View>

                                <View style={styles.starsRowCompact}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Ionicons key={s} name="star" size={13} color="#D97706" style={{ marginRight: 2 }} />
                                    ))}
                                    <Text style={styles.ratingsVerifiedText}>Seeker Ratings</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.ratingBadgeActionsRow}>
                            <TouchableOpacity
                                style={styles.seeReviewsBtn}
                                onPress={() => onOpenReviews && onOpenReviews(boarding)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="chatbox-ellipses-outline" size={15} color="#1B4D3E" style={{ marginRight: 5 }} />
                                <Text style={styles.seeReviewsBtnText}>
                                    {propertyReviews.length > 0 ? `View All (${propertyReviews.length}) Reviews` : 'Write a Review'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Seeker Reviews List Widget (Displayed above Map) */}
                    <View style={{ marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Seeker Reviews ({propertyReviews.length})</Text>
                            <TouchableOpacity onPress={() => onOpenReviews && onOpenReviews(boarding)}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1B4D3E' }}>
                                    {propertyReviews.length > 0 ? `View All (${propertyReviews.length})` : '+ Write Review'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {loadingReviews ? (
                            <ActivityIndicator size="small" color="#1B4D3E" style={{ marginVertical: 15 }} />
                        ) : propertyReviews.length > 0 ? (
                            propertyReviews.slice(0, 3).map((rev) => {
                                const revAvatar = (rev.userAvatar && typeof rev.userAvatar === 'string' && rev.userAvatar.trim().length > 0)
                                    ? rev.userAvatar
                                    : (rev.seekerAvatar && typeof rev.seekerAvatar === 'string' && rev.seekerAvatar.trim().length > 0)
                                        ? rev.seekerAvatar
                                        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                                const revName = rev.userName || rev.seekerName || 'Anonymous Seeker';
                                const dateStr = rev.createdAt
                                    ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'Recently';

                                return (
                                    <View
                                        key={rev.id || Math.random().toString()}
                                        style={{
                                            backgroundColor: '#FFFFFF',
                                            borderRadius: 16,
                                            padding: 14,
                                            marginBottom: 10,
                                            borderWidth: 1,
                                            borderColor: '#E2E8F0',
                                            shadowColor: '#0F172A',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.03,
                                            shadowRadius: 4,
                                            elevation: 1,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                            <Image source={{ uri: revAvatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{revName}</Text>
                                                <Text style={{ fontSize: 11, color: '#64748B' }}>{dateStr}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                                                <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 3 }} />
                                                <Text style={{ fontSize: 12, fontWeight: '800', color: '#B45309' }}>{rev.rating}</Text>
                                            </View>
                                        </View>
                                        {rev.comment ? (
                                            <Text style={{ fontSize: 13, color: '#334155', lineHeight: 18 }}>{rev.comment}</Text>
                                        ) : (
                                            <Text style={{ fontSize: 12, fontStyle: 'italic', color: '#94A3B8' }}>No written comment provided.</Text>
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#F8FAFC',
                                    borderRadius: 14,
                                    padding: 16,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#E2E8F0',
                                    borderStyle: 'dashed'
                                }}
                                onPress={() => onOpenReviews && onOpenReviews(boarding)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="chatbox-ellipses-outline" size={26} color="#94A3B8" style={{ marginBottom: 4 }} />
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1B4D3E', marginBottom: 2 }}>No seeker reviews yet</Text>
                                <Text style={{ fontSize: 12, color: '#64748B' }}>Be the first seeker to write a review for this property!</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Location Map Section */}
                    <Text style={styles.sectionHeading}>Location</Text>
                    <TouchableOpacity
                        style={styles.mapCard}
                        onPress={handleMapPress}
                        activeOpacity={0.9}
                    >
                        <MapView
                            style={StyleSheet.absoluteFillObject}
                            zoomEnabled={false}
                            scrollEnabled={false}
                            pitchEnabled={false}
                            rotateEnabled={false}
                            region={{
                                latitude: mapCoords.lat,
                                longitude: mapCoords.lng,
                                latitudeDelta: 0.015,
                                longitudeDelta: 0.015,
                            }}
                        >
                            <Marker
                                coordinate={{
                                    latitude: mapCoords.lat,
                                    longitude: mapCoords.lng,
                                }}
                            />
                        </MapView>
                        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
                        <View style={styles.mapOverlayPin}>
                            <View style={styles.mapPinBadge}>
                                <Text style={styles.mapPinText}>Tap to Open Map</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Booking Request Modal */}
            <BookingRequestModal
                visible={isBookingModalVisible}
                onClose={() => setIsBookingModalVisible(false)}
                boarding={boarding}
                initialSelectedRoomId={selectedRoom}
                onSubmitBooking={(bookingData) => {
                    if (onBookSuccess) onBookSuccess(bookingData);
                }}
            />

            {/* Room Details Modal */}
            <Modal
                visible={isRoomModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsRoomModalVisible(false)}
            >
                <View style={styles.roomModalOverlay}>
                    {/* Background Backdrop Touch to Close */}
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => setIsRoomModalVisible(false)}
                    />

                    {/* Room Modal Card */}
                    <View style={styles.roomModalContainer}>
                        {/* Modal Header */}
                        <View style={styles.roomModalHeader}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text style={styles.roomModalTitle}>
                                    {selectedRoomModalData?.roomName || selectedRoomModalData?.roomNumber || selectedRoomModalData?.name || 'Room Details'}
                                </Text>
                                {selectedRoomModalData?.roomType ? (
                                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1, fontWeight: '600' }}>
                                        {selectedRoomModalData.roomType} Room Type
                                    </Text>
                                ) : null}
                            </View>
                            <TouchableOpacity onPress={() => setIsRoomModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={22} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.roomModalScrollView}
                            contentContainerStyle={{ paddingBottom: 24 }}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* 1. Swipeable Room Image Carousel */}
                            {(() => {
                                const rawPhotos = (selectedRoomModalData?.photos && selectedRoomModalData.photos.length > 0)
                                    ? selectedRoomModalData.photos
                                    : (selectedRoomModalData?.imageUrls && selectedRoomModalData.imageUrls.length > 0)
                                        ? selectedRoomModalData.imageUrls
                                        : (selectedRoomModalData?.imageUrl || selectedRoomModalData?.image)
                                            ? [selectedRoomModalData.imageUrl || selectedRoomModalData.image]
                                            : (imagesList && imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600']);

                                const modalRoomPhotos = rawPhotos.map(p => typeof p === 'string' ? p : (p?.uri || p?.imageUrl || p?.url)).filter(Boolean);
                                const hasMultiplePhotos = modalRoomPhotos.length > 1;

                                return (
                                    <View
                                        style={styles.modalHeroImageContainer}
                                        onLayout={(e) => {
                                            const w = e.nativeEvent.layout.width;
                                            if (w > 0 && w !== modalHeroWidth) {
                                                setModalHeroWidth(w);
                                            }
                                        }}
                                    >
                                        <ScrollView
                                            ref={roomImageScrollViewRef}
                                            horizontal
                                            pagingEnabled
                                            showsHorizontalScrollIndicator={false}
                                            onScroll={(e) => {
                                                const w = e.nativeEvent.layoutMeasurement.width || modalHeroWidth || 380;
                                                const slide = Math.round(e.nativeEvent.contentOffset.x / w);
                                                if (slide !== activeRoomModalImgIndex && slide >= 0 && slide < modalRoomPhotos.length) {
                                                    setActiveRoomModalImgIndex(slide);
                                                }
                                            }}
                                            scrollEventThrottle={16}
                                        >
                                            {modalRoomPhotos.map((imgUri, pIdx) => (
                                                <Image
                                                    key={pIdx}
                                                    source={{ uri: imgUri }}
                                                    style={[styles.modalCarouselImage, { width: modalHeroWidth || 380 }]}
                                                    resizeMode="cover"
                                                />
                                            ))}
                                        </ScrollView>

                                        {/* Swipe Cue / Left Arrow Overlay for Multiple Images */}
                                        {hasMultiplePhotos && (
                                            <>
                                                {/* Left Arrow Button */}
                                                {activeRoomModalImgIndex > 0 && (
                                                    <TouchableOpacity
                                                        style={[styles.carouselNavBtn, styles.carouselNavBtnLeft]}
                                                        onPress={() => {
                                                            const prevIdx = activeRoomModalImgIndex - 1;
                                                            setActiveRoomModalImgIndex(prevIdx);
                                                            roomImageScrollViewRef.current?.scrollTo({ x: prevIdx * (modalHeroWidth || 380), animated: true });
                                                        }}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                                                    </TouchableOpacity>
                                                )}

                                                {/* Right Arrow Button (Swipe Left Indicator) */}
                                                {activeRoomModalImgIndex < modalRoomPhotos.length - 1 && (
                                                    <TouchableOpacity
                                                        style={[styles.carouselNavBtn, styles.carouselNavBtnRight]}
                                                        onPress={() => {
                                                            const nextIdx = activeRoomModalImgIndex + 1;
                                                            setActiveRoomModalImgIndex(nextIdx);
                                                            roomImageScrollViewRef.current?.scrollTo({ x: nextIdx * (modalHeroWidth || 380), animated: true });
                                                        }}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                                                    </TouchableOpacity>
                                                )}

                                                {/* Top Left "Swipe for More Photos" Badge */}
                                                <View style={styles.swipeHintBadge}>
                                                    <Ionicons name="swap-horizontal" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                                                    <Text style={styles.swipeHintBadgeText}>
                                                        {activeRoomModalImgIndex + 1} / {modalRoomPhotos.length} Photos (Swipe Left)
                                                    </Text>
                                                </View>
                                            </>
                                        )}

                                        {/* Pagination Dots */}
                                        {hasMultiplePhotos && (
                                            <View style={styles.modalImagePagination}>
                                                {modalRoomPhotos.map((_, dotIdx) => (
                                                    <View
                                                        key={dotIdx}
                                                        style={[
                                                            styles.modalDot,
                                                            activeRoomModalImgIndex === dotIdx && styles.modalActiveDot,
                                                        ]}
                                                    />
                                                ))}
                                            </View>
                                        )}

                                        {/* Availability Space Tag */}
                                        {selectedRoomModalData?.remainingSpaces != null && (
                                            <View style={styles.modalHeroBadge}>
                                                <Ionicons name="people-outline" size={12} color="#1B4D3E" style={{ marginRight: 4 }} />
                                                <Text style={styles.modalHeroBadgeText}>
                                                    {selectedRoomModalData.remainingSpaces} Spaces Available
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })()}

                            {/* 2. Monthly Rent Breakdown Cards (Both Per Room & Per Person) */}
                            {(() => {
                                const rawPrice = selectedRoomModalData?.monthlyPrice || selectedRoomModalData?.monthlyRent || selectedRoomModalData?.price || selectedRoomModalData?.rent || price || 0;
                                const cap = selectedRoomModalData?.totalCapacity || 1;
                                const rType = (selectedRoomModalData?.rentType || '').toUpperCase();

                                let roomRent = rawPrice;
                                let personRent = rawPrice;

                                if (rType === 'PER_PERSON' || rType === 'PERSON') {
                                    personRent = rawPrice;
                                    roomRent = rawPrice * cap;
                                } else {
                                    roomRent = rawPrice;
                                    personRent = Math.round(rawPrice / cap);
                                }

                                return (
                                    <View style={{ marginBottom: 18 }}>
                                        <Text style={styles.modalSectionLabel}>💵 Rent Breakdown</Text>
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            {/* Per Room Card */}
                                            <View style={[styles.modalPriceCard, { flex: 1, marginBottom: 0, paddingVertical: 12, paddingHorizontal: 12 }]}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                    <Ionicons name="home-outline" size={14} color="#1B4D3E" style={{ marginRight: 4 }} />
                                                    <Text style={[styles.modalPriceLabel, { marginBottom: 0 }]}>Per Room (Monthly)</Text>
                                                </View>
                                                <Text style={[styles.modalPriceValue, { fontSize: 16 }]}>
                                                    Rs. {roomRent.toLocaleString()}
                                                </Text>
                                            </View>

                                            {/* Per Person Card */}
                                            <View style={[styles.modalPriceCard, { flex: 1, marginBottom: 0, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                    <Ionicons name="person-outline" size={14} color="#475569" style={{ marginRight: 4 }} />
                                                    <Text style={[styles.modalPriceLabel, { marginBottom: 0, color: '#475569' }]}>Per Person (Monthly)</Text>
                                                </View>
                                                <Text style={[styles.modalPriceValue, { fontSize: 16, color: '#1E293B' }]}>
                                                    Rs. {personRent.toLocaleString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })()}

                            {/* 3. Utility Bills Status Banner (Directly under Monthly Rent) */}
                            <Text style={styles.modalSectionLabel}>⚡ Utility Bills Status</Text>
                            <View style={styles.utilityBillsContainer}>
                                <View style={styles.utilityBillRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={[styles.utilityIconBox, { backgroundColor: '#FEF3C7' }]}>
                                            <Ionicons name="flash-outline" size={16} color="#D97706" />
                                        </View>
                                        <Text style={styles.utilityTitleText}>Electricity Bill</Text>
                                    </View>
                                    <View style={[styles.utilityStatusTag, selectedRoomModalData?.isElectricityIncluded !== false ? styles.utilityTagIncluded : styles.utilityTagExcluded]}>
                                        <Ionicons
                                            name={selectedRoomModalData?.isElectricityIncluded !== false ? "checkmark-circle" : "close-circle"}
                                            size={13}
                                            color={selectedRoomModalData?.isElectricityIncluded !== false ? "#059669" : "#DC2626"}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={[styles.utilityStatusTagText, { color: selectedRoomModalData?.isElectricityIncluded !== false ? "#065F46" : "#991B1B" }]}>
                                            {selectedRoomModalData?.isElectricityIncluded !== false ? 'Included in Rent' : 'Paid by Occupant'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.utilityBillRow, { borderBottomWidth: 0 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={[styles.utilityIconBox, { backgroundColor: '#E0F2FE' }]}>
                                            <Ionicons name="water-outline" size={16} color="#0284C7" />
                                        </View>
                                        <Text style={styles.utilityTitleText}>Water Supply Bill</Text>
                                    </View>
                                    <View style={[styles.utilityStatusTag, selectedRoomModalData?.isWaterIncluded !== false ? styles.utilityTagIncluded : styles.utilityTagExcluded]}>
                                        <Ionicons
                                            name={selectedRoomModalData?.isWaterIncluded !== false ? "checkmark-circle" : "close-circle"}
                                            size={13}
                                            color={selectedRoomModalData?.isWaterIncluded !== false ? "#059669" : "#DC2626"}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={[styles.utilityStatusTagText, { color: selectedRoomModalData?.isWaterIncluded !== false ? "#065F46" : "#991B1B" }]}>
                                            {selectedRoomModalData?.isWaterIncluded !== false ? 'Included in Rent' : 'Paid by Occupant'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* 4. Room Specifications Section */}
                            <Text style={styles.modalSectionLabel}>Room Specifications</Text>
                            <View style={styles.modalSpecsGrid}>
                                <View style={styles.modalSpecChipFull}>
                                    <Ionicons name="home-outline" size={15} color="#1B4D3E" style={{ marginRight: 8 }} />
                                    <Text style={styles.modalSpecText}>
                                        Room Type: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{selectedRoomModalData?.roomType || 'Standard Single'}</Text>
                                    </Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="people-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Max Occupants: {selectedRoomModalData?.totalCapacity || selectedRoomModalData?.capacity || 1}</Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="bed-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Beds: {selectedRoomModalData?.beds || 1} Bed(s)</Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="water-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Washrooms: {selectedRoomModalData?.washrooms || 1}</Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="location-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Type: {selectedRoomModalData?.washroomType || (selectedRoomModalData?.hasAttachedBathroom ? 'Attached' : 'Common')}</Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="snow-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>AC: {selectedRoomModalData?.isAirConditioned ? 'Air Conditioned' : 'Non-AC'}</Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="cube-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Furnishing: {selectedRoomModalData?.isFurnished ? 'Furnished' : 'Unfurnished'}</Text>
                                </View>
                                {selectedRoomModalData?.genderPreference && (
                                    <View style={styles.modalSpecChipFull}>
                                        <Ionicons name="man-woman-outline" size={15} color="#1B4D3E" style={{ marginRight: 8 }} />
                                        <Text style={styles.modalSpecText}>Gender Preference: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{selectedRoomModalData.genderPreference}</Text></Text>
                                    </View>
                                )}
                            </View>

                            {/* 5. Room Amenities Section (Separated) */}
                            {(() => {
                                let roomAmenityList = [];
                                const rawAm = selectedRoomModalData?.amenities;
                                if (Array.isArray(rawAm)) {
                                    roomAmenityList = rawAm;
                                } else if (typeof rawAm === 'string' && rawAm.trim()) {
                                    try {
                                        const parsed = JSON.parse(rawAm);
                                        if (Array.isArray(parsed)) roomAmenityList = parsed;
                                        else if (typeof parsed === 'object') roomAmenityList = Object.keys(parsed).filter(k => parsed[k]);
                                        else roomAmenityList = rawAm.split(',').map(s => s.trim()).filter(Boolean);
                                    } catch (e) {
                                        roomAmenityList = rawAm.split(',').map(s => s.trim()).filter(Boolean);
                                    }
                                } else if (typeof rawAm === 'object' && rawAm !== null) {
                                    roomAmenityList = Object.keys(rawAm).filter(k => rawAm[k]);
                                }

                                // Fallback room amenities matching AddRoomScreen defaults
                                if (roomAmenityList.length === 0) {
                                    roomAmenityList = ['Work Desk / Study Table', 'Ceiling Fan', 'Wardrobe / Closet'];
                                    if (selectedRoomModalData?.isFurnished) roomAmenityList.push('Window Curtains', 'Private Lock');
                                    if (selectedRoomModalData?.isAirConditioned) roomAmenityList.push('Remote AC Unit');
                                }

                                const getAmenityIcon = (name) => {
                                    const lName = name.toLowerCase();
                                    if (lName.includes('desk') || lName.includes('table')) return 'library-outline';
                                    if (lName.includes('wardrobe') || lName.includes('cupboard') || lName.includes('closet')) return 'shirt-outline';
                                    if (lName.includes('fridge')) return 'cube-outline';
                                    if (lName.includes('tv') || lName.includes('television')) return 'tv-outline';
                                    if (lName.includes('iron')) return 'cut-outline';
                                    if (lName.includes('balcony')) return 'grid-outline';
                                    if (lName.includes('entrance') || lName.includes('lock')) return 'lock-closed-outline';
                                    if (lName.includes('fan')) return 'sync-outline';
                                    if (lName.includes('wifi')) return 'wifi-outline';
                                    return 'checkmark-circle-outline';
                                };

                                return (
                                    <>
                                        <Text style={styles.modalSectionLabel}>Room Features & Additional Amenities</Text>
                                        <View style={styles.modalAmenitiesGrid}>
                                            {roomAmenityList.map((amName, aIdx) => (
                                                <View key={aIdx} style={styles.modalAmenityCard}>
                                                    <Ionicons name={getAmenityIcon(amName)} size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                                    <Text style={styles.modalAmenityText}>{amName}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </>
                                );
                            })()}

                            {/* 6. Description / Notes */}
                            {selectedRoomModalData?.description ? (
                                <>
                                    <Text style={styles.modalSectionLabel}>Room Description</Text>
                                    <Text style={styles.modalDescText}>{selectedRoomModalData.description}</Text>
                                </>
                            ) : null}
                        </ScrollView>

                        {/* Modal Select Action Button */}
                        <TouchableOpacity
                            style={styles.modalSelectBtn}
                            onPress={() => {
                                if (selectedRoomModalData) {
                                    const rId = selectedRoomModalData.id || selectedRoomModalData.roomNumber || 'shared';
                                    setSelectedRoom(rId);
                                }
                                setIsRoomModalVisible(false);
                                setIsBookingModalVisible(true);
                            }}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.modalSelectBtnText}>Select Room & Book Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Fixed Bottom Action Bar */}
            <View style={styles.bottomFixedBar}>
                <View>
                    <Text style={styles.bottomPriceVal}>Rs.{price}</Text>
                    <TouchableOpacity>
                        <Text style={styles.bottomViewDetailsLink}>View Details</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.bookNowBtn}
                    onPress={handleBookNowPress}
                    activeOpacity={0.85}
                >
                    <Text style={styles.bookNowBtnText}>BOOK NOW</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingBottom: 24,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Hero Image & Top Bar */
    imageContainer: {
        position: 'relative',
        height: 280,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    topBarOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 30,
        elevation: 10,
    },
    topRightActions: {
        flexDirection: 'row',
        gap: 10,
    },
    circleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        zIndex: 35,
    },
    paginationDots: {
        position: 'absolute',
        bottom: 14,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        zIndex: 20,
        elevation: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: 'rgba(255, 255, 255, 0.45)',
    },
    activeDot: {
        backgroundColor: '#FFD700',
        width: 18,
        height: 7,
        borderRadius: 3.5,
    },

    /* Main Content */
    content: {
        paddingHorizontal: 20,
        paddingTop: 18,
    },
    titleRatingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
        gap: 10,
    },
    mainTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.4,
    },
    headerRatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginTop: 2,
    },
    headerRatingScore: {
        fontSize: 13,
        fontWeight: '800',
        color: '#92400E',
        marginRight: 2,
    },
    headerReviewsCount: {
        fontSize: 11,
        fontWeight: '700',
        color: '#B45309',
    },
    locationHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    locationHeaderText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    distanceBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F4EA',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
        marginBottom: 14,
    },
    distanceBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#133E32',
    },
    /* Owner Card */
    ownerCard: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 14,
        marginTop: 6,
        marginBottom: 16,
    },
    ownerInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ownerAvatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    ownerAvatarFallback: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1B4D3E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    ownerAvatarInitial: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    ownerTextContainer: {
        flex: 1,
    },
    ownerNameText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    ownerRoleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    ownerActionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    whatsappBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25D366',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    whatsappBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    otherPropertiesBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F4EA',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    otherPropertiesBtnText: {
        color: '#1B4D3E',
        fontSize: 12,
        fontWeight: '800',
    },

    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 20,
    },

    /* Section Titles */
    sectionHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
    },
    aboutParagraph: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 20,
    },

    /* Compact Amenities Grid */
    compactAmenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    compactAmenityCard: {
        width: '48.5%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    compactAmenityText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
    },

    /* Annex Card Styles */
    annexCard: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    annexHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    annexTitleText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    annexGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    annexBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    annexBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    annexPriceBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
    },
    annexPriceLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 2,
    },
    annexPriceVal: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    annexUtilitySection: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 10,
    },
    annexUtilityHeading: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    annexUtilityRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    annexUtilityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    annexUtilityChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
    },

    /* Available Rooms Card - Horizontal Layout */
    roomCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    horizontalRoomCard: {
        width: 280,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        marginRight: 14,
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    roomImageContainer: {
        position: 'relative',
        height: 125,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    roomCardImage: {
        width: '100%',
        height: '100%',
    },
    roomImageBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    roomImageBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    roomCardContentBody: {
        padding: 12,
    },
    roomHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    roomTypeTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
    },
    roomCardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roomBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1B4D3E',
    },
    roomFeaturePillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
        marginBottom: 12,
    },
    roomFeaturePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roomFeaturePillText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#133E32',
    },
    bulletsContainer: {
        marginBottom: 14,
        gap: 4,
    },
    bulletItem: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    roomCardDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 10,
    },
    roomPriceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    roomPriceText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1B4D3E',
    },
    roomPricePeriod: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    roomActionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    viewRoomBtn: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1B4D3E',
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewRoomBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    selectRoomCardBtn: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#1B4D3E',
        paddingVertical: 8,
        borderRadius: 8,
    },
    selectRoomCardBtnActive: {
        backgroundColor: '#1B4D3E',
        borderColor: '#1B4D3E',
    },
    selectRoomCardBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    selectRoomCardBtnTextActive: {
        color: '#FFFFFF',
    },
    selectRoomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    selectRoomText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
    },

    /* Room Modal Styles */
    roomModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    roomModalContainer: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    roomModalScrollView: {
        flexGrow: 1,
    },
    roomModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginBottom: 16,
    },
    roomModalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    modalPriceCard: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    modalPriceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 2,
    },
    modalPriceValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1B4D3E',
    },
    modalPriceBasis: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    modalSectionLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
        marginTop: 4,
    },
    modalHeroImageContainer: {
        position: 'relative',
        height: 180,
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#F1F5F9',
    },
    modalCarouselImage: {
        height: 180,
    },
    carouselNavBtn: {
        position: 'absolute',
        top: '40%',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 12,
    },
    carouselNavBtnLeft: {
        left: 10,
    },
    carouselNavBtnRight: {
        right: 10,
    },
    swipeHintBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        zIndex: 10,
    },
    swipeHintBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalImagePagination: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 5,
        zIndex: 10,
    },
    modalDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    modalActiveDot: {
        backgroundColor: '#FFD700',
        width: 14,
    },
    modalHeroBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        elevation: 2,
        zIndex: 11,
    },
    modalHeroBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    utilityBillsContainer: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginBottom: 16,
    },
    utilityBillRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    utilityIconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    utilityTitleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    utilityStatusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    utilityTagIncluded: {
        backgroundColor: '#E6F4EA',
    },
    utilityTagExcluded: {
        backgroundColor: '#FEE2E2',
    },
    utilityStatusTagText: {
        fontSize: 11,
        fontWeight: '800',
    },
    modalSpecsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    modalSpecChip: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    modalSpecChipFull: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    modalSpecText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        flex: 1,
    },
    modalAmenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    modalAmenityCard: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    modalAmenityText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
    },
    modalDescText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 16,
    },
    modalSelectBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1B4D3E',
        borderRadius: 12,
        paddingVertical: 13,
        marginTop: 10,
    },
    modalSelectBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    /* Map Card */
    mapCard: {
        position: 'relative',
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapOverlayPin: {
        position: 'absolute',
        top: '40%',
        left: '42%',
        alignItems: 'center',
    },
    mapPinBadge: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    mapPinText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Rating & Reviews Golden Badge Section */
    ratingBadgeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 4,
        marginBottom: 20,
    },
    ratingBadgeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    goldenStarContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    ratingBadgeTextCol: {
        flex: 1,
    },
    ratingBadgeScore: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
    },
    ratingBadgeMax: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    starsRowCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    ratingsVerifiedText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B4D3E',
        marginLeft: 6,
    },
    ratingBadgeActionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    seeReviewsBtn: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#E6F0EC',
        paddingVertical: 10,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    seeReviewsBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Fixed Bottom Action Bar */
    bottomFixedBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    bottomPriceVal: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
    },
    bottomViewDetailsLink: {
        fontSize: 12,
        color: '#64748B',
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
    bookNowBtn: {
        backgroundColor: '#D97706',
        borderRadius: 12,
        paddingHorizontal: 28,
        paddingVertical: 12,
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    bookNowBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});
