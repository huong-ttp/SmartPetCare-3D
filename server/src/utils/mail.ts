import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export default transporter;
export async function sendTestEmail() {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_USER,
    subject: "SmartPetCare Test",
    html: "<h2>Hello SmartPetCare</h2><p>Email hoạt động!</p>",
  });
}

export async function sendOTPEmail(
  email: string,
  otp: string
) {
    await transporter.verify();
console.log("SMTP Connected");
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "SmartPetCare Password Reset",

    html: `
      <h2>SmartPetCare</h2>

      <p>Mã OTP của bạn là:</p>

      <h1>${otp}</h1>

      <p>Mã có hiệu lực trong 5 phút.</p>
    `,
  });
}