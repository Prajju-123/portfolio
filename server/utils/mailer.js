import nodemailer from 'nodemailer';

// Escape user input before putting it into the HTML email body.
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  const { MAIL_USER, MAIL_PASS, SMTP_HOST, SMTP_PORT, SMTP_SECURE } = process.env;
  if (!MAIL_USER || !MAIL_PASS) throw new Error('MAIL_USER / MAIL_PASS are not set in server/.env');
  transporter = SMTP_HOST
    ? nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT) || 587, secure: SMTP_SECURE === 'true', auth: { user: MAIL_USER, pass: MAIL_PASS } })
    : nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } }); // Gmail App Password
  return transporter;
}

// Sends the contact-form message to MAIL_TO (default: the portfolio owner's inbox).
// "Reply" in your mail app goes straight to the visitor because of replyTo.
export async function sendContactMail({ name, email, message }) {
  const to = process.env.MAIL_TO || 'prajjumogaveera2001@gmail.com';
  const info = await getTransporter().sendMail({
    from: `"Portfolio Contact" <${process.env.MAIL_USER}>`,
    to,
    replyTo: `"${String(name).replace(/["\r\n]/g, '')}" <${email}>`,
    subject: `New portfolio message from ${String(name).replace(/[\r\n]/g, ' ')}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="margin:0 0 12px">New message from your portfolio</h2>
      <p><b>Name:</b> ${esc(name)}<br><b>Email:</b> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
      <p style="white-space:pre-wrap;border-left:4px solid #f59e0b;padding-left:12px">${esc(message)}</p>
    </div>`,
  });
  return info;
}
