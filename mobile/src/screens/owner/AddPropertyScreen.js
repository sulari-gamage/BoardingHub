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
    Platform,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

export default function AddPropertyScreen({ onBack, onSaveProperty }) {
    // Current active wizard step: 1 (Info), 2 (Location), 3 (Amenities), 4 (Photos)
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1 Form State (Property Info & Certificate Gallery Modal)
    const CERTIFICATE_GALLERY_ITEMS = [
        { id: 'gal_1', name: 'LEED_Eco_Building_Certificate_2024.jpg', title: 'LEED Eco Building Pass', uri: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80', size: '2.4 MB' },
        { id: 'gal_2', name: 'Solar_Power_Permit_Moratuwa.png', title: 'Solar Energy Grid Permit', uri: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80', size: '1.8 MB' },
        { id: 'gal_3', name: 'Fire_Safety_Inspection_Passed.pdf', title: 'Municipal Fire Safety Pass', uri: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80', size: '3.1 MB' },
        { id: 'gal_4', name: 'Water_Quality_Audit_2024.jpg', title: 'Water Quality & Safety Audit', uri: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=600&q=80', size: '1.2 MB' },
        { id: 'gal_5', name: 'Waste_Recycling_Eco_Badge.png', title: 'Zero Waste & Recycling Badge', uri: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80', size: '950 KB' },
    ];

    const [propertyName, setPropertyName] = useState('');
    const [propertyNature, setPropertyNature] = useState('ROOM_BASED'); // ROOM_BASED or WHOLE_HOUSE
    const [description, setDescription] = useState('');
    const [genderPreference, setGenderPreference] = useState('Mixed');
    const [certifications, setCertifications] = useState([]);
    const [uploadedCertPhotos, setUploadedCertPhotos] = useState([]);
    const [newCertText, setNewCertText] = useState('');
    const [isCertModalVisible, setIsCertModalVisible] = useState(false);
    const [isGalleryModalVisible, setIsGalleryModalVisible] = useState(false);
    const [selectedGalleryItemIds, setSelectedGalleryItemIds] = useState(['gal_1']);

    // Step 2 Form State (Location & Dynamic Map Geocoding)
    const LOCATION_PRESETS = [
        { label: 'Moratuwa (Katubedda)', city: 'Moratuwa', address: '123 Katubedda Road, Moratuwa', postalCode: '10400', lat: 6.7730, lng: 79.8816, image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80' },
        { label: 'Colombo 07 (Cinnamon Gardens)', city: 'Colombo', address: '45 Ward Place, Colombo 07', postalCode: '00700', lat: 6.9147, lng: 79.8647, image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80' },
        { label: 'Peradeniya (Kandy)', city: 'Kandy', address: '88 Galaha Road, Peradeniya', postalCode: '20400', lat: 7.2606, lng: 80.5976, image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80' },
        { label: 'Kelaniya (Dalugama)', city: 'Kelaniya', address: '12 Kandy Road, Dalugama, Kelaniya', postalCode: '11600', lat: 6.9553, lng: 79.9174, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80' },
        { label: 'Malabe (SLIIT Campus)', city: 'Malabe', address: '99 Kaduwela Road, Malabe', postalCode: '10115', lat: 6.9061, lng: 79.9696, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
        { label: 'Nugegoda (USJ Area)', city: 'Nugegoda', address: '55 High Level Road, Nugegoda', postalCode: '10250', lat: 6.8719, lng: 79.8885, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80' },
    ];

    const [searchAddress, setSearchAddress] = useState('123 Katubedda Road, Moratuwa');
    const [city, setCity] = useState('Moratuwa');
    const [postalCode, setPostalCode] = useState('10400');
    const [mapCoords, setMapCoords] = useState({ lat: 6.7730, lng: 79.8816 });
    const [mapImage, setMapImage] = useState('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80');
    const [isPrimaryHub, setIsPrimaryHub] = useState(true);

    const handleSelectPreset = (preset) => {
        setSearchAddress(preset.address);
        setCity(preset.city);
        setPostalCode(preset.postalCode);
        setMapCoords({ lat: preset.lat, lng: preset.lng });
        setMapImage(preset.image);
    };

    const handleSearchChange = (text) => {
        setSearchAddress(text);
        const textLower = text.toLowerCase();
        const matched = LOCATION_PRESETS.find(p =>
            p.city.toLowerCase().includes(textLower) ||
            p.label.toLowerCase().includes(textLower) ||
            p.address.toLowerCase().includes(textLower)
        );
        if (matched) {
            setCity(matched.city);
            setPostalCode(matched.postalCode);
            setMapCoords({ lat: matched.lat, lng: matched.lng });
            setMapImage(matched.image);
        } else if (text.trim()) {
            setCity(text.split(',')[0] || text);
        }
    };

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

    const openDeviceGalleryPicker = async (onFileSelected, acceptType = 'image/*') => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Needed', 'Please allow access to your device photo gallery to pick photos and certificates.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const fileName = asset.fileName || asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
                onFileSelected({
                    name: fileName,
                    size: asset.fileSize || 0,
                    type: asset.mimeType || 'image/jpeg',
                    uri: asset.uri,
                });
            }
        } catch (err) {
            console.log('Error launching native phone gallery:', err);
            if (typeof document !== 'undefined') {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = acceptType;
                fileInput.onchange = (event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            onFileSelected({
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                uri: e.target?.result || URL.createObjectURL(file),
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                };
                fileInput.click();
            }
        }
    };

    const toggleGalleryItemSelection = (id) => {
        if (selectedGalleryItemIds.includes(id)) {
            setSelectedGalleryItemIds(selectedGalleryItemIds.filter(i => i !== id));
        } else {
            setSelectedGalleryItemIds([...selectedGalleryItemIds, id]);
        }
    };

    const handleConfirmGallerySelection = () => {
        const selectedItems = CERTIFICATE_GALLERY_ITEMS.filter(item => selectedGalleryItemIds.includes(item.id));
        if (selectedItems.length === 0) {
            Alert.alert('No Selection', 'Please select at least one certificate from the gallery.');
            return;
        }
        const newUploadedCerts = selectedItems.map(item => ({
            id: `cert_${Date.now()}_${item.id}`,
            name: item.name,
            title: item.title,
            uri: item.uri,
            size: item.size
        }));

        const existingNames = uploadedCertPhotos.map(c => c.name);
        const filteredNew = newUploadedCerts.filter(c => !existingNames.includes(c.name));

        setUploadedCertPhotos(prev => [...prev, ...filteredNew]);
        setIsGalleryModalVisible(false);
        Alert.alert('Certificates Selected 🎉', `Added ${selectedItems.length} certificate(s) from device gallery.`);
    };

    const handleBrowseCustomDeviceFile = () => {
        openDeviceGalleryPicker((file) => {
            const certItem = {
                id: `cert_${Date.now()}`,
                name: file.name || 'Custom_Device_Certificate.jpg',
                uri: file.uri,
                size: 'Device File'
            };
            setUploadedCertPhotos((prev) => [...prev, certItem]);
            setIsGalleryModalVisible(false);
            Alert.alert('Device File Uploaded 📄', `Loaded "${certItem.name}" directly from device storage.`);
        }, 'image/*,.pdf');
    };

    const handlePickCertPhoto = () => {
        openDeviceGalleryPicker((file) => {
            const certItem = {
                id: `cert_${Date.now()}`,
                name: file.name || `Certificate_${Date.now()}.jpg`,
                title: file.name ? file.name.replace(/\.[^/.]+$/, "") : 'Phone Gallery Document',
                uri: file.uri,
                size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Real Photo'
            };
            setUploadedCertPhotos((prev) => [...prev, certItem]);
        }, 'image/*,.pdf');
    };

    const handlePickCoverPhoto = () => {
        openDeviceGalleryPicker((file) => {
            setCoverImage(file.uri);
        }, 'image/*');
    };

    const handlePickAdditionalPhoto = () => {
        openDeviceGalleryPicker((file) => {
            const newPhoto = {
                id: `photo_${Date.now()}`,
                name: file.name || 'Gallery_Photo.jpg',
                uri: file.uri,
                isUploading: false,
            };
            setAdditionalPhotos((prev) => [...prev, newPhoto]);
        }, 'image/*');
    };

    const handleRemoveCertPhoto = (id) => {
        setUploadedCertPhotos(uploadedCertPhotos.filter((item) => item.id !== id));
    };

    const handleNext = async () => {
        if (currentStep === 1 && !propertyName.trim()) {
            Alert.alert('Required Field', 'Please enter a property name.');
            return;
        }
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            // Step 4: Publish Property
            try {
                // 1. Map GenderPreference to backend Enum (ANY, MALE_ONLY, FEMALE_ONLY)
                let mappedGender = 'ANY';
                if (genderPreference === 'Female Only') mappedGender = 'FEMALE_ONLY';
                else if (genderPreference === 'Male Only') mappedGender = 'MALE_ONLY';
                else if (genderPreference === 'Mixed') mappedGender = 'ANY';

                // 2. Geocode city location coordinates from dynamic map selection
                const lat = mapCoords.lat || 6.773;
                const lng = mapCoords.lng || 79.8816;

                // 3. Prepare Image URLs list
                const imagesList = [coverImage];
                additionalPhotos.forEach(p => {
                    if (p.uri && !imagesList.includes(p.uri)) {
                        imagesList.push(p.uri);
                    }
                });

                // 4. Construct RoomRequest DTO (roomType, monthlyPrice, totalCapacity, remainingSpaces)
                const rentVal = propertyNature === 'WHOLE_HOUSE' ? 45000 : 20000;
                const capacity = propertyNature === 'WHOLE_HOUSE' ? 1 : 4;
                const roomTypeLabel = propertyNature === 'WHOLE_HOUSE' ? 'Whole House / Annex' : 'Shared Room';

                const propertyPayload = {
                    title: propertyName,
                    description: description || 'Eco-friendly student boarding house with modern amenities.',
                    address: searchAddress || '123 University Road',
                    city: city || 'Moratuwa',
                    genderPreference: mappedGender,
                    monthlyRent: parseFloat(rentVal),
                    latitude: lat,
                    longitude: lng,
                    imageUrls: imagesList,
                    rooms: [
                        {
                            roomType: roomTypeLabel,
                            monthlyPrice: parseFloat(rentVal),
                            totalCapacity: parseInt(capacity),
                            remainingSpaces: parseInt(capacity),
                        }
                    ]
                };

                const savedProperty = await api.properties.create(propertyPayload);
                Alert.alert('Success 🎉', 'New property submitted successfully for admin review!');
                if (onSaveProperty) onSaveProperty(savedProperty);
                else if (onBack) onBack();
            } catch (err) {
                console.log('Error creating property:', err);
                Alert.alert('Submission Error', err.message || 'Could not submit property.');
            }
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

                        {/* Eco-Certifications / Optional Tags & Gallery Upload */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                            <Text style={[styles.fieldLabel, { marginTop: 0 }]}>Eco-Certifications & Documents</Text>
                            <TouchableOpacity
                                onPress={handlePickCertPhoto}
                                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="images-outline" size={15} color="#133E32" style={{ marginRight: 4 }} />
                                <Text style={{ color: '#133E32', fontSize: 12, fontWeight: '700' }}>Upload from Gallery</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Uploaded Device Gallery Certification Documents */}
                        {uploadedCertPhotos.length > 0 && (
                            <View style={{ marginVertical: 8, gap: 8 }}>
                                {uploadedCertPhotos.map((certItem) => (
                                    <View key={certItem.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                        <Image source={{ uri: certItem.uri }} style={{ width: 38, height: 38, borderRadius: 6, marginRight: 10 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                                                📄 {certItem.name}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: '#133E32', fontWeight: '600' }}>
                                                Device Gallery • Verified Document
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleRemoveCertPhoto(certItem.id)} style={{ padding: 4 }}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

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
                                <Text style={styles.addCertText}>Add Certification Tag</Text>
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
                        {/* Quick Preset Location Chips */}
                        <Text style={[styles.fieldLabel, { marginTop: 0, marginBottom: 6 }]}>Popular University / City Hubs</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {LOCATION_PRESETS.map((preset) => {
                                    const isSel = city.toLowerCase() === preset.city.toLowerCase();
                                    return (
                                        <TouchableOpacity
                                            key={preset.label}
                                            style={[styles.certChip, isSel && { backgroundColor: '#133E32', borderColor: '#133E32' }]}
                                            onPress={() => handleSelectPreset(preset)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="location" size={14} color={isSel ? '#FFD700' : '#133E32'} style={{ marginRight: 4 }} />
                                            <Text style={[styles.certChipText, isSel && { color: '#FFFFFF', fontWeight: '800' }]}>
                                                {preset.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* Map View Box with Floating Address Search Overlay */}
                        <View style={styles.mapCard}>
                            <Image
                                source={{ uri: mapImage }}
                                style={styles.mapImage}
                                resizeMode="cover"
                            />

                            {/* Floating Address Search Input */}
                            <View style={styles.mapSearchOverlay}>
                                <Ionicons name="search" size={18} color="#133E32" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.mapSearchInput}
                                    placeholder="Search location, university, or city..."
                                    placeholderTextColor="#94A3B8"
                                    value={searchAddress}
                                    onChangeText={handleSearchChange}
                                />
                            </View>

                            {/* Center Map Pin with Dynamic Location Info Badge */}
                            <View style={styles.mapPinContainer}>
                                <View style={{ alignItems: 'center' }}>
                                    <View style={{ backgroundColor: '#133E32', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 4 }}>
                                        <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '800' }}>
                                            📍 {city || 'Selected Location'} ({mapCoords.lat.toFixed(3)}° N, {mapCoords.lng.toFixed(3)}° E)
                                        </Text>
                                    </View>
                                    <View style={styles.pinCircle}>
                                        <Ionicons name="location" size={24} color="#133E32" />
                                    </View>
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
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={styles.photoCardTitle}>Cover Image</Text>
                                    <Text style={styles.photoCardSubtitle}>Required. Selected from your device gallery.</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={handlePickCoverPhoto}
                                    style={{ backgroundColor: '#133E32', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '800' }}>Select Photo</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.coverImagePreviewWrapper, { marginTop: 12 }]}>
                                <Image source={{ uri: coverImage }} style={styles.coverImagePreview} resizeMode="cover" />
                                <View style={styles.coverActionButtons}>
                                    <TouchableOpacity style={styles.actionBtnCircle} onPress={handlePickCoverPhoto} activeOpacity={0.8}>
                                        <Ionicons name="pencil" size={16} color="#133E32" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Additional Photos Box */}
                        <View style={styles.photoCard}>
                            <View style={styles.photoCardHeaderRow}>
                                <Text style={styles.photoCardTitle}>Additional Photos ({additionalPhotos.length})</Text>
                                <TouchableOpacity onPress={handlePickAdditionalPhoto} style={styles.limitBadge} activeOpacity={0.8}>
                                    <Text style={styles.limitBadgeText}>+ Upload from Device</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.photoCardSubtitle}>Upload interior spaces, rooms, and facilities directly from your device gallery.</Text>

                            <View style={styles.additionalGrid}>
                                {additionalPhotos.map((photo) => (
                                    <View key={photo.id} style={styles.thumbWrapper}>
                                        <Image source={{ uri: photo.uri }} style={styles.thumbImage} resizeMode="cover" />
                                        <TouchableOpacity
                                            onPress={() => setAdditionalPhotos(additionalPhotos.filter(p => p.id !== photo.id))}
                                            style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 12, padding: 3 }}
                                        >
                                            <Ionicons name="trash" size={12} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {/* Add Photo Button Card */}
                                <TouchableOpacity style={styles.addPhotoCard} onPress={handlePickAdditionalPhoto} activeOpacity={0.8}>
                                    <Ionicons name="images-outline" size={28} color="#133E32" />
                                    <Text style={styles.addPhotoCardText}>Gallery Upload</Text>
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
