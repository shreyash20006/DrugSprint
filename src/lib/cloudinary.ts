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
