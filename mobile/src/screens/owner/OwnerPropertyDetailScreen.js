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
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { api } from '../../services/api';

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

                {/* Quick Actions Title */}
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
                            <Ionicons name="images-outline" size={24} color="#133E32" />
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
                </View>

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
                        <Text style={styles.sectionTitle}>Rooms Breakdown ({currentProperty.rooms.length})</Text>
                        <View style={{ gap: 10, marginBottom: 18 }}>
                            {currentProperty.rooms.map((room, idx) => {
                                const rName = room.roomName || room.roomNumber || room.name || `Room ${idx + 1}`;
                                const rType = room.roomType || '';
                                const subDetails = [
                                    rType ? `${rType} Type` : null,
                                    room.beds ? `${room.beds} Bed(s)` : null,
                                    room.washrooms ? `${room.washrooms} ${room.washroomType || ''} Bath` : null
                                ].filter(Boolean).join(' • ');

                                return (
                                    <View key={room.id || idx} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <View style={{ flex: 1, paddingRight: 8 }}>
                                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{rName}</Text>
                                                {subDetails ? (
                                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 2 }}>{subDetails}</Text>
                                                ) : null}
                                                {room.amenities ? (
                                                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                                                        Amenities: {typeof room.amenities === 'string' ? room.amenities : room.amenities.join(', ')}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            <View style={{ backgroundColor: '#E6F0EC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' }}>
                                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#133E32' }}>
                                                    LKR {(room.monthlyPrice || 0).toLocaleString()} {room.rentType === 'PER_ROOM' ? '/ room / mo' : '/ person / mo'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
                                            Remaining Spaces: <Text style={{ fontWeight: '700', color: '#133E32' }}>{room.remainingSpaces != null ? room.remainingSpaces : room.totalCapacity} / {room.totalCapacity}</Text>
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

                {/* Map View Box */}
                <TouchableOpacity style={styles.mapCard} activeOpacity={0.9} onPress={handleMapPress}>
                    <MapView
                        style={StyleSheet.absoluteFillObject}
                        zoomEnabled={false}
                        scrollEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                        region={{
                            latitude: currentProperty.latitude || 6.9271,
                            longitude: currentProperty.longitude || 79.8612,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }}
                    >
                        <Marker
                            coordinate={{
                                latitude: currentProperty.latitude || 6.9271,
                                longitude: currentProperty.longitude || 79.8612,
                            }}
                        />
                    </MapView>
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
                    <View style={{ position: 'absolute', top: '42%', left: '40%', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, elevation: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#133E32' }}>Tap for Directions</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? 35 : 0,
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
});
