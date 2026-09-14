const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendResetPasswordEmail = async (toEmail, resetToken) => {
  // Lien vers la page Frontend de confirmation
  const resetUrl = `http://localhost:4200/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"BitLister Support" <no-reply@bitlister.com>',
    to: toEmail,
    subject: '⚡ Demande de modification de votre mot de passe',
    html: `
      <h2>Modification de mot de passe</h2>
      <p>Vous avez demandé la modification ou le changement de votre mot de passe sur BitLister.</p>
      <p>Cliquez sur le lien ci-dessous pour confirmer et saisir votre nouveau mot de passe (Lien valide pendant 1 heure) :</p>
      <a href="${resetUrl}" style="background-color: #f7931a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Changer mon mot de passe
      </a>
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetPasswordEmail };