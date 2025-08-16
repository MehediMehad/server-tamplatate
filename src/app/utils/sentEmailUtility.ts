import config from "../config";
import nodemailer from "nodemailer";

interface Attachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType: string;
}

const sentEmailUtility = async (
  emailTo: string,
  EmailSubject: string,
  EmailHTML?: string,
  EmailText?: string,
  attachments?: Attachment[]
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.app_pass,
    },
  });

  const mailOptions = {
    from: config.emailSender.email,
    to: emailTo,
    subject: EmailSubject,
    text: EmailText,
    html: EmailHTML,
    attachments: attachments || [],
  };

  return await transporter.sendMail(mailOptions);
};

export default sentEmailUtility;
