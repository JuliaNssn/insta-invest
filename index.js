const puppy = require("puppeteer");
const nodemailer = require("nodemailer");

require("dotenv").config();

const link =
  "https://www.amazon.de/Sony-Interactive-Entertainment-PlayStation-5/dp/B08H93ZRK9/";

var lastTimeAvailable;

function sendMail() {
  let transporter = nodemailer.createTransport({
    host: "securesmtp.t-online.de",
    port: 465,
    secure: true,
    auth: {
      user: process.env.FROMMAILUSER,
      pass: process.env.FROMMAILPASSWORD,
    },
  });

  transporter.sendMail({
    from: `"PS5 Mailer" <${process.env.FROMMAILUSER}>`,
    to: `${process.env.USER1MAIL}, ${process.env.USER2MAIL}`,
    subject: "PS5 Now available",
    text: link,
    html: `<a href='${link}'>${link}</a>`,
  });
}

async function checkAvailability() {
  if (!lastTimeAvailable || Date.now() - lastTimeAvailable > 43200000) {
    const browser = await puppy.launch();
    const page = await browser.newPage();
    await page.goto(link);

    const availability = await page.$eval(
      "div#availability .a-size-medium",
      (el) => el.innerHTML.trim()
    );

    if (!availability.includes("nicht")) {
      lastTimeAvailable = Date.now();

      sendMail();
    }

    await browser.close();
  }
  setTimeout(() => checkAvailability(), 5000);
}

checkAvailability();
