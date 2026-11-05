import Settings from "../models/Settings";
import { sendEmail } from "./mail";

async function getBusinessWhatsAppNumber() {
  const settings = await Settings.findOne().select("whatsapp_number");
  return settings?.whatsapp_number?.replace(/[^\d]/g, "") || "";
}

export async function getWhatsAppContactLink() {
  const number = await getBusinessWhatsAppNumber();
  return number ? `https://wa.me/${number}` : null;
}

async function sendWhatsAppMessage(to: string, message: string) {
  const provider = process.env.WHATSAPP_PROVIDER;
  if (!provider) return;

  const recipient = to.replace(/[^\d]/g, "");
  if (!recipient) throw new Error("Customer phone number is required for WhatsApp messages");
  const contactLink = await getWhatsAppContactLink();
  const outgoingMessage = contactLink
    ? `${message}\n\nContact us: ${contactLink}`
    : message;

  if (provider === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const senderNumber = process.env.WHATSAPP_FROM || await getBusinessWhatsAppNumber();
    if (!accountSid || !authToken || !senderNumber) {
      throw new Error("Twilio WhatsApp credentials and business WhatsApp number must be configured");
    }

    const form = new URLSearchParams({
      From: `whatsapp:+${senderNumber.replace(/[^\d]/g, "")}`,
      To: `whatsapp:+${recipient}`,
      Body: outgoingMessage,
    });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      }
    );
    if (!response.ok) {
      throw new Error(`Twilio WhatsApp request failed with status ${response.status}`);
    }
    return;
  }

  if (provider === "meta") {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
    if (!accessToken || !phoneNumberId) {
      throw new Error("Meta WhatsApp access token and phone number ID must be configured");
    }
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { body: outgoingMessage },
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Meta WhatsApp request failed with status ${response.status}`);
    }
    return;
  }

  throw new Error(`Unsupported WHATSAPP_PROVIDER: ${provider}`);
}

export async function notifyCustomer(options: {
  email?: string | null;
  phone?: string | null;
  subject: string;
  message: string;
}) {
  const results: { email: boolean; whatsapp: boolean; whatsappContact: string | null } = {
    email: false,
    whatsapp: false,
    whatsappContact: null,
  };
  const tasks: Promise<void>[] = [];

  if (options.email) {
    tasks.push(
      sendEmail({
        to: options.email,
        subject: options.subject,
        text: options.message,
      }).then(() => {
        results.email = true;
      }).catch((error: unknown) => {
        console.error(`Email notification failed (${options.subject}):`, error);
      })
    );
  }

  try {
    results.whatsappContact = await getWhatsAppContactLink();
  } catch (error) {
    console.error("Could not load the configured WhatsApp contact number:", error);
  }

  if (process.env.WHATSAPP_PROVIDER) {
    if (!options.phone) {
      console.warn(`WhatsApp notification skipped (${options.subject}): customer phone is missing`);
    } else {
      tasks.push(
        sendWhatsAppMessage(options.phone, options.message).then(() => {
          results.whatsapp = true;
        }).catch((error: unknown) => {
          console.error(`WhatsApp notification failed (${options.subject}):`, error);
        })
      );
    }
  }

  await Promise.all(tasks);
  return results;
}
