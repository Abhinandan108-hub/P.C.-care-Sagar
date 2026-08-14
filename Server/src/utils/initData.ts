import bcrypt from "bcryptjs";
import User from "../models/User";
import Settings from "../models/Settings";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@pccaresagar.com";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Pccare@12345";

export async function ensureDefaultAppData() {
  const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN_EMAIL.toLowerCase().trim() });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
    await User.create({
      name: "Admin",
      email: DEFAULT_ADMIN_EMAIL.toLowerCase().trim(),
      password: hashed,
      role: "admin",
    });
    // eslint-disable-next-line no-console
    console.log("Created default admin user:", DEFAULT_ADMIN_EMAIL);
  }

  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    await Settings.create({
      company_name: "P.C. Care Sagar",
      tagline: "Trusted IT products and service",
      hero_title: "Reliable IT solutions for every business",
      hero_subtitle: "Laptops, desktops, printers, networking and more — all in one place.",
      whatsapp_number: "+919826828666",
      phone_number: "+919826828666",
      email: "pccaresagar@yahoo.com",
      address: "",
      google_map_link: "",
      facebook_url: "",
      instagram_url: "",
      linkedin_url: "",
      youtube_url: "",
      business_hours: "",
      footer_text: "",
      copyright_text: "",
    });
    // eslint-disable-next-line no-console
    console.log("Created default website settings.");
  }
}
