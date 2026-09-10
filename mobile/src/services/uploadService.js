import { Platform } from 'react-native';

const CLOUD_NAME = 'vwgsaglm';
const UPLOAD_PRESET = 'boardinghub_preset';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads a single image to Cloudinary and returns the secure remote URL.
 * If the URI is already a remote URL (http/https), it returns it as is.
 *
 * @param {string|object} inputUri - The local file URI (e.g. from ImagePicker), file object, or remote URL.
 * @returns {Promise<string>} The remote URL of the uploaded image.
 */
export const uploadImage = async (inputUri) => {
    if (!inputUri) return null;

    // Handle object with uri property
    const uri = (typeof inputUri === 'object' && inputUri.uri) ? inputUri.uri : inputUri;

    // If it's already a remote URL (HTTP/HTTPS), return as is
    if (typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://'))) {
        return uri;
    }

    const formData = new FormData();

    if (Platform.OS === 'web' || (typeof uri === 'string' && (uri.startsWith('data:') || uri.startsWith('blob:')))) {
        try {
            if (typeof uri === 'string' && uri.startsWith('data:')) {
                // Cloudinary accepts base64 data URLs directly as string
                formData.append('file', uri);
            } else if (typeof uri === 'string' && uri.startsWith('blob:')) {
                const res = await fetch(uri);
                const blob = await res.blob();
                formData.append('file', blob);
            } else if (typeof uri === 'string') {
                const res = await fetch(uri);
                const blob = await res.blob();
                formData.append('file', blob);
            } else {
                formData.append('file', uri);
            }
        } catch (e) {
            console.warn('Web blob conversion fallback:', e);
            formData.append('file', uri);
        }
    } else {
        // Native React Native FormData format
        let mimeType = 'image/jpeg';
        let fileName = `upload_${Date.now()}.jpg`;

        if (typeof uri === 'string') {
            const cleanUri = uri.split('?')[0];
            const ext = cleanUri.split('.').pop()?.toLowerCase();
            if (ext === 'png') {
                mimeType = 'image/png';
                fileName = `upload_${Date.now()}.png`;
            } else if (ext === 'webp') {
                mimeType = 'image/webp';
                fileName = `upload_${Date.now()}.webp`;
            }
        }

        formData.append('file', {
            uri,
            name: fileName,
            type: mimeType
        });
    }

    formData.append('upload_preset', UPLOAD_PRESET);

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
            return data.secure_url;
        } else {
            console.error('Cloudinary Upload Error details:', data);
            return null;
        }
    } catch (error) {
        console.error('Upload catch error:', error);
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
