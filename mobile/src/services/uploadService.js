import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const CLOUD_NAME = 'vwgsaglm';
const UPLOAD_PRESET = 'boardinghub_preset';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Helper to convert any local file:// or content:// URI into a valid base64 data URL string with proper image MIME header.
 * Uses Expo FileSystem to natively read local files across Android/iOS path formats without native FormDataPart errors.
 *
 * @param {string} localUri - Local file or content URI
 * @returns {Promise<string|null>} base64 data URL string or null if conversion fails
 */
const localUriToBase64 = async (localUri) => {
    if (typeof localUri !== 'string') return null;

    // Detect MIME type from extension
    let mimeType = 'image/jpeg';
    const cleanUri = localUri.trim().split('?')[0];
    const ext = cleanUri.toLowerCase().split('.').pop();
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';

    if (localUri.startsWith('data:')) {
        // If it's already a data URI but has generic application/octet-stream, replace header
        if (localUri.startsWith('data:application/') || localUri.startsWith('data:;')) {
            const base64Content = localUri.split(';base64,').pop();
            return `data:${mimeType};base64,${base64Content}`;
        }
        return localUri;
    }

    let doubleDecoded = cleanUri;
    try {
        doubleDecoded = decodeURIComponent(decodeURIComponent(cleanUri));
    } catch (e) {
        try {
            doubleDecoded = decodeURIComponent(cleanUri);
        } catch (e2) { }
    }

    // Try FileSystem readAsStringAsync with multiple URI path variations for max Android/iOS compatibility
    const pathVariants = [
        cleanUri,
        doubleDecoded,
        cleanUri.replace(/^file:\/\//, ''),
        doubleDecoded.replace(/^file:\/\//, ''),
        `file://${doubleDecoded.replace(/^file:\/\//, '')}`
    ];

    for (const targetPath of pathVariants) {
        if (!targetPath) continue;
        try {
            console.log('[UploadService] Reading local URI via FileSystem:', targetPath.substring(0, 50));
            const base64Data = await FileSystem.readAsStringAsync(targetPath, {
                encoding: FileSystem.EncodingType.Base64,
            });
            if (base64Data && base64Data.length > 0) {
                console.log('[UploadService] ✓ FileSystem readAsStringAsync success!');
                return `data:${mimeType};base64,${base64Data}`;
            }
        } catch (fsErr) {
            // Continue trying remaining path variants
        }
    }

    // Try FileSystem.copyAsync to app cache directory if direct read fails
    const copySources = [cleanUri, doubleDecoded, `file://${doubleDecoded.replace(/^file:\/\//, '')}`];
    for (const srcUri of copySources) {
        try {
            const tempPath = `${FileSystem.cacheDirectory}temp_upload_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext || 'jpg'}`;
            console.log('[UploadService] Copying native URI to app cache:', tempPath.substring(0, 50));
            await FileSystem.copyAsync({
                from: srcUri,
                to: tempPath
            });
            const tempBase64 = await FileSystem.readAsStringAsync(tempPath, {
                encoding: FileSystem.EncodingType.Base64,
            });
            FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => { });
            if (tempBase64 && tempBase64.length > 0) {
                console.log('[UploadService] ✓ FileSystem copyAsync + readAsStringAsync success!');
                return `data:${mimeType};base64,${tempBase64}`;
            }
        } catch (copyErr) {
            // Continue to next copy source
        }
    }

    // Fallback: fetch blob + FileReader
    try {
        const response = await fetch(cleanUri);
        const blob = await response.blob();
        if (blob && blob.size > 100) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string' && reader.result.includes('base64,')) {
                        const base64Data = reader.result.split(';base64,').pop();
                        resolve(`data:${mimeType};base64,${base64Data}`);
                    } else {
                        resolve(null);
                    }
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        }
    } catch (fetchErr) {
        console.warn('[UploadService] Fetch blob fallback warning:', fetchErr?.message || fetchErr);
    }

    return null;
};

/**
 * Uploads a single image to Cloudinary and returns the secure remote URL.
 * If the URI is already a remote URL (http/https), it returns it as is.
 *
 * @param {string|object} inputUri - The local file URI (e.g. from ImagePicker), file object, or remote URL.
 * @returns {Promise<string>} The remote URL of the uploaded image.
 */
export const uploadImage = async (inputUri) => {
    if (!inputUri) return null;

    // Handle object with uri, base64, imageUrl, or plain string
    let uri = null;
    if (typeof inputUri === 'string') {
        uri = inputUri;
    } else if (typeof inputUri === 'object' && inputUri !== null) {
        uri = inputUri.base64 || inputUri.uri || inputUri.imageUrl || inputUri.url || null;
    }

    if (!uri || typeof uri !== 'string') return null;

    // If it's already a remote URL (HTTP/HTTPS), return as is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
    }

    console.log('[UploadService] Uploading image to Cloudinary... URI prefix:', uri.substring(0, 40));

    const formData = new FormData();
    formData.append('upload_preset', UPLOAD_PRESET);

    let fileName = `upload_${Date.now()}.jpg`;
    let mimeType = 'image/jpeg';
    const cleanUri = uri.trim().split('?')[0];
    const ext = cleanUri.split('.').pop()?.toLowerCase();
    if (ext === 'png') {
        mimeType = 'image/png';
        fileName = `upload_${Date.now()}.png`;
    } else if (ext === 'webp') {
        mimeType = 'image/webp';
        fileName = `upload_${Date.now()}.webp`;
    }

    // CASE 1: Base64 data URL string (e.g. data:image/jpeg;base64,...)
    if (uri.startsWith('data:')) {
        console.log('[UploadService] Appending base64 data URL payload directly...');
        let validDataUrl = uri;
        if (uri.startsWith('data:application/') || uri.startsWith('data:;')) {
            const base64Data = uri.split(';base64,').pop();
            validDataUrl = `data:${mimeType};base64,${base64Data}`;
        }
        formData.append('file', validDataUrl);
    }
    // CASE 2: Web environment or blob URL
    else if (Platform.OS === 'web' || uri.startsWith('blob:')) {
        console.log('[UploadService] Appending web blob payload...');
        formData.append('file', uri);
    }
    // CASE 3: Native React Native local file URI (file:// or content://)
    else {
        // Try converting native local file to Base64 data URL first
        const base64DataUrl = await localUriToBase64(cleanUri);
        if (base64DataUrl) {
            console.log('[UploadService] ✓ Converted native file to Base64 data URL!');
            formData.append('file', base64DataUrl);
        } else {
            console.warn('[UploadService] Base64 conversion yielded null, trying native object as last resort...');
            formData.append('file', {
                uri: cleanUri,
                name: fileName,
                type: mimeType
            });
        }
    }

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            }
        });

        const data = await response.json();

        if (data.secure_url) {
            console.log('[UploadService] ✓ Upload successful! Cloudinary Remote URL:', data.secure_url);
            return data.secure_url;
        } else {
            console.error('[UploadService] ✗ Cloudinary Upload Failed:', data?.error?.message || JSON.stringify(data));
            return null;
        }
    } catch (error) {
        console.error('[UploadService] ✗ Network/Upload error:', error?.message || error);
        return null;
    }
};

/**
 * Uploads an array of images to Cloudinary in parallel.
 *
 * @param {string[]} uris - Array of local file URIs.
 * @returns {Promise<string[]>} Array of remote URLs.
 */
export const uploadImages = async (uris = []) => {
    try {
        const uploadPromises = uris.map(uri => uploadImage(uri));
        const remoteUrls = await Promise.all(uploadPromises);
        // Filter out any nulls
        return remoteUrls.filter(url => url !== null);
    } catch (error) {
        console.error('Error uploading multiple images:', error);
        throw error;
    }
};
