import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { loadEmailConfigFromEnv } from '../config/emailConfig';
import { SportKey } from '../src/models/Event';

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');

const SPORT_KEYS: SportKey[] = [
  'football',
  'cricket',
  'f1',
  'golf',
  'rugby_union',
  'rugby_league',
  'racing',
  'tennis',
  'boxing',
  'nfl',
  'darts',
  'basketball',
  'netball',
  'other_sports'
];

const SUBJECT_LABEL: Record<SportKey, string> = {
  football: 'Football',
  cricket: 'Cricket',
  f1: 'Formula 1',
  golf: 'Golf',
  rugby_union: 'Rugby Union',
  rugby_league: 'Rugby League',
  racing: 'Racing',
  tennis: 'Tennis',
  boxing: 'Boxing',
  nfl: 'NFL',
  darts: 'Darts',
  basketball: 'Basketball',
  netball: 'Netball',
  other_sports: 'Other Sports'
};

async function main() {
  const cfg = loadEmailConfigFromEnv();
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass
    }
  });

  for (const key of SPORT_KEYS) {
    const htmlPath = path.join(OUTPUT_DIR, `email-${key}.html`);
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, 'utf8');
    const subject = `Sky Sports weekly schedule – ${SUBJECT_LABEL[key]}`;

    const info = await transporter.sendMail({
      from: cfg.from,
      to: cfg.to,
      subject,
      html
    });

    console.log(`📧 Sent ${key} email: ${info.messageId}`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Error sending emails:', err);
    process.exit(1);
  });
}

