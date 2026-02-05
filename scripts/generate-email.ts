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

// Public URLs for per-sport icons.
const ICON_BASE_URL =
  'https://raw.githubusercontent.com/DJazzTest/sports-calendar/main/assets';

const SPORT_ICON: Partial<Record<SportKey, string>> = {
  football: `${ICON_BASE_URL}/football.png`,
  rugby_union: `${ICON_BASE_URL}/rugby.png`,
  rugby_league: `${ICON_BASE_URL}/rugby.png`,
  cricket: `${ICON_BASE_URL}/cricket.png`,
  darts: `${ICON_BASE_URL}/darts.png`,
  tennis: `${ICON_BASE_URL}/tennis.png`,
  golf: `${ICON_BASE_URL}/golf.png`
};

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

  // Demote women's / youth / junior fixtures even if they match a high-priority team.
  if (/(women|woman|ladies|u21|under-21|under 21|junior)/i.test(text)) {
    return false;
  }

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
  const iconUrl = SPORT_ICON[sportKey] || '';

  const rows: string[] = [];
  for (const [date, dayEvents] of Object.entries(grouped).sort(([a], [b]) =>
    compareDateLabels(a, b)
  )) {
    rows.push(
      `<tr>
        <th colspan="5" style="
          text-align:left;
          padding:10px 12px;
          background-color:#4b5563;
          color:#42f59e;
          font-size:13px;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:0.04em;
          border:1px solid #e5e7eb;
          border-bottom:1px solid #9ca3af;
        ">
          ${date}
        </th>
      </tr>`
    );
    for (const ev of dayEvents) {
      const high = isHighPriority(sportKey, ev);
      const priorityCell = high
        ? `<td style="
              padding:8px 10px;
              background-color:#dc2626;
              color:#ffffff;
              font-weight:700;
              font-size:12px;
              text-align:center;
              white-space:nowrap;
              border:1px solid #e5e7eb;
            ">HIGH</td>`
        : `<td style="padding:8px 10px; font-size:12px; color:#6b7280; border:1px solid #e5e7eb; background:#ffffff;"></td>`;
      rows.push(
        `<tr style="background:#ffffff;">
          ${priorityCell}
          <td style="padding:8px 10px; white-space:nowrap; font-weight:600; color:#1f2937; font-size:13px; border:1px solid #e5e7eb;">
            ${ev.time || ''}
          </td>
          <td style="padding:8px 10px; font-size:13px; color:${
            high ? '#b91c1c' : '#374151'
          }; border:1px solid #e5e7eb;">
            ${
              iconUrl
                ? `<img src="${iconUrl}" alt="" style="height:16px; width:16px; vertical-align:middle; margin-right:6px;" />`
                : ''
            }${ev.competition || ''}
          </td>
          <td style="padding:8px 10px; font-size:13px; color:#111827; font-weight:500; border:1px solid #e5e7eb;">
            ${ev.eventName || ''}
          </td>
          <td style="padding:8px 10px; font-size:12px; color:#374151; border:1px solid #e5e7eb;">
            ${ev.channel || ''}
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
<body style="margin:0; padding:24px 12px; background:#f3f4f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="
    max-width:900px;
    margin:0 auto;
    background:#ffffff;
    border-radius:8px;
    padding:24px 24px 28px;
    box-shadow:0 1px 3px rgba(0,0,0,0.1);
    border:1px solid #e5e7eb;
  ">
    <div style="display:flex; align-items:center; margin-bottom:8px;">
      <h1 style="margin:0; font-size:22px; font-weight:800; color:#1f2937; letter-spacing:0.02em;">
        ${sportLabel}
      </h1>
      ${
        iconUrl
          ? `<img src="${iconUrl}" alt="" style="height:24px; margin-left:8px; margin-right:2px;" />`
          : ''
      }
      <img src="${LOGO_URL}" alt="PlanetSport" style="height:26px; margin-left:8px;" />
      <span style="margin-left:6px; font-size:18px; font-weight:700; color:#1f2937;">Sports Schedule</span>
    </div>
    <p style="margin:0 0 16px; font-size:14px; color:#6b7280;">
      Upcoming events for the next 7 days.
    </p>
    <table cellspacing="0" cellpadding="0" border="0" style="
      border-collapse:collapse;
      width:100%;
      border:1px solid #e5e7eb;
      border-radius:6px;
      overflow:hidden;
    ">
      <thead>
        <tr>
          <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Priority</th>
          <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Time</th>
          <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Competition</th>
          <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Event</th>
          <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Channel</th>
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
  const iconUrl = SPORT_ICON[sportKey] || '';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:24px 12px; background:#f3f4f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="
    max-width:900px;
    margin:0 auto;
    background:#ffffff;
    border-radius:8px;
    padding:24px 24px 28px;
    box-shadow:0 1px 3px rgba(0,0,0,0.1);
    border:1px solid #e5e7eb;
  ">
    <div style="display:flex; align-items:center; margin-bottom:8px;">
      <h1 style="margin:0; font-size:22px; font-weight:800; color:#1f2937; letter-spacing:0.02em;">
        ${sportLabel}
      </h1>
      ${
        iconUrl
          ? `<img src="${iconUrl}" alt="" style="height:24px; margin-left:8px; margin-right:2px;" />`
          : ''
      }
      <img src="${LOGO_URL}" alt="PlanetSport" style="height:26px; margin-left:8px;" />
      <span style="margin-left:6px; font-size:18px; font-weight:700; color:#1f2937;">Sports Schedule</span>
    </div>
    <p style="margin:0; font-size:14px; color:#6b7280;">
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

