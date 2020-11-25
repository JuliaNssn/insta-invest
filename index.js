const puppy = require('puppeteer');
const nodemailer = require('nodemailer');
const moment = require('moment'); // require

require('dotenv').config();

class InvestEntity {
  constructor(id, name, link, emails, triggerWord, lastTimeAvailable) {
    this.id = id;
    this.name = name;
    this.link = link;
    this.emails = emails;
    this.triggerWord = triggerWord;
    this.lastTimeAvailable = lastTimeAvailable;
  }
}

const investies = [
  new InvestEntity(
    0,
    'PS 5',
    'https://www.amazon.de/Sony-Interactive-Entertainment-PlayStation-5/dp/B08H93ZRK9/',
    ['r.schramowski@googlemail.com', 'j.nissen@outlook.de', 'n.lipinski@web.de', 'p.schulz@eprivacy.eu'],
    'nicht',
    null
  ),
  new InvestEntity(
    1,
    'Paddys Laptop',
    'https://www.mediamarkt.de/de/product/_hp-15s-eq0355ng-2673915.html',
    ['p.schulz@eprivacy.eu'],
    'lol', //'Leider keine Lieferung',
    null
  ),
];

function sendMail(investEntity) {
  let transporter = nodemailer.createTransport({
    host: 'securesmtp.t-online.de',
    port: 465,
    secure: true,
    auth: {
      user: process.env.FROMMAILUSER,
      pass: process.env.FROMMAILPASSWORD,
    },
  });

  transporter.sendMail({
    from: `"Insta-Invest Mailer" <${process.env.FROMMAILUSER}>`,
    to: investEntity.emails.join(','),
    subject: investEntity.name + ' available!',
    text: investEntity.link,
    html: `<a href='${investEntity.link}'>${investEntity.link}</a>`,
  });
}

async function checkAvailability(investEntity) {
  if (!investEntity.lastTimeAvailable || Date.now() - investEntity.lastTimeAvailable > 43200000) {
    const browser = await puppy.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

    await page.goto(investEntity.link);

    var availability;

    switch (investEntity.id) {
      case 0:
        availability = await page.$eval('div#availability .a-size-medium', (el) => el.innerHTML.trim());
        break;
      case 1:
        const divContainer = await page.$('[data-test="mms-delivery-online-availability"]');
        availability = await divContainer.$eval('div', (el) => el.innerHTML.trim().split('>')[1].split('<')[0]);
        break;
    }

    console.log('[' + moment().format('DD.MM.YYY HH:mm:ss') + ']:', investEntity.name + ' -', availability);

    if (availability != null && !availability.includes(investEntity.triggerWord)) {
      investEntity.lastTimeAvailable = Date.now();

      console.log('[' + moment().format('DD.MM.YYY HH:mm:ss') + ']:', investEntity.name, 'GOGOGOGOGO');
      sendMail(investEntity);
    }

    await browser.close();
  }

  setTimeout(() => checkAvailability(investEntity), 5000);
}

investies.forEach((investEntity) => checkAvailability(investEntity));
