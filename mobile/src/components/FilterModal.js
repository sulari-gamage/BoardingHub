import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FilterModal({ visible, onClose, onApply }) {
    const [selectedGender, setSelectedGender] = useState('Female');
    const [roomTypes, setRoomTypes] = useState({
        privateRoom: true,
        sharedRoom: false,
    });
    const [amenities, setAmenities] = useState({
        wifi: true,
        parking: true,
        laundry: false,
    });
    const [priceMin, setPriceMin] = useState(10000);
    const [priceMax, setPriceMax] = useState(30000);

    const toggleRoomType = (key) => {
        setRoomTypes((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAmenity = (key) => {
        setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleReset = () => {
        setSelectedGender('Female');
        setRoomTypes({ privateRoom: true, sharedRoom: false });
        setAmenities({ wifi: true, parking: true, laundry: false });
        setPriceMin(10000);
        setPriceMax(30000);
    };

    const handleApply = () => {
        if (onApply) {
            onApply({
                gender: selectedGender,
                roomTypes,
                amenities,
                priceMin,
                priceMax,
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
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            {/* Drag Handle */}
                            <View style={styles.handleContainer}>
                                <View style={styles.dragHandle} />
                            </View>

                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Filters</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                                    <Ionicons name="close" size={22} color="#0F172A" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                                {/* Price Range Section */}
                                <View style={styles.section}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Text style={styles.sectionTitle}>Price Range</Text>
                                        <Text style={styles.priceValueText}>
                                            Rs. {priceMin.toLocaleString()} - {priceMax.toLocaleString()}
                                        </Text>
                                    </View>

                                    {/* Styled Range Bar */}
                                    <View style={styles.sliderTrackContainer}>
                                        <View style={styles.sliderTrackBackground} />
                                        <View style={[styles.sliderTrackActive, { left: '15%', right: '25%' }]} />
                                        <View style={[styles.sliderThumb, { left: '48%' }]} />
                                    </View>
                                </View>

                                {/* Gender Preference Section */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Gender Preference</Text>
                                    <View style={styles.segmentRow}>
                                        {['Male', 'Female', 'Mixed'].map((item) => {
                                            const isActive = selectedGender === item;
                                            return (
                                                <TouchableOpacity
                                                    key={item}
                                                    style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                                                    onPress={() => setSelectedGender(item)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                                                        {item}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Room Type Section */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Room Type</Text>

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => toggleRoomType('privateRoom')}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.checkbox, roomTypes.privateRoom && styles.checkboxActive]}>
                                            {roomTypes.privateRoom && (
                                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                            )}
                                        </View>
                                        <Text style={styles.checkboxLabel}>Private Room</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => toggleRoomType('sharedRoom')}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.checkbox, roomTypes.sharedRoom && styles.checkboxActive]}>
                                            {roomTypes.sharedRoom && (
                                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                            )}
                                        </View>
                                        <Text style={styles.checkboxLabel}>Shared Room</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Amenities Section */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Amenities</Text>

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => toggleAmenity('wifi')}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.checkbox, amenities.wifi && styles.checkboxActive]}>
                                            {amenities.wifi && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>WiFi</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => toggleAmenity('parking')}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.checkbox, amenities.parking && styles.checkboxActive]}>
                                            {amenities.parking && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>Parking</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => toggleAmenity('laundry')}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.checkbox, amenities.laundry && styles.checkboxActive]}>
                                            {amenities.laundry && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>Laundry</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>

                            {/* Bottom Fixed Action Buttons */}
                            <View style={styles.footerRow}>
                                <TouchableOpacity
                                    style={styles.resetBtn}
                                    onPress={handleReset}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.resetBtnText}>Reset</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.applyBtn}
                                    onPress={handleApply}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.applyBtnText}>Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 10,
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
        paddingBottom: 12,
    },

    /* Section Styling */
    section: {
        marginBottom: 22,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
    },
    priceValueText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },

    /* Slider Track */
    sliderTrackContainer: {
        position: 'relative',
        height: 30,
        justifyContent: 'center',
        marginVertical: 4,
    },
    sliderTrackBackground: {
        height: 4,
        backgroundColor: '#CBD5E1',
        borderRadius: 2,
        width: '100%',
    },
    sliderTrackActive: {
        position: 'absolute',
        height: 4,
        backgroundColor: '#1B4D3E',
        borderRadius: 2,
    },
    sliderThumb: {
        position: 'absolute',
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#1B4D3E',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },

    /* Segment Buttons */
    segmentRow: {
        flexDirection: 'row',
        gap: 10,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    segmentBtnActive: {
        borderColor: '#1B4D3E',
        borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    segmentTextActive: {
        color: '#1B4D3E',
        fontWeight: '800',
    },

    /* Checkboxes */
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: '#1B4D3E',
        borderColor: '#1B4D3E',
    },
    checkboxLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
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
        backgroundColor: '#ECF3F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    applyBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#D97706',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    applyBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
