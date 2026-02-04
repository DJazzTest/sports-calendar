import fs from 'fs';
import path from 'path';
import { RawEvent, SportKey } from '../src/models/Event';

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');

const SPORT_FILE_KEYS: SportKey[] = [
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

const SPORT_DISPLAY: Record<SportKey, string> = {
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

function groupByDate(events: RawEvent[]): Record<string, RawEvent[]> {
  return events.reduce<Record<string, RawEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});
}

function buildHtmlTable(sportKey: SportKey, events: RawEvent[]): string {
  const grouped = groupByDate(events);

  const rows: string[] = [];
  for (const [date, dayEvents] of Object.entries(grouped).sort()) {
    rows.push(
      `<tr><th colspan="4" style="background:#f0f0f0;text-align:left;padding:8px;">${date}</th></tr>`
    );
    for (const ev of dayEvents) {
      rows.push(
        `<tr>
          <td style="padding:4px 8px; white-space:nowrap;">${ev.time || ''}</td>
          <td style="padding:4px 8px;">${ev.competition || ''}</td>
          <td style="padding:4px 8px;">${ev.eventName || ''}</td>
          <td style="padding:4px 8px;">${ev.channel || ''}</td>
        </tr>`
      );
    }
  }

  const title = `${SPORT_DISPLAY[sportKey]} – Sky Sports schedule`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <h1>${title}</h1>
  <p>Upcoming events for the next 7 days.</p>
  <table cellspacing="0" cellpadding="0" border="1" style="border-collapse:collapse; width:100%; max-width:900px;">
    <thead>
      <tr style="background:#222;color:#fff;">
        <th style="padding:6px 8px;">Time</th>
        <th style="padding:6px 8px;">Competition</th>
        <th style="padding:6px 8px;">Event</th>
        <th style="padding:6px 8px;">Channel</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('\n')}
    </tbody>
  </table>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    throw new Error(`Output directory does not exist: ${OUTPUT_DIR}. Run extract & split first.`);
  }

  for (const key of SPORT_FILE_KEYS) {
    const fileName = key === 'other_sports' ? 'other_sports.json' : `${key}.json`;
    const jsonPath = path.join(OUTPUT_DIR, fileName);
    if (!fs.existsSync(jsonPath)) continue;

    const events = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as RawEvent[];
    if (!events.length) continue;

    const html = buildHtmlTable(key, events);
    const htmlPath = path.join(OUTPUT_DIR, `email-${key}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✅ Wrote email HTML for ${key} to ${htmlPath}`);
  }
}

if (require.main === module) {
  main();
}

