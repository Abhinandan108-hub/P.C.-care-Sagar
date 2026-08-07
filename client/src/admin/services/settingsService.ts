import { supabase } from "../lib/supabaseClient";
import type { SiteSettings, SiteSettingsFormValues } from "../types/settings";

const TABLE = "site_settings";

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", 1).single();
  if (error) throw error;
  return data as SiteSettings;
}

export async function updateSiteSettings(
  values: SiteSettingsFormValues
): Promise<SiteSettings> {
  const payload = {
    id: 1,
    company_name: values.company_name.trim(),
    tagline: values.tagline.trim(),
    logo_url: values.logo_url,
    favicon_url: values.favicon_url,
    hero_banner_url: values.hero_banner_url,
    hero_title: values.hero_title.trim(),
    hero_subtitle: values.hero_subtitle.trim(),
    whatsapp_number: values.whatsapp_number.trim(),
    phone_number: values.phone_number.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
    google_map_link: values.google_map_link.trim(),
    facebook_url: values.facebook_url.trim(),
    instagram_url: values.instagram_url.trim(),
    linkedin_url: values.linkedin_url.trim(),
    youtube_url: values.youtube_url.trim(),
    business_hours: values.business_hours.trim(),
    footer_text: values.footer_text.trim(),
    copyright_text: values.copyright_text.trim(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as SiteSettings;
}
