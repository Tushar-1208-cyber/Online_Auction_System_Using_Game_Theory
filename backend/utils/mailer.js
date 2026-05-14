const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_16_digit_app_password_here') {
      await transporter.sendMail(mailOptions);
    } else {
      console.log(`\n=========================================`);
      console.log(`✉️ DUMMY EMAIL TO ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`CONTENT: ${htmlContent}`);
      console.log(`(Configure .env with real credentials to actually send email)`);
      console.log(`=========================================\n`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendEmail };
