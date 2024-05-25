const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io", // Ganti dengan host SMTP Anda
  port: process.env.SMTP_PORT || 2525, // Ganti dengan port SMTP Anda
  secure: false, // true untuk port 465, false untuk port lainnya
  auth: {
    user: process.env.SMTP_USER || "13fe06ae8089f9", // Ganti dengan email Anda
    pass: process.env.SMTP_PASS || "0139f89f8cae7b", // Ganti dengan password email Anda
  },
});

export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
) => {
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS || "info@app.com", // Ganti dengan email pengirim
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
