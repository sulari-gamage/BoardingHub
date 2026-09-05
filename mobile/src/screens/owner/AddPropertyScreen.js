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
    Image,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddPropertyScreen({ onBack, onSaveProperty }) {
    // Current active wizard step: 1 (Info), 2 (Location), 3 (Amenities), 4 (Photos)
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1 Form State (Property Info)
    const [propertyName, setPropertyName] = useState('Green Valley Boarding');
    const [propertyNature, setPropertyNature] = useState('ROOM_BASED'); // ROOM_BASED or WHOLE_HOUSE
    const [description, setDescription] = useState('');
    const [genderPreference, setGenderPreference] = useState('Mixed');
    const [certifications, setCertifications] = useState(['LEED Certified']);
    const [newCertText, setNewCertText] = useState('');
    const [isCertModalVisible, setIsCertModalVisible] = useState(false);

    // Step 2 Form State (Location)
    const [searchAddress, setSearchAddress] = useState('');
    const [city, setCity] = useState('Moratuwa');
    const [postalCode, setPostalCode] = useState('10400');
    const [isPrimaryHub, setIsPrimaryHub] = useState(true);

    // Step 3 Form State (Amenities Selection)
    const [selectedAmenities, setSelectedAmenities] = useState({
        wifi: true,
        electricity: true,
        parking: true,
        fitness: true,
        cctv: true,
    });

    // Step 4 Form State (Photos)
    const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80');
    const [additionalPhotos, setAdditionalPhotos] = useState([
        { id: '1', uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', isUploading: false },
        { id: '2', name: 'DSC_9912.jpg', progress: 75, isUploading: true },
    ]);

    const toggleAmenity = (key) => {
        setSelectedAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAddCertification = () => {
        if (newCertText.trim()) {
            setCertifications([...certifications, newCertText.trim()]);
            setNewCertText('');
            setIsCertModalVisible(false);
        }
    };

    const removeCertification = (cert) => {
        setCertifications(certifications.filter((c) => c !== cert));
    };

    const handleNext = () => {
        if (currentStep === 1 && !propertyName.trim()) {
            Alert.alert('Required Field', 'Please enter a property name.');
            return;
        }
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            // Step 4: Publish Property
            const newProperty = {
                id: `p_${Date.now()}`,
                title: propertyName,
                propertyNature: propertyNature,
                location: `${city}, Sri Lanka`,
                price: propertyNature === 'WHOLE_HOUSE' ? 45000 : 20000,
                totalRooms: propertyNature === 'WHOLE_HOUSE' ? 1 : 4,
                occupiedRooms: 0,
                availableRooms: propertyNature === 'WHOLE_HOUSE' ? 1 : 4,
                status: 'ACTIVE',
                rating: 5.0,
                imageUrl: coverImage,
                genderPreference,
                amenities: Object.keys(selectedAmenities).filter((k) => selectedAmenities[k]),
            };

            if (onSaveProperty) onSaveProperty(newProperty);
            else Alert.alert('Success 🎉', 'New property listed successfully!');
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            if (onBack) onBack();
        }
    };

    // Render Step Header Bar & Step Indicator
    const renderStepHeader = () => {
        const stepTitles = [
            'Property Information',
            'Location',
            'Property Amenities',
            'Property Photos'
        ];

        return (
            <View style={styles.topHeaderContainer}>
                {/* Brand Header */}
                <View style={styles.brandRow}>
                    <TouchableOpacity style={styles.headerBackBtn} onPress={handlePrev} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={20} color="#133E32" />
                    </TouchableOpacity>
                    <View style={styles.logoRow}>
                        <Image source={require('../../../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
                        <Text style={styles.brandTitle}>BoardingHub</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={onBack} activeOpacity={0.8}>
                        <Ionicons name="close" size={22} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Subtitle Stepper Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>
                        {currentStep === 1 && 'Add New Property'}
                        {currentStep === 2 && 'Location'}
                        {currentStep === 3 && 'Select Property Amenities'}
                        {currentStep === 4 && 'Upload Property Photos'}
                    </Text>
                    <Text style={styles.stepSubtitle}>
                        Step {currentStep} of 4: {stepTitles[currentStep - 1]}
                    </Text>
                </View>

                {/* Number Stepper Circles (1, 2, 3, 4) */}
                <View style={styles.stepperRow}>
                    {[
                        { num: 1, label: 'Info' },
                        { num: 2, label: 'Location' },
                        { num: 3, label: 'Amenities' },
                        { num: 4, label: 'Photos' },
                    ].map((step, idx) => {
                        const isActive = currentStep === step.num;
                        const isPassed = currentStep > step.num;
                        return (
                            <React.Fragment key={step.num}>
                                {idx > 0 && (
                                    <View style={[styles.stepperLine, (isActive || isPassed) && styles.stepperLineActive]} />
                                )}
                                <TouchableOpacity
                                    style={styles.stepItem}
                                    onPress={() => setCurrentStep(step.num)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[
                                        styles.stepCircle,
                                        isActive && styles.stepCircleActive,
                                        isPassed && styles.stepCirclePassed
                                    ]}>
                                        {isPassed ? (
                                            <Ionicons name="checkmark-bold" size={14} color="#FFD700" />
                                        ) : (
                                            <Text style={[styles.stepNumText, isActive && styles.stepNumTextActive]}>
                                                {step.num}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={[styles.stepLabel, (isActive || isPassed) && styles.stepLabelActive]}>
                                        {step.label}
                                    </Text>
                                </TouchableOpacity>
                            </React.Fragment>
                        );
                    })}
                </View>

                {/* Top Progress Bar */}
                <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${(currentStep / 4) * 100}%` }]} />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Top Stepper Header */}
            {renderStepHeader()}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* STEP 1: PROPERTY INFORMATION */}
                {currentStep === 1 && (
                    <View style={styles.cardContainer}>
                        {/* Property Name */}
                        <Text style={styles.fieldLabel}>Property Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Green Valley Boarding"
                            placeholderTextColor="#94A3B8"
                            value={propertyName}
                            onChangeText={setPropertyName}
                        />

                        {/* Property Nature (Room-Based vs Whole House) */}
                        <Text style={styles.fieldLabel}>Property Nature / Type</Text>
                        <View style={styles.genderContainer}>
                            {[
                                { key: 'ROOM_BASED', label: 'Room-Based' },
                                { key: 'WHOLE_HOUSE', label: 'Whole House / Annex' }
                            ].map((nature) => {
                                const isSelected = propertyNature === nature.key;
                                return (
                                    <TouchableOpacity
                                        key={nature.key}
                                        style={[styles.genderPill, isSelected && styles.genderPillActive]}
                                        onPress={() => setPropertyNature(nature.key)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.genderPillText, isSelected && styles.genderPillTextActive]}>
                                            {nature.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Description */}
                        <Text style={styles.fieldLabel}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline
                            numberOfLines={4}
                            placeholder="Describe the ecological features and main selling points..."
                            placeholderTextColor="#94A3B8"
                            value={description}
                            onChangeText={setDescription}
                            textAlignVertical="top"
                        />

                        {/* Gender Preference */}
                        <Text style={styles.fieldLabel}>Gender Preference</Text>
                        <View style={styles.genderContainer}>
                            {['Mixed', 'Female Only', 'Male Only'].map((pref) => {
                                const isSelected = genderPreference === pref;
                                return (
                                    <TouchableOpacity
                                        key={pref}
                                        style={[styles.genderPill, isSelected && styles.genderPillActive]}
                                        onPress={() => setGenderPreference(pref)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.genderPillText, isSelected && styles.genderPillTextActive]}>
                                            {pref}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Eco-Certifications / Optional Tags */}
                        <Text style={styles.fieldLabel}>Eco-Certifications (Optional)</Text>
                        <View style={styles.tagsContainer}>
                            {certifications.map((cert) => (
                                <View key={cert} style={styles.certChip}>
                                    <Text style={styles.certChipText}>{cert}</Text>
                                    <TouchableOpacity onPress={() => removeCertification(cert)} style={{ marginLeft: 6 }}>
                                        <Ionicons name="close-circle" size={16} color="#133E32" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <TouchableOpacity
                                style={styles.addCertChip}
                                onPress={() => setIsCertModalVisible(!isCertModalVisible)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add" size={16} color="#133E32" style={{ marginRight: 4 }} />
                                <Text style={styles.addCertText}>Add Certification</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Add Certification Modal Input */}
                        {isCertModalVisible && (
                            <View style={styles.certInputRow}>
                                <TextInput
                                    style={styles.certInput}
                                    placeholder="Enter certification (e.g. Solar Powered)"
                                    placeholderTextColor="#94A3B8"
                                    value={newCertText}
                                    onChangeText={setNewCertText}
                                />
                                <TouchableOpacity style={styles.certAddBtn} onPress={handleAddCertification}>
                                    <Text style={styles.certAddBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* STEP 2: LOCATION */}
                {currentStep === 2 && (
                    <View style={styles.stepTwoContainer}>
                        {/* Map View Box with Floating Address Search Overlay */}
                        <View style={styles.mapCard}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80' }}
                                style={styles.mapImage}
                                resizeMode="cover"
                            />

                            {/* Floating Address Search Input */}
                            <View style={styles.mapSearchOverlay}>
                                <Ionicons name="search" size={18} color="#133E32" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.mapSearchInput}
                                    placeholder="Search address..."
                                    placeholderTextColor="#94A3B8"
                                    value={searchAddress}
                                    onChangeText={setSearchAddress}
                                />
                            </View>

                            {/* Center Map Pin */}
                            <View style={styles.mapPinContainer}>
                                <View style={styles.pinCircle}>
                                    <Ionicons name="location" size={24} color="#133E32" />
                                </View>
                            </View>
                        </View>

                        {/* City & Postal Code Inputs */}
                        <View style={styles.cardContainer}>
                            <Text style={styles.fieldLabel}>City</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Seattle / Moratuwa"
                                placeholderTextColor="#94A3B8"
                                value={city}
                                onChangeText={setCity}
                            />

                            <Text style={styles.fieldLabel}>Postal Code</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="98101 / 10400"
                                placeholderTextColor="#94A3B8"
                                value={postalCode}
                                onChangeText={setPostalCode}
                                keyboardType="numeric"
                            />

                            {/* Primary Management Hub Toggle Checkbox */}
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setIsPrimaryHub(!isPrimaryHub)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.checkbox, isPrimaryHub && styles.checkboxActive]}>
                                    {isPrimaryHub && <Ionicons name="checkmark" size={14} color="#FFD700" />}
                                </View>
                                <Text style={styles.checkboxLabel}>Set as primary management hub</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* STEP 3: AMENITIES */}
                {currentStep === 3 && (
                    <View style={styles.stepThreeContainer}>
                        {/* Section 1: Basic Utilities */}
                        <Text style={styles.amenityCategoryTitle}>Basic Utilities</Text>
                        <View style={styles.amenityGrid}>
                            {[
                                { key: 'wifi', label: 'High-Speed WiFi', icon: 'wifi-outline' },
                                { key: 'water', label: 'Water Supply', icon: 'water-outline' },
                                { key: 'electricity', label: '24/7 Electricity', icon: 'flash-outline' },
                                { key: 'gas', label: 'Gas Connection', icon: 'flame-outline' },
                            ].map((item) => {
                                const isSelected = !!selectedAmenities[item.key];
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.amenityCard, isSelected && styles.amenityCardSelected]}
                                        onPress={() => toggleAmenity(item.key)}
                                        activeOpacity={0.85}
                                    >
                                        {isSelected && (
                                            <View style={styles.amenityCheckBadge}>
                                                <Ionicons name="checkmark" size={12} color="#133E32" />
                                            </View>
                                        )}
                                        <Ionicons
                                            name={item.icon}
                                            size={22}
                                            color={isSelected ? '#133E32' : '#475569'}
                                            style={{ marginBottom: 6 }}
                                        />
                                        <Text style={[styles.amenityCardText, isSelected && styles.amenityCardTextSelected]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Section 2: Facilities */}
                        <Text style={styles.amenityCategoryTitle}>Facilities</Text>
                        <View style={styles.amenityGrid}>
                            {[
                                { key: 'laundry', label: 'Laundry Room', icon: 'shirt-outline' },
                                { key: 'parking', label: 'Covered Parking', icon: 'car-outline' },
                                { key: 'kitchen', label: 'Shared Kitchen', icon: 'restaurant-outline' },
                                { key: 'common', label: 'Common Area', icon: 'exit-outline' },
                                { key: 'pool', label: 'Swimming Pool', icon: 'water-outline' },
                                { key: 'fitness', label: 'Fitness Center', icon: 'barbell-outline' },
                            ].map((item) => {
                                const isSelected = !!selectedAmenities[item.key];
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.amenityCard, isSelected && styles.amenityCardSelected]}
                                        onPress={() => toggleAmenity(item.key)}
                                        activeOpacity={0.85}
                                    >
                                        {isSelected && (
                                            <View style={styles.amenityCheckBadge}>
                                                <Ionicons name="checkmark" size={12} color="#133E32" />
                                            </View>
                                        )}
                                        <Ionicons
                                            name={item.icon}
                                            size={22}
                                            color={isSelected ? '#133E32' : '#475569'}
                                            style={{ marginBottom: 6 }}
                                        />
                                        <Text style={[styles.amenityCardText, isSelected && styles.amenityCardTextSelected]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Section 3: Security */}
                        <Text style={styles.amenityCategoryTitle}>Security</Text>
                        <View style={styles.amenityGrid}>
                            {[
                                { key: 'cctv', label: '24/7 CCTV', icon: 'videocam-outline' },
                                { key: 'guard', label: 'Security Guard', icon: 'shield-checkmark-outline' },
                                { key: 'keycard', label: 'Keycard Access', icon: 'key-outline' },
                            ].map((item) => {
                                const isSelected = !!selectedAmenities[item.key];
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.amenityCard, isSelected && styles.amenityCardSelected]}
                                        onPress={() => toggleAmenity(item.key)}
                                        activeOpacity={0.85}
                                    >
                                        {isSelected && (
                                            <View style={styles.amenityCheckBadge}>
                                                <Ionicons name="checkmark" size={12} color="#133E32" />
                                            </View>
                                        )}
                                        <Ionicons
                                            name={item.icon}
                                            size={22}
                                            color={isSelected ? '#133E32' : '#475569'}
                                            style={{ marginBottom: 6 }}
                                        />
                                        <Text style={[styles.amenityCardText, isSelected && styles.amenityCardTextSelected]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* STEP 4: PHOTOS */}
                {currentStep === 4 && (
                    <View style={styles.stepFourContainer}>
                        {/* Cover Image Box */}
                        <View style={styles.photoCard}>
                            <Text style={styles.photoCardTitle}>Cover Image</Text>
                            <Text style={styles.photoCardSubtitle}>Required. Ideal aspect ratio 16:9. Max size 5MB.</Text>

                            <View style={styles.coverImagePreviewWrapper}>
                                <Image source={{ uri: coverImage }} style={styles.coverImagePreview} resizeMode="cover" />
                                <View style={styles.coverActionButtons}>
                                    <TouchableOpacity style={styles.actionBtnCircle} activeOpacity={0.8}>
                                        <Ionicons name="pencil" size={16} color="#133E32" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtnCircle, styles.deleteBtnCircle]} activeOpacity={0.8}>
                                        <Ionicons name="trash" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Additional Photos Box */}
                        <View style={styles.photoCard}>
                            <View style={styles.photoCardHeaderRow}>
                                <Text style={styles.photoCardTitle}>Additional Photos</Text>
                                <View style={styles.limitBadge}>
                                    <Text style={styles.limitBadgeText}>2 / 10 limit</Text>
                                </View>
                            </View>
                            <Text style={styles.photoCardSubtitle}>Upload interior spaces, amenities, and technical facilities.</Text>

                            <View style={styles.additionalGrid}>
                                {/* Image 1 Thumbnail */}
                                <View style={styles.thumbWrapper}>
                                    <Image
                                        source={{ uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80' }}
                                        style={styles.thumbImage}
                                        resizeMode="cover"
                                    />
                                </View>

                                {/* File Uploading Progress Card */}
                                <View style={styles.uploadingCard}>
                                    <Ionicons name="image-outline" size={24} color="#133E32" style={{ marginBottom: 6 }} />
                                    <Text style={styles.uploadingFileName} numberOfLines={1}>DSC_9912.jpg</Text>
                                    <View style={styles.uploadingTrack}>
                                        <View style={[styles.uploadingFill, { width: '75%' }]} />
                                    </View>
                                    <Text style={styles.uploadingPercentText}>75%</Text>
                                </View>

                                {/* Add Photo Button Card */}
                                <TouchableOpacity style={styles.addPhotoCard} activeOpacity={0.8}>
                                    <Ionicons name="add-circle-outline" size={30} color="#133E32" />
                                    <Text style={styles.addPhotoCardText}>Add Photo</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Fixed Action Buttons */}
            <View style={styles.bottomBar}>
                {currentStep > 1 ? (
                    <TouchableOpacity style={styles.outlinedBackBtn} onPress={handlePrev} activeOpacity={0.8}>
                        <Text style={styles.outlinedBackBtnText}>
                            {currentStep === 3 ? 'Back to Location' : 'Back'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.outlinedBackBtn} onPress={onBack} activeOpacity={0.8}>
                        <Text style={styles.outlinedBackBtnText}>Cancel</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.primaryNextBtn} onPress={handleNext} activeOpacity={0.85}>
                    <Text style={styles.primaryNextBtnText}>
                        {currentStep === 4 ? 'Publish Listing' : 'Next Step'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFD700" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    /* Top Header */
    topHeaderContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingTop: Platform.OS === 'android' ? 35 : 10,
        paddingHorizontal: 20,
        paddingBottom: 14,
    },
    brandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerBackBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        width: 24,
        height: 20,
        marginRight: 6,
    },
    brandTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#133E32',
    },
    closeBtn: {
        padding: 4,
    },

    /* Stepper Subtitle & Header */
    titleSection: {
        marginBottom: 12,
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#133E32',
        marginBottom: 2,
    },
    stepSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },

    /* Stepper Circles Row */
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    stepItem: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepCircleActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    stepCirclePassed: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    stepNumText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748B',
    },
    stepNumTextActive: {
        color: '#FFD700',
        fontWeight: '900',
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    stepLabelActive: {
        color: '#133E32',
        fontWeight: '800',
    },
    stepperLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 6,
        marginBottom: 16,
    },
    stepperLineActive: {
        backgroundColor: '#133E32',
    },

    progressBarTrack: {
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#133E32',
    },

    /* Scrollable Content */
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Card Container */
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: 16,
    },

    fieldLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        marginTop: 12,
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
    textArea: {
        height: 100,
        paddingTop: 12,
    },

    /* Gender Selector */
    genderContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginTop: 4,
    },
    genderPill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    genderPillActive: {
        backgroundColor: '#133E32',
    },
    genderPillText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    genderPillTextActive: {
        color: '#FFD700',
        fontWeight: '900',
    },

    /* Certification Chips */
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6,
    },
    certChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#C3DCD4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    certChipText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
    },
    addCertChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#133E32',
        borderStyle: 'dashed',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
    },
    addCertText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
    },
    certInputRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    certInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
        fontSize: 13,
    },
    certAddBtn: {
        backgroundColor: '#133E32',
        borderRadius: 10,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    certAddBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
    },

    /* STEP 2: LOCATION */
    stepTwoContainer: {},
    mapCard: {
        position: 'relative',
        height: 220,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapSearchOverlay: {
        position: 'absolute',
        top: 14,
        left: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 44,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mapSearchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
    },
    mapPinContainer: {
        position: 'absolute',
        top: '40%',
        left: '46%',
    },
    pinCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 2,
        borderColor: '#133E32',
    },

    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: '#FFFFFF',
    },
    checkboxActive: {
        backgroundColor: '#133E32',
        borderColor: '#133E32',
    },
    checkboxLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
    },

    /* STEP 3: AMENITIES */
    stepThreeContainer: {},
    amenityCategoryTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#133E32',
        marginTop: 10,
        marginBottom: 12,
    },
    amenityGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 14,
    },
    amenityCard: {
        position: 'relative',
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    amenityCardSelected: {
        backgroundColor: '#E6F0EC',
        borderColor: '#133E32',
    },
    amenityCheckBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },
    amenityCardText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        textAlign: 'center',
    },
    amenityCardTextSelected: {
        color: '#133E32',
        fontWeight: '900',
    },

    /* STEP 4: PHOTOS */
    stepFourContainer: {},
    photoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    photoCardTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#133E32',
        marginBottom: 4,
    },
    photoCardSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 14,
    },
    coverImagePreviewWrapper: {
        position: 'relative',
        height: 180,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
    },
    coverImagePreview: {
        width: '100%',
        height: '100%',
    },
    coverActionButtons: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        gap: 8,
    },
    actionBtnCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    deleteBtnCircle: {
        backgroundColor: '#DC2626',
    },

    photoCardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    limitBadge: {
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    limitBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#133E32',
    },

    additionalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    thumbWrapper: {
        width: 100,
        height: 100,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
    },
    thumbImage: {
        width: '100%',
        height: '100%',
    },
    uploadingCard: {
        width: 130,
        height: 100,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingFileName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    uploadingTrack: {
        width: '100%',
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 4,
    },
    uploadingFill: {
        height: '100%',
        backgroundColor: '#133E32',
    },
    uploadingPercentText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
    },
    addPhotoCard: {
        width: 100,
        height: 100,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#133E32',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
    },
    addPhotoCardText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#133E32',
        marginTop: 4,
    },

    /* Fixed Bottom Action Bar */
    bottomBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
    },
    outlinedBackBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    outlinedBackBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#133E32',
    },
    primaryNextBtn: {
        flex: 1.5,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#133E32',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    primaryNextBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
