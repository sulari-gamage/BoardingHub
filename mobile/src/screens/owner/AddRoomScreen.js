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
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddRoomScreen({ onBack, onSaveRoom }) {
    // Form state matching Image 2 mockup
    const [roomNumber, setRoomNumber] = useState('');
    const [roomType, setRoomType] = useState('Single');
    const [maxOccupants, setMaxOccupants] = useState(1);
    const [pricePerMonth, setPricePerMonth] = useState('');

    // Room Amenities state
    const [amenities, setAmenities] = useState({
        wifi: true,
        ac: false,
        bathroom: false,
        desk: true,
    });

    const toggleAmenity = (key) => {
        setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        if (!roomNumber.trim()) {
            Alert.alert('Required Field', 'Please enter a room number or name.');
            return;
        }

        const newRoom = {
            id: `r_${Date.now()}`,
            number: roomNumber,
            type: `${roomType} Type`,
            price: parseFloat(pricePerMonth) || 15000,
            occupants: `${maxOccupants} Occupant${maxOccupants > 1 ? 's' : ''}`,
            area: '200 sqft',
            status: 'AVAILABLE',
            imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
            amenities,
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
                <Text style={styles.headerTitle}>Add New Room</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>Add New Room</Text>
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
                        {['Single', 'Shared', 'Deluxe', 'Suite'].map((type) => {
                            const isSelected = roomType === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typePill, isSelected && styles.typePillActive]}
                                    onPress={() => setRoomType(type)}
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
                            onPress={() => setMaxOccupants(Math.max(1, maxOccupants - 1))}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="remove" size={18} color="#133E32" />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{maxOccupants}</Text>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setMaxOccupants(maxOccupants + 1)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={18} color="#133E32" />
                        </TouchableOpacity>
                    </View>

                    {/* Price per Month Input */}
                    <Text style={styles.fieldLabel}>Price per Month</Text>
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

                {/* Card 3: Room Amenities */}
                <View style={styles.cardContainer}>
                    <Text style={styles.cardTitle}>Room Amenities</Text>
                    <View style={styles.titleDivider} />

                    {[
                        { key: 'wifi', label: 'High-Speed Wi-Fi' },
                        { key: 'ac', label: 'Air Conditioning' },
                        { key: 'bathroom', label: 'En-suite Bathroom' },
                        { key: 'desk', label: 'Work Desk' },
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
