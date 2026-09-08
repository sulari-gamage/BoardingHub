import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TextInput,
    Alert,
    Platform,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function AddRoomScreen({ onBack, onSaveRoom, initialRoomData = null }) {
    // Form state matching Image 2 mockup
    const [roomNumber, setRoomNumber] = useState('');
    const [roomType, setRoomType] = useState('Single');
    const [maxOccupants, setMaxOccupants] = useState(1);
    const [pricePerMonth, setPricePerMonth] = useState('');
    const [rentType, setRentType] = useState('PER_PERSON');

    const [beds, setBeds] = useState('1');
    const [washrooms, setWashrooms] = useState('1');
    const [washroomType, setWashroomType] = useState('Common');

    // Room Amenities state
    const [amenities, setAmenities] = useState({
        wifi: true,
        ac: false,
        bathroom: false,
        desk: true,
        fridge: false,
        oven: false,
    });

    const [photos, setPhotos] = useState(initialRoomData?.photos || (initialRoomData?.imageUrl ? [{ id: '1', uri: initialRoomData.imageUrl }] : []));

    const toggleAmenity = (key) => {
        setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    React.useEffect(() => {
        if (initialRoomData) {
            setRoomNumber(initialRoomData.roomName || initialRoomData.number || '');
            setRoomType(initialRoomData.roomType || initialRoomData.roomTypeStyle || 'Single');
            setMaxOccupants(parseInt(initialRoomData.totalCapacity || initialRoomData.capacity || 1, 10));
            setPricePerMonth(initialRoomData.monthlyPrice || initialRoomData.price ? (initialRoomData.monthlyPrice || initialRoomData.price).toString() : '');
            setBeds(initialRoomData.beds ? initialRoomData.beds.toString() : '1');
            setWashrooms(initialRoomData.washrooms ? initialRoomData.washrooms.toString() : '1');
            setWashroomType(initialRoomData.washroomType || 'Common');
            setRentType(initialRoomData.rentType || 'PER_PERSON');
            if (initialRoomData.amenities) {
                if (typeof initialRoomData.amenities === 'string') {
                    const str = initialRoomData.amenities;
                    setAmenities({
                        wifi: /Wi-Fi|wifi/i.test(str),
                        ac: /AC/i.test(str),
                        bathroom: /Bathroom|bathroom/i.test(str),
                        desk: /Desk/i.test(str),
                        fridge: /Fridge/i.test(str),
                        oven: /Oven/i.test(str),
                    });
                } else {
                    setAmenities(initialRoomData.amenities);
                }
            }
        }
    }, [initialRoomData]);

    const handlePickRoomPhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setPhotos(prev => [...prev, { id: `photo_${Date.now()}`, uri: asset.uri }]);
            }
        } catch (err) { }
    };

    const handleRemoveRoomPhoto = (id) => {
        setPhotos(photos.filter(p => p.id !== id));
    };

    const handleSave = () => {
        if (!roomNumber.trim()) {
            Alert.alert('Required Field', 'Please enter a room number or name.');
            return;
        }

        const activeAmenities = Object.keys(amenities).filter(k => amenities[k]).map(k => {
            if (k === 'desk') return 'Desk';
            if (k === 'fridge') return 'Fridge';
            if (k === 'fan') return 'Fan';
            if (k === 'tv') return 'TV';
            if (k === 'iron') return 'Iron';
            if (k === 'wifi') return 'Wi-Fi';
            if (k === 'ac') return 'AC';
            if (k === 'bathroom') return 'En-suite Bath';
            return k;
        });

        const amenitiesStr = activeAmenities.join(', ');
        const facilityStr = `${beds} Bed(s), ${washrooms} ${washroomType} Washroom(s)${activeAmenities.length > 0 ? ', ' + amenitiesStr : ''}`;

        const newRoom = {
            id: initialRoomData?.id || initialRoomData?.rawId || `r_${Date.now()}`,
            rawId: initialRoomData?.rawId || initialRoomData?.id,
            roomName: roomNumber,
            roomType: roomType,
            beds: parseInt(beds, 10) || 1,
            washrooms: parseInt(washrooms, 10) || 1,
            washroomType: washroomType,
            amenities: amenitiesStr,
            monthlyPrice: parseFloat(pricePerMonth) || 15000,
            rentType: rentType,
            totalCapacity: maxOccupants,
            remainingSpaces: maxOccupants,
            // UI compatibility fields
            number: roomNumber,
            type: `${roomType} Type | ${facilityStr}`,
            price: parseFloat(pricePerMonth) || 15000,
            capacity: maxOccupants,
            photos,
        };

        if (onSaveRoom) onSaveRoom(newRoom);
        else Alert.alert('Success 🎉', 'New room added successfully!');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Top Navigation Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#133E32" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{initialRoomData?.id || initialRoomData?.rawId ? 'Edit Room' : 'Add New Room'}</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>{initialRoomData?.id || initialRoomData?.rawId ? 'Edit Room Details' : 'Add New Room'}</Text>
                    <Text style={styles.subtitle}>Configure room details, pricing, and amenities.</Text>
                </View>

                {/* Card 1: Basic Details */}
                <View style={styles.cardContainer}>
                    <Text style={styles.cardTitle}>Basic Details</Text>
                    <View style={styles.titleDivider} />

                    {/* Room Number / Name */}
                    <Text style={styles.fieldLabel}>Room Number / Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 101 or Executive Suite"
                        placeholderTextColor="#94A3B8"
                        value={roomNumber}
                        onChangeText={setRoomNumber}
                    />

                    {/* Room Type Picker */}
                    <Text style={styles.fieldLabel}>Room Type</Text>
                    <View style={styles.typeSelectorRow}>
                        {['Single', 'Shared', 'single/shared'].map((type) => {
                            const isSelected = roomType === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typePill, isSelected && styles.typePillActive]}
                                    onPress={() => {
                                        setRoomType(type);
                                        if (type.toLowerCase() === 'single') {
                                            setMaxOccupants(1);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Card 2: Capacity & Pricing */}
                <View style={styles.cardContainer}>
                    <Text style={styles.cardTitle}>Capacity & Pricing</Text>
                    <View style={styles.titleDivider} />

                    {/* Max Occupants Counter */}
                    <Text style={styles.fieldLabel}>Max Occupants</Text>
                    <View style={styles.stepperBox}>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setMaxOccupants(Math.max(1, parseInt(maxOccupants || 1, 10) - 1))}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="remove" size={18} color="#133E32" />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{maxOccupants}</Text>
                        <TouchableOpacity
                            style={[styles.stepperBtn, roomType.toLowerCase() === 'single' && { opacity: 0.4 }]}
                            onPress={() => setMaxOccupants(parseInt(maxOccupants || 1, 10) + 1)}
                            activeOpacity={0.8}
                            disabled={roomType.toLowerCase() === 'single'}
                        >
                            <Ionicons name="add" size={18} color="#133E32" />
                        </TouchableOpacity>
                    </View>

                    {/* Price per Month Input */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                        <Text style={styles.fieldLabel}>Price per Month</Text>
                        <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#E2E8F0', height: 32 }}>
                            <TouchableOpacity
                                style={[styles.rentToggleBtn, rentType === 'PER_PERSON' && styles.rentToggleBtnActive]}
                                onPress={() => setRentType('PER_PERSON')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.rentToggleText, rentType === 'PER_PERSON' && styles.rentToggleTextActive]}>
                                    / Person
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.rentToggleBtn, rentType === 'PER_ROOM' && styles.rentToggleBtnActive]}
                                onPress={() => setRentType('PER_ROOM')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.rentToggleText, rentType === 'PER_ROOM' && styles.rentToggleTextActive]}>
                                    / Room
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.priceInputWrapper}>
                        <Text style={styles.currencyPrefix}>Rs.</Text>
                        <TextInput
                            style={styles.priceInput}
                            placeholder="0.00"
                            placeholderTextColor="#94A3B8"
                            value={pricePerMonth}
                            onChangeText={setPricePerMonth}
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Card 3: Room Facilities & Amenities */}
                <View style={styles.cardContainer}>
                    <Text style={styles.cardTitle}>Room Facilities</Text>
                    <View style={styles.titleDivider} />

                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>No. of Beds</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 2"
                                placeholderTextColor="#94A3B8"
                                value={beds}
                                onChangeText={setBeds}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>Washrooms</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 1"
                                placeholderTextColor="#94A3B8"
                                value={washrooms}
                                onChangeText={setWashrooms}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1.5 }}>
                            <Text style={styles.fieldLabel}>Washroom Type</Text>
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                <TouchableOpacity
                                    style={[styles.typePill, washroomType === 'Attached' && styles.typePillActive, { paddingVertical: 10 }]}
                                    onPress={() => setWashroomType('Attached')}
                                >
                                    <Text style={[styles.typePillText, washroomType === 'Attached' && styles.typePillTextActive, { fontSize: 11 }]}>Attached</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typePill, washroomType === 'Common' && styles.typePillActive, { paddingVertical: 10 }]}
                                    onPress={() => setWashroomType('Common')}
                                >
                                    <Text style={[styles.typePillText, washroomType === 'Common' && styles.typePillTextActive, { fontSize: 11 }]}>Common</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.cardTitle}>Additional Amenities For Room</Text>
                    {[
                        { key: 'desk', label: 'Work Desk / Study Table' },
                        { key: 'fridge', label: 'Mini Fridge' },
                        { key: 'fan', label: 'Ceiling / Stand Fan' },
                        { key: 'tv', label: 'Television' },
                        { key: 'iron', label: 'Ironing Board' },
                    ].map((item) => {
                        const isChecked = !!amenities[item.key];
                        return (
                            <TouchableOpacity
                                key={item.key}
                                style={styles.checkboxRow}
                                onPress={() => toggleAmenity(item.key)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                                    {isChecked && <Ionicons name="checkmark" size={14} color="#FFD700" />}
                                </View>
                                <Text style={styles.checkboxLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Card 4: Room Photos */}
                <View style={styles.cardContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Room Photos</Text>
                        <TouchableOpacity
                            onPress={handlePickRoomPhoto}
                            style={{ backgroundColor: '#133E32', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="camera" size={14} color="#FFD700" style={{ marginRight: 6 }} />
                            <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '800' }}>+ Add Photo</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.titleDivider} />

                    {photos && photos.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {photos.map((photo) => (
                                <View key={photo.id} style={{ position: 'relative', width: 75, height: 75, borderRadius: 10, overflow: 'hidden' }}>
                                    <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} />
                                    <TouchableOpacity
                                        onPress={() => handleRemoveRoomPhoto(photo.id)}
                                        style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(220, 38, 38, 0.9)', borderRadius: 12, padding: 3 }}
                                    >
                                        <Ionicons name="close" size={12} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={handlePickRoomPhoto}
                            style={{ height: 90, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="images-outline" size={28} color="#133E32" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#133E32', marginTop: 6 }}>Upload images of this specific unit</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Action Buttons */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.8}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.saveBtnText}>Save Room</Text>
                </TouchableOpacity>
            </View>
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
        color: '#133E32',
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
    },

    /* Cards */
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 6,
    },
    titleDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 14,
    },

    fieldLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        marginTop: 6,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        height: 46,
        fontSize: 14,
        color: '#0F172A',
    },

    /* Type Selector */
    typeSelectorRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    typePill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    typePillActive: {
        backgroundColor: '#133E32',
    },
    typePillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    typePillTextActive: {
        color: '#FFD700',
        fontWeight: '900',
    },

    /* Rent Toggle */
    rentToggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rentToggleBtnActive: {
        backgroundColor: '#133E32',
    },
    rentToggleText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '700',
    },
    rentToggleTextActive: {
        color: '#FFFFFF',
    },


    /* Stepper Box */
    stepperBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        alignSelf: 'flex-start',
        padding: 4,
    },
    stepperBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperValue: {
        width: 44,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },

    /* Price Input */
    priceInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        height: 46,
    },
    currencyPrefix: {
        fontSize: 14,
        fontWeight: '800',
        color: '#133E32',
        marginRight: 6,
    },
    priceInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },

    /* Checkboxes */
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: '#FFFFFF',
    },
    checkboxActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    checkboxLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },

    /* Fixed Bottom Bar */
    bottomBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#133E32',
    },
    saveBtn: {
        flex: 1.5,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
