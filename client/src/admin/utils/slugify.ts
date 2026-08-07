/** Convert a display name into a URL-friendly slug, e.g. "Gaming Laptops" -> "gaming-laptops". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
