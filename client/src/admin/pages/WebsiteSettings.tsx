import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Globe } from "lucide-react";
import ImagePicker from "../components/common/ImagePicker";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { getSiteSettings, updateSiteSettings } from "../services/settingsService";
import { emptySiteSettingsFormValues } from "../types/settings";
import type { SiteSettingsFormValues } from "../types/settings";

export default function WebsiteSettings() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SiteSettingsFormValues>({ defaultValues: emptySiteSettingsFormValues });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const settings = await getSiteSettings();
        if (!mounted) return;
        reset({
          company_name: settings.company_name,
          tagline: settings.tagline,
          logo_url: settings.logo_url,
          favicon_url: settings.favicon_url,
          hero_banner_url: settings.hero_banner_url,
          hero_title: settings.hero_title,
          hero_subtitle: settings.hero_subtitle,
          whatsapp_number: settings.whatsapp_number,
          phone_number: settings.phone_number,
          email: settings.email,
          address: settings.address,
          google_map_link: settings.google_map_link,
          facebook_url: settings.facebook_url,
          instagram_url: settings.instagram_url,
          linkedin_url: settings.linkedin_url,
          youtube_url: settings.youtube_url,
          business_hours: settings.business_hours,
          footer_text: settings.footer_text,
          copyright_text: settings.copyright_text,
        });
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Failed to load website settings.";
        setLoadError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [reset]);

  const logoUrl = watch("logo_url");
  const faviconUrl = watch("favicon_url");
  const heroBannerUrl = watch("hero_banner_url");

  async function onSubmit(values: SiteSettingsFormValues) {
    setSaving(true);
    try {
      await updateSiteSettings(values);
      toast.success("Website Settings Updated Successfully");
    } catch {
      toast.error("Database Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Website Settings</h1>
          <p>Everything shown on the public storefront — nothing here is hardcoded.</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-table-card">
          <LoadingSpinner label="Loading website settings…" />
        </div>
      ) : loadError ? (
        <div className="admin-table-card">
          <EmptyState icon={Globe} title="Couldn't load settings" description={loadError} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ---------- Branding ---------- */}
          <div className="admin-form-card">
            <div className="admin-form-card__title">Branding</div>
            <div className="admin-form-card__sub">Your company identity shown across the site.</div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label>
                  Company Name <span className="admin-required">*</span>
                </label>
                <input
                  className={`admin-plain-input ${errors.company_name ? "has-error" : ""}`}
                  placeholder="e.g. P.C. Care Sagar"
                  {...register("company_name", { required: "Company name is required" })}
                />
                {errors.company_name && <span className="admin-field__error">{errors.company_name.message}</span>}
              </div>
              <div className="admin-field">
                <label>Tagline</label>
                <input className="admin-plain-input" placeholder="e.g. Your Trusted IT Partner" {...register("tagline")} />
              </div>
            </div>

            <ImagePicker label="Logo" folder="site" value={logoUrl} onChange={(url) => setValue("logo_url", url)} />
            <ImagePicker label="Favicon" folder="site" value={faviconUrl} onChange={(url) => setValue("favicon_url", url)} />
          </div>

          {/* ---------- Hero Section ---------- */}
          <div className="admin-form-card">
            <div className="admin-form-card__title">Homepage Hero</div>
            <div className="admin-form-card__sub">The first thing visitors see on your homepage.</div>

            <ImagePicker label="Hero Banner Image" folder="site" value={heroBannerUrl} onChange={(url) => setValue("hero_banner_url", url)} />

            <div className="admin-form-grid">
              <div className="admin-field admin-field--full">
                <label>Hero Title</label>
                <input className="admin-plain-input" placeholder="e.g. Premium Computers & IT Solutions" {...register("hero_title")} />
              </div>
              <div className="admin-field admin-field--full">
                <label>Hero Subtitle</label>
                <textarea className="admin-textarea" placeholder="A short supporting line under the hero title…" {...register("hero_subtitle")} />
              </div>
            </div>
          </div>

          {/* ---------- Contact Details ---------- */}
          <div className="admin-form-card">
            <div className="admin-form-card__title">Contact Details</div>
            <div className="admin-form-card__sub">Shown in the header, footer and contact page.</div>

            <div className="admin-form-grid admin-form-grid--3">
              <div className="admin-field">
                <label>WhatsApp Number</label>
                <input className="admin-plain-input" placeholder="e.g. +91 98765 43210" {...register("whatsapp_number")} />
              </div>
              <div className="admin-field">
                <label>Phone Number</label>
                <input className="admin-plain-input" placeholder="e.g. +91 98765 43210" {...register("phone_number")} />
              </div>
              <div className="admin-field">
                <label>Email</label>
                <input type="email" className="admin-plain-input" placeholder="e.g. hello@pccaresagar.com" {...register("email")} />
              </div>
              <div className="admin-field admin-field--full">
                <label>Address</label>
                <textarea className="admin-textarea" placeholder="Full store address…" {...register("address")} />
              </div>
              <div className="admin-field admin-field--full">
                <label>Google Map Link</label>
                <input className="admin-plain-input" placeholder="https://maps.google.com/…" {...register("google_map_link")} />
              </div>
            </div>
          </div>

          {/* ---------- Social Media ---------- */}
          <div className="admin-form-card">
            <div className="admin-form-card__title">Social Media</div>
            <div className="admin-form-card__sub">Links shown in the footer and header icons.</div>

            <div className="admin-form-grid admin-form-grid--3">
              <div className="admin-field">
                <label>Facebook</label>
                <input className="admin-plain-input" placeholder="https://facebook.com/…" {...register("facebook_url")} />
              </div>
              <div className="admin-field">
                <label>Instagram</label>
                <input className="admin-plain-input" placeholder="https://instagram.com/…" {...register("instagram_url")} />
              </div>
              <div className="admin-field">
                <label>LinkedIn</label>
                <input className="admin-plain-input" placeholder="https://linkedin.com/…" {...register("linkedin_url")} />
              </div>
              <div className="admin-field">
                <label>YouTube</label>
                <input className="admin-plain-input" placeholder="https://youtube.com/…" {...register("youtube_url")} />
              </div>
            </div>
          </div>

          {/* ---------- Footer ---------- */}
          <div className="admin-form-card">
            <div className="admin-form-card__title">Business Hours &amp; Footer</div>

            <div className="admin-form-grid">
              <div className="admin-field admin-field--full">
                <label>Business Hours</label>
                <textarea className="admin-textarea" placeholder="e.g. Mon–Sat: 10:00 AM – 8:00 PM" {...register("business_hours")} />
              </div>
              <div className="admin-field admin-field--full">
                <label>Footer Text</label>
                <textarea className="admin-textarea" placeholder="Short text shown in the site footer…" {...register("footer_text")} />
              </div>
              <div className="admin-field admin-field--full">
                <label>Copyright</label>
                <input className="admin-plain-input" placeholder="e.g. © 2026 P.C. Care Sagar. All rights reserved." {...register("copyright_text")} />
              </div>
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? <LoadingSpinner size="sm" onAccent /> : null}
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
