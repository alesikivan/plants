import exifr from 'exifr';

export async function getPhotoDate(file: File): Promise<Date | null> {
  try {
    const result = await exifr.parse(file, ['DateTimeOriginal', 'DateTime', 'DateTimeDigitized']);
    const rawDate = result?.DateTimeOriginal ?? result?.DateTime ?? result?.DateTimeDigitized;
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      return rawDate;
    }
  } catch (err) {
    console.log(`[exif] ${file.name}: ошибка чтения EXIF —`, err);
  }
  return null;
}
