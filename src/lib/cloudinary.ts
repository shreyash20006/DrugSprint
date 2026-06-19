/**
 * Cloudinary URL transformation utilities.
 * Handles dynamic image optimization, auto-generated video posters,
 * and media quality enhancements based on direct Cloudinary links.
 */

export function getCloudinaryThumbnail(url: string, type: 'image' | 'video' | 'audio'): string {
  if (!url || !url.trim()) return '';
  
  // Safe pass-through for non-Cloudinary links (e.g. ImgBB, unsplash, Google Drive)
  if (!url.includes('cloudinary.com')) return url;

  const typeLower = type?.toLowerCase();

  if (typeLower === 'video') {
    // 1. Replace /upload/ with /upload/so_0/ to fetch first frame poster
    let transformed = url.replace('/upload/', '/upload/so_0/');
    
    // 2. Change extension to .jpg dynamically
    const lastDotIndex = transformed.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      transformed = transformed.substring(0, lastDotIndex) + '.jpg';
    } else {
      transformed += '.jpg';
    }
    return transformed;
  }

  if (typeLower === 'image') {
    // Inject w_800,q_auto,f_auto for dynamic responsive optimization
    return url.replace('/upload/', '/upload/w_800,q_auto,f_auto/');
  }

  return url;
}

export function getCloudinaryMediaUrl(url: string, type: 'image' | 'video' | 'audio'): string {
  if (!url || !url.trim()) return '';
  if (!url.includes('cloudinary.com')) return url;

  const typeLower = type?.toLowerCase();

  if (typeLower === 'video') {
    // Injects w_800,q_auto,vc_auto for mobile optimized streaming
    return url.replace('/upload/', '/upload/w_800,q_auto,vc_auto/');
  }

  if (typeLower === 'image') {
    // Injects w_800,q_auto,f_auto
    return url.replace('/upload/', '/upload/w_800,q_auto,f_auto/');
  }

  return url;
}

/**
 * Uploads a file directly to Cloudinary using an unsigned upload preset.
 * Expects VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.
 */
export async function uploadFileToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error('Cloudinary configuration is missing in environment variables VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET');
    throw new Error('Cloudinary configuration is missing. Please create/configure .env variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Cloudinary upload error payload:', errData);
      throw new Error(errData?.error?.message || 'Failed to upload file to Cloudinary');
    }

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error('Cloudinary response did not contain secure_url');
    }

    return data.secure_url;
  } catch (error: any) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
}

