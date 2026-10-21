import sharp from "sharp";
import { isAdmin } from "@/lib/adminAuth";
import { saveMenuImage } from "@/lib/db";
import { json } from "@/lib/http";

const MAX_BYTES = 8 * 1024 * 1024;

// JPEG, PNG and WebP files each start with a recognisable set of bytes.
// Checking them means a renamed file of some other kind is refused.
function looksLikeImage(bytes: Buffer) {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const webp =
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return jpeg || png || webp;
}

// Takes a dish photo, shrinks it and stores it. Returns the address to use for the dish.
export async function POST(request: Request) {
  if (!(await isAdmin())) return json({ error: "Please log in." }, 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "That upload did not work. Please try again." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "No photo was sent." }, 400);
  if (file.size > MAX_BYTES) return json({ error: "That photo is too large." }, 413);

  const input = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(input)) {
    return json({ error: "Please upload a JPG, PNG or WebP photo." }, 400);
  }

  let output: Buffer;
  try {
    // Turns it the right way up, limits it to 1600 pixels, and saves it as a small WebP.
    // Re-saving also removes hidden details such as the place the photo was taken.
    output = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return json({ error: "We could not read that photo." }, 400);
  }

  try {
    return json({ url: await saveMenuImage(output) });
  } catch (error) {
    console.error("[menu] could not store a photo:", error);
    return json({ error: "The photo could not be saved. Please try again." }, 502);
  }
}
