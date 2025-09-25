import nodemailer, { Transporter } from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

function createEmailTransporter(): Transporter {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Only for development
      },
    });

    // Configure Handlebars for Email Templates
    transporter.use(
      "compile",
      hbs({
        viewEngine: {
          extname: ".hbs",
          defaultLayout: false,
          partialsDir: path.resolve(__dirname, "./templates"),
        },
        viewPath: path.resolve(__dirname, "./templates"),
        extName: ".hbs",
      })
    );

    return transporter;
  } catch (error) {
    throw error;
  }
}

// Initialize transporter
const transporter = createEmailTransporter();

// Email sending function
export async function sendEmail(
  template: string,
  to: string,
  subject: string,
  context: object,
  // attachments?: { filename: string; content: Buffer }[]
) {
  try {
    const mailOptions = {
      from: `"No Reply" <${process.env.SMTP_USER}>`,
      to,
      subject,
      template,
      context,
      // attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    return info;
  } catch (error: any) {
    throw new Error(`❌ Email sending failed: ${error.message}`);
  }
}
