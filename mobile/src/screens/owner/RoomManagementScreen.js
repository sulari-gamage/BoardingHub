import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    TextInput,
    Image,
    Platform,
    Modal,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { uploadImage, uploadImages } from '../../services/uploadService';
import OccupantDetailsModal from '../../components/OccupantDetailsModal';
import AddRoomScreen from './AddRoomScreen';

export default function RoomManagementScreen({ onBack, onAddRoom, property, propertyName = 'Boarding Property', onPropertyUpdated, onOpenBookings, onOpenGallery }) {
    const isRoomBased = property?.propertyNature
        ? property.propertyNature === 'ROOM_BASED'
        : (property?.rooms && property.rooms.length > 0 && !property.rooms.some(r => r.roomType === 'Whole House / Annex' || r.roomType === 'Entire Boarding House'));
    const displayPropertyName = property?.title || propertyName;

    // Room Hub & Edit State
    const [selectedManageRoom, setSelectedManageRoom] = useState(null);
    const [editingRoom, setEditingRoom] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [roomOccupants, setRoomOccupants] = useState([]);
    const [loadingRoomOccupants, setLoadingRoomOccupants] = useState(false);
    const [isOccupantsModalOpen, setIsOccupantsModalOpen] = useState(false);

    // Resolve real rooms from property object passed from parent
    const rawRooms = property?.rooms || (property?.raw && property?.raw.rooms) || [];

    const rooms = rawRooms.map((r, idx) => {
        const totCap = r.totalCapacity || r.totalSpaces || 1;
        const remCap = r.remainingSpaces != null ? r.remainingSpaces : (r.availableSpaces != null ? r.availableSpaces : totCap);
        const occCount = Math.max(0, totCap - remCap);
        const isAvail = remCap > 0;

        const propertyCover = property?.imageUrl ||
            (property?.imageUrls && property?.imageUrls.length > 0 ? property.imageUrls[0] : null) ||
            (property?.images && property?.images.length > 0 ? (typeof property.images[0] === 'string' ? property.images[0] : property.images[0].imageUrl) : null);

        const roomImg = r.imageUrl || (r.imageUrls && r.imageUrls.length > 0 ? r.imageUrls[0] : propertyCover);

        const rName = r.roomName || r.roomNumber || r.name || `Room ${idx + 1}`;
        const rType = r.roomType || 'Single';
        const beds = r.beds || 1;
        const washrooms = r.washrooms || 1;
        const washroomType = r.washroomType || 'Common';
        const amenities = r.amenities || '';

        return {
            id: r.id ? r.id.toString() : `r-${idx}`,
            rawId: r.id,
            roomName: rName,
            roomType: rType,
            beds,
            washrooms,
            washroomType,
            amenities,
            number: rName,
            type: r.rentType === 'PER_ROOM' ? 'Per Room Basis' : 'Per Person Basis',
            price: r.monthlyPrice || r.price || 0,
            occupants: `${occCount} / ${totCap} Occupied (${remCap} Free)`,
            area: `${beds} Bed(s) • ${washrooms} ${washroomType} Bath`,
            status: isAvail ? 'AVAILABLE' : 'OCCUPIED',
            imageUrl: roomImg,
            totCap,
            raw: r,
        };
    });

    const handleAddNewRoom = () => {
        setEditingRoom({
            isNew: true,
            roomName: `Room ${rawRooms.length + 1}`,
            roomType: 'Single',
            totalCapacity: 1,
            monthlyPrice: 15000,
            rentType: 'PER_PERSON',
            beds: 1,
            washrooms: 1,
            washroomType: 'Common',
            amenities: '',
            photos: []
        });
    };

    const handleManageRoom = (room) => {
        const rawObj = room.raw || room;
        const mappedRoom = {
            ...room,
            id: room.id,
            rawId: room.rawId,
            roomName: rawObj.roomName || room.number || 'Unit',
            roomType: rawObj.roomType || 'Single',
            roomTypeStyle: rawObj.roomType || 'Single',
            capacity: room.totCap || rawObj.totalCapacity || 1,
            totalCapacity: room.totCap || rawObj.totalCapacity || 1,
            price: room.price || rawObj.monthlyPrice || 15000,
            monthlyPrice: room.price || rawObj.monthlyPrice || 15000,
            rentType: rawObj.rentType || 'PER_PERSON',
            beds: rawObj.beds || 1,
            washrooms: rawObj.washrooms || 1,
            washroomType: rawObj.washroomType || 'Common',
            amenities: rawObj.amenities || '',
            imageUrl: room.imageUrl,
            raw: rawObj,
        };

        setSelectedManageRoom(mappedRoom);

        // Fetch approved occupants for this room
        if (property?.id) {
            setLoadingRoomOccupants(true);
            api.bookings.getByPropertyId(property.id)
                .then((res) => {
                    if (res && Array.isArray(res)) {
                        const approved = res.filter(b => b.status === 'APPROVED');
                        // Filter by room if room data matches
                        const roomApproved = approved.filter(b =>
                            !b.roomId || b.roomId.toString() === (mappedRoom.rawId ? mappedRoom.rawId.toString() : mappedRoom.id.toString()) || b.roomName === mappedRoom.roomName
                        );
                        setRoomOccupants(roomApproved.length > 0 ? roomApproved : approved);
                    }
                })
                .catch((err) => console.log('[RoomManagement] Occupants fetch error:', err))
                .finally(() => setLoadingRoomOccupants(false));
        }
    };

    const saveRoomChanges = async (formRoom) => {
        if (!editingRoom || !property?.id) return;
        setIsSaving(true);
        try {
            const photosList = formRoom.photos || [];
            const allUris = photosList.map(p => typeof p === 'string' ? p : (p?.uri || p?.imageUrl || p?.url)).filter(Boolean);
            const existingRemote = allUris.filter(u => u.startsWith('http://') || u.startsWith('https://'));
            const localUris = allUris.filter(u => !u.startsWith('http://') && !u.startsWith('https://'));

            let uploadedLocal = [];
            if (localUris.length > 0) {
                uploadedLocal = await uploadImages(localUris);
            }
            const validNew = uploadedLocal.filter(u => u && (u.startsWith('http://') || u.startsWith('https://')));
            const uploadedRoomPhotos = [...existingRemote, ...validNew];

            const isNewRoom = !!editingRoom?.isNew || (!editingRoom?.rawId && !editingRoom?.id);

            let updatedRooms = [];
            if (isNewRoom) {
                const newTotal = parseInt(formRoom.totalCapacity || formRoom.capacity) || 1;
                const newRoomPayload = {
                    roomName: formRoom.roomName || formRoom.number || `Room ${rawRooms.length + 1}`,
                    roomType: formRoom.roomType || 'Single',
                    beds: parseInt(formRoom.beds) || 1,
                    washrooms: parseInt(formRoom.washrooms) || 1,
                    washroomType: formRoom.washroomType || 'Common',
                    amenities: typeof formRoom.amenities === 'string' ? formRoom.amenities : JSON.stringify(formRoom.amenities || ''),
                    monthlyPrice: parseFloat(formRoom.monthlyPrice || formRoom.price) || 15000,
                    totalCapacity: newTotal,
                    occupied: 0,
                    remainingSpaces: newTotal,
                    rentType: formRoom.rentType || 'PER_PERSON',
                    imageUrl: uploadedRoomPhotos.length > 0 ? uploadedRoomPhotos[0] : undefined,
                    imageUrls: uploadedRoomPhotos
                };

                updatedRooms = [
                    ...rawRooms.map(r => ({ ...r, id: r.id || undefined })),
                    newRoomPayload
                ];
            } else {
                updatedRooms = rawRooms.map((r, idx) => {
                    const matches = (editingRoom.rawId && r.id === editingRoom.rawId) ||
                        (editingRoom.id && (r.id?.toString() === editingRoom.id.toString() || `r-${idx}` === editingRoom.id)) ||
                        (formRoom.id && (r.id?.toString() === formRoom.id.toString() || `r-${idx}` === formRoom.id));

                    if (matches) {
                        const newTotal = parseInt(formRoom.totalCapacity || formRoom.capacity) || r.totalCapacity || 1;
                        const oldTotal = r.totalCapacity || 1;
                        const oldRemaining = r.remainingSpaces != null ? r.remainingSpaces : oldTotal;
                        const oldOccupied = r.occupied != null ? r.occupied : Math.max(0, oldTotal - oldRemaining);
                        const newOccupied = Math.min(newTotal, oldOccupied);
                        const newRemaining = Math.max(0, newTotal - newOccupied);

                        const validExistingImg = (r.imageUrl && (r.imageUrl.startsWith('http://') || r.imageUrl.startsWith('https://'))) ? r.imageUrl : undefined;
                        const finalImg = uploadedRoomPhotos.length > 0 ? uploadedRoomPhotos[0] : validExistingImg;
                        return {
                            ...r,
                            id: r.id || undefined,
                            roomName: formRoom.roomName || formRoom.number,
                            roomType: formRoom.roomType || 'Single',
                            beds: parseInt(formRoom.beds) || 1,
                            washrooms: parseInt(formRoom.washrooms) || 1,
                            washroomType: formRoom.washroomType || 'Common',
                            amenities: typeof formRoom.amenities === 'string' ? formRoom.amenities : JSON.stringify(formRoom.amenities || ''),
                            monthlyPrice: parseFloat(formRoom.monthlyPrice || formRoom.price) || r.monthlyPrice,
                            totalCapacity: newTotal,
                            occupied: newOccupied,
                            remainingSpaces: newRemaining,
                            rentType: formRoom.rentType || r.rentType || 'PER_PERSON',
                            imageUrl: finalImg,
                            imageUrls: uploadedRoomPhotos.length > 0 ? uploadedRoomPhotos : (finalImg ? [finalImg] : [])
                        };
                    }
                    return r;
                });
            }

            // Explicitly build full PropertyRequest payload to ensure no validation errors on update
            const rawProp = property.raw || property;
            const payload = {
                title: rawProp.title || property.title,
                description: rawProp.description || property.description || '',
                address: rawProp.address || property.address,
                city: rawProp.city || property.city,
                genderPreference: rawProp.genderPreference || property.genderPreference || 'ANY',
                monthlyRent: rawProp.monthlyRent || property.price || 15000,
                latitude: rawProp.latitude || property.latitude,
                longitude: rawProp.longitude || property.longitude,
                propertyNature: rawProp.propertyNature || property.propertyNature,
                roomsCount: rawProp.roomsCount || property.roomsCount,
                bedsCount: rawProp.bedsCount || property.bedsCount,
                bathsCount: rawProp.bathsCount || property.bathsCount,
                hasKitchen: rawProp.hasKitchen !== undefined ? rawProp.hasKitchen : property.hasKitchen,
                isFurnished: rawProp.isFurnished !== undefined ? rawProp.isFurnished : property.isFurnished,
                amenities: rawProp.amenities || property.amenities || [],
                imageUrls: rawProp.imageUrls || property.imageUrls || [],
                rooms: updatedRooms
            };

            const updatedResponse = await api.properties.update(property.id, payload);

            // Re-fetch fresh property from API to ensure instant UI synchronization
            let freshProp = updatedResponse;
            try {
                freshProp = await api.properties.getById(property.id);
            } catch (e) { }

            Alert.alert("Success 🎉", isNewRoom ? "New room added successfully!" : "Unit successfully saved!", [{
                text: 'OK',
                onPress: () => {
                    setEditingRoom(null);
                    if (freshProp && onPropertyUpdated) {
                        onPropertyUpdated(freshProp);
                    }
                }
            }]);
        } catch (err) {
            Alert.alert("Error", "Failed to save unit: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRoom = (roomToDelete) => {
        const rName = roomToDelete.roomName || roomToDelete.number || 'this room';
        const targetRoomId = roomToDelete.rawId || roomToDelete.id;

        Alert.alert(
            'Delete Room 🗑️',
            `Are you sure you want to permanently delete "${rName}"? All associated booking requests for this unit will be removed. This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Room',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsSaving(true);
                            const updatedProperty = await api.properties.deleteRoom(property.id, targetRoomId);
                            Alert.alert('Room Deleted 🎉', `"${rName}" has been successfully deleted.`, [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        setSelectedManageRoom(null);
                                        if (onPropertyUpdated && updatedProperty) {
                                            onPropertyUpdated(updatedProperty);
                                        }
                                    }
                                }
                            ]);
                        } catch (err) {
                            Alert.alert('Error', err.message || 'Failed to delete room');
                        } finally {
                            setIsSaving(false);
                        }
                    }
                }
            ]
        );
    };

    if (editingRoom) {
        return (
            <View style={{ flex: 1 }}>
                <AddRoomScreen
                    initialRoomData={editingRoom}
                    onBack={() => setEditingRoom(null)}
                    onSaveRoom={saveRoomChanges}
                />
                {isSaving && (
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                        <ActivityIndicator size="large" color="#133E32" />
                        <Text style={{ marginTop: 12, fontWeight: '700', color: '#133E32' }}>Saving Changes...</Text>
                    </View>
                )}
            </View>
        );
    }

    if (selectedManageRoom) {
        const room = selectedManageRoom;
        const totCap = room.totCap || room.totalCapacity || 1;
        const remCap = room.remainingSpaces != null ? room.remainingSpaces : (room.raw?.remainingSpaces != null ? room.raw.remainingSpaces : totCap);
        const occCount = Math.max(0, totCap - remCap);
        const isAvail = remCap > 0;

        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedManageRoom(null)} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={20} color="#133E32" />
                    </TouchableOpacity>
                    <View style={styles.breadcrumbRow}>
                        <Text style={styles.breadcrumbLink}>{displayPropertyName}</Text>
                        <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginHorizontal: 4 }} />
                        <Text style={styles.breadcrumbCurrent} numberOfLines={1}>{room.roomName}</Text>
                    </View>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Cover Image & Badges */}
                    <View style={styles.imageWrapper}>
                        {room.imageUrl ? (
                            <Image source={{ uri: room.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.cardImage, { backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="bed-outline" size={54} color="#133E32" />
                            </View>
                        )}
                        <View style={[styles.statusTag, isAvail ? styles.statusActive : styles.statusFull]}>
                            <Text style={[styles.statusTagText, { color: isAvail ? '#065F46' : '#991B1B' }]}>
                                {isAvail ? 'VACANCIES' : 'FULLY OCCUPIED'}
                            </Text>
                        </View>
                        <View style={styles.rentTypeTag}>
                            <Ionicons name="pricetag-outline" size={11} color="#133E32" style={{ marginRight: 3 }} />
                            <Text style={styles.rentTypeTagText}>{room.type || 'Per Person Basis'}</Text>
                        </View>
                    </View>

                    {/* Quick Action Grid */}
                    <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Quick Actions</Text>
                    <View style={styles.quickGrid}>
                        {/* 1. Edit Card */}
                        <TouchableOpacity style={styles.actionCard} onPress={() => setEditingRoom(room)} activeOpacity={0.85}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="pencil-outline" size={24} color="#133E32" />
                            </View>
                            <Text style={styles.actionCardTitle}>Edit Details</Text>
                        </TouchableOpacity>

                        {/* 2. Add Image Card */}
                        <TouchableOpacity style={styles.actionCard} onPress={() => setEditingRoom({ ...room, autoPickPhoto: true, focusSection: 'photos' })} activeOpacity={0.85}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="add-circle-outline" size={26} color="#133E32" />
                            </View>
                            <Text style={styles.actionCardTitle}>Add Image</Text>
                        </TouchableOpacity>

                        {/* 3. Bookings Card */}
                        <TouchableOpacity style={styles.actionCard} onPress={() => onOpenBookings ? onOpenBookings(property) : Alert.alert('Bookings', 'Opening room bookings.')} activeOpacity={0.85}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="calendar-outline" size={24} color="#133E32" />
                            </View>
                            <Text style={styles.actionCardTitle}>Bookings</Text>
                        </TouchableOpacity>

                        {/* 4. Occupants Card */}
                        <TouchableOpacity style={styles.actionCard} onPress={() => setIsOccupantsModalOpen(true)} activeOpacity={0.85}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="people-outline" size={24} color="#133E32" />
                            </View>
                            <Text style={styles.actionCardTitle}>Occupants</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Room Specifications Card */}
                    <Text style={styles.sectionTitle}>Room Specifications</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrapper}>
                                <Ionicons name="bed-outline" size={20} color="#133E32" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>BEDS & BATHROOMS</Text>
                                <Text style={styles.infoValue}>
                                    {room.beds || 1} Bed(s) • {room.washrooms || 1} {room.washroomType || 'Common'} Bath
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrapper}>
                                <Ionicons name="pricetag-outline" size={20} color="#133E32" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>MONTHLY RENT</Text>
                                <Text style={styles.infoValue}>
                                    LKR {(room.price || room.monthlyPrice || 0).toLocaleString()} {room.rentType === 'PER_ROOM' ? '/ room' : '/ person'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrapper}>
                                <Ionicons name="people-outline" size={20} color="#133E32" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>CAPACITY & VACANCY STATUS</Text>
                                <Text style={styles.infoValue}>
                                    {occCount} / {totCap} Occupied ({remCap} Free Spaces)
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Occupants Details Summary */}
                    <View style={{ marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.sectionTitle}>Occupants Details Summary ({roomOccupants.length})</Text>
                            <TouchableOpacity onPress={() => setIsOccupantsModalOpen(true)}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#133E32' }}>View All</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingRoomOccupants ? (
                            <ActivityIndicator size="small" color="#133E32" style={{ marginVertical: 15 }} />
                        ) : roomOccupants.length > 0 ? (
                            roomOccupants.map((occ, idx) => {
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
                                        onPress={() => setIsOccupantsModalOpen(true)}
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
                                                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Approved Occupant</Text>
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
                                                    const msg = encodeURIComponent(`Hi ${name}, contacting you regarding ${room.roomName} on BoardingHub.`);
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
                            })
                        ) : (
                            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' }}>
                                <Ionicons name="people-outline" size={28} color="#94A3B8" style={{ marginBottom: 4 }} />
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#133E32' }}>No occupants in this room yet</Text>
                            </View>
                        )}
                    </View>

                    {/* Delete Room Action Button at Bottom of Page */}
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#FEF2F2',
                            borderWidth: 1.5,
                            borderColor: '#FCA5A5',
                            borderRadius: 14,
                            paddingVertical: 14,
                            marginTop: 10,
                            marginBottom: 30
                        }}
                        onPress={() => handleDeleteRoom(room)}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="trash-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#DC2626' }}>Delete Room</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Occupants Detail Modal */}
                <OccupantDetailsModal
                    visible={isOccupantsModalOpen}
                    onClose={() => setIsOccupantsModalOpen(false)}
                    occupants={roomOccupants}
                    loading={loadingRoomOccupants}
                    title={`${room.roomName} Occupants`}
                    onRemoveOccupant={(removedId) => {
                        setRoomOccupants(prev => prev.filter(o => o.id !== removedId));
                        if (onPropertyUpdated && property?.id) {
                            api.properties.getById(property.id).then(updated => {
                                if (updated) onPropertyUpdated(updated);
                            }).catch(() => { });
                        }
                    }}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Top Navigation Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#133E32" />
                </TouchableOpacity>
                <View style={styles.breadcrumbRow}>
                    <Text style={styles.breadcrumbLink}>Properties</Text>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginHorizontal: 4 }} />
                    <Text style={styles.breadcrumbCurrent} numberOfLines={1}>{displayPropertyName}</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Title & Add Room Action */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>{isRoomBased ? 'Property Units' : 'House Layout'}</Text>
                    <Text style={styles.subtitle}>
                        {isRoomBased ? 'Manage individual units, capacity, and pricing.' : 'Overview of complete property configuration.'}
                    </Text>

                    {isRoomBased && (
                        <TouchableOpacity style={styles.addRoomBtn} onPress={handleAddNewRoom} activeOpacity={0.85}>
                            <Ionicons name="add" size={20} color="#FFD700" style={{ marginRight: 6 }} />
                            <Text style={styles.addRoomBtnText}>Add New Room</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {!isRoomBased ? (
                    <View style={styles.roomCard}>
                        <View style={styles.roomImageWrapper}>
                            {property?.imageUrl || (property?.imageUrls && property?.imageUrls.length > 0) ? (
                                <Image source={{ uri: property.imageUrl || property.imageUrls[0] }} style={styles.roomImage} resizeMode="cover" />
                            ) : (
                                <View style={[styles.roomImage, { backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="home-outline" size={44} color="#133E32" />
                                </View>
                            )}
                            <View style={[styles.statusBadge, property?.status === 'ACTIVE' ? styles.statusBadgeAvailable : styles.statusBadgeOccupied]}>
                                <View style={[styles.badgeDot, { backgroundColor: property?.status === 'ACTIVE' ? '#059669' : '#DC2626' }]} />
                                <Text style={[styles.statusBadgeText, { color: property?.status === 'ACTIVE' ? '#065F46' : '#991B1B' }]}>
                                    {property?.status === 'ACTIVE' ? 'Available' : 'Occupied'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.roomContent}>
                            <View style={styles.titlePriceRow}>
                                <View>
                                    <Text style={styles.roomNumber}>Entire Boarding House</Text>
                                    <Text style={styles.roomType}>Exclusive Rental</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {property?.amenities && property.amenities.filter(a => a.includes('Bed') || a.includes('Washroom')).map((am, i) => (
                                    <View key={i} style={styles.specItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 4 }} />
                                        <Text style={styles.specText}>{am}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                ) : (
                    rooms.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="bed-outline" size={48} color="#94A3B8" />
                            <Text style={styles.emptyTitle}>No Units Found</Text>
                            <Text style={styles.emptySubtitle}>Try adding a new unit.</Text>
                        </View>
                    ) : (
                        rooms.map((room) => {
                            const totCap = room.totCap || room.raw?.totalCapacity || 1;
                            const remCap = room.raw?.remainingSpaces != null ? room.raw.remainingSpaces : totCap;
                            const occCount = Math.max(0, totCap - remCap);
                            const isAvail = remCap > 0;
                            const rName = room.roomName || room.number || 'Unit';

                            return (
                                <TouchableOpacity
                                    key={room.id}
                                    style={[styles.propertyCard, (!isAvail || room.raw?.isFilled) && styles.filledRoomRedBorder]}
                                    onPress={() => handleManageRoom(room)}
                                    activeOpacity={0.9}
                                >
                                    {/* Top Cover Image Box */}
                                    <View style={styles.imageWrapper}>
                                        {room.imageUrl ? (
                                            <Image source={{ uri: room.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                                        ) : (
                                            <View style={[styles.cardImage, { backgroundColor: '#E6F0EC', justifyContent: 'center', alignItems: 'center' }]}>
                                                <Ionicons name="bed-outline" size={44} color="#133E32" />
                                            </View>
                                        )}

                                        {/* Vacancies / Occupied Status Tag */}
                                        <View style={[styles.statusTag, isAvail ? styles.statusActive : styles.statusFull]}>
                                            <Text style={[styles.statusTagText, { color: isAvail ? '#065F46' : '#991B1B' }]}>
                                                {isAvail ? 'VACANCIES' : 'FULLY OCCUPIED'}
                                            </Text>
                                        </View>

                                        {/* Rent Type Tag */}
                                        <View style={styles.rentTypeTag}>
                                            <Ionicons name="pricetag-outline" size={11} color="#133E32" style={{ marginRight: 3 }} />
                                            <Text style={styles.rentTypeTagText}>{room.type}</Text>
                                        </View>
                                    </View>

                                    {/* Card Content Details */}
                                    <View style={styles.cardContent}>
                                        <Text style={styles.propertyTitle}>{rName}</Text>

                                        <View style={styles.infoRow}>
                                            <Ionicons name="bed-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                                            <Text style={[styles.locationText, { flex: 1 }]} numberOfLines={1}>
                                                {room.area}
                                            </Text>
                                        </View>

                                        <View style={[styles.infoRow, { marginBottom: 14 }]}>
                                            <Ionicons name="home-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                                            <Text style={[styles.locationText, { color: '#0F172A', fontWeight: '600', flex: 1 }]} numberOfLines={1}>
                                                {room.roomType ? `${room.roomType} Type Unit` : 'Boarding Unit'}
                                            </Text>
                                        </View>

                                        {/* Stats Row Grid - 1:1 Match with Properties Screen */}
                                        <View style={styles.statsRow}>
                                            <View style={styles.statBox}>
                                                <Text style={styles.statBoxNum}>{totCap}</Text>
                                                <Text style={styles.statBoxLabel}>Total Spaces</Text>
                                            </View>
                                            <View style={styles.statBox}>
                                                <Text style={[styles.statBoxNum, { color: '#D97706' }]}>{occCount}</Text>
                                                <Text style={styles.statBoxLabel}>Occupied</Text>
                                            </View>
                                            <View style={styles.statBox}>
                                                <Text style={[styles.statBoxNum, { color: isAvail ? '#133E32' : '#DC2626' }]}>{remCap}</Text>
                                                <Text style={styles.statBoxLabel}>Available</Text>
                                            </View>
                                        </View>

                                        {/* Card Footer: Price & Manage Button */}
                                        <View style={styles.cardFooter}>
                                            <Text style={styles.priceText}>
                                                Rs. {(room.price || 0).toLocaleString()}{' '}
                                                <Text style={styles.pricePeriod}>/ month</Text>
                                            </Text>

                                            <TouchableOpacity
                                                style={styles.manageBtn}
                                                onPress={() => handleManageRoom(room)}
                                                activeOpacity={0.85}
                                            >
                                                <Text style={styles.manageBtnText}>Manage & Occupants</Text>
                                                <Ionicons name="chevron-forward" size={14} color="#133E32" style={{ marginLeft: 2 }} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )
                )}
            </ScrollView>

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
        alignItems: 'center',
        justifyContent: 'space-between',
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
    breadcrumbRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    breadcrumbLink: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    breadcrumbCurrent: {
        fontSize: 13,
        fontWeight: '800',
        color: '#133E32',
        maxWidth: 160,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    titleSection: {
        marginBottom: 16,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#133E32',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 16,
    },
    addRoomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#133E32',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    addRoomBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    /* Room Control Hub & Section Styles */
    sectionTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 12,
    },
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
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
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

    /* Filter & Search Card */
    filterCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 18,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    filterPillRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    filterPillActive: {
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#133E32',
    },
    dotIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    filterPillTextActive: {
        color: '#133E32',
        fontWeight: '900',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 42,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
    },

    /* Property Card (Matching OwnerPropertiesScreen) */
    propertyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    imageWrapper: {
        position: 'relative',
        height: 170,
        backgroundColor: '#E2E8F0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    statusTag: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusActive: {
        backgroundColor: '#E6F0EC',
    },
    statusFull: {
        backgroundColor: '#FEE2E2',
    },
    statusTagText: {
        fontSize: 10.5,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    rentTypeTag: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    rentTypeTagText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#133E32',
    },

    cardContent: {
        padding: 16,
    },
    propertyTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    locationText: {
        fontSize: 13,
        color: '#64748B',
    },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
        justifyContent: 'space-around',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statBox: {
        alignItems: 'center',
    },
    statBoxNum: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    statBoxLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#133E32',
    },
    pricePeriod: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    manageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    manageBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
        marginRight: 4,
    },
    titlePriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    roomNumber: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 2,
    },
    roomType: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    roomPrice: {
        fontSize: 18,
        fontWeight: '900',
        color: '#133E32',
    },
    perMonthText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    specsRow: {
        flexDirection: 'row',
        gap: 20,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    specText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 4,
    },
    filledRoomRedBorder: {
        borderColor: '#DC2626',
        borderWidth: 2.5,
        elevation: 4,
    },
});
