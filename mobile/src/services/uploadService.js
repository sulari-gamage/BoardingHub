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

    // If it's already a remote URL, no need to upload
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
    }

    // Get the file extension and type
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    // Convert to standard format
    const name = uri.split('/').pop();

    const formData = new FormData();
    formData.append('file', {
        uri,
        name,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`
    });
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });

        const data = await response.json();

        if (data.secure_url) {
            return data.secure_url;
        } else {
            console.error('Cloudinary Upload Error:', data);
            throw new Error(data.error?.message || 'Failed to upload image');
        }
    } catch (error) {
        console.error('Upload catch error:', error);
        throw error;
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
