const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

exports.sendOTPEmail = async (to, name, otp) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Institution Management System" <${process.env.EMAIL_FROM}>`,
      to,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e0e0e0;border-radius:8px">
          <h2 style="color:#1976d2">Password Reset Request</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your OTP for password reset is:</p>
          <div style="font-size:32px;font-weight:bold;color:#1976d2;letter-spacing:8px;text-align:center;padding:20px;background:#f5f5f5;border-radius:8px">${otp}</div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr/>
          <small style="color:#999">Institution Management System - Auto-generated email</small>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

exports.sendWelcomeEmail = async (to, name, email, password, role) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Institution Management System" <${process.env.EMAIL_FROM}>`,
      to,
      subject: "Welcome to Institution Management System",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e0e0e0;border-radius:8px">
          <h2 style="color:#1976d2">Welcome, ${name}!</h2>
          <p>Your account has been created as <strong>${role}</strong>.</p>
          <p><strong>Login Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
          <p>Please login and change your password immediately.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="background:#1976d2;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:10px">Login Now</a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Welcome email failed:", err.message);
  }
};
