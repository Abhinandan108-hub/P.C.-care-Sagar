import nodemailer from "nodemailer";

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendMailOptions) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || "P.C. Care Sagar <no-reply@pccaresagar.com>";

  if (!host || !user || !pass) {
    console.log("[mail] SMTP not configured, email not sent:", { to, subject, text, html });
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
