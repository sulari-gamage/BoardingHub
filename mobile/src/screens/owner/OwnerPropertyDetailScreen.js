import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Image,
    Platform,
    Linking,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import OccupantDetailsModal from '../../components/OccupantDetailsModal';

export default function OwnerPropertyDetailScreen({
    property,
    onBack,
    onOpenRooms,
    onOpenGallery,
    onEditProperty,
    onOpenBookings,
    onPropertyUpdated
}) {
    const [currentProperty, setCurrentProperty] = useState(property || {
        id: 'p1',
        title: 'Green Valley Boarding',
        address: '169, 44 Dewelta Homes, John Rodrigo Mawatha',
        city: 'Moratuwa',
        price: 15000,
        status: 'ACTIVE',
        isApproved: true,
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        totalRooms: 4,
        availableRooms: 2
    });

    const [propertyReviews, setPropertyReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [approvedOccupants, setApprovedOccupants] = useState([]);
    const [loadingOccupants, setLoadingOccupants] = useState(false);
    const [isOccupantModalVisible, setIsOccupantModalVisible] = useState(false);

    useEffect(() => {
        if (currentProperty?.id) {
            setLoadingReviews(true);
            api.reviews.getByPropertyId(currentProperty.id)
                .then((res) => {
                    if (res && Array.isArray(res)) {
                        setPropertyReviews(res);
                    }
                })
                .catch((err) => console.log('[OwnerPropertyDetail] Reviews fetch error:', err))
                .finally(() => setLoadingReviews(false));

            setLoadingOccupants(true);
            api.bookings.getByPropertyId(currentProperty.id)
                .then((res) => {
                    if (res && Array.isArray(res)) {
                        setApprovedOccupants(res.filter(b => b.status === 'APPROVED'));
                    }
                })
                .catch((err) => console.log('[OwnerPropertyDetail] Occupants fetch error:', err))
                .finally(() => setLoadingOccupants(false));
        }
    }, [currentProperty?.id]);

    const reloadPropertyAndOccupants = async () => {
        if (!currentProperty?.id) return;
        try {
            setLoadingOccupants(true);
            const [latestProp, latestBookings] = await Promise.all([
                api.properties.getById(currentProperty.id).catch(() => null),
                api.bookings.getByPropertyId(currentProperty.id).catch(() => [])
            ]);

            if (latestProp) {
                const lTotal = (latestProp.rooms && latestProp.rooms.length > 0)
                    ? latestProp.rooms.reduce((acc, r) => acc + (r.totalCapacity || 1), 0)
                    : (latestProp.totalCapacity || latestProp.bedsCount || 1);
                const lOcc = (latestProp.rooms && latestProp.rooms.length > 0)
                    ? latestProp.rooms.reduce((acc, r) => acc + (r.occupied != null ? r.occupied : Math.max(0, (r.totalCapacity || 1) - (r.remainingSpaces != null ? r.remainingSpaces : 0))), 0)
                    : (latestProp.totalOccupied != null ? latestProp.totalOccupied : 0);
                const lAvail = Math.max(0, lTotal - lOcc);

                setCurrentProperty({
                    id: latestProp.id,
                    title: latestProp.title,
                    address: latestProp.address,
                    city: latestProp.city,
                    price: latestProp.monthlyRent || 0,
                    totalRooms: lTotal,
                    availableRooms: lAvail,
                    rooms: latestProp.rooms || [],
                    amenities: latestProp.amenities || [],
                    raw: latestProp,
                    imageUrls: latestProp.imageUrls,
                    images: latestProp.images,
                    imageUrl: (latestProp.imageUrls && latestProp.imageUrls.length > 0) ? latestProp.imageUrls[0] : null
                });
            }

            if (latestBookings && Array.isArray(latestBookings)) {
                setApprovedOccupants(latestBookings.filter(b => b.status === 'APPROVED'));
            }
        } catch (e) {
            console.log('Error reloading property occupants:', e);
        } finally {
            setLoadingOccupants(false);
        }
    };

    useEffect(() => {
        if (!property) return;

        const propToUse = property.raw || property;
        const totalCap = (propToUse.rooms && propToUse.rooms.length > 0)
            ? propToUse.rooms.reduce((acc, r) => acc + (r.totalCapacity || 1), 0)
            : (propToUse.totalCapacity || propToUse.bedsCount || 1);
        const occCap = (propToUse.rooms && propToUse.rooms.length > 0)
            ? propToUse.rooms.reduce((acc, r) => acc + (r.occupied != null ? r.occupied : Math.max(0, (r.totalCapacity || 1) - (r.remainingSpaces != null ? r.remainingSpaces : 0))), 0)
            : (propToUse.totalOccupied != null ? propToUse.totalOccupied : 0);
        const availCap = Math.max(0, totalCap - occCap);

        setCurrentProperty({
            id: propToUse.id,
            title: propToUse.title,
            address: propToUse.address,
            city: propToUse.city,
            price: propToUse.monthlyRent || propToUse.price || 0,
            propertyNature: propToUse.propertyNature,
            totalRooms: totalCap,
            availableRooms: availCap,
            rooms: propToUse.rooms || [],
            amenities: propToUse.amenities || [],
            raw: propToUse,
            imageUrls: propToUse.imageUrls,
            images: propToUse.images,
            imageUrl: (propToUse.imageUrls && propToUse.imageUrls.length > 0) ? propToUse.imageUrls[0] : null
        });

        if (!property?.id) return;
        let isMounted = true;
        const fetchLatest = async () => {
            try {
                const latest = await api.properties.getById(property.id);
                if (isMounted) {
                    const lTotal = (latest.rooms && latest.rooms.length > 0)
                        ? latest.rooms.reduce((acc, r) => acc + (r.totalCapacity || 1), 0)
                        : (latest.totalCapacity || latest.bedsCount || 1);
                    const lOcc = (latest.rooms && latest.rooms.length > 0)
                        ? latest.rooms.reduce((acc, r) => acc + (r.occupied != null ? r.occupied : Math.max(0, (r.totalCapacity || 1) - (r.remainingSpaces != null ? r.remainingSpaces : 0))), 0)
                        : (latest.totalOccupied != null ? latest.totalOccupied : 0);
                    const lAvail = Math.max(0, lTotal - lOcc);

                    const mapped = {
                        id: latest.id,
                        title: latest.title,
                        address: latest.address,
                        city: latest.city,
                        price: latest.monthlyRent || 0,
                        totalRooms: lTotal,
                        availableRooms: lAvail,
                        rooms: latest.rooms || [],
                        amenities: latest.amenities || [],
                        raw: latest,
                        imageUrls: latest.imageUrls,
                        images: latest.images,
                        imageUrl: (latest.imageUrls && latest.imageUrls.length > 0) ? latest.imageUrls[0] : null
                    };
                    setCurrentProperty(mapped);
                }
            } catch (e) { }
        };
        fetchLatest();
        return () => { isMounted = false; };
    }, [property]);

    const handleMapPress = () => {
        const lat = currentProperty.latitude || 6.9271;
        const lng = currentProperty.longitude || 79.8612;
        const label = encodeURIComponent(currentProperty.title || 'Boarding Location');

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

    const isAnnex = (currentProperty?.propertyNature === 'WHOLE_HOUSE' || currentProperty?.raw?.propertyNature === 'WHOLE_HOUSE' || currentProperty?.propertyNature === 'ANNEX' || currentProperty?.raw?.propertyNature === 'ANNEX' || currentProperty?.boardingType === 'ANNEX' || currentProperty?.raw?.boardingType === 'ANNEX' || currentProperty?.boardingType === 'WHOLE_HOUSE');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Top Navigation Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#133E32" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{currentProperty.title}</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Cover Image & Approved Status Badge */}
                <View style={styles.coverWrapper}>
                    {((currentProperty.imageUrls && currentProperty.imageUrls.length > 0) ||
                        (currentProperty.images && currentProperty.images.length > 0) ||
                        currentProperty.imageUrl) ? (
                        <Image
                            source={{
                                uri: (currentProperty.imageUrls && currentProperty.imageUrls.length > 0)
                                    ? currentProperty.imageUrls[0]
                                    : (currentProperty.images && currentProperty.images.length > 0)
                                        ? (typeof currentProperty.images[0] === 'string' ? currentProperty.images[0] : currentProperty.images[0].imageUrl)
                                        : currentProperty.imageUrl
                            }}
                            style={styles.coverImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.coverImage, { backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="home-outline" size={54} color="#133E32" />
                        </View>
                    )}

                    <View style={styles.approvedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={styles.approvedText}>Approved</Text>
                    </View>
                </View>

                {(currentProperty.availableRooms === 0 || currentProperty.raw?.isFilled) && (
                    <View style={{ backgroundColor: '#FEF2F2', borderColor: '#DC2626', borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <Ionicons name="people" size={20} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '900', color: '#991B1B' }}>PROPERTY FULLY OCCUPIED</Text>
                                <Text style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>All spaces filled. See booking summaries below.</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                            onPress={() => setIsOccupantModalVisible(true)}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Summaries</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Quick Actions Title & Grid - Hidden if Annex Property is Fully Filled */}
                {!(isAnnex && (currentProperty.availableRooms === 0 || currentProperty.raw?.isFilled)) && (
                    <>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <View style={styles.quickGrid}>
                            {/* Rooms Card - Only for ROOM_BASED boarding properties */}
                            {!(currentProperty?.propertyNature === 'WHOLE_HOUSE' || currentProperty?.raw?.propertyNature === 'WHOLE_HOUSE' || currentProperty?.propertyNature === 'ANNEX' || currentProperty?.raw?.propertyNature === 'ANNEX') && (
                                <TouchableOpacity style={styles.actionCard} onPress={onOpenRooms} activeOpacity={0.85}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="bed-outline" size={24} color="#133E32" />
                                    </View>
                                    <Text style={styles.actionCardTitle}>Rooms</Text>
                                </TouchableOpacity>
                            )}

                            {/* Images Card */}
                            <TouchableOpacity style={styles.actionCard} onPress={() => onOpenGallery && onOpenGallery(currentProperty)} activeOpacity={0.85}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="add-circle-outline" size={26} color="#133E32" />
                                </View>
                                <Text style={styles.actionCardTitle}>Images</Text>
                            </TouchableOpacity>

                            {/* Edit Card */}
                            <TouchableOpacity style={styles.actionCard} onPress={onEditProperty} activeOpacity={0.85}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="pencil-outline" size={24} color="#133E32" />
                                </View>
                                <Text style={styles.actionCardTitle}>Edit</Text>
                            </TouchableOpacity>

                            {/* Booking Card */}
                            <TouchableOpacity style={styles.actionCard} onPress={onOpenBookings} activeOpacity={0.85}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="calendar-outline" size={24} color="#133E32" />
                                </View>
                                <Text style={styles.actionCardTitle}>Booking</Text>
                            </TouchableOpacity>

                            {/* Occupants Card - Only for Annex / Whole House (non-room-based) properties */}
                            {(currentProperty?.propertyNature === 'WHOLE_HOUSE' || currentProperty?.raw?.propertyNature === 'WHOLE_HOUSE' || currentProperty?.propertyNature === 'ANNEX' || currentProperty?.raw?.propertyNature === 'ANNEX' || currentProperty?.boardingType === 'ANNEX' || currentProperty?.raw?.boardingType === 'ANNEX' || currentProperty?.boardingType === 'WHOLE_HOUSE') && (
                                <TouchableOpacity style={styles.actionCard} onPress={() => setIsOccupantModalVisible(true)} activeOpacity={0.85}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="people-outline" size={24} color="#133E32" />
                                    </View>
                                    <Text style={styles.actionCardTitle}>Occupants</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                )}

                {/* Property Information */}
                <Text style={styles.sectionTitle}>Property Information</Text>
                <View style={styles.infoCard}>
                    {/* Location Row */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                            <Ionicons name="location-outline" size={20} color="#133E32" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>LOCATION</Text>
                            <Text style={styles.infoValue}>
                                {currentProperty.city ? `${currentProperty.address}, ${currentProperty.city}` : (currentProperty.location || currentProperty.address || 'Location Not Set')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Pricing Row */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconWrapper}>
                            <Ionicons name="pricetag-outline" size={20} color="#133E32" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>PRICING</Text>
                            <Text style={styles.infoValue}>Total LKR {(currentProperty.price || 0).toLocaleString()} / month</Text>
                        </View>
                    </View>

                    {/* House Layout Specifications if Whole House */}
                    {(currentProperty.raw?.roomsCount > 0 || currentProperty.raw?.bedsCount > 0 || currentProperty.raw?.hasKitchen !== undefined) && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconWrapper}>
                                    <Ionicons name="home-outline" size={20} color="#133E32" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.infoLabel}>HOUSE SPECIFICATIONS</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                        {currentProperty.raw?.roomsCount > 0 && (
                                            <View style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FEF08A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="bed-outline" size={12} color="#D97706" style={{ marginRight: 4 }} />
                                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#B45309' }}>{currentProperty.raw.roomsCount} Rooms</Text>
                                            </View>
                                        )}
                                        {currentProperty.raw?.bedsCount > 0 && (
                                            <View style={{ backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="bed-outline" size={12} color="#334155" style={{ marginRight: 4 }} />
                                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#334155' }}>{currentProperty.raw.bedsCount} Beds</Text>
                                            </View>
                                        )}
                                        {currentProperty.raw?.bathsCount > 0 && (
                                            <View style={{ backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="water-outline" size={12} color="#334155" style={{ marginRight: 4 }} />
                                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#334155' }}>{currentProperty.raw.bathsCount} Baths</Text>
                                            </View>
                                        )}
                                        {currentProperty.raw?.hasKitchen && (
                                            <View style={{ backgroundColor: '#E6F0EC', borderWidth: 1, borderColor: '#C3DCD4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="restaurant-outline" size={12} color="#133E32" style={{ marginRight: 4 }} />
                                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#133E32' }}>Kitchen Included</Text>
                                            </View>
                                        )}
                                        {currentProperty.raw?.isFurnished !== undefined && (
                                            <View style={{ backgroundColor: '#E6F0EC', borderWidth: 1, borderColor: '#C3DCD4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="checkmark-circle-outline" size={12} color="#133E32" style={{ marginRight: 4 }} />
                                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#133E32' }}>{currentProperty.raw.isFurnished ? 'Furnished' : 'Unfurnished'}</Text>
                                            </View>
                                        )}
                                        {currentProperty.raw?.isElectricityIncluded !== undefined && (
                                            <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="flash-outline" size={12} color="#133E32" style={{ marginRight: 4 }} />
                                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#133E32' }}>
                                                    {currentProperty.raw.isElectricityIncluded ? '⚡ Electricity Included' : '⚡ Occupants Pay Electricity'}
                                                </Text>
                                            </View>
                                        )}
                                        {currentProperty.raw?.isWaterIncluded !== undefined && (
                                            <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="water-outline" size={12} color="#133E32" style={{ marginRight: 4 }} />
                                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#133E32' }}>
                                                    {currentProperty.raw.isWaterIncluded ? '💧 Water Included' : '💧 Occupants Pay Water'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* Annex Occupancy & Vacancies Summary (Shown for Annex / Whole House boardings before Amenities) */}
                {isAnnex && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={styles.sectionTitle}>Occupancy & Vacancies</Text>
                        <View style={styles.annexStatsCard}>
                            <View style={styles.annexStatBox}>
                                <Ionicons name="people" size={22} color="#1D4ED8" style={{ marginBottom: 4 }} />
                                <Text style={styles.annexStatValOccupants}>{approvedOccupants.length}</Text>
                                <Text style={styles.annexStatLabel}>Occupants</Text>
                            </View>

                            <View style={styles.annexStatDivider} />

                            <View style={styles.annexStatBox}>
                                <Ionicons name="key" size={22} color="#15803D" style={{ marginBottom: 4 }} />
                                <Text style={styles.annexStatValVacancies}>
                                    {Math.max(0, (currentProperty.raw?.totalCapacity || currentProperty.totalRooms || 1) - approvedOccupants.length)}
                                </Text>
                                <Text style={styles.annexStatLabel}>Vacancies</Text>
                            </View>

                            <View style={styles.annexStatDivider} />

                            <View style={styles.annexStatBox}>
                                <Ionicons name="home-outline" size={22} color="#B45309" style={{ marginBottom: 4 }} />
                                <Text style={styles.annexStatValTotal}>
                                    {currentProperty.raw?.totalCapacity || currentProperty.totalRooms || 1}
                                </Text>
                                <Text style={styles.annexStatLabel}>Total Capacity</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Amenities Section */}
                {((currentProperty.amenities && currentProperty.amenities.length > 0) || (currentProperty.raw && currentProperty.raw.amenities && currentProperty.raw.amenities.length > 0)) && (
                    <>
                        <Text style={styles.sectionTitle}>Property Amenities</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                            {(currentProperty.amenities || currentProperty.raw.amenities).map((amenity, idx) => (
                                <View key={idx} style={{ backgroundColor: '#E6F0EC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#C3DCD4' }}>
                                    <Ionicons name="checkmark-circle" size={16} color="#133E32" style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#133E32' }}>{amenity}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Rooms Inventory Section if present */}
                {currentProperty.rooms && currentProperty.rooms.length > 0 && (
                    <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.sectionTitle}>Rooms Breakdown ({currentProperty.rooms.length})</Text>
                            <TouchableOpacity onPress={onOpenRooms}>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: '#133E32' }}>Manage Rooms &gt;</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ gap: 12, marginBottom: 20 }}>
                            {currentProperty.rooms.map((room, idx) => {
                                const rName = room.roomName || room.roomNumber || room.name || `Room ${idx + 1}`;
                                const rType = room.roomType || '';
                                const subDetails = [
                                    rType ? `${rType} Type` : null,
                                    room.beds ? `${room.beds} Bed(s)` : null,
                                    room.washrooms ? `${room.washrooms} ${room.washroomType || ''} Bath` : null
                                ].filter(Boolean).join(' • ');

                                const totCap = room.totalCapacity || 1;
                                const vacancies = room.remainingSpaces != null ? room.remainingSpaces : Math.max(0, totCap - (room.occupied || 0));
                                const occupants = room.occupied != null ? room.occupied : Math.max(0, totCap - vacancies);
                                const priceVal = room.monthlyPrice || room.monthlyRent || room.price || 0;
                                const rentTypeLabel = room.rentType === 'PER_PERSON' ? '/ person / mo' : '/ room / mo';

                                return (
                                    <TouchableOpacity
                                        key={room.id || idx}
                                        style={styles.ownerRoomCardContainer}
                                        onPress={onOpenRooms}
                                        activeOpacity={0.88}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <View style={{ flex: 1, paddingRight: 8 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }} numberOfLines={1}>{rName}</Text>
                                                {subDetails ? (
                                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 2 }}>{subDetails}</Text>
                                                ) : null}
                                            </View>
                                            <View style={{ backgroundColor: '#E6F0EC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#C3DCD4' }}>
                                                <Text style={{ fontSize: 13, fontWeight: '900', color: '#133E32' }}>
                                                    LKR {priceVal.toLocaleString()}
                                                </Text>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#1B4D3E', textAlign: 'right' }}>
                                                    {rentTypeLabel}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Vacancies & Occupants Badges Row */}
                                        <View style={styles.roomBadgeStatusRow}>
                                            <View style={styles.roomOccupantsBadge}>
                                                <Ionicons name="people" size={13} color="#1D4ED8" style={{ marginRight: 4 }} />
                                                <Text style={styles.roomOccupantsBadgeText}>Occupants: {occupants}</Text>
                                            </View>

                                            <View style={styles.roomVacanciesBadge}>
                                                <Ionicons name="key" size={13} color="#15803D" style={{ marginRight: 4 }} />
                                                <Text style={styles.roomVacanciesBadgeText}>Vacancies: {vacancies}</Text>
                                            </View>

                                            <View style={styles.roomTotalBadge}>
                                                <Text style={styles.roomTotalBadgeText}>Total: {totCap}</Text>
                                            </View>
                                        </View>

                                        {/* Tap navigation footer */}
                                        <View style={styles.roomTapFooter}>
                                            <Text style={styles.roomTapFooterText}>Tap card to view room details & management</Text>
                                            <Ionicons name="chevron-forward" size={14} color="#133E32" />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}

                {/* Approved Occupants Preview */}
                {approvedOccupants.length > 0 && (
                    <View style={{ marginBottom: 22 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.sectionTitle}>Approved Occupants ({approvedOccupants.length})</Text>
                            <TouchableOpacity onPress={() => setIsOccupantModalVisible(true)}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#133E32' }}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        {approvedOccupants.slice(0, 3).map((occ, idx) => {
                            const name = occ.seekerName || occ.userName || 'Occupant';
                            const initial = name.charAt(0).toUpperCase();
                            let avatar = occ.seekerAvatarUrl || occ.seekerAvatar;
                            if (avatar && typeof avatar === 'string' && avatar.startsWith('/')) {
                                const baseUrl = api.getBaseUrl ? api.getBaseUrl() : 'http://192.168.1.100:8080';
                                avatar = `${baseUrl}${avatar}`;
                            }
                            const phone = occ.seekerPhone || occ.seekerWhatsapp || '';

                            return (
                                <TouchableOpacity
                                    key={occ.id || idx}
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: 16,
                                        padding: 14,
                                        marginBottom: 10,
                                        borderWidth: 1,
                                        borderColor: '#E2E8F0',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                    onPress={() => setIsOccupantModalVisible(true)}
                                    activeOpacity={0.85}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        {avatar ? (
                                            <Image source={{ uri: avatar }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
                                        ) : (
                                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <Text style={{ fontSize: 18, fontWeight: '900', color: '#133E32' }}>{initial}</Text>
                                            </View>
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{name}</Text>
                                            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                                {occ.roomName ? `Room: ${occ.roomName}` : 'Approved Resident'}
                                            </Text>
                                        </View>
                                    </View>

                                    {phone ? (
                                        <TouchableOpacity
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: '#25D366',
                                                paddingHorizontal: 12,
                                                paddingVertical: 7,
                                                borderRadius: 10,
                                            }}
                                            onPress={() => {
                                                const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
                                                const formatted = cleanPhone.startsWith('0') ? '94' + cleanPhone.substring(1) : cleanPhone;
                                                const msg = encodeURIComponent(`Hi ${name}, contacting you via BoardingHub.`);
                                                Linking.openURL(`whatsapp://send?phone=${formatted}&text=${msg}`).catch(() => {
                                                    Linking.openURL(`https://wa.me/${formatted}?text=${msg}`);
                                                });
                                            }}
                                            activeOpacity={0.85}
                                        >
                                            <Ionicons name="logo-whatsapp" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
                                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>WhatsApp</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Seeker Reviews Section */}
                <View style={{ marginBottom: 22 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={styles.sectionTitle}>Seeker Reviews ({propertyReviews.length})</Text>
                    </View>

                    {loadingReviews ? (
                        <ActivityIndicator size="small" color="#133E32" style={{ marginVertical: 15 }} />
                    ) : propertyReviews.length > 0 ? (
                        propertyReviews.map((rev) => {
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
                        <View
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 14,
                                padding: 16,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                                borderStyle: 'dashed'
                            }}
                        >
                            <Ionicons name="chatbox-ellipses-outline" size={26} color="#94A3B8" style={{ marginBottom: 4 }} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#133E32', marginBottom: 2 }}>No seeker reviews yet</Text>
                            <Text style={{ fontSize: 12, color: '#64748B' }}>When seekers review this property, their feedback will appear here.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Occupants Detail Modal */}
            <OccupantDetailsModal
                visible={isOccupantModalVisible}
                onClose={() => setIsOccupantModalVisible(false)}
                occupants={approvedOccupants}
                loading={loadingOccupants}
                title={`${currentProperty.title} Occupants`}
                onRemoveOccupant={() => reloadPropertyAndOccupants()}
            />
        </SafeAreaView>
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
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        maxWidth: 220,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Cover Image */
    coverWrapper: {
        position: 'relative',
        height: 200,
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#E2E8F0',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    approvedBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    approvedText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 12,
    },

    /* Quick Grid */
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 22,
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionCardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },

    /* Info Card */
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    infoIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 10,
    },

    /* Map Card */
    mapCard: {
        position: 'relative',
        height: 180,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapPinContainer: {
        position: 'absolute',
        top: '38%',
        left: '46%',
    },
    pinCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#133E32',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },

    /* Annex Occupancy & Vacancies Card */
    annexStatsCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    annexStatBox: {
        alignItems: 'center',
        flex: 1,
    },
    annexStatDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#E2E8F0',
    },
    annexStatValOccupants: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1D4ED8',
    },
    annexStatValVacancies: {
        fontSize: 18,
        fontWeight: '900',
        color: '#15803D',
    },
    annexStatValTotal: {
        fontSize: 18,
        fontWeight: '900',
        color: '#B45309',
    },
    annexStatLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 2,
    },

    /* Owner Room Breakdown Card Container */
    ownerRoomCardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    roomBadgeStatusRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 4,
        marginBottom: 10,
    },
    roomOccupantsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    roomOccupantsBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1D4ED8',
    },
    roomVacanciesBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    roomVacanciesBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#15803D',
    },
    roomTotalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    roomTotalBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
    },
    roomTapFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    roomTapFooterText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#133E32',
    },
});
