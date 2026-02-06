import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { loadEmailConfigFromEnv } from '../config/emailConfig';

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');
const COMBINED_HTML_PATH = path.join(OUTPUT_DIR, 'email-combined.html');

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

  if (!fs.existsSync(COMBINED_HTML_PATH)) {
    console.error(`Combined email not found at ${COMBINED_HTML_PATH}. Run generate:emails first.`);
    process.exit(1);
  }

  const html = fs.readFileSync(COMBINED_HTML_PATH, 'utf8');
  const subject = 'Sky Sports weekly schedule – All sports';

  const info = await transporter.sendMail({
    from: cfg.from,
    to: cfg.to,
    subject,
    html
  });

  console.log(`📧 Sent combined sports schedule email: ${info.messageId}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Error sending emails:', err);
    process.exit(1);
  });
}

