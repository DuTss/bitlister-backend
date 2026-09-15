const nodemailer = require('nodemailer');

const sendResetPasswordEmail = async (toEmail, resetToken) => {
  const resetUrl = `http://localhost:4200/reset-password?token=${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.CONTACT_EMAIL,
      pass: process.env.CONTACT_EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `"Support" <${process.env.CONTACT_EMAIL}>`,
    to: toEmail,
    subject: '⚡ Modification de votre mot de passe',
    html: `
      <h2>Changement de mot de passe</h2>
      <p>Cliquez sur le lien ci-dessous pour modifier votre mot de passe :</p>
      <a href="${resetUrl}" style="background-color: #f7931a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Changer mon mot de passe
      </a>
      <p>Ce lien expirera dans 1 heure.</p>
    `
  });
};

const sendVerificationEmail = async (toEmail, verificationToken) => {
  const verifyUrl = `http://localhost:4200/verify-email?token=${verificationToken}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.CONTACT_EMAIL,
      pass: process.env.CONTACT_EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `"Support" <${process.env.CONTACT_EMAIL}>`,
    to: toEmail,
    subject: '⚡ Activation de votre compte',
    html: `
      <h2>Bienvenue !</h2>
      <p>Merci de vous être inscrit. Cliquez sur le lien ci-dessous pour activer votre compte :</p>
      <a href="${verifyUrl}" style="background-color: #f7931a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Activer mon compte
      </a>
      <p>Ce lien expirera dans 24 heures.</p>
    `
  });
};

module.exports = { 
  sendResetPasswordEmail, 
  sendVerificationEmail 
};