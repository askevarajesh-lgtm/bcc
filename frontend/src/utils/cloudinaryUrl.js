/**
 * cloudinaryUrl utility
 * Transforms Cloudinary URLs with transformation parameters.
 */

/**
 * Builds a Cloudinary URL with optional transformation options.
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options (width, height, crop, quality, format)
 */
export function buildCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;

  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;
  const transforms = [];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);

  const transformStr = transforms.join(',');
  return url.replace('/upload/', `/upload/${transformStr}/`);
}

/**
 * Returns a thumbnail version of a Cloudinary URL.
 */
export function getCloudinaryThumbnail(url, size = 200) {
  return buildCloudinaryUrl(url, { width: size, height: size, crop: 'fill' });
}

/**
 * Returns the original image delivery URL without transformations.
 */
export function getCloudinaryOriginalDeliveryUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;
  
  // Naive removal of transformations (e.g. /upload/w_200,c_fill/v1234/...)
  return url.replace(/\/upload\/([^v][^\/]+\/)+/, '/upload/');
}

/**
 * Returns a URL that forces a download for a Cloudinary asset.
 */
export function getCloudinaryDownloadUrl(url, filename) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;
  
  const cleanUrl = getCloudinaryOriginalDeliveryUrl(url);
  let attachParam = 'fl_attachment';
  
  if (filename) {
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.') || filename;
    attachParam = `fl_attachment:${encodeURIComponent(nameWithoutExt)}`;
  }
  
  return cleanUrl.replace('/upload/', `/upload/${attachParam}/`);
}

export default { buildCloudinaryUrl, getCloudinaryThumbnail, getCloudinaryOriginalDeliveryUrl, getCloudinaryDownloadUrl };
