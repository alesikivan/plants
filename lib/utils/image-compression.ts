const MAX_DIMENSION = 1920;

/**
 * Compresses an image file using Canvas API.
 * - Skips GIF (would lose animation) and files already within the limit.
 * - Resizes to max 1920px on the longest side.
 * - Iteratively reduces JPEG quality until file fits within maxSizeMB.
 */
export async function compressImage(file: File, maxSizeMB = 5): Promise<File> {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size <= maxBytes || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

      const outputName = file.name.replace(/\.[^.]+$/, '.jpg');
      let quality = 0.85;

      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          if (blob.size <= maxBytes || quality <= 0.1) {
            resolve(new File([blob], outputName, { type: 'image/jpeg', lastModified: Date.now() }));
          } else {
            quality = Math.max(0.1, quality - 0.15);
            tryCompress();
          }
        }, 'image/jpeg', quality);
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
