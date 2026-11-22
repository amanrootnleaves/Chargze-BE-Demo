/*
 * IMPORTS
 */
import Nodemailer from "nodemailer";
import Context from "../../context";

/*
 * EXPORTS
 */
export const SendVerificationEmail = async (to, token) => {
  try {
    const transporter = Nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #003366; /* Dark Blue */
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 30px;
            text-align: center;
            color: #333333;
          }
          .btn {
            display: inline-block;
            background-color: #003366; /* Dark Blue */
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            font-weight: bold;
          }
          .footer {
            background-color: #f4f4f4;
            color: #666666;
            padding: 20px;
            text-align: center;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Chargze!</h1>
          </div>
          <div class="content">
            <p>Thank you for registering with us.</p>
            <p>Please click the button below to verify your email address and complete your registration.</p>
            <a href="${verificationUrl}" class="btn">Verify Email</a>
          </div>
          <div class="footer">
            <p>If you did not create an account, no further action is required.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Rezune Support" <${process.env.SMTP_USER}>`,
      to,
      subject: "Verify your email address - Rezune",
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    return error;
  }
};

export default {
  SendVerificationEmail,
};
