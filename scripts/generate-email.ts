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
      `<tr><th colspan="5" style="background:#f0f0f0;text-align:left;padding:8px;">${date}</th></tr>`
    );
    for (const ev of dayEvents) {
      const high = isHighPriority(sportKey, ev);
      const priorityCell = high
        ? `<td style="padding:4px 8px; background:#c62828; color:#fff; font-weight:bold;">HIGH</td>`
        : `<td style="padding:4px 8px;"></td>`;
      rows.push(
        `<tr>
          ${priorityCell}
          <td style="padding:4px 8px; white-space:nowrap;">${ev.time || ''}</td>
          <td style="padding:4px 8px;">${ev.competition || ''}</td>
          <td style="padding:4px 8px;">${ev.eventName || ''}</td>
          <td style="padding:4px 8px;">${ev.channel || ''}</td>
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
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <h1>
    ${sportLabel}
    <img src="${LOGO_URL}" alt="PlanetSport" style="height:24px; vertical-align:middle; margin:0 6px;" />
    Sports Schedule
  </h1>
  <p>Upcoming events for the next 7 days.</p>
  <table cellspacing="0" cellpadding="0" border="1" style="border-collapse:collapse; width:100%; max-width:900px;">
    <thead>
      <tr style="background:#222;color:#fff;">
        <th style="padding:6px 8px;">Priority</th>
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
function buildNoEventsHtml(sportKey: SportKey): string {
  const sportLabel = SPORT_DISPLAY[sportKey];
  const title = `${sportLabel} Sports Schedule`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <h1>
    ${sportLabel}
    <img src="${LOGO_URL}" alt="PlanetSport" style="height:24px; vertical-align:middle; margin:0 6px;" />
    Sports Schedule
  </h1>
  <p>No scheduled ${sportLabel} events currently.</p>
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

