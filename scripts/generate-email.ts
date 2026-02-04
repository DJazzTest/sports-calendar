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

// Public URL for the PlanetSport logo.
// Make sure the file exists at assets/PlanetSport.png in this repo.
const LOGO_URL =
  'https://raw.githubusercontent.com/DJazzTest/sports-calendar/main/assets/PlanetSport.png';

function groupByDate(events: RawEvent[]): Record<string, RawEvent[]> {
  return events.reduce<Record<string, RawEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});
}

function parseDateLabel(label: string): { monthIndex: number; day: number } | null {
  // e.g. "Wed 4th February"
  const match = label.match(/\b(\d{1,2})(st|nd|rd|th)?\s+([A-Za-z]+)/);
  if (!match) return null;
  const day = Number(match[1]);
  const monthName = match[3].toLowerCase();
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december'
  ];
  const monthIndex = months.indexOf(monthName);
  if (monthIndex === -1) return null;
  return { monthIndex, day };
}

function compareDateLabels(a: string, b: string): number {
  const pa = parseDateLabel(a);
  const pb = parseDateLabel(b);
  if (pa && pb) {
    if (pa.monthIndex !== pb.monthIndex) return pa.monthIndex - pb.monthIndex;
    return pa.day - pb.day;
  }
  return a.localeCompare(b);
}

function isHighPriority(sportKey: SportKey, ev: RawEvent): boolean {
  const text = `${ev.eventName} ${ev.competition}`.toLowerCase();

  if (sportKey === 'football') {
    const clubs = [
      'arsenal',
      'aston villa',
      'bournemouth',
      'brentford',
      'brighton & hove albion',
      'brighton and hove albion',
      'burnley',
      'chelsea',
      'crystal palace',
      'everton',
      'fulham',
      'leeds united',
      'liverpool',
      'manchester city',
      'man city',
      'manchester united',
      'man utd',
      'newcastle united',
      'nottingham forest',
      'sunderland',
      'tottenham hotspur',
      'spurs',
      'west ham united',
      'wolverhampton wanderers',
      'wolves'
    ];
    return clubs.some((c) => text.includes(c));
  }

  if (sportKey === 'cricket') {
    const teams = [
      'england',
      'surrey',
      'yorkshire',
      'lancashire',
      'australia',
      'india',
      'pakistan',
      'new zealand',
      'south africa'
    ];
    return teams.some((t) => text.includes(t));
  }

  if (sportKey === 'golf') {
    const events = [
      'the open championship',
      'british open',
      'the masters',
      'masters tournament',
      'ryder cup',
      'pga championship',
      'us open'
    ];
    return events.some((e) => text.includes(e));
  }

  if (sportKey === 'rugby_union') {
    const teams = [
      'england',
      'all blacks',
      'new zealand',
      'springboks',
      'south africa',
      'ireland',
      'france',
      'wales',
      'wallabies',
      'australia',
      'scotland'
    ];
    return teams.some((t) => text.includes(t));
  }

  if (sportKey === 'rugby_league') {
    const teams = [
      'wigan warriors',
      'st helens',
      'leeds rhinos',
      'warrington wolves',
      'hull fc',
      'england',
      'australia',
      'kangaroos',
      'new zealand',
      'kiwis',
      'tonga',
      'samoa'
    ];
    return teams.some((t) => text.includes(t));
  }

  if (sportKey === 'racing') {
    const races = [
      'grand national',
      'cheltenham festival',
      'royal ascot',
      'epsom derby',
      'st leger'
    ];
    return races.some((r) => text.includes(r));
  }

  if (sportKey === 'tennis') {
    const events = [
      'wimbledon',
      'us open',
      'australian open',
      'french open',
      'roland garros',
      'atp finals',
      'wta finals',
      'miami open'
    ];
    return events.some((e) => text.includes(e));
  }

  if (sportKey === 'nfl') {
    const teams = [
      'kansas city chiefs',
      'dallas cowboys',
      'green bay packers',
      'new england patriots',
      'pittsburgh steelers',
      'super bowl'
    ];
    return teams.some((t) => text.includes(t));
  }

  return false;
}

function buildHtmlTable(sportKey: SportKey, events: RawEvent[]): string {
  const grouped = groupByDate(events);

  const rows: string[] = [];
  for (const [date, dayEvents] of Object.entries(grouped).sort(([a], [b]) =>
    compareDateLabels(a, b)
  )) {
    rows.push(
      `<tr>
        <th colspan="5" style="
          text-align:left;
          padding:8px 12px;
          background:linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
          color:#222;
          font-size:13px;
          text-transform:uppercase;
          letter-spacing:0.04em;
        ">
          ${date}
        </th>
      </tr>`
    );
    for (const ev of dayEvents) {
      const high = isHighPriority(sportKey, ev);
      const priorityCell = high
        ? `<td style="
              padding:6px 10px;
              background:linear-gradient(180deg,#ff5252,#d50000);
              color:#fff;
              font-weight:700;
              font-size:12px;
              text-align:center;
              border-radius:6px;
              white-space:nowrap;
            ">HIGH</td>`
        : `<td style="padding:6px 10px; font-size:12px; color:#666;"></td>`;
      rows.push(
        `<tr style="background:rgba(255,255,255,0.9);">
          ${priorityCell}
          <td style="padding:6px 10px; white-space:nowrap; font-weight:600; color:#1b3a8a; font-size:13px;">
            ${ev.time || ''}
          </td>
          <td style="padding:6px 10px; font-size:13px; color:#333;">
            ${ev.competition || ''}
          </td>
          <td style="padding:6px 10px; font-size:13px; color:#111;">
            ${ev.eventName || ''}
          </td>
          <td style="padding:6px 10px; font-size:12px; color:#fff;">
            ${
              ev.channel
                ? `<span style="
                     display:inline-block;
                     padding:4px 10px;
                     border-radius:999px;
                     background:linear-gradient(90deg,#1e40af,#7c3aed);
                     font-weight:600;
                   ">${ev.channel}</span>`
                : ''
            }
          </td>
        </tr>`
      );
    }
  }

  const sportLabel = SPORT_DISPLAY[sportKey];
  const title = `${sportLabel} Sports Schedule`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:24px 12px; background:#020617; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="
    max-width:900px;
    margin:0 auto;
    background:radial-gradient(circle at top left,#1d4ed8,#7c3aed 45%,#020617 85%);
    border-radius:18px;
    padding:20px 20px 24px;
    box-shadow:0 24px 60px rgba(15,23,42,0.7);
    color:#e5e7eb;
  ">
    <div style="display:flex; align-items:center; margin-bottom:12px;">
      <h1 style="margin:0; font-size:22px; font-weight:800; letter-spacing:0.02em;">
        ${sportLabel}
      </h1>
      <img src="${LOGO_URL}" alt="PlanetSport" style="height:26px; margin-left:8px;" />
      <span style="margin-left:6px; font-size:18px; font-weight:700;">Sports Schedule</span>
    </div>
    <p style="margin:0 0 16px; font-size:13px; color:#e5e7eb;">
      Upcoming events for the next 7 days.
    </p>
    <table cellspacing="0" cellpadding="0" border="0" style="
      border-collapse:separate;
      border-spacing:0;
      width:100%;
      background:rgba(15,23,42,0.8);
      border-radius:12px;
      overflow:hidden;
    ">
      <thead>
        <tr>
          <th style="padding:10px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; text-align:left; color:#cbd5f5; border-bottom:1px solid rgba(148,163,184,0.4);">Priority</th>
          <th style="padding:10px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; text-align:left; color:#cbd5f5; border-bottom:1px solid rgba(148,163,184,0.4);">Time</th>
          <th style="padding:10px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; text-align:left; color:#cbd5f5; border-bottom:1px solid rgba(148,163,184,0.4);">Competition</th>
          <th style="padding:10px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; text-align:left; color:#cbd5f5; border-bottom:1px solid rgba(148,163,184,0.4);">Event</th>
          <th style="padding:10px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; text-align:left; color:#cbd5f5; border-bottom:1px solid rgba(148,163,184,0.4);">Channel</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('\n')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}
function buildNoEventsHtml(sportKey: SportKey): string {
  const sportLabel = SPORT_DISPLAY[sportKey];
  const title = `${sportLabel} Sports Schedule`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:24px 12px; background:#020617; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="
    max-width:900px;
    margin:0 auto;
    background:radial-gradient(circle at top left,#1d4ed8,#7c3aed 45%,#020617 85%);
    border-radius:18px;
    padding:20px 20px 24px;
    box-shadow:0 24px 60px rgba(15,23,42,0.7);
    color:#e5e7eb;
  ">
    <div style="display:flex; align-items:center; margin-bottom:12px;">
      <h1 style="margin:0; font-size:22px; font-weight:800; letter-spacing:0.02em;">
        ${sportLabel}
      </h1>
      <img src="${LOGO_URL}" alt="PlanetSport" style="height:26px; margin-left:8px;" />
      <span style="margin-left:6px; font-size:18px; font-weight:700;">Sports Schedule</span>
    </div>
    <p style="margin:0; font-size:14px; color:#e5e7eb;">
      No scheduled ${sportLabel} events currently.
    </p>
  </div>
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
    let html: string;
    if (fs.existsSync(jsonPath)) {
      const events = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as RawEvent[];
      if (events.length) {
        html = buildHtmlTable(key, events);
      } else {
        html = buildNoEventsHtml(key);
      }
    } else {
      // Even if there is no JSON file (no events at all for this sport),
      // still send an email so service teams know there is nothing scheduled.
      html = buildNoEventsHtml(key);
    }

    const htmlPath = path.join(OUTPUT_DIR, `email-${key}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✅ Wrote email HTML for ${key} to ${htmlPath}`);
  }
}

if (require.main === module) {
  main();
}

