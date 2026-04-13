const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email send error:', error.message);
    throw error;
  }
};

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  const subject = 'Xác thực email - SE113 Group 10';
  const html = `
    <h1>Xác thực email của bạn</h1>
    <p>Vui lòng click vào link bên dưới để xác thực email:</p>
    <a href="${verifyUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Xác thực</a>
    <p>Link sẽ hết hạn sau 24 giờ.</p>
    <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
  `;
  await sendEmail(email, subject, html);
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const subject = 'Đặt lại mật khẩu - SE113 Group 10';
  const html = `
    <h1>Đặt lại mật khẩu</h1>
    <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link bên dưới:</p>
    <a href="${resetUrl}" style="padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
    <p>Link sẽ hết hạn sau 1 giờ.</p>
    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
  `;
  await sendEmail(email, subject, html);
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };