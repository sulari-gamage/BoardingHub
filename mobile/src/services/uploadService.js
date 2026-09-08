// src/services/uploadService.js
const CLOUD_NAME = 'vwgsaglm';
const UPLOAD_PRESET = 'boardinghub_preset';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads a single image to Cloudinary and returns the secure remote URL.
 * If the URI is already a remote URL (http/https), it returns it as is.
 *
 * @param {string} uri - The local file URI (e.g. from ImagePicker) or remote URL.
 * @returns {Promise<string>} The remote URL of the uploaded image.
 */
export const uploadImage = async (uri) => {
    if (!uri) return null;

    // If it's already a remote URL (HTTP/HTTPS), return as is
    if (typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://'))) {
        return uri;
    }

    // Determine clean file extension & mime type
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
        } else if (ext === 'jpg' || ext === 'jpeg') {
            mimeType = 'image/jpeg';
            fileName = `upload_${Date.now()}.jpg`;
        }
    }

    const formData = new FormData();
    formData.append('file', {
        uri,
        name: fileName,
        type: mimeType
    });
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
