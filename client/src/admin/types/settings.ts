export interface SiteSettings {
  id: number;

  company_name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;

  hero_banner_url: string | null;
  hero_title: string;
  hero_subtitle: string;

  whatsapp_number: string;
  phone_number: string;
  email: string;
  address: string;
  google_map_link: string;

  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;

  business_hours: string;
  footer_text: string;
  copyright_text: string;

  updated_at: string;
}

export type SiteSettingsFormValues = Omit<SiteSettings, "id" | "updated_at">;

export const emptySiteSettingsFormValues: SiteSettingsFormValues = {
  company_name: "",
  tagline: "",
  logo_url: null,
  favicon_url: null,
  hero_banner_url: null,
  hero_title: "",
  hero_subtitle: "",
  whatsapp_number: "",
  phone_number: "",
  email: "",
  address: "",
  google_map_link: "",
  facebook_url: "",
  instagram_url: "",
  linkedin_url: "",
  youtube_url: "",
  business_hours: "",
  footer_text: "",
  copyright_text: "",
};
