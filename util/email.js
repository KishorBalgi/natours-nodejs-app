const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");
// new Email(user,url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Kishor Balgi <${process.env.EMAIL_FROM}>`;
  }
  // Create a transporter:
  newTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USERNAME,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_ADD,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  // Send mail:

  async send(template, subject) {
    // 1.Render HTML:
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    // 2.Mail options:
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      text: htmlToText.fromString(html),
      html,
    };
    //3.Actually send the email:
    await this.newTransport().sendMail(mailOptions);
  }
  // Welcome mail:
  async sendWelcome() {
    await this.send("welcome", "welcome to the Natours Family🤩");
  }
  // Password reset token:
  async sendPasswordReset() {
    await this.send("passwordReset", "Password Reset 🔑");
  }
};

// const sendEmail = async (options) => {
// 1.Create transpoter:
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_ADD,
//     pass: process.env.EMAIL_PASS,
//   },
// });
// 2.Define the email options:
// const mailOptions = {
//   from: "Kishor Balgi <kb@gmail.com>",
//   to: options.email,
//   subject: options.subject,
//   text: options.message,
//   // html:
// };
// //3.Actually send the email:
// await transporter.sendMail(mailOptions);
// };
// module.exports = sendEmail;
