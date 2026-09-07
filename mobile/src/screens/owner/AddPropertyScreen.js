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
import { uploadImage } from '../../services/uploadService';

const AMENITY_MAP = {
    wifi: 'High-Speed WiFi',
    water: 'Water Supply',
    electricity: '24/7 Electricity',
    gas: 'Gas Connection',
    laundry: 'Laundry Room',
    parking: 'Covered Parking',
    kitchen: 'Shared Kitchen',
    common: 'Common Area',
    pool: 'Swimming Pool',
    fitness: 'Fitness Center',
    cctv: 'CCTV Security',
    gate: 'Secure Gate',
    fire: 'Fire Extinguisher',
    firstaid: 'First Aid Kit',
    ac: 'Air Conditioning',
    generator: 'Generator Backup',
    bathroom: 'Attached Bathroom',
    balcony: 'Private Balcony',
};

export default function AddPropertyScreen({ onBack, onSaveProperty, propertyToEdit = null }) {
    const isEditMode = !!propertyToEdit;
    // Current active wizard step: 1 (Info), 2 (Location), 3 (Amenities), 4 (Photos)
    const [currentStep, setCurrentStep] = useState(1);

    // Initial state pre-population from propertyToEdit
    const initialAmenities = {};
    const existingAmenitiesList = propertyToEdit?.amenities || (propertyToEdit?.raw && propertyToEdit.raw.amenities) || [];
    if (Array.isArray(existingAmenitiesList)) {
        existingAmenitiesList.forEach(name => {
            const foundKey = Object.keys(AMENITY_MAP).find(k => AMENITY_MAP[k].toLowerCase() === name.toLowerCase());
            if (foundKey) initialAmenities[foundKey] = true;
            else initialAmenities[name] = true;
        });
    }

    // Step 1 Form State (Property Info & Dynamic Room Inventory)
    const [propertyName, setPropertyName] = useState(propertyToEdit?.title || propertyToEdit?.name || '');
    const [monthlyRent, setMonthlyRent] = useState(propertyToEdit?.monthlyRent ? propertyToEdit.monthlyRent.toString() : (propertyToEdit?.price ? propertyToEdit.price.toString() : ''));
    const [totalCapacity, setTotalCapacity] = useState(propertyToEdit?.totalCapacity ? propertyToEdit.totalCapacity.toString() : '1');
    const [propertyNature, setPropertyNature] = useState(propertyToEdit?.rooms && propertyToEdit.rooms.length > 0 ? 'ROOM_BASED' : 'WHOLE_HOUSE');
    const [description, setDescription] = useState(propertyToEdit?.description || '');
    const [genderPreference, setGenderPreference] = useState(
        propertyToEdit?.genderPreference === 'FEMALE_ONLY' ? 'Female Only' :
            propertyToEdit?.genderPreference === 'MALE_ONLY' ? 'Male Only' : 'Mixed'
    );
    const [certifications, setCertifications] = useState([]);
    const [uploadedCertPhotos, setUploadedCertPhotos] = useState([]);
    const [newCertText, setNewCertText] = useState('');
    const [isCertModalVisible, setIsCertModalVisible] = useState(false);

    // Dynamic Room Inventory State (for ROOM_BASED properties)
    const [rooms, setRooms] = useState(
        ((propertyToEdit?.rooms || (propertyToEdit?.raw && propertyToEdit.raw.rooms)) || []).map((r, i) => ({
            id: r.id ? r.id.toString() : `room_${i}`,
            name: r.roomType || r.name || `Room ${i + 1}`,
            rent: (r.monthlyPrice || r.price || r.rent || 0).toString(),
            capacity: (r.totalCapacity || r.capacity || 1).toString(),
            genderPreference: r.genderPreference || 'Mixed',
            rentType: r.rentType || 'PER_PERSON',
            photos: r.imageUrl ? [{ id: `img_${i}`, uri: r.imageUrl }] : []
        }))
    );
    const [isRoomModalVisible, setIsRoomModalVisible] = useState(false);
    const [currentRoom, setCurrentRoom] = useState({
        id: null,
        name: '',
        rent: '',
        capacity: '1',
        genderPreference: 'Mixed',
        photos: [],
    });

    const handleOpenAddRoomModal = () => {
        setCurrentRoom({
            id: `room_${Date.now()}`,
            name: `Room ${rooms.length + 1}`,
            rent: '',
            capacity: '1',
            genderPreference: 'Mixed',
            rentType: 'PER_PERSON',
            photos: [],
        });
        setIsRoomModalVisible(true);
    };

    const handleOpenEditRoomModal = (room) => {
        setCurrentRoom({
            ...room,
            rentType: room.rentType || 'PER_PERSON',
            photos: room.photos || []
        });
        setIsRoomModalVisible(true);
    };

    const calcAggregateRent = (roomList) => {
        return roomList.reduce((sum, r) => {
            const rentVal = parseFloat(r.rent) || 0;
            const capVal = parseInt(r.capacity) || 1;
            return sum + (r.rentType === 'PER_ROOM' ? rentVal : rentVal * capVal);
        }, 0);
    };

    const handleSaveRoom = () => {
        if (!currentRoom.name.trim()) {
            Alert.alert('Required Field', 'Please enter a name or identifier for the room (e.g. Room 101).');
            return;
        }
        if (!currentRoom.rent.trim() || isNaN(parseFloat(currentRoom.rent)) || parseFloat(currentRoom.rent) <= 0) {
            Alert.alert('Required Field', 'Please enter a valid monthly rent for this room.');
            return;
        }
        if (!currentRoom.capacity.trim() || isNaN(parseInt(currentRoom.capacity)) || parseInt(currentRoom.capacity) <= 0) {
            Alert.alert('Required Field', 'Please enter a valid capacity (occupants) for this room.');
            return;
        }

        const existingIndex = rooms.findIndex((r) => r.id === currentRoom.id);
        let updatedRooms = [];
        if (existingIndex >= 0) {
            updatedRooms = [...rooms];
            updatedRooms[existingIndex] = currentRoom;
        } else {
            updatedRooms = [...rooms, currentRoom];
        }

        setRooms(updatedRooms);
        setIsRoomModalVisible(false);

        // Auto-aggregate total rent and capacity for room-based property
        const aggRent = calcAggregateRent(updatedRooms);
        const aggCap = updatedRooms.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0);
        setMonthlyRent(aggRent.toString());
        setTotalCapacity(aggCap.toString());
    };

    const handleDeleteRoom = (roomId) => {
        const updatedRooms = rooms.filter((r) => r.id !== roomId);
        setRooms(updatedRooms);
        if (updatedRooms.length > 0) {
            const aggRent = calcAggregateRent(updatedRooms);
            const aggCap = updatedRooms.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0);
            setMonthlyRent(aggRent.toString());
            setTotalCapacity(aggCap.toString());
        } else {
            setMonthlyRent('');
            setTotalCapacity('');
        }
    };

    const handlePickRoomPhoto = () => {
        openDeviceGalleryPicker((file) => {
            const newPhoto = {
                id: `room_photo_${Date.now()}`,
                name: file.name || 'Room_Photo.jpg',
                uri: file.uri,
            };
            setCurrentRoom((prev) => ({
                ...prev,
                photos: [...(prev.photos || []), newPhoto],
            }));
        }, 'image/*');
    };

    const handleRemoveRoomPhoto = (photoId) => {
        setCurrentRoom((prev) => ({
            ...prev,
            photos: (prev.photos || []).filter((p) => p.id !== photoId),
        }));
    };

    // Step 2 Form State (Location & Dynamic Map Geocoding)
    const [searchAddress, setSearchAddress] = useState(propertyToEdit?.address || '');
    const [streetAddress, setStreetAddress] = useState(propertyToEdit?.address || '');
    const [city, setCity] = useState(propertyToEdit?.city || '');
    const [postalCode, setPostalCode] = useState('');
    const [mapCoords, setMapCoords] = useState({
        lat: propertyToEdit?.latitude || 6.9271,
        lng: propertyToEdit?.longitude || 79.8612
    });
    const [isPrimaryHub, setIsPrimaryHub] = useState(true);
    const [isMapModalVisible, setIsMapModalVisible] = useState(false);
    const [tempMapCoords, setTempMapCoords] = useState({
        lat: propertyToEdit?.latitude || 6.9271,
        lng: propertyToEdit?.longitude || 79.8612
    });
    const [tempAddressLabel, setTempAddressLabel] = useState('');

    // Sri Lankan Known Cities & Regions Geocoding Table
    const SRI_LANKA_CITIES = {
        colombo: { lat: 6.9271, lng: 79.8612, city: 'Colombo' },
        moratuwa: { lat: 6.7730, lng: 79.8816, city: 'Moratuwa' },
        kandy: { lat: 7.2906, lng: 80.6337, city: 'Kandy' },
        galle: { lat: 6.0535, lng: 80.2210, city: 'Galle' },
        malabe: { lat: 6.9061, lng: 79.9647, city: 'Malabe' },
        maharagama: { lat: 6.8480, lng: 79.9265, city: 'Maharagama' },
        nugegoda: { lat: 6.8728, lng: 79.8879, city: 'Nugegoda' },
        kelaniya: { lat: 6.9535, lng: 79.9174, city: 'Kelaniya' },
        negombo: { lat: 7.2008, lng: 79.8737, city: 'Negombo' },
        jaffna: { lat: 9.6615, lng: 80.0255, city: 'Jaffna' },
        matara: { lat: 5.9549, lng: 80.5550, city: 'Matara' },
        kurunegala: { lat: 7.4863, lng: 80.3647, city: 'Kurunegala' },
        gampaha: { lat: 7.0840, lng: 79.9925, city: 'Gampaha' },
        battaramulla: { lat: 6.8990, lng: 79.9213, city: 'Battaramulla' },
        homagama: { lat: 6.8443, lng: 80.0024, city: 'Homagama' },
        dehiwala: { lat: 6.8511, lng: 79.8660, city: 'Dehiwala' },
        panadura: { lat: 6.7132, lng: 79.9074, city: 'Panadura' },
        peradeniya: { lat: 7.2583, lng: 80.5960, city: 'Peradeniya' },
        ratnapura: { lat: 6.6828, lng: 80.4014, city: 'Ratnapura' },
        anuradhapura: { lat: 8.3114, lng: 80.4037, city: 'Anuradhapura' },
        trincomalee: { lat: 8.5874, lng: 81.2152, city: 'Trincomalee' },
        batticaloa: { lat: 7.7170, lng: 81.7000, city: 'Batticaloa' },
    };

    const handleSearchChange = (text) => {
        setSearchAddress(text);
        if (!text.trim()) {
            setStreetAddress('');
            setCity('');
            return;
        }

        const lowerText = text.toLowerCase().trim();

        // 1. Check if user typed a comma-separated address: e.g. "99 Kaduwela Road, Malabe"
        if (text.includes(',')) {
            const parts = text.split(',');
            const extractedCity = parts[parts.length - 1].trim();
            const extractedStreet = parts.slice(0, parts.length - 1).join(',').trim();
            setStreetAddress(extractedStreet || text.trim());
            setCity(extractedCity || text.trim());
        } else {
            // 2. No comma: check if last word or full string matches a known Sri Lankan city
            const words = text.trim().split(/\s+/);
            const lastWordLower = words[words.length - 1].toLowerCase();
            const matchingCityKey = Object.keys(SRI_LANKA_CITIES).find(
                (k) => lowerText.includes(k) || lastWordLower === k
            );

            if (matchingCityKey) {
                const matchedObj = SRI_LANKA_CITIES[matchingCityKey];
                setCity(matchedObj.city);

                // Extract street address portion if more than city name was typed
                if (words.length > 1) {
                    const streetPart = text.replace(new RegExp(matchedObj.city, 'gi'), '').replace(/,\s*$/, '').trim();
                    setStreetAddress(streetPart || text.trim());
                } else {
                    setStreetAddress(matchedObj.city);
                }
            } else {
                setStreetAddress(text.trim());
                // Set city to the last word if multi-word, or whole text
                setCity(words.length > 1 ? words[words.length - 1] : text.trim());
            }
        }

        // 3. Precise Sri Lankan Geocoding Coordinates Sync
        const matchedCityKey = Object.keys(SRI_LANKA_CITIES).find((k) => lowerText.includes(k));
        if (matchedCityKey) {
            const coords = SRI_LANKA_CITIES[matchedCityKey];
            setMapCoords({ lat: coords.lat, lng: coords.lng });
        } else {
            // Hash into valid Sri Lankan lat/lng range (Lat: 6.0 to 9.5 N, Lng: 79.8 to 81.5 E)
            const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const dynamicLat = parseFloat((6.7000 + ((hash % 250) / 100)).toFixed(4));
            const dynamicLng = parseFloat((79.8500 + ((hash % 150) / 100)).toFixed(4));
            setMapCoords({ lat: dynamicLat, lng: dynamicLng });
        }
    };

    const handleStreetAddressChange = (text) => {
        setStreetAddress(text);
        setSearchAddress(text);
        if (text.trim()) {
            const parts = text.split(',');
            if (parts.length > 1) {
                setCity(parts[parts.length - 1].trim());
            }
        }
    };

    const handleOpenMapPicker = () => {
        setTempMapCoords(mapCoords);
        setTempAddressLabel(streetAddress || searchAddress || city || 'Selected Location');
        setIsMapModalVisible(true);
    };

    const handleConfirmMapPicker = () => {
        setMapCoords(tempMapCoords);
        if (tempAddressLabel) {
            setSearchAddress(tempAddressLabel);
            setStreetAddress(tempAddressLabel);
        }
        setIsMapModalVisible(false);
        Alert.alert('Location Updated 📍', `Pin placed at (${tempMapCoords.lat.toFixed(4)}° N, ${tempMapCoords.lng.toFixed(4)}° E)`);
    };

    const handleInteractiveMapTap = (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const latOffset = ((150 - locationY) / 150) * 0.04;
        const lngOffset = ((locationX - 150) / 150) * 0.04;
        const newLat = parseFloat((tempMapCoords.lat + latOffset).toFixed(4));
        const newLng = parseFloat((tempMapCoords.lng + lngOffset).toFixed(4));
        setTempMapCoords({ lat: newLat, lng: newLng });
        setTempAddressLabel(`${streetAddress || city || 'Picked Map Target'}`);
    };

    // Step 3 Form State (Amenities Selection)
    const [selectedAmenities, setSelectedAmenities] = useState(initialAmenities);

    // Step 4 Form State (Photos)
    const initialCover = propertyToEdit?.imageUrl ||
        (propertyToEdit?.imageUrls && propertyToEdit.imageUrls.length > 0 ? propertyToEdit.imageUrls[0] : null) ||
        (propertyToEdit?.images && propertyToEdit.images.length > 0 ? (typeof propertyToEdit.images[0] === 'string' ? propertyToEdit.images[0] : propertyToEdit.images[0].imageUrl) : null);

    const [coverImage, setCoverImage] = useState(initialCover);
    const [additionalPhotos, setAdditionalPhotos] = useState([]);

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
        if (currentStep === 1) {
            if (!propertyName.trim()) {
                Alert.alert('Required Field', 'Please enter a property name.');
                return;
            }
            if (propertyNature === 'ROOM_BASED') {
                if (rooms.length === 0) {
                    Alert.alert('Room Required', 'Please add at least one room to your room-based property inventory before continuing.');
                    return;
                }
            } else {
                if (!monthlyRent.trim() || isNaN(parseFloat(monthlyRent)) || parseFloat(monthlyRent) <= 0) {
                    Alert.alert('Required Field', 'Please enter a valid monthly rent amount (e.g. 25000).');
                    return;
                }
            }
        }
        if (currentStep === 2) {
            if (!streetAddress.trim() && !searchAddress.trim()) {
                Alert.alert('Required Field', 'Please enter a street address or search location.');
                return;
            }
            if (!city.trim()) {
                Alert.alert('Required Field', 'Please enter a city.');
                return;
            }
        }
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            // Step 4: Publish Property
            if (!coverImage) {
                Alert.alert('Cover Photo Required', 'Please select a cover photo from your device gallery before publishing.');
                return;
            }
            try {
                // 1. Map GenderPreference to backend Enum (ANY, MALE_ONLY, FEMALE_ONLY)
                let mappedGender = 'ANY';
                if (genderPreference === 'Female Only') mappedGender = 'FEMALE_ONLY';
                else if (genderPreference === 'Male Only') mappedGender = 'MALE_ONLY';
                else if (genderPreference === 'Mixed') mappedGender = 'ANY';

                // 2. Location coordinates from dynamic map selection
                const lat = mapCoords.lat || 6.9271;
                const lng = mapCoords.lng || 79.8612;

                // 3. Prepare Image URLs list via Cloudinary (cover + additional + all room photos)
                const uploadedCover = await uploadImage(coverImage);
                const imagesList = [uploadedCover];

                for (const p of additionalPhotos) {
                    if (p.uri) {
                        if (imagesList.includes(p.uri)) continue; // handle already remote urls
                        const url = await uploadImage(p.uri);
                        if (url && !imagesList.includes(url)) imagesList.push(url);
                    }
                }

                // 4. Construct RoomRequest DTO and upload room images
                const parsedRent = parseFloat(monthlyRent) || 0;
                const parsedCapacity = parseInt(totalCapacity || '1');
                const roomTypeLabel = propertyNature === 'WHOLE_HOUSE' ? 'Whole House / Annex' : 'Shared Room';

                const payloadRooms = [];

                if (propertyNature === 'ROOM_BASED' && rooms.length > 0) {
                    for (const r of rooms) {
                        const uploadedRoomPhotos = [];
                        for (const p of (r.photos || [])) {
                            if (p.uri) {
                                const url = await uploadImage(p.uri);
                                if (url) {
                                    uploadedRoomPhotos.push(url);
                                    if (!imagesList.includes(url)) imagesList.push(url);
                                }
                            }
                        }

                        payloadRooms.push({
                            roomType: r.name,
                            monthlyPrice: parseFloat(r.rent) || 0,
                            totalCapacity: parseInt(r.capacity) || 1,
                            remainingSpaces: parseInt(r.capacity) || 1,
                            rentType: r.rentType || 'PER_PERSON',
                            genderPreference: r.genderPreference || mappedGender,
                            imageUrls: uploadedRoomPhotos
                        });
                    }
                } else {
                    payloadRooms.push({
                        roomType: roomTypeLabel,
                        monthlyPrice: parsedRent,
                        totalCapacity: parsedCapacity,
                        remainingSpaces: parsedCapacity,
                        rentType: 'PER_ROOM'
                    });
                }

                // 5. Build amenities string array
                const selectedAmenityNamesList = Object.keys(selectedAmenities)
                    .filter(k => selectedAmenities[k])
                    .map(k => AMENITY_MAP[k] || k);

                const propertyPayload = {
                    title: propertyName,
                    description: description || 'Boarding house property.',
                    address: streetAddress || searchAddress,
                    city: city,
                    genderPreference: mappedGender,
                    monthlyRent: parsedRent,
                    latitude: lat,
                    longitude: lng,
                    amenities: selectedAmenityNamesList,
                    imageUrls: imagesList,
                    rooms: payloadRooms
                };

                let savedProperty;
                if (isEditMode && propertyToEdit?.id) {
                    savedProperty = await api.properties.update(propertyToEdit.id, propertyPayload);
                    Alert.alert('Success 🎉', 'Property updated successfully!');
                } else {
                    savedProperty = await api.properties.create(propertyPayload);
                    Alert.alert('Success 🎉', 'New property published successfully!');
                }
                if (onSaveProperty) onSaveProperty(savedProperty);
                else if (onBack) onBack();
            } catch (err) {
                console.log('Error saving property:', err);
                Alert.alert('Submission Error', err.message || 'Could not save property.');
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
                        {currentStep === 1 && (isEditMode ? 'Edit Property' : 'Add New Property')}
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
                        <Text style={styles.fieldLabel}>Property Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Green Valley Boarding House"
                            placeholderTextColor="#94A3B8"
                            value={propertyName}
                            onChangeText={setPropertyName}
                        />

                        {/* Property Nature (Room-Based vs Whole House) */}
                        <Text style={styles.fieldLabel}>Property Nature / Type *</Text>
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

                        {/* If WHOLE_HOUSE selected: show single property rent & capacity inputs */}
                        {propertyNature === 'WHOLE_HOUSE' ? (
                            <>
                                <Text style={styles.fieldLabel}>Monthly Rent (LKR) *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 45000"
                                    placeholderTextColor="#94A3B8"
                                    value={monthlyRent}
                                    onChangeText={setMonthlyRent}
                                    keyboardType="numeric"
                                />

                                <Text style={styles.fieldLabel}>Total Property Capacity / Occupants</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 6"
                                    placeholderTextColor="#94A3B8"
                                    value={totalCapacity}
                                    onChangeText={setTotalCapacity}
                                    keyboardType="numeric"
                                />
                            </>
                        ) : (
                            /* If ROOM_BASED selected: render dynamic Room Inventory Management card */
                            <View style={{ marginTop: 16, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#CBD5E1' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#133E32' }}>
                                        🛏️ Rooms Inventory ({rooms.length})
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleOpenAddRoomModal}
                                        style={{ backgroundColor: '#133E32', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                                        activeOpacity={0.85}
                                    >
                                        <Ionicons name="add-circle" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                                        <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '800' }}>Add Room</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>
                                    Specify rent, capacity, and upload device photos separately for each room.
                                </Text>

                                {/* Total Aggregated Rent & Capacity Summary Badge */}
                                {rooms.length > 0 && (
                                    <View style={{ backgroundColor: '#E6F0EC', padding: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, borderWidth: 1, borderColor: '#C3DCD4' }}>
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontSize: 10, color: '#133E32', fontWeight: '700' }}>TOTAL ROOMS</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '900', color: '#133E32' }}>{rooms.length}</Text>
                                        </View>
                                        <View style={{ width: 1, backgroundColor: '#CBD5E1' }} />
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontSize: 10, color: '#133E32', fontWeight: '700' }}>TOTAL RENT</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '900', color: '#133E32' }}>LKR {monthlyRent || '0'}</Text>
                                        </View>
                                        <View style={{ width: 1, backgroundColor: '#CBD5E1' }} />
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontSize: 10, color: '#133E32', fontWeight: '700' }}>TOTAL CAPACITY</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '900', color: '#133E32' }}>{totalCapacity || '0'} Beds</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Room Cards List */}
                                {rooms.length === 0 ? (
                                    <TouchableOpacity
                                        onPress={handleOpenAddRoomModal}
                                        style={{ height: 110, borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="bed-outline" size={32} color="#133E32" style={{ marginBottom: 4 }} />
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#133E32' }}>+ Tap to Add Your First Room</Text>
                                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>Set monthly rent, capacity, and room photos</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ gap: 10 }}>
                                        {rooms.map((room, index) => (
                                            <View key={room.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#133E32', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                                            <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '900' }}>{index + 1}</Text>
                                                        </View>
                                                        <View>
                                                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>{room.name}</Text>
                                                            <Text style={{ fontSize: 11, color: '#64748B' }}>
                                                                Pref: <Text style={{ fontWeight: '700', color: '#133E32' }}>{room.genderPreference || 'Mixed'}</Text>
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                                        <TouchableOpacity onPress={() => handleOpenEditRoomModal(room)} style={{ padding: 4 }}>
                                                            <Ionicons name="pencil" size={18} color="#133E32" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleDeleteRoom(room.id)} style={{ padding: 4 }}>
                                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                {/* Room Specs Pills */}
                                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                                    <View style={{ backgroundColor: '#E6F0EC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#133E32' }}>
                                                            💰 LKR {parseFloat(room.rent).toLocaleString()} {room.rentType === 'PER_ROOM' ? '/ room / mo' : '/ person / mo'}
                                                        </Text>
                                                    </View>
                                                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
                                                            👥 Max {room.capacity} Occupant(s)
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Room Gallery Thumbnails */}
                                                {room.photos && room.photos.length > 0 && (
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                                        <View style={{ flexDirection: 'row', gap: 6 }}>
                                                            {room.photos.map((p) => (
                                                                <Image key={p.id} source={{ uri: p.uri }} style={{ width: 50, height: 50, borderRadius: 8 }} />
                                                            ))}
                                                        </View>
                                                    </ScrollView>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

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
                        {/* Interactive Vector Map Canvas Box with Floating Address Search */}
                        <TouchableOpacity
                            style={styles.mapCard}
                            onPress={handleOpenMapPicker}
                            activeOpacity={0.9}
                        >
                            {/* Stylized Vector Grid Background */}
                            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }}>
                                {/* Grid lines background simulation */}
                                <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', top: '25%' }} />
                                <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', top: '50%' }} />
                                <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', top: '75%' }} />
                                <View style={{ position: 'absolute', height: '100%', width: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', left: '33%' }} />
                                <View style={{ position: 'absolute', height: '100%', width: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', left: '66%' }} />
                            </View>

                            {/* Floating Address Search Input */}
                            <View style={styles.mapSearchOverlay}>
                                <Ionicons name="search" size={18} color="#133E32" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.mapSearchInput}
                                    placeholder="Search location, address, or city..."
                                    placeholderTextColor="#94A3B8"
                                    value={searchAddress}
                                    onChangeText={handleSearchChange}
                                />
                            </View>

                            {/* Map Action Badges (Zoom / Tap Indicator) */}
                            <View style={{ position: 'absolute', right: 12, top: 60, gap: 6 }}>
                                <View style={{ backgroundColor: '#133E32', padding: 6, borderRadius: 8, opacity: 0.9 }}>
                                    <Ionicons name="compass" size={18} color="#FFD700" />
                                </View>
                                <View style={{ backgroundColor: '#133E32', padding: 6, borderRadius: 8, opacity: 0.9 }}>
                                    <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
                                </View>
                            </View>

                            {/* Center Map Pin with Dynamic Location Info Badge */}
                            <View style={styles.mapPinContainer}>
                                <View style={{ alignItems: 'center' }}>
                                    <View style={{ backgroundColor: '#133E32', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 4, elevation: 4 }}>
                                        <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '800' }}>
                                            📍 {streetAddress || city || 'Selected Location'}
                                        </Text>
                                        <Text style={{ color: '#E2E8F0', fontSize: 9, fontWeight: '600', textAlign: 'center' }}>
                                            ({mapCoords.lat.toFixed(4)}° N, {mapCoords.lng.toFixed(4)}° E) • Tap to adjust
                                        </Text>
                                    </View>
                                    <View style={styles.pinCircle}>
                                        <Ionicons name="location" size={24} color="#133E32" />
                                    </View>
                                </View>
                            </View>

                            {/* Bottom Touch Map Prompt */}
                            <View style={{ position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                                    👇 Touch map to adjust pin position
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Address, City & Postal Code Inputs */}
                        <View style={styles.cardContainer}>
                            <Text style={styles.fieldLabel}>Street Address *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 99 Kaduwela Road, Malabe"
                                placeholderTextColor="#94A3B8"
                                value={streetAddress}
                                onChangeText={handleStreetAddressChange}
                            />

                            <Text style={styles.fieldLabel}>City / Area *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Malabe / Moratuwa"
                                placeholderTextColor="#94A3B8"
                                value={city}
                                onChangeText={setCity}
                            />

                            <Text style={styles.fieldLabel}>Postal Code</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 10115 / 10400"
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

                        {/* Interactive Full-Screen Map Location Picker Modal */}
                        <Modal
                            visible={isMapModalVisible}
                            animationType="slide"
                            transparent={false}
                            onRequestClose={() => setIsMapModalVisible(false)}
                        >
                            <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
                                <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

                                {/* Modal Header */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#133E32' }}>
                                    <TouchableOpacity onPress={() => setIsMapModalVisible(false)} style={{ padding: 4 }}>
                                        <Ionicons name="close" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>Adjust Map Location</Text>
                                        <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '600' }}>Tap map canvas to set precise pin target</Text>
                                    </View>
                                    <TouchableOpacity onPress={handleConfirmMapPicker} style={{ backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                                        <Text style={{ color: '#133E32', fontSize: 12, fontWeight: '800' }}>Confirm</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Full Interactive Map View Box */}
                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: '#1E293B', position: 'relative' }}
                                    activeOpacity={1}
                                    onPress={handleInteractiveMapTap}
                                >
                                    {/* Grid canvas background simulation */}
                                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#0F172A' }}>
                                        <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', top: '20%' }} />
                                        <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', top: '40%' }} />
                                        <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', top: '60%' }} />
                                        <View style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', top: '80%' }} />
                                        <View style={{ position: 'absolute', height: '100%', width: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', left: '25%' }} />
                                        <View style={{ position: 'absolute', height: '100%', width: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', left: '50%' }} />
                                        <View style={{ position: 'absolute', height: '100%', width: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', left: '75%' }} />
                                    </View>

                                    {/* Crosshair Target overlay */}
                                    <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -20 }, { translateY: -20 }], alignItems: 'center' }}>
                                        <View style={{ backgroundColor: '#133E32', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 4, elevation: 6 }}>
                                            <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '800', textAlign: 'center' }}>
                                                🎯 {tempAddressLabel}
                                            </Text>
                                            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '600', textAlign: 'center' }}>
                                                {tempMapCoords.lat.toFixed(4)}° N, {tempMapCoords.lng.toFixed(4)}° E
                                            </Text>
                                        </View>
                                        <Ionicons name="location" size={36} color="#FFD700" />
                                    </View>

                                    {/* Map Controls Floating Column */}
                                    <View style={{ position: 'absolute', right: 16, top: 16, backgroundColor: '#0F172A', borderRadius: 12, padding: 6, gap: 12 }}>
                                        <TouchableOpacity style={{ padding: 4 }} onPress={() => setTempMapCoords(prev => ({ ...prev, lat: prev.lat + 0.005 }))}>
                                            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                                        </TouchableOpacity>
                                        <View style={{ height: 1, backgroundColor: '#334155' }} />
                                        <TouchableOpacity style={{ padding: 4 }} onPress={() => setTempMapCoords(prev => ({ ...prev, lat: prev.lat - 0.005 }))}>
                                            <Ionicons name="remove-circle-outline" size={24} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Bottom Info bar */}
                                    <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'rgba(19, 62, 50, 0.95)', padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ flex: 1, marginRight: 10 }}>
                                            <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '800' }}>Pinned Location</Text>
                                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                                                {tempAddressLabel}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#FFD700', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
                                            onPress={handleConfirmMapPicker}
                                        >
                                            <Text style={{ color: '#133E32', fontSize: 13, fontWeight: '900' }}>Confirm Pin 📍</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            </SafeAreaView>
                        </Modal>
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

                            {coverImage ? (
                                <View style={[styles.coverImagePreviewWrapper, { marginTop: 12 }]}>
                                    <Image source={{ uri: coverImage }} style={styles.coverImagePreview} resizeMode="cover" />
                                    <View style={styles.coverActionButtons}>
                                        <TouchableOpacity style={styles.actionBtnCircle} onPress={handlePickCoverPhoto} activeOpacity={0.8}>
                                            <Ionicons name="pencil" size={16} color="#133E32" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={handlePickCoverPhoto}
                                    style={{ marginTop: 12, height: 160, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="camera-outline" size={36} color="#133E32" style={{ marginBottom: 6 }} />
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#133E32' }}>Tap to Pick Cover Image</Text>
                                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Upload high-resolution property cover photo</Text>
                                </TouchableOpacity>
                            )}
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

            {/* Add / Edit Room Modal */}
            <Modal
                visible={isRoomModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsRoomModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' }}>
                        {/* Modal Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: '#133E32' }}>
                                {currentRoom.id && rooms.some(r => r.id === currentRoom.id) ? 'Edit Room Details' : 'Add New Room'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsRoomModalVisible(false)} style={{ padding: 4 }}>
                                <Ionicons name="close-circle" size={26} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Room Name Input */}
                            <Text style={styles.fieldLabel}>Room Name / Number *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Room 101 - AC Double Bed"
                                placeholderTextColor="#94A3B8"
                                value={currentRoom.name}
                                onChangeText={(text) => setCurrentRoom({ ...currentRoom, name: text })}
                            />

                            {/* Rent Charge Basis (Per Person vs Per Room) */}
                            <Text style={styles.fieldLabel}>Rent Charge Basis *</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                                <TouchableOpacity
                                    style={[styles.genderPill, (currentRoom.rentType || 'PER_PERSON') === 'PER_PERSON' && styles.genderPillActive]}
                                    onPress={() => setCurrentRoom({ ...currentRoom, rentType: 'PER_PERSON' })}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.genderPillText, (currentRoom.rentType || 'PER_PERSON') === 'PER_PERSON' && styles.genderPillTextActive]}>
                                        Per Person / Occupant
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.genderPill, currentRoom.rentType === 'PER_ROOM' && styles.genderPillActive]}
                                    onPress={() => setCurrentRoom({ ...currentRoom, rentType: 'PER_ROOM' })}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.genderPillText, currentRoom.rentType === 'PER_ROOM' && styles.genderPillTextActive]}>
                                        Per Entire Room
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Monthly Rent for Room */}
                            <Text style={styles.fieldLabel}>Monthly Rent for this Room (LKR) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 18000"
                                placeholderTextColor="#94A3B8"
                                value={currentRoom.rent}
                                onChangeText={(text) => setCurrentRoom({ ...currentRoom, rent: text })}
                                keyboardType="numeric"
                            />

                            {/* Maximum Capacity / Occupants */}
                            <Text style={styles.fieldLabel}>Maximum Room Capacity (Occupants) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 2"
                                placeholderTextColor="#94A3B8"
                                value={currentRoom.capacity}
                                onChangeText={(text) => setCurrentRoom({ ...currentRoom, capacity: text })}
                                keyboardType="numeric"
                            />

                            {/* Room Gender Preference Pill */}
                            <Text style={styles.fieldLabel}>Accommodation Preference</Text>
                            <View style={styles.genderContainer}>
                                {['Mixed', 'Female Only', 'Male Only'].map((pref) => {
                                    const isSelected = currentRoom.genderPreference === pref;
                                    return (
                                        <TouchableOpacity
                                            key={pref}
                                            style={[styles.genderPill, isSelected && styles.genderPillActive]}
                                            onPress={() => setCurrentRoom({ ...currentRoom, genderPreference: pref })}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.genderPillText, isSelected && styles.genderPillTextActive]}>
                                                {pref}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Room Photo Gallery Upload Section */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 }}>
                                <Text style={[styles.fieldLabel, { marginTop: 0 }]}>Room Gallery Photos ({currentRoom.photos ? currentRoom.photos.length : 0})</Text>
                                <TouchableOpacity
                                    onPress={handlePickRoomPhoto}
                                    style={{ backgroundColor: '#133E32', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="camera" size={15} color="#FFD700" style={{ marginRight: 4 }} />
                                    <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '800' }}>+ Pick Photo</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Uploaded Room Photos Strip */}
                            {currentRoom.photos && currentRoom.photos.length > 0 ? (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                                    {currentRoom.photos.map((photo) => (
                                        <View key={photo.id} style={{ position: 'relative', width: 70, height: 70, borderRadius: 10, overflow: 'hidden' }}>
                                            <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} />
                                            <TouchableOpacity
                                                onPress={() => handleRemoveRoomPhoto(photo.id)}
                                                style={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 10, padding: 2 }}
                                            >
                                                <Ionicons name="close" size={12} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={handlePickRoomPhoto}
                                    style={{ height: 80, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="images-outline" size={24} color="#133E32" />
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#133E32', marginTop: 4 }}>Upload Photos for this Room from Phone Gallery</Text>
                                </TouchableOpacity>
                            )}

                            {/* Save Room Action Button */}
                            <TouchableOpacity
                                onPress={handleSaveRoom}
                                style={{ backgroundColor: '#133E32', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 20 }}
                                activeOpacity={0.9}
                            >
                                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Save Room Details</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
