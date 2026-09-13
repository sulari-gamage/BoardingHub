import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FilterModal({ visible, onClose, onApply, initialFilters }) {
    // Category 1: Boarding Types & Rent Basis
    const [boardingCategory, setBoardingCategory] = useState('ALL'); // 'ALL', 'ROOM_BASED', 'ANNEX'
    const [rentBasis, setRentBasis] = useState('PER_PERSON'); // 'PER_PERSON', 'PER_ROOM'
    const [roomTypes, setRoomTypes] = useState({
        privateRoom: false,
        sharedRoom: false,
    });

    // Category 2: Gender Preference
    const [selectedGender, setSelectedGender] = useState('ANY'); // 'ANY', 'MALE', 'FEMALE'

    // Category 3: Price Range (UX Improved with presets & numeric min/max inputs)
    const [priceMinInput, setPriceMinInput] = useState('0');
    const [priceMaxInput, setPriceMaxInput] = useState('100000');
    const [activePricePreset, setActivePricePreset] = useState('ALL'); // 'ALL', '<15k', '15k-30k', '30k-50k', '50k+'

    // Category 4: Amenities & Features
    const [amenities, setAmenities] = useState({
        wifi: false,
        parking: false,
        laundry: false,
        attachedBathroom: false,
        kitchenAccess: false,
        airConditioning: false,
    });

    // Category 5: Sort By
    const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT', 'PRICE_LOW_HIGH', 'PRICE_HIGH_LOW', 'RATING'

    useEffect(() => {
        if (initialFilters) {
            if (initialFilters.boardingCategory) setBoardingCategory(initialFilters.boardingCategory);
            if (initialFilters.rentBasis) setRentBasis(initialFilters.rentBasis);
            if (initialFilters.roomTypes) setRoomTypes(initialFilters.roomTypes);
            if (initialFilters.gender) setSelectedGender(initialFilters.gender);
            if (initialFilters.priceMin !== undefined) setPriceMinInput(String(initialFilters.priceMin));
            if (initialFilters.priceMax !== undefined) setPriceMaxInput(String(initialFilters.priceMax));
            if (initialFilters.amenities) setAmenities(initialFilters.amenities);
            if (initialFilters.sortBy) setSortBy(initialFilters.sortBy);
        }
    }, [initialFilters, visible]);

    const toggleRoomType = (key) => {
        setRoomTypes((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAmenity = (key) => {
        setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSelectPricePreset = (preset) => {
        setActivePricePreset(preset);
        switch (preset) {
            case '<15k':
                setPriceMinInput('0');
                setPriceMaxInput('15000');
                break;
            case '15k-30k':
                setPriceMinInput('15000');
                setPriceMaxInput('30000');
                break;
            case '30k-50k':
                setPriceMinInput('30000');
                setPriceMaxInput('50000');
                break;
            case '50k+':
                setPriceMinInput('50000');
                setPriceMaxInput('200000');
                break;
            case 'ALL':
            default:
                setPriceMinInput('0');
                setPriceMaxInput('100000');
                break;
        }
    };

    const handleReset = () => {
        const defaultFilters = {
            boardingCategory: 'ALL',
            rentBasis: 'PER_PERSON',
            roomTypes: { privateRoom: false, sharedRoom: false },
            gender: 'ANY',
            priceMin: 0,
            priceMax: 100000,
            amenities: {
                wifi: false,
                parking: false,
                laundry: false,
                attachedBathroom: false,
                kitchenAccess: false,
                airConditioning: false,
            },
            sortBy: 'DEFAULT',
        };

        setBoardingCategory(defaultFilters.boardingCategory);
        setRentBasis(defaultFilters.rentBasis);
        setRoomTypes(defaultFilters.roomTypes);
        setSelectedGender(defaultFilters.gender);
        setPriceMinInput('0');
        setPriceMaxInput('100000');
        setActivePricePreset('ALL');
        setAmenities(defaultFilters.amenities);
        setSortBy(defaultFilters.sortBy);

        if (onApply) {
            onApply(defaultFilters);
        }
        if (onClose) {
            onClose();
        }
    };

    const handleApply = () => {
        const minVal = parseInt(priceMinInput.replace(/[^0-9]/g, ''), 10) || 0;
        const maxVal = parseInt(priceMaxInput.replace(/[^0-9]/g, ''), 10) || 100000;

        if (onApply) {
            onApply({
                boardingCategory,
                rentBasis,
                roomTypes,
                gender: selectedGender,
                priceMin: minVal,
                priceMax: maxVal,
                amenities,
                sortBy,
            });
        }
        if (onClose) onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop press trigger */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={styles.modalContent}>
                    {/* Drag Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.dragHandle} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="options-outline" size={22} color="#133E32" style={{ marginRight: 8 }} />
                            <Text style={styles.headerTitle}>Filter Boardings</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                            <Ionicons name="close" size={22} color="#0F172A" />
                        </TouchableOpacity>
                    </View>

                    {/* Smooth Scrollable Body */}
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.scrollBody}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                    >

                        {/* Category 1: Boarding Type */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>1. Boarding Type</Text>
                            <Text style={styles.sectionSubtitle}>Categorized by occupancy structure</Text>

                            <View style={styles.categoryCardRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.categoryCard,
                                        boardingCategory === 'ALL' && styles.categoryCardActive
                                    ]}
                                    onPress={() => setBoardingCategory('ALL')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name="grid-outline"
                                        size={20}
                                        color={boardingCategory === 'ALL' ? '#133E32' : '#64748B'}
                                    />
                                    <Text style={[styles.categoryCardText, boardingCategory === 'ALL' && styles.categoryCardTextActive]}>
                                        All Types
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.categoryCard,
                                        boardingCategory === 'ROOM_BASED' && styles.categoryCardActive
                                    ]}
                                    onPress={() => setBoardingCategory('ROOM_BASED')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name="bed-outline"
                                        size={20}
                                        color={boardingCategory === 'ROOM_BASED' ? '#133E32' : '#64748B'}
                                    />
                                    <Text style={[styles.categoryCardText, boardingCategory === 'ROOM_BASED' && styles.categoryCardTextActive]}>
                                        Room Based
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.categoryCard,
                                        boardingCategory === 'ANNEX' && styles.categoryCardActive
                                    ]}
                                    onPress={() => setBoardingCategory('ANNEX')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name="home-outline"
                                        size={20}
                                        color={boardingCategory === 'ANNEX' ? '#133E32' : '#64748B'}
                                    />
                                    <Text style={[styles.categoryCardText, boardingCategory === 'ANNEX' && styles.categoryCardTextActive]}>
                                        Annex Type
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Category 2: Dynamic Price Filter with UX Improvements */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>2. Monthly Price Range (LKR)</Text>
                            </View>

                            {/* Rent Calculation Basis Selection under Monthly Price Range (for Room Based or All) */}
                            {(boardingCategory === 'ROOM_BASED' || boardingCategory === 'ALL') && (
                                <View style={{ marginBottom: 14 }}>
                                    <Text style={[styles.subCategoryTitle, { color: '#64748B', marginBottom: 6 }]}>Price Calculation Basis:</Text>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <TouchableOpacity
                                            style={[
                                                styles.rentBasisChip,
                                                rentBasis === 'PER_PERSON' && styles.rentBasisChipActive
                                            ]}
                                            onPress={() => setRentBasis('PER_PERSON')}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name="person-outline"
                                                size={15}
                                                color={rentBasis === 'PER_PERSON' ? '#133E32' : '#64748B'}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={[styles.rentBasisChipText, rentBasis === 'PER_PERSON' && styles.rentBasisChipTextActive]}>
                                                Per Person
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.rentBasisChip,
                                                rentBasis === 'PER_ROOM' && styles.rentBasisChipActive
                                            ]}
                                            onPress={() => setRentBasis('PER_ROOM')}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name="key-outline"
                                                size={15}
                                                color={rentBasis === 'PER_ROOM' ? '#133E32' : '#64748B'}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={[styles.rentBasisChipText, rentBasis === 'PER_ROOM' && styles.rentBasisChipTextActive]}>
                                                Per Room
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Direct Price Input Fields */}
                            <View style={styles.priceInputRow}>
                                <View style={styles.priceInputBox}>
                                    <Text style={styles.priceInputLabel}>Min Price (Rs.)</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        value={priceMinInput}
                                        onChangeText={(val) => {
                                            setPriceMinInput(val);
                                            setActivePricePreset('CUSTOM');
                                        }}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>

                                <Text style={styles.priceDash}>-</Text>

                                <View style={styles.priceInputBox}>
                                    <Text style={styles.priceInputLabel}>Max Price (Rs.)</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        value={priceMaxInput}
                                        onChangeText={(val) => {
                                            setPriceMaxInput(val);
                                            setActivePricePreset('CUSTOM');
                                        }}
                                        keyboardType="numeric"
                                        placeholder="100000"
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            {/* Quick Price Preset Chips */}
                            <Text style={styles.presetLabel}>Quick Presets:</Text>
                            <View style={styles.presetChipRow}>
                                {[
                                    { id: 'ALL', label: 'Any Price' },
                                    { id: '<15k', label: '< 15k' },
                                    { id: '15k-30k', label: '15k - 30k' },
                                    { id: '30k-50k', label: '30k - 50k' },
                                    { id: '50k+', label: '50k+' },
                                ].map((preset) => {
                                    const isActive = activePricePreset === preset.id;
                                    return (
                                        <TouchableOpacity
                                            key={preset.id}
                                            style={[styles.presetChip, isActive && styles.presetChipActive]}
                                            onPress={() => handleSelectPricePreset(preset.id)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                                                {preset.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Category 3: Gender Preference Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>3. Gender Preference</Text>
                            <View style={styles.segmentRow}>
                                {[
                                    { id: 'ANY', label: 'Any Gender', icon: 'people-outline' },
                                    { id: 'MALE', label: 'Boys Only', icon: 'male-outline' },
                                    { id: 'FEMALE', label: 'Girls Only', icon: 'female-outline' },
                                ].map((item) => {
                                    const isActive = selectedGender === item.id;
                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                                            onPress={() => setSelectedGender(item.id)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={item.icon}
                                                size={16}
                                                color={isActive ? '#133E32' : '#64748B'}
                                                style={{ marginBottom: 2 }}
                                            />
                                            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Category 4: Amenities & Features Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>4. Key Amenities</Text>

                            <View style={styles.amenitiesGrid}>
                                {[
                                    { key: 'wifi', label: 'WiFi Connection', icon: 'wifi-outline' },
                                    { key: 'parking', label: 'Parking Area', icon: 'car-outline' },
                                    { key: 'laundry', label: 'Laundry Facility', icon: 'shirt-outline' },
                                    { key: 'attachedBathroom', label: 'Attached Bath', icon: 'water-outline' },
                                    { key: 'kitchenAccess', label: 'Kitchen Access', icon: 'restaurant-outline' },
                                    { key: 'airConditioning', label: 'A/C Room', icon: 'snow-outline' },
                                ].map((amenityItem) => {
                                    const isChecked = amenities[amenityItem.key];
                                    return (
                                        <TouchableOpacity
                                            key={amenityItem.key}
                                            style={[styles.amenityTile, isChecked && styles.amenityTileActive]}
                                            onPress={() => toggleAmenity(amenityItem.key)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={amenityItem.icon}
                                                size={18}
                                                color={isChecked ? '#133E32' : '#64748B'}
                                                style={{ marginRight: 8 }}
                                            />
                                            <Text style={[styles.amenityTileText, isChecked && styles.amenityTileTextActive]}>
                                                {amenityItem.label}
                                            </Text>
                                            <View style={[styles.miniCheck, isChecked && styles.miniCheckActive]}>
                                                {isChecked && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Bottom Fixed Action Buttons */}
                    <View style={styles.footerRow}>
                        <TouchableOpacity
                            style={styles.resetBtn}
                            onPress={handleReset}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="refresh-outline" size={16} color="#133E32" style={{ marginRight: 4 }} />
                            <Text style={styles.resetBtnText}>Reset All</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.applyBtn}
                            onPress={handleApply}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.applyBtnText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View >
        </Modal >
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '85%',
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 14,
        elevation: 10,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
        flexDirection: 'column',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    dragHandle: {
        width: 48,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#CBD5E1',
    },

    /* Header */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    closeBtn: {
        padding: 4,
    },

    /* Scroll Body */
    scrollBody: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },

    /* Section Styling */
    section: {
        marginBottom: 22,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 12,
    },

    /* Boarding Category Cards */
    categoryCardRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    categoryCard: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        gap: 6,
    },
    categoryCardActive: {
        borderColor: '#133E32',
        backgroundColor: '#E6F0EC',
    },
    categoryCardText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    categoryCardTextActive: {
        color: '#133E32',
        fontWeight: '800',
    },

    subCategoryBox: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 12,
        marginTop: 4,
    },
    subCategoryTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
    },

    rentBasisChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
    },
    rentBasisChipActive: {
        backgroundColor: '#E6F0EC',
        borderColor: '#133E32',
    },
    rentBasisChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    rentBasisChipTextActive: {
        color: '#133E32',
        fontWeight: '800',
    },

    /* Checkboxes */
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    checkboxActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    checkboxLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
    },

    /* Price Section UX */
    priceInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    priceInputBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    priceInputLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    priceInput: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        paddingVertical: 2,
    },
    priceDash: {
        fontSize: 18,
        fontWeight: '800',
        color: '#64748B',
        marginHorizontal: 10,
    },

    presetLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
    },
    presetChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    presetChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    presetChipActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    presetChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    presetChipTextActive: {
        color: '#FFD700',
        fontWeight: '800',
    },

    /* Segment Buttons */
    segmentRow: {
        flexDirection: 'row',
        gap: 8,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentBtnActive: {
        borderColor: '#133E32',
        borderWidth: 1.5,
        backgroundColor: '#E6F0EC',
    },
    segmentText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    segmentTextActive: {
        color: '#133E32',
        fontWeight: '800',
    },

    /* Amenities Grid */
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    amenityTile: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    amenityTileActive: {
        borderColor: '#133E32',
        backgroundColor: '#E6F0EC',
    },
    amenityTileText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    amenityTileTextActive: {
        color: '#133E32',
        fontWeight: '800',
    },
    miniCheck: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniCheckActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },

    /* Sort Chips */
    sortRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sortChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sortChipActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    sortChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    sortChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '800',
    },

    /* Footer Row */
    footerRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 12,
    },
    resetBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#E6F0EC',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#133E32',
    },
    applyBtn: {
        flex: 1.5,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#133E32',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    applyBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
