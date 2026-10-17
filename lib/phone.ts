// Turns what a customer types into the format SMS and WhatsApp services expect:
// country code first, no plus sign, no spaces. Example: 2348012345678
// Accepts 0803 123 4567, +234 803 123 4567 and 2348031234567.
export function normalizeNgPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().+]/g, "");
  if (!/^\d+$/.test(digits)) return null;

  let national: string;
  if (digits.startsWith("234")) national = digits.slice(3);
  else if (digits.startsWith("0")) national = digits.slice(1);
  else national = digits;

  // Nigerian mobile numbers have 10 digits after the country code and start with 7, 8 or 9
  if (!/^[789]\d{9}$/.test(national)) return null;
  return "234" + national;
}

// 2348031234567 becomes 0803 123 4567
export function displayPhone(normalized: string): string {
  const local = "0" + normalized.slice(3);
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
