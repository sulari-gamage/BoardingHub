import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    Platform,
    Linking,
    Dimensions,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import BookingRequestModal from '../../components/BookingRequestModal';

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
    const [selectedRoom, setSelectedRoom] = useState('shared');
    const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
    const [selectedRoomModalData, setSelectedRoomModalData] = useState(null);
    const [isRoomModalVisible, setIsRoomModalVisible] = useState(false);

    const handleOpenRoomModal = (roomItem) => {
        setSelectedRoomModalData(roomItem);
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
    const rating = boarding.rating || 4.8;
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
                    <View style={styles.topBarOverlay}>
                        <TouchableOpacity style={styles.circleBtn} onPress={onBack} activeOpacity={0.8}>
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
                                        const rentBasisLabel = roomItem.rentType === 'PER_ROOM' ? '/ Room / mo' : '/ Person / mo';
                                        const roomPriceFormatted = (roomItem.monthlyPrice || price).toLocaleString();
                                        const roomImgUri = roomItem.imageUrl || roomItem.image || (imagesList && imagesList.length > 0 ? imagesList[index % imagesList.length] : 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600');

                                        // Formatted Title: Room Name (Room Type)
                                        const baseRoomName = roomItem.roomName || roomItem.roomNumber || roomItem.name || `Room ${index + 1}`;
                                        const fullRoomTitle = roomItem.roomType ? `${baseRoomName} (${roomItem.roomType})` : baseRoomName;

                                        // Build special feature pills list (Bathroom count only, no type)
                                        const featurePills = [];
                                        const bathCount = roomItem.washrooms || (roomItem.washroomType || roomItem.hasAttachedBathroom ? 1 : null);
                                        if (bathCount != null) {
                                            featurePills.push({ icon: 'water-outline', label: `${bathCount} ${bathCount === 1 ? 'Bath' : 'Baths'}` });
                                        }
                                        if (roomItem.isAirConditioned != null) {
                                            featurePills.push({ icon: 'snow-outline', label: roomItem.isAirConditioned ? 'AC Room' : 'Non-AC' });
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
                                                    {/* Room Header Row */}
                                                    <View style={styles.roomHeaderRow}>
                                                        <Text style={styles.roomTypeTitle} numberOfLines={1}>
                                                            {baseRoomName}
                                                            {roomItem.roomType ? (
                                                                <Text style={{ fontWeight: '400', fontSize: 12, color: '#64748B' }}>
                                                                    {` (${roomItem.roomType})`}
                                                                </Text>
                                                            ) : null}
                                                        </Text>
                                                    </View>

                                                    {/* Special Room Features Pills */}
                                                    {featurePills.length > 0 && (
                                                        <View style={styles.roomFeaturePillsRow}>
                                                            {featurePills.map((pill, pIdx) => (
                                                                <View key={pIdx} style={styles.roomFeaturePill}>
                                                                    <Ionicons name={pill.icon} size={11} color="#133E32" style={{ marginRight: 4 }} />
                                                                    <Text style={styles.roomFeaturePillText}>{pill.label}</Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}

                                                    <View style={styles.roomCardDivider} />

                                                    {/* Room Card Footer Row */}
                                                    <View style={styles.roomFooterRow}>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.roomPriceText}>Rs.{roomPriceFormatted}</Text>
                                                            <Text style={styles.roomPricePeriod}>{rentBasisLabel}</Text>
                                                        </View>

                                                        <TouchableOpacity
                                                            style={styles.viewRoomBtn}
                                                            onPress={() => handleOpenRoomModal(roomItem)}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Ionicons name="eye-outline" size={14} color="#1B4D3E" style={{ marginRight: 4 }} />
                                                            <Text style={styles.viewRoomBtnText}>View</Text>
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
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setIsRoomModalVisible(false)}
                >
                    <View style={styles.roomModalContainer} onStartShouldSetResponder={() => true}>
                        <View style={styles.roomModalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="bed-outline" size={20} color="#1B4D3E" style={{ marginRight: 8 }} />
                                <Text style={styles.roomModalTitle}>
                                    {selectedRoomModalData?.roomName || selectedRoomModalData?.roomNumber || selectedRoomModalData?.name || 'Room Details'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsRoomModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={22} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {/* Rent & Price Header Card */}
                            <View style={styles.modalPriceCard}>
                                <Text style={styles.modalPriceLabel}>Monthly Rent</Text>
                                <Text style={styles.modalPriceValue}>
                                    Rs. {(selectedRoomModalData?.monthlyPrice || selectedRoomModalData?.price || price).toLocaleString()}
                                    <Text style={styles.modalPriceBasis}>
                                        {selectedRoomModalData?.rentType === 'PER_ROOM' ? ' / Room / Month' : ' / Person / Month'}
                                    </Text>
                                </Text>
                            </View>

                            {/* Specs Grid */}
                            <Text style={styles.modalSectionLabel}>Room Specifications</Text>
                            <View style={styles.modalSpecsGrid}>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="people-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Capacity: {selectedRoomModalData?.totalCapacity || 1} Person(s)</Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="bed-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Beds: {selectedRoomModalData?.beds || 1} Bed(s)</Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="water-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Washroom: {selectedRoomModalData?.washroomType || (selectedRoomModalData?.hasAttachedBathroom ? 'Attached' : 'Shared')}</Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="snow-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Air Conditioning: {selectedRoomModalData?.isAirConditioned ? 'Yes (AC)' : 'No (Non-AC)'}</Text>
                                </View>
                                <View style={styles.modalSpecChip}>
                                    <Ionicons name="cube-outline" size={15} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.modalSpecText}>Furnished: {selectedRoomModalData?.isFurnished ? 'Fully Furnished' : 'Unfurnished'}</Text>
                                </View>
                                {selectedRoomModalData?.remainingSpaces != null && (
                                    <View style={styles.modalSpecChip}>
                                        <Ionicons name="time-outline" size={15} color="#15803D" style={{ marginRight: 6 }} />
                                        <Text style={[styles.modalSpecText, { color: '#15803D', fontWeight: '800' }]}>
                                            {selectedRoomModalData.remainingSpaces} Spaces Available
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Additional Description / Notes */}
                            {selectedRoomModalData?.description ? (
                                <>
                                    <Text style={styles.modalSectionLabel}>Description</Text>
                                    <Text style={styles.modalDescText}>{selectedRoomModalData.description}</Text>
                                </>
                            ) : null}
                        </ScrollView>

                        {/* Modal Select Action Button */}
                        <TouchableOpacity
                            style={styles.modalSelectBtn}
                            onPress={() => {
                                if (selectedRoomModalData) {
                                    setSelectedRoom(selectedRoomModalData.id || selectedRoomModalData.roomNumber || 'shared');
                                }
                                setIsRoomModalVisible(false);
                            }}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.modalSelectBtnText}>Select This Room</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
        paddingTop: Platform.OS === 'android' ? 20 : 0,
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
        elevation: 3,
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
        width: 260,
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
        marginBottom: 14,
    },
    roomFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomPriceText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    roomPricePeriod: {
        fontSize: 12,
        color: '#64748B',
    },
    viewRoomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F4EA',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    viewRoomBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B4D3E',
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    roomModalContainer: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
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
    modalSpecText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
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
