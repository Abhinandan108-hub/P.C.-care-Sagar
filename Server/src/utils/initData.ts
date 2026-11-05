
import bcrypt from "bcryptjs";
import User from "../models/User";
import Settings from "../models/Settings";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function ensureDefaultAppData() {
  // 1. Create default admin if one does not exist
  const existingAdmin = await User.findOne({
    role: "admin",
  });

  if (!existingAdmin) {
    if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env"
      );
    }

    if (DEFAULT_ADMIN_PASSWORD.length < 12) {
      throw new Error(
        "ADMIN_PASSWORD must contain at least 12 characters"
      );
    }

    const adminEmail = DEFAULT_ADMIN_EMAIL.toLowerCase().trim();

    const existingEmail = await User.findOne({
      email: adminEmail,
    });

    if (existingEmail) {
      throw new Error(
        "ADMIN_EMAIL is already registered with a non-admin account"
      );
    }

    const hashedPassword = await bcrypt.hash(
      DEFAULT_ADMIN_PASSWORD,
      12
    );

    await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
      emailVerified: true,
    });

    // eslint-disable-next-line no-console
    console.log("Created default admin user:", adminEmail);
  }

  await User.updateMany(
    { emailVerified: { $exists: false } },
    { $set: { emailVerified: true } }
  );

  // 2. Create default website settings if they do not exist
  const existingSettings = await Settings.findOne();

  if (!existingSettings) {
    await Settings.create({
      company_name: "P.C. Care Sagar",
      tagline: "Trusted IT products and service",
      hero_title: "Reliable IT solutions for every business",
      hero_subtitle:
        "Laptops, desktops, printers, networking and more — all in one place.",
      whatsapp_number: "+916267808085",
      phone_number: "+916267808085",
      email: "abhinandansoni100@gmail.com",
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

  await Settings.updateMany(
    {
      $or: [
        { whatsapp_number: "+919826828666" },
        { whatsapp_number: "" },
        { phone_number: "+919826828666" },
        { email: "pccaresagar@yahoo.com" },
      ],
    },
    {
      $set: {
        whatsapp_number: "+916267808085",
        phone_number: "+916267808085",
        email: "abhinandansoni100@gmail.com",
      },
    }
  );
}
