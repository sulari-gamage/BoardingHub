import React, { useState, useRef } from 'react';
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
    Modal,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../services/api';
import { uploadImage } from '../../services/uploadService';
import AddRoomScreen from './AddRoomScreen';

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
    const dbSource = propertyToEdit?.raw || propertyToEdit || {};

    // Current active wizard step: 1 (Info), 2 (Location), 3 (Amenities), 4 (Photos)
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLock = useRef(false);

    // Initial state pre-population from propertyToEdit
    const initialAmenities = {};
    const existingAmenitiesList = dbSource.amenities || [];
    if (Array.isArray(existingAmenitiesList)) {
        existingAmenitiesList.forEach(name => {
            const foundKey = Object.keys(AMENITY_MAP).find(k => AMENITY_MAP[k].toLowerCase() === name.toLowerCase());
            if (foundKey) initialAmenities[foundKey] = true;
            else initialAmenities[name] = true;
        });
    }

    // Nearest Locations & House Layout Specifications (for Whole House / Annex)
    const [nearestPlaces, setNearestPlaces] = useState('');
    const [wholeHouseRooms, setWholeHouseRooms] = useState(dbSource.roomsCount ? dbSource.roomsCount.toString() : '');
    const [wholeHouseBeds, setWholeHouseBeds] = useState(dbSource.bedsCount ? dbSource.bedsCount.toString() : '');
    const [wholeHouseWashrooms, setWholeHouseWashrooms] = useState(dbSource.bathsCount ? dbSource.bathsCount.toString() : '');
    const [hasKitchen, setHasKitchen] = useState(dbSource.hasKitchen !== undefined ? dbSource.hasKitchen : true);
    const [isFurnished, setIsFurnished] = useState(dbSource.isFurnished !== undefined ? dbSource.isFurnished : false);
    const [hasFridge, setHasFridge] = useState(false);
    const [hasOven, setHasOven] = useState(false);
    const [hasAC, setHasAC] = useState(false);
    const [isElectricityIncluded, setIsElectricityIncluded] = useState(dbSource.isElectricityIncluded !== undefined ? dbSource.isElectricityIncluded : true);
    const [isWaterIncluded, setIsWaterIncluded] = useState(dbSource.isWaterIncluded !== undefined ? dbSource.isWaterIncluded : true);


    // Step 1 Form State (Property Info & Dynamic Room Inventory)
    const [propertyName, setPropertyName] = useState(dbSource.title || dbSource.name || propertyToEdit?.title || '');
    const [monthlyRent, setMonthlyRent] = useState(dbSource.monthlyRent ? dbSource.monthlyRent.toString() : (dbSource.price ? dbSource.price.toString() : ''));
    const [totalCapacity, setTotalCapacity] = useState(dbSource.totalCapacity ? dbSource.totalCapacity.toString() : '1');
    const [propertyNature, setPropertyNature] = useState(dbSource.rooms && dbSource.rooms.length > 0 ? 'ROOM_BASED' : 'WHOLE_HOUSE');
    const [description, setDescription] = useState(dbSource.description || '');
    const [genderPreference, setGenderPreference] = useState(
        dbSource.genderPreference === 'FEMALE_ONLY' ? 'Female Only' :
            dbSource.genderPreference === 'MALE_ONLY' ? 'Male Only' : 'Mixed'
    );


    // Dynamic Room Inventory State (for ROOM_BASED properties)
    const [rooms, setRooms] = useState(
        ((dbSource.rooms) || []).map((r, i) => ({
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
        beds: '1',
        washrooms: '1',
        washroomType: 'Common',
        ac: false,
        fridge: false,
        oven: false,
    });

    const handleOpenAddRoomModal = () => {
        setCurrentRoom({
            id: `room_${Date.now()}`,
            isEditMode: false,
            isNew: true,
            name: `Room ${rooms.length + 1}`,
            rent: '',
            capacity: '1',
            genderPreference: 'Mixed',
            rentType: 'PER_PERSON',
            photos: [],
            beds: '1',
            washrooms: '1',
            washroomType: 'Common',
            ac: false,
            fridge: false,
            oven: false,
        });
        setIsRoomModalVisible(true);
    };

    const handleOpenEditRoomModal = (room) => {
        setCurrentRoom({
            ...room,
            isEditMode: true,
            isNew: false,
            number: room.name,
            price: room.rent,
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

    const handleSaveRoomFromScreen = (roomPayload) => {
        if (!roomPayload) return setIsRoomModalVisible(false);

        const existingIndex = rooms.findIndex((r) => r.id === roomPayload.id);
        const unifiedRoomObj = {
            id: roomPayload.id,
            name: roomPayload.number,
            compiledType: roomPayload.type,
            rent: roomPayload.price.toString(),
            capacity: roomPayload.capacity.toString(),
            genderPreference: 'Mixed',
            rentType: roomPayload.rentType || 'PER_PERSON',
            photos: roomPayload.photos || [],
            roomTypeStyle: roomPayload.roomTypeStyle,
            beds: roomPayload.beds || '1',
            washrooms: roomPayload.washrooms || '1',
            washroomType: roomPayload.washroomType || 'Common',
            amenities: roomPayload.amenities || {}
        };

        let updatedRooms = [];
        if (existingIndex >= 0) {
            updatedRooms = [...rooms];
            updatedRooms[existingIndex] = unifiedRoomObj;
        } else {
            updatedRooms = [...rooms, unifiedRoomObj];
        }

        setRooms(updatedRooms);
        setIsRoomModalVisible(false);

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
    const [searchAddress, setSearchAddress] = useState(dbSource.address || '');
    const [streetAddress, setStreetAddress] = useState(dbSource.address || '');
    const [city, setCity] = useState(dbSource.city || '');
    const [district, setDistrict] = useState(dbSource.district || '');
    const [postalCode, setPostalCode] = useState('');
    const [mapCoords, setMapCoords] = useState({
        lat: dbSource.latitude || 6.9271,
        lng: dbSource.longitude || 79.8612
    });
    const [isPrimaryHub, setIsPrimaryHub] = useState(true);
    const [isMapModalVisible, setIsMapModalVisible] = useState(false);
    const [tempMapCoords, setTempMapCoords] = useState({
        lat: dbSource.latitude || 6.9271,
        lng: dbSource.longitude || 79.8612
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

    const cleanAddressForGeocoding = (addressStr, cityStr) => {
        let raw = `${addressStr || ''} ${cityStr || ''}`.trim();
        if (!raw) return '';
        raw = raw.replace(/[\r\n]+/g, ', ')
            .replace(/\s+/g, ' ')
            .replace(/,\s*,/g, ',')
            .replace(/\.\s*$/, '')
            .trim();
        if (!raw.toLowerCase().includes('sri lanka')) {
            raw = `${raw}, Sri Lanka`;
        }
        return raw;
    };

    const triggerGeocode = (addrStr, cityStr) => {
        const query = cleanAddressForGeocoding(addrStr, cityStr);
        if (!query || query.length < 3) return;

        Location.geocodeAsync(query)
            .then((results) => {
                if (results && results.length > 0) {
                    const { latitude, longitude } = results[0];
                    if (latitude && longitude) {
                        setMapCoords({ lat: latitude, lng: longitude });
                    }
                }
            })
            .catch((err) => console.log('[AddPropertyScreen] Geocode error:', err.message));
    };

    const handleSearchChange = (text) => {
        setSearchAddress(text);
        if (!text.trim()) {
            setStreetAddress('');
            setCity('');
            return;
        }

        const lowerText = text.toLowerCase().trim();

        if (text.includes(',')) {
            const parts = text.split(',');
            const extractedCity = parts[parts.length - 1].trim();
            const extractedStreet = parts.slice(0, parts.length - 1).join(',').trim();
            setStreetAddress(extractedStreet || text.trim());
            setCity(extractedCity || text.trim());
        } else {
            const words = text.trim().split(/\s+/);
            const lastWordLower = words[words.length - 1].toLowerCase();
            const matchingCityKey = Object.keys(SRI_LANKA_CITIES).find(
                (k) => lowerText.includes(k) || lastWordLower === k
            );

            if (matchingCityKey) {
                const matchedObj = SRI_LANKA_CITIES[matchingCityKey];
                setCity(matchedObj.city);
                if (words.length > 1) {
                    const streetPart = text.replace(new RegExp(matchedObj.city, 'gi'), '').replace(/,\s*$/, '').trim();
                    setStreetAddress(streetPart || text.trim());
                } else {
                    setStreetAddress(matchedObj.city);
                }
            } else {
                setStreetAddress(text.trim());
                setCity(words.length > 1 ? words[words.length - 1] : text.trim());
            }
        }

        triggerGeocode(text, city);
    };

    const handleStreetAddressChange = (text) => {
        setStreetAddress(text);
        setSearchAddress(text);
        let extractedCity = city;
        if (text.trim()) {
            const parts = text.split(',');
            if (parts.length > 1) {
                extractedCity = parts[parts.length - 1].trim();
                setCity(extractedCity);
            }
        }
        triggerGeocode(text, extractedCity);
    };

    const handleGetCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please allow location access to use this feature.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = location.coords;
            setMapCoords({ lat: latitude, lng: longitude });
            Alert.alert('Location Found 📍', 'Map pin has been precisely placed at your current location.');
        } catch (error) {
            console.log('Error fetching location:', error);
            Alert.alert('Error', 'Could not fetch device location.');
        }
    };

    // Step 3 Form State (Amenities Selection)
    const [selectedAmenities, setSelectedAmenities] = useState(initialAmenities);

    // Step 4 Form State (Photos)
    const initialImages = dbSource.imageUrls || (dbSource.images && dbSource.images.map(i => typeof i === 'string' ? i : i.imageUrl)) || [];
    const initialCover = initialImages.length > 0 ? initialImages[0] : (propertyToEdit?.imageUrl || null);

    const [coverImage, setCoverImage] = useState(initialCover);
    const [additionalPhotos, setAdditionalPhotos] = useState(
        initialImages.slice(1).map((url, idx) => ({ id: `remote_photo_${idx}`, uri: url }))
    );

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
            if (!streetAddress.trim() && !searchAddress.trim()) {
                Alert.alert('Required Field', 'Please enter property address.');
                return;
            }
            if (!city.trim()) {
                Alert.alert('Required Field', 'Please enter city / town.');
                return;
            }
            if (!district.trim()) {
                Alert.alert('Required Field', 'Please enter district.');
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
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Step 3: Publish Property
            if (isSubmitting || submitLock.current) return;
            if (!coverImage) {
                Alert.alert('Cover Photo Required', 'Please select a cover photo from your device gallery before publishing.');
                return;
            }
            setIsSubmitting(true);
            submitLock.current = true;
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
                const rawImagesList = [uploadedCover];

                for (const p of additionalPhotos) {
                    if (p.uri) {
                        const url = await uploadImage(p.uri);
                        if (url && !rawImagesList.includes(url)) rawImagesList.push(url);
                    }
                }

                // Filter out any local file:// or null paths to ensure ONLY valid remote HTTP/HTTPS URLs are stored in DB
                const imagesList = rawImagesList.filter(url => url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')));

                // 4. Construct RoomRequest DTO and upload room images
                const parsedRent = parseFloat(monthlyRent) || 0;
                const parsedCapacity = parseInt(totalCapacity || '1');
                const roomTypeLabel = propertyNature === 'WHOLE_HOUSE' ? 'Whole House / Annex' : 'Shared Room';

                const payloadRooms = [];

                if (propertyNature === 'ROOM_BASED' && rooms.length > 0) {
                    for (const r of rooms) {
                        const photosList = r.photos || [];
                        const uploadedRoomPhotos = [];
                        for (const p of photosList) {
                            if (p.uri) {
                                const url = await uploadImage(p.uri);
                                if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                                    uploadedRoomPhotos.push(url);
                                    if (!imagesList.includes(url)) imagesList.push(url);
                                }
                            }
                        }

                        payloadRooms.push({
                            roomType: r.compiledType || r.name,
                            monthlyPrice: parseFloat(r.rent) || 0,
                            totalCapacity: parseInt(r.capacity) || 1,
                            remainingSpaces: parseInt(r.capacity) || 1,
                            rentType: r.rentType || 'PER_PERSON',
                            genderPreference: r.genderPreference || mappedGender,
                            isElectricityIncluded: r.isElectricityIncluded !== undefined ? r.isElectricityIncluded : true,
                            isWaterIncluded: r.isWaterIncluded !== undefined ? r.isWaterIncluded : true,
                            imageUrls: uploadedRoomPhotos
                        });
                    }
                }

                // 5. Build amenities string array
                const selectedAmenityNamesList = Object.keys(selectedAmenities)
                    .filter(k => selectedAmenities[k])
                    .map(k => AMENITY_MAP[k] || k);

                if (nearestPlaces.trim()) {
                    selectedAmenityNamesList.push(`Nearest Places: ${nearestPlaces.trim()}`);
                }
                if (propertyNature === 'WHOLE_HOUSE') {
                    if (wholeHouseBeds) selectedAmenityNamesList.push(`${wholeHouseBeds} Beds`);
                    if (wholeHouseWashrooms) selectedAmenityNamesList.push(`${wholeHouseWashrooms} Washrooms`);
                    if (hasFridge) selectedAmenityNamesList.push('Fridge');
                    if (hasOven) selectedAmenityNamesList.push('Oven');
                    if (hasAC) selectedAmenityNamesList.push('Air Conditioning');
                }

                const propertyPayload = {
                    title: propertyName,
                    description: description || 'Boarding house property.',
                    address: streetAddress || searchAddress,
                    city: city,
                    district: district,
                    genderPreference: mappedGender,
                    monthlyRent: parsedRent,
                    latitude: mapCoords.lat,
                    longitude: mapCoords.lng,
                    amenities: selectedAmenityNamesList,
                    imageUrls: imagesList,
                    rooms: payloadRooms,
                    propertyNature: propertyNature,
                    roomsCount: propertyNature === 'WHOLE_HOUSE' ? (parseInt(wholeHouseRooms || '') || 1) : rooms.length,
                    bedsCount: propertyNature === 'WHOLE_HOUSE' ? (parseInt(wholeHouseBeds || '') || 1) : null,
                    bathsCount: propertyNature === 'WHOLE_HOUSE' ? (parseInt(wholeHouseWashrooms || '') || 1) : null,
                    totalCapacity: propertyNature === 'WHOLE_HOUSE' ? (parseInt(totalCapacity || '') || parseInt(wholeHouseBeds || '') || 1) : parsedCapacity,
                    hasKitchen: propertyNature === 'WHOLE_HOUSE' ? hasKitchen : true,
                    isFurnished: propertyNature === 'WHOLE_HOUSE' ? isFurnished : false,
                    isElectricityIncluded: isElectricityIncluded,
                    isWaterIncluded: isWaterIncluded,
                    hasWifi: selectedAmenities.wifi ? true : null,
                    hasWater: selectedAmenities.water ? true : null,
                    hasElectricity: selectedAmenities.electricity ? true : null,
                    hasGas: selectedAmenities.gas ? true : null,
                    hasLaundry: selectedAmenities.laundry ? true : null,
                    hasParking: selectedAmenities.parking ? true : null,
                    hasKitchenAmenity: selectedAmenities.kitchen ? true : null,
                    hasCommonArea: selectedAmenities.common ? true : null,
                    hasPool: selectedAmenities.pool ? true : null,
                    hasFitness: selectedAmenities.fitness ? true : null,
                    hasCctv: selectedAmenities.cctv ? true : null,
                    hasGate: selectedAmenities.gate ? true : null,
                    hasFireExtinguisher: selectedAmenities.fire ? true : null,
                    hasFirstAid: selectedAmenities.firstaid ? true : null,
                    hasAc: (selectedAmenities.ac || hasAC) ? true : null,
                    hasGenerator: selectedAmenities.generator ? true : null,
                    hasAttachedBathroom: selectedAmenities.bathroom ? true : null,
                    hasBalcony: selectedAmenities.balcony ? true : null,
                    customAmenities: nearestPlaces.trim() || null
                };

                let savedProperty;
                if (isEditMode && propertyToEdit?.id) {
                    savedProperty = await api.properties.update(propertyToEdit.id, propertyPayload);
                    Alert.alert('Success 🎉', 'Property updated successfully!');
                } else {
                    savedProperty = await api.properties.create(propertyPayload);
                    Alert.alert('Success 🎉', 'New property published successfully!');
                }
                setIsSubmitting(false);
                submitLock.current = false;
                if (onSaveProperty) onSaveProperty(savedProperty);
                else if (onBack) onBack();
            } catch (err) {
                console.log('Error saving property:', err);
                Alert.alert('Submission Error', err.message || 'Could not save property.');
                setIsSubmitting(false);
                submitLock.current = false;
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
                        {currentStep === 2 && 'Select Property Amenities'}
                        {currentStep === 3 && 'Upload Property Photos'}
                    </Text>
                    <Text style={styles.stepSubtitle}>
                        Step {currentStep} of 3: {stepTitles[currentStep - 1]}
                    </Text>
                </View>

                {/* Number Stepper Circles (1, 2, 3) */}
                <View style={styles.stepperRow}>
                    {[
                        { num: 1, label: 'Info' },
                        { num: 2, label: 'Amenities' },
                        { num: 3, label: 'Photos' },
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
                                            <Ionicons name="checkmark" size={14} color="#FFD700" />
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
                    <View style={[styles.progressBarFill, { width: `${(currentStep / 3) * 100}%` }]} />
                </View>
            </View>
        );
    };

    if (isRoomModalVisible && currentRoom) {
        return (
            <View style={{ flex: 1 }}>
                <AddRoomScreen
                    initialRoomData={currentRoom}
                    onBack={() => setIsRoomModalVisible(false)}
                    onSaveRoom={handleSaveRoomFromScreen}
                />
            </View>
        );
    }

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

                        {/* Address */}
                        <Text style={styles.fieldLabel}>Property Address *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. No. 45, Temple Road, Bambalapitiya"
                            placeholderTextColor="#94A3B8"
                            value={streetAddress}
                            onChangeText={(text) => {
                                setStreetAddress(text);
                                setSearchAddress(text);
                            }}
                        />

                        {/* City and District Row */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>City / Town *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Malabe, Moratuwa"
                                    placeholderTextColor="#94A3B8"
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>District *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Colombo, Kandy"
                                    placeholderTextColor="#94A3B8"
                                    value={district}
                                    onChangeText={setDistrict}
                                />
                            </View>
                        </View>

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

                                <Text style={styles.fieldLabel}>Total Property Capacity / Max Occupants</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 6"
                                    placeholderTextColor="#94A3B8"
                                    value={totalCapacity}
                                    onChangeText={setTotalCapacity}
                                    keyboardType="numeric"
                                />

                                <View style={{ marginTop: 12, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>
                                        🏡 House Layout & Specifications
                                    </Text>

                                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>No. of Rooms</Text>
                                            <TextInput
                                                style={[styles.input, { marginBottom: 0 }]}
                                                placeholder="e.g. 3"
                                                placeholderTextColor="#94A3B8"
                                                value={wholeHouseRooms}
                                                onChangeText={setWholeHouseRooms}
                                                keyboardType="numeric"
                                            />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>No. of Beds</Text>
                                            <TextInput
                                                style={[styles.input, { marginBottom: 0 }]}
                                                placeholder="e.g. 2"
                                                placeholderTextColor="#94A3B8"
                                                value={wholeHouseBeds}
                                                onChangeText={setWholeHouseBeds}
                                                keyboardType="numeric"
                                            />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fieldLabel}>Bathrooms</Text>
                                            <TextInput
                                                style={[styles.input, { marginBottom: 0 }]}
                                                placeholder="e.g. 2"
                                                placeholderTextColor="#94A3B8"
                                                value={wholeHouseWashrooms}
                                                onChangeText={setWholeHouseWashrooms}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    {/* Kitchen Included Checkbox Tick */}
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 12, paddingVertical: 4 }}
                                        onPress={() => setHasKitchen(!hasKitchen)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 6,
                                            borderWidth: 2,
                                            borderColor: hasKitchen ? '#133E32' : '#94A3B8',
                                            backgroundColor: hasKitchen ? '#133E32' : '#FFFFFF',
                                            justify: 'center',
                                            alignItems: 'center',
                                            marginRight: 10
                                        }}>
                                            {hasKitchen && <Ionicons name="checkmark" size={16} color="#FFD700" />}
                                        </View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                                            Kitchen Included
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Furnished Checkbox Tick */}
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingVertical: 4 }}
                                        onPress={() => setIsFurnished(!isFurnished)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 6,
                                            borderWidth: 2,
                                            borderColor: isFurnished ? '#133E32' : '#94A3B8',
                                            backgroundColor: isFurnished ? '#133E32' : '#FFFFFF',
                                            justify: 'center',
                                            alignItems: 'center',
                                            marginRight: 10
                                        }}>
                                            {isFurnished && <Ionicons name="checkmark" size={16} color="#FFD700" />}
                                        </View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>
                                            Furnished / Rent With Furniture
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 💡 Utility Bill Inclusion Card (Electricity & Water) */}
                                <View style={{ marginTop: 16, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                                        ⚡ Utility Bills Inclusion
                                    </Text>
                                    <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>
                                        Specify whether utility bills are included in monthly rent or paid separately by occupants.
                                    </Text>

                                    {/* ⚡ Electricity Bill Segmented Control */}
                                    <Text style={[styles.fieldLabel, { marginTop: 4, marginBottom: 6 }]}>⚡ Electricity Bill</Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        backgroundColor: '#F1F5F9',
                                        borderRadius: 12,
                                        padding: 3,
                                        borderWidth: 1,
                                        borderColor: '#E2E8F0',
                                        marginBottom: 14
                                    }}>
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingVertical: 10,
                                                borderRadius: 9,
                                                backgroundColor: isElectricityIncluded ? '#133E32' : 'transparent',
                                                shadowColor: isElectricityIncluded ? '#000' : 'transparent',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 2,
                                                elevation: isElectricityIncluded ? 1 : 0
                                            }}
                                            onPress={() => setIsElectricityIncluded(true)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={isElectricityIncluded ? 'checkmark-circle' : 'checkmark-circle-outline'}
                                                size={15}
                                                color={isElectricityIncluded ? '#FFD700' : '#64748B'}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={{
                                                fontSize: 12,
                                                fontWeight: isElectricityIncluded ? '800' : '600',
                                                color: isElectricityIncluded ? '#FFFFFF' : '#475569'
                                            }}>
                                                Included in Rent
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingVertical: 10,
                                                borderRadius: 9,
                                                backgroundColor: !isElectricityIncluded ? '#133E32' : 'transparent',
                                                shadowColor: !isElectricityIncluded ? '#000' : 'transparent',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 2,
                                                elevation: !isElectricityIncluded ? 1 : 0
                                            }}
                                            onPress={() => setIsElectricityIncluded(false)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={!isElectricityIncluded ? 'flash' : 'flash-outline'}
                                                size={14}
                                                color={!isElectricityIncluded ? '#FFD700' : '#64748B'}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={{
                                                fontSize: 12,
                                                fontWeight: !isElectricityIncluded ? '800' : '600',
                                                color: !isElectricityIncluded ? '#FFFFFF' : '#475569'
                                            }}>
                                                Paid by Occupant
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* 💧 Water Bill Segmented Control */}
                                    <Text style={[styles.fieldLabel, { marginTop: 0, marginBottom: 6 }]}>💧 Water Bill</Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        backgroundColor: '#F1F5F9',
                                        borderRadius: 12,
                                        padding: 3,
                                        borderWidth: 1,
                                        borderColor: '#E2E8F0'
                                    }}>
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingVertical: 10,
                                                borderRadius: 9,
                                                backgroundColor: isWaterIncluded ? '#133E32' : 'transparent',
                                                shadowColor: isWaterIncluded ? '#000' : 'transparent',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 2,
                                                elevation: isWaterIncluded ? 1 : 0
                                            }}
                                            onPress={() => setIsWaterIncluded(true)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={isWaterIncluded ? 'checkmark-circle' : 'checkmark-circle-outline'}
                                                size={15}
                                                color={isWaterIncluded ? '#FFD700' : '#64748B'}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={{
                                                fontSize: 12,
                                                fontWeight: isWaterIncluded ? '800' : '600',
                                                color: isWaterIncluded ? '#FFFFFF' : '#475569'
                                            }}>
                                                Included in Rent
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                paddingVertical: 10,
                                                borderRadius: 9,
                                                backgroundColor: !isWaterIncluded ? '#133E32' : 'transparent',
                                                shadowColor: !isWaterIncluded ? '#000' : 'transparent',
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 2,
                                                elevation: !isWaterIncluded ? 1 : 0
                                            }}
                                            onPress={() => setIsWaterIncluded(false)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={!isWaterIncluded ? 'water' : 'water-outline'}
                                                size={14}
                                                color={!isWaterIncluded ? '#FFD700' : '#64748B'}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text style={{
                                                fontSize: 12,
                                                fontWeight: !isWaterIncluded ? '800' : '600',
                                                color: !isWaterIncluded ? '#FFFFFF' : '#475569'
                                            }}>
                                                Paid by Occupant
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        ) : (
                            /* If ROOM_BASED selected: render dynamic Room Inventory Management card */
                            <View style={{ marginTop: 22 }}>
                                {/* Section Header & Action Button */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <View style={{ flex: 1, marginRight: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Ionicons name="bed" size={18} color="#133E32" />
                                            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                                                Rooms & Inventory ({rooms.length})
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                            Configure pricing, occupancy capacity, and unit photos for each room.
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleOpenAddRoomModal}
                                        style={{
                                            backgroundColor: '#133E32',
                                            paddingHorizontal: 16,
                                            paddingVertical: 9,
                                            borderRadius: 12,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            shadowColor: '#133E32',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.15,
                                            shadowRadius: 4,
                                            elevation: 3
                                        }}
                                        activeOpacity={0.85}
                                    >
                                        <Ionicons name="add-circle" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                                        <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '800' }}>+ Add Room</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Total Aggregated Rent & Capacity Summary Dashboard Badge */}
                                {rooms.length > 0 && (
                                    <View style={{
                                        backgroundColor: '#133E32',
                                        borderRadius: 16,
                                        padding: 16,
                                        marginBottom: 16,
                                        shadowColor: '#133E32',
                                        shadowOffset: { width: 0, height: 3 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 6,
                                        elevation: 3
                                    }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.12)', pb: 8, paddingBottom: 8 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFD700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                                📊 Inventory Analytics Summary
                                            </Text>
                                            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                                                <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>
                                                    {rooms.length} Active {rooms.length === 1 ? 'Unit' : 'Units'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ alignItems: 'flex-start', flex: 1 }}>
                                                <Text style={{ fontSize: 10, color: '#A7F3D0', fontWeight: '700', marginBottom: 2 }}>TOTAL ROOMS</Text>
                                                <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>{rooms.length}</Text>
                                            </View>
                                            <View style={{ width: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)', height: 32, marginHorizontal: 12 }} />
                                            <View style={{ alignItems: 'flex-start', flex: 1.6 }}>
                                                <Text style={{ fontSize: 10, color: '#A7F3D0', fontWeight: '700', marginBottom: 2 }}>ESTIMATED RENT / MO</Text>
                                                <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFD700' }}>LKR {monthlyRent ? parseFloat(monthlyRent).toLocaleString() : '0'}</Text>
                                            </View>
                                            <View style={{ width: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)', height: 32, marginHorizontal: 12 }} />
                                            <View style={{ alignItems: 'flex-start', flex: 1 }}>
                                                <Text style={{ fontSize: 10, color: '#A7F3D0', fontWeight: '700', marginBottom: 2 }}>TOTAL CAPACITY</Text>
                                                <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>{totalCapacity || '0'} Beds</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Room Unit Cards List */}
                                {rooms.length === 0 ? (
                                    <TouchableOpacity
                                        onPress={handleOpenAddRoomModal}
                                        style={{
                                            paddingVertical: 28,
                                            paddingHorizontal: 20,
                                            borderWidth: 2,
                                            borderColor: '#A7F3D0',
                                            borderStyle: 'dashed',
                                            borderRadius: 16,
                                            justify: 'center',
                                            alignItems: 'center',
                                            backgroundColor: '#F0FDF4'
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#133E32', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                                            <Ionicons name="bed" size={24} color="#FFD700" />
                                        </View>
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#133E32' }}>+ Tap to Add Your First Room</Text>
                                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, textAlign: 'center' }}>
                                            Define room type, occupancy rate, facilities, and upload room photos.
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ gap: 12 }}>
                                        {rooms.map((room, index) => {
                                            const formattedPrice = room.rent ? parseFloat(room.rent).toLocaleString() : '0';
                                            const isPerRoom = room.rentType === 'PER_ROOM';
                                            return (
                                                <View
                                                    key={room.id}
                                                    style={{
                                                        backgroundColor: '#FFFFFF',
                                                        borderRadius: 16,
                                                        padding: 16,
                                                        borderWidth: 1,
                                                        borderColor: '#E2E8F0',
                                                        shadowColor: '#0F172A',
                                                        shadowOffset: { width: 0, height: 2 },
                                                        shadowOpacity: 0.04,
                                                        shadowRadius: 5,
                                                        elevation: 2
                                                    }}
                                                >
                                                    {/* Card Header: Unit Tag, Name & Edit/Delete */}
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                                            <View style={{
                                                                backgroundColor: '#133E32',
                                                                paddingHorizontal: 10,
                                                                paddingVertical: 4,
                                                                borderRadius: 8
                                                            }}>
                                                                <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '900' }}>
                                                                    UNIT #{index + 1}
                                                                </Text>
                                                            </View>
                                                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', flex: 1 }} numberOfLines={1}>
                                                                {room.name}
                                                            </Text>
                                                        </View>

                                                        {/* Actions */}
                                                        <View style={{ flexDirection: 'row', gap: 6 }}>
                                                            <TouchableOpacity
                                                                onPress={() => handleOpenEditRoomModal(room)}
                                                                style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#F1F5F9', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                                                activeOpacity={0.8}
                                                            >
                                                                <Ionicons name="pencil" size={13} color="#133E32" />
                                                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#133E32' }}>Edit</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={() => handleDeleteRoom(room.id)}
                                                                style={{ paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#FEF2F2', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                                                                activeOpacity={0.8}
                                                            >
                                                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>

                                                    {/* Key Specs Pills Grid */}
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                                        <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                            <Ionicons name="cash-outline" size={13} color="#047857" />
                                                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#047857' }}>
                                                                LKR {formattedPrice} <Text style={{ fontSize: 10, fontWeight: '600' }}>{isPerRoom ? '/ room' : '/ person'}</Text>
                                                            </Text>
                                                        </View>

                                                        <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                            <Ionicons name="people-outline" size={13} color="#475569" />
                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
                                                                Max {room.capacity} {parseInt(room.capacity, 10) === 1 ? 'Occupant' : 'Occupants'}
                                                            </Text>
                                                        </View>

                                                        <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                            <Ionicons name="body-outline" size={13} color="#475569" />
                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
                                                                {room.genderPreference || 'Mixed'}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {/* Room Facilities & Photos */}
                                                    {(room.type || room.amenities || (room.photos && room.photos.length > 0)) && (
                                                        <View style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10, marginTop: 4 }}>
                                                            {room.type && (
                                                                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500', marginBottom: 6 }}>
                                                                    ✨ {room.type}
                                                                </Text>
                                                            )}

                                                            {/* Room Photos Preview */}
                                                            {room.photos && room.photos.length > 0 && (
                                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                                                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                                                        {room.photos.map((p) => (
                                                                            <Image key={p.id} source={{ uri: p.uri }} style={{ width: 56, height: 56, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }} />
                                                                        ))}
                                                                    </View>
                                                                </ScrollView>
                                                            )}
                                                        </View>
                                                    )}
                                                </View>
                                            );
                                        })}
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


                    </View>
                )}

                {/* STEP 2: AMENITIES */}
                {currentStep === 2 && (
                    <View style={styles.stepThreeContainer}>

                        <View style={styles.cardContainer}>
                            <Text style={styles.fieldLabel}>Nearest Special Places</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 500m to SLIIT / Supermarket"
                                placeholderTextColor="#94A3B8"
                                value={nearestPlaces}
                                onChangeText={setNearestPlaces}
                            />
                        </View>

                        {propertyNature === 'WHOLE_HOUSE' && (
                            <View style={styles.cardContainer}>
                                <Text style={styles.cardTitle}>Whole House Facilities</Text>
                                <View style={styles.titleDivider} />

                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabel}>No. of Beds</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. 3"
                                            placeholderTextColor="#94A3B8"
                                            value={wholeHouseBeds}
                                            onChangeText={setWholeHouseBeds}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.fieldLabel}>Washrooms</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. 2"
                                            placeholderTextColor="#94A3B8"
                                            value={wholeHouseWashrooms}
                                            onChangeText={setWholeHouseWashrooms}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <Text style={styles.fieldLabel}>Appliances</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                    <TouchableOpacity style={[styles.checkboxRow, { width: '45%' }]} onPress={() => setHasAC(!hasAC)}>
                                        <View style={[styles.checkbox, hasAC && styles.checkboxActive]}>
                                            {hasAC && <Ionicons name="checkmark" size={14} color="#FFD700" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>Air Con.</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.checkboxRow, { width: '45%' }]} onPress={() => setHasFridge(!hasFridge)}>
                                        <View style={[styles.checkbox, hasFridge && styles.checkboxActive]}>
                                            {hasFridge && <Ionicons name="checkmark" size={14} color="#FFD700" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>Fridge</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.checkboxRow, { width: '45%' }]} onPress={() => setHasOven(!hasOven)}>
                                        <View style={[styles.checkbox, hasOven && styles.checkboxActive]}>
                                            {hasOven && <Ionicons name="checkmark" size={14} color="#FFD700" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>Oven</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

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

                {/* STEP 3: PHOTOS */}
                {currentStep === 3 && (
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
                            {currentStep === 2 ? 'Back to Info' : 'Back to Amenities'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.outlinedBackBtn} onPress={onBack} activeOpacity={0.8}>
                        <Text style={styles.outlinedBackBtnText}>Cancel</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.primaryNextBtn, currentStep === 3 && isSubmitting && { opacity: 0.7 }]}
                    onPress={handleNext}
                    activeOpacity={0.85}
                    disabled={currentStep === 3 && isSubmitting}
                >
                    {currentStep === 3 && isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Text style={styles.primaryNextBtnText}>
                                {currentStep === 3 ? 'Publish Listing' : 'Next Step'}
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFD700" style={{ marginLeft: 6 }} />
                        </>
                    )}
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        paddingVertical: 12,
        marginBottom: 20,
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
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        height: 48,
        fontSize: 14,
        fontWeight: '500',
        color: '#0F172A',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },

    genderContainer: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 4,
        marginTop: 4,
    },
    genderPill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    genderPillActive: {
        backgroundColor: '#133E32',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    genderPillText: {
        fontSize: 12,
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
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    certChipText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
    },
    addCertChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderStyle: 'solid',
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
