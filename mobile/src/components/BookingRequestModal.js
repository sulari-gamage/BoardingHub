import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    Image,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BookingRequestModal({ visible, onClose, boarding = {}, onSubmitBooking }) {
    const [selectedRoom, setSelectedRoom] = useState('Shared Room');
    const [showRoomDropdown, setShowRoomDropdown] = useState(false);
    const [moveInDate, setMoveInDate] = useState('09/10/2026');
    const [peopleCount, setPeopleCount] = useState(1);
    const [message, setMessage] = useState('');

    const roomOptions = ['Shared Room', 'Private Room', 'Single Room'];
    const propertyTitle = boarding.title || 'Green Valley Boarding';

    const handleIncrement = () => setPeopleCount(prev => prev + 1);
    const handleDecrement = () => setPeopleCount(prev => (prev > 1 ? prev - 1 : 1));

    const handleSubmit = () => {
        const bookingData = {
            id: `booking_${Date.now()}`,
            title: propertyTitle,
            location: boarding.location || 'Moratuwa, Sri Lanka',
            date: moveInDate,
            roomType: selectedRoom,
            peopleCount,
            message,
            status: 'PENDING',
            price: boarding.price || 15000,
            imageUrl: boarding.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            description: boarding.description,
            ownerName: boarding.ownerName || 'Sunethra Silva',
            ownerPhone: boarding.ownerPhone || '+94 77 123 4567'
        };

        if (onSubmitBooking) {
            onSubmitBooking(bookingData);
        }
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header Row with Brand Logo & Close Icon */}
                    <View style={styles.header}>
                        <View style={styles.brandRow}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.brandName}>BoardingHub</Text>
                        </View>

                        <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                        {/* Property Card Header */}
                        <View style={styles.cardHeader}>
                            <Text style={styles.modalTitle}>Booking Request</Text>
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={16} color="#1B4D3E" style={{ marginRight: 4 }} />
                                <Text style={styles.propertyName}>{propertyTitle}</Text>
                            </View>
                        </View>

                        {/* Form Section */}
                        <View style={styles.formContainer}>
                            {/* Select Room */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name="bed-outline" size={15} color="#1B4D3E" />  Select Room
                            </Text>
                            <TouchableOpacity
                                style={styles.dropdownBtn}
                                onPress={() => setShowRoomDropdown(!showRoomDropdown)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.dropdownBtnText}>{selectedRoom}</Text>
                                <Ionicons name="chevron-down" size={18} color="#64748B" />
                            </TouchableOpacity>

                            {showRoomDropdown && (
                                <View style={styles.dropdownMenu}>
                                    {roomOptions.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.dropdownItem, selectedRoom === opt && styles.activeDropdownItem]}
                                            onPress={() => {
                                                setSelectedRoom(opt);
                                                setShowRoomDropdown(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, selectedRoom === opt && styles.activeDropdownText]}>
                                                {opt}
                                            </Text>
                                            {selectedRoom === opt && (
                                                <Ionicons name="checkmark" size={16} color="#1B4D3E" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Move-in Date */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name="calendar-outline" size={15} color="#1B4D3E" />  Move-in Date
                            </Text>
                            <View style={styles.dateInputRow}>
                                <TextInput
                                    style={styles.dateInput}
                                    value={moveInDate}
                                    onChangeText={setMoveInDate}
                                    placeholder="mm/dd/yyyy"
                                    placeholderTextColor="#94A3B8"
                                />
                                <Ionicons name="calendar-outline" size={18} color="#64748B" />
                            </View>

                            {/* Number of People Stepper */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name="people-outline" size={15} color="#1B4D3E" />  Number of People
                            </Text>
                            <View style={styles.stepperContainer}>
                                <TouchableOpacity
                                    style={styles.stepperBtnMinus}
                                    onPress={handleDecrement}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="remove" size={18} color="#0F172A" />
                                </TouchableOpacity>

                                <Text style={styles.stepperVal}>{peopleCount}</Text>

                                <TouchableOpacity
                                    style={styles.stepperBtnPlus}
                                    onPress={handleIncrement}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="add" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Message to Owner */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name="chatbox-ellipses-outline" size={15} color="#1B4D3E" />  Message to Owner
                            </Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Any special requests or questions?"
                                placeholderTextColor="#94A3B8"
                                textAlignVertical="top"
                            />

                            {/* Gold Submit Button */}
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleSubmit}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.submitBtnText}>Submit Booking Request</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerBrand}>BoardingHub</Text>
                            <View style={styles.footerLinksRow}>
                                <TouchableOpacity><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
                                <TouchableOpacity><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
                                <TouchableOpacity><Text style={styles.footerLink}>Contact Support</Text></TouchableOpacity>
                            </View>
                            <Text style={styles.copyrightText}>© 2024 BoardingHub. All rights reserved.</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 28,
        height: 22,
        marginRight: 8,
    },
    brandName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    closeBtn: {
        padding: 4,
    },

    /* Scroll Body */
    scrollBody: {
        padding: 20,
    },

    /* Card Header */
    cardHeader: {
        backgroundColor: '#E6F0EC',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#C3DCD4',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    propertyName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1B4D3E',
    },

    /* Form Container */
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        marginTop: 12,
    },
    dropdownBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 4,
    },
    dropdownBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    dropdownMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 12,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    activeDropdownItem: {
        backgroundColor: '#E6F0EC',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#334155',
    },
    activeDropdownText: {
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Date Input */
    dateInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 12,
    },
    dateInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
    },

    /* Stepper */
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 6,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 12,
        width: 170,
    },
    stepperBtnMinus: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperVal: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    stepperBtnPlus: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#1B4D3E',
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Text Area */
    textArea: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 14,
        height: 100,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        fontSize: 14,
        color: '#0F172A',
        marginBottom: 20,
    },

    /* Submit Button */
    submitBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D97706',
        height: 50,
        borderRadius: 12,
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    submitBtnText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFFFFF',
    },

    /* Footer */
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerBrand: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1B4D3E',
        marginBottom: 10,
    },
    footerLinksRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 10,
    },
    footerLink: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    copyrightText: {
        fontSize: 11,
        color: '#94A3B8',
    },
});
