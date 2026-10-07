/** Longest side of a stored photo, in pixels. */
const MAX_SIDE = 800;
/** Stay under the server limit for inline photos (about 300 KB). */
const MAX_CHARS = 400_000;

/**
 * Shrinks a photo picked on the device to a small JPEG data URL.
 * Runs in the browser only.
 */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Couldn't read that image.");
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    const data = canvas.toDataURL("image/jpeg", quality);
    if (data.length <= MAX_CHARS) return data;
  }
  throw new Error("That image is too detailed to store. Try a smaller one.");
}
