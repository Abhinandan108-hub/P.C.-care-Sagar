import type { Product } from "../productsData";

export const API_URL = import.meta.env.VITE_API_URL?.trim() || "/api";

type ApiProductRecord = Record<string, unknown>;

export interface ProductsApiResponse {
  success: boolean;
  data: {
    products: ApiProductRecord[];
    totalCount: number;
  };
}

const availabilityMap: Record<string, Product["availability"]> = {
  in_stock: "In Stock",
  out_of_stock: "Pre Order",
  coming_soon: "Coming Soon",
};

export function mapApiProductToFeatured(raw: ApiProductRecord): Product {
  const specs = Array.isArray(raw.specifications)
    ? (raw.specifications as Array<{ key: string; value: string }>)
    : [];
  const getSpec = (key: string) =>
    specs.find((s) => s.key.toLowerCase() === key.toLowerCase())?.value;

  const tags: string[] = [];
  if (raw.featured) tags.push("Business Ready");
  if (raw.latest) tags.push("Latest");

  const offers: string[] = [];
  if (Number(raw.offer_percentage) > 0) offers.push("Special Offer");

  return {
    id: String(raw._id ?? raw.id ?? ""),
    name: String(raw.name ?? ""),
    category: String(raw.category ?? ""),
    brand: String(raw.brand ?? ""),
    image: String(raw.image_url ?? raw.image ?? ""),
    description: String(raw.description ?? ""),
    processor: (raw.processor as string | undefined) ?? getSpec("Processor"),
    ram: (raw.ram as string | undefined) ?? getSpec("RAM"),
    storage: (raw.storage as string | undefined) ?? getSpec("Storage"),
    graphics: (raw.graphics as string | undefined) ?? getSpec("Graphics"),
    display: (raw.display_size as string | undefined) ?? getSpec("Display"),
    os: (raw.operating_system as string | undefined) ?? getSpec("Operating System"),
    availability: availabilityMap[String(raw.availability)] ?? "In Stock",
    warranty: String(raw.warranty ?? "Standard Warranty"),
    tags,
    offers,
    price: Number(raw.price ?? 0),
    rating: 4.5,
  };
}

export async function fetchPublicProducts(pageSize = 100): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products?status=active&pageSize=${pageSize}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const json = (await res.json()) as ProductsApiResponse | ApiProductRecord[];
  const items = Array.isArray(json)
    ? json
    : Array.isArray(json?.data?.products)
      ? json.data.products
      : [];

  return items.map(mapApiProductToFeatured);
}
