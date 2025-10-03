require("dotenv").config();

const nodemailer = require("nodemailer");

async function main() {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  try {
    await transporter.verify();
    console.log("✅ Connection OK");

    let info = await transporter.sendMail({
      from: `"CodeBuddies" <${process.env.EMAIL_USER}>`,
      to: "catherine.mugnai@gmail.com",
      subject: "Test email",
      text: "If you see this, Gmail SMTP works locally",
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

main();
