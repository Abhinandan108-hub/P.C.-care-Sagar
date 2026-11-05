
import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";

type EmailAttachment = NonNullable<SendMailOptions["attachments"]>[number];

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments,
}: SendEmailOptions) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error("Email service is not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    attachments,
  });
}
