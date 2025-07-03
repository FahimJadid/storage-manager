const nodemailer = require("nodemailer");

const emailService = {
  transporter: null,

  init: function () {
    this.transporter = nodemailer.createTransport({
      // service: 'gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  },

  sendVerificationCode: function (email, code) {
    if (!this.transporter) throw new Error("Email transporter not initialized");
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Verification Code",
      text: `Your verification code is: ${code}`,
    };

    return this.transporter.sendMail(mailOptions);
  },

  sendWelcomeEmail: function (email) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Jotter!",
      text: "Thank you for signing up for Jotter. We hope you enjoy our service!",
    };

    return this.transporter.sendMail(mailOptions);
  },
};

module.exports = emailService;
