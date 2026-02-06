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

// Order for combined email: list view then expand to see schedule.
const COMBINED_SPORT_ORDER: SportKey[] = [
  'football',
  'cricket',
  'f1',
  'rugby_union',
  'rugby_league',
  'golf',
  'tennis',
  'racing',
  'darts',
  'boxing',
  'nfl',
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

type SkyChannelMeta = {
  name: string;
  url: string;
  logo?: string;
};

// Known Sky Sports channels and their watch URLs.
// Order from most specific to most generic so we get the right logo.
const SKY_CHANNELS: SkyChannelMeta[] = [
  {
    name: 'Sky Sports Main Event',
    url: 'https://www.skysports.com/watch/sky-sports-main-event',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=7023540979985581117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports Premier League',
    url: 'https://www.skysports.com/watch/sky-sports-premier-league'
  },
  {
    name: 'Sky Sports Football',
    url: 'https://www.skysports.com/watch/sky-sports-football',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=6419044864297754117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports Cricket',
    url: 'https://www.skysports.com/watch/sky-sports-cricket',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=8800573917753836117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports Golf',
    url: 'https://www.skysports.com/watch/sky-sports-golf',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=8844525863258642117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports F1',
    url: 'https://www.skysports.com/watch/sky-sports-f1',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=5158758531313507117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports Tennis',
    url: 'https://www.skysports.com/watch/sky-sports-tennis',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=4896228439428403117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports NFL',
    url: 'https://www.skysports.com/watch/sky-sports-nfl',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=8719200523741613117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports News',
    url: 'https://www.skysports.com/watch/sky-sports-news'
  },
  {
    name: 'Sky Sports+',
    url: 'https://www.skysports.com/watch/sky-sports-plus',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=6858995960279493117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports Racing',
    url: 'https://www.skysports.com/watch/sky-sports-racing',
    // From the snippet you provided (Stations - light).
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=6627732418081674117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports Mix',
    url: 'https://www.skysports.com/watch/sky-sports-mix',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=8350774144114096117&width=600&height=100&rule=Stations%20-%20light'
  },
  {
    name: 'Sky Sports',
    url: 'https://www.skysports.com/watch',
    logo:
      'https://img001-eu-mo-prd.delivery.skycdp.com/select/logo?entityId=6814741578518519117&width=600&height=100&rule=Stations%20-%20light'
  }
];

// Public URL for the PlanetSport logo.
// Make sure the file exists at assets/PlanetSport.png in this repo.
const LOGO_URL =
  'https://raw.githubusercontent.com/DJazzTest/sports-calendar/main/assets/PlanetSport.png';

// Public URLs for per-sport icons (GitHub assets + wheresthematch.com for missing sports).
const ICON_BASE_URL =
  'https://raw.githubusercontent.com/DJazzTest/sports-calendar/main/assets';
const WTM_ICONS = 'https://www.wheresthematch.com/images/sports';

const SPORT_ICON: Partial<Record<SportKey, string>> = {
  football: `${ICON_BASE_URL}/football.png`,
  rugby_union: `${ICON_BASE_URL}/rugby.png`,
  rugby_league: `${ICON_BASE_URL}/rugby.png`,
  cricket: `${ICON_BASE_URL}/cricket.png`,
  darts: `${ICON_BASE_URL}/darts.png`,
  tennis: `${ICON_BASE_URL}/tennis.png`,
  golf: `${ICON_BASE_URL}/golf.png`,
  f1: `${WTM_ICONS}/f1.gif`,
  racing: `${WTM_ICONS}/horseracing.gif`,
  boxing: `${WTM_ICONS}/boxing.gif`,
  nfl: `${WTM_ICONS}/americanfootball.gif`,
  basketball: `${WTM_ICONS}/basketball.gif`,
  netball: `${WTM_ICONS}/basketball.gif`,
  other_sports: 'https://www.wheresthematch.com/images/nav4-more-sports-on-tv-off.png'
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

function isEventInUpcomingWindow(
  dateLabel: string,
  totalDays: number,
  startFromTomorrow: boolean
): boolean {
  const parsed = parseDateLabel(dateLabel);
  if (!parsed) return false;

  const now = new Date();
  const year = now.getFullYear();

  const eventDate = new Date(year, parsed.monthIndex, parsed.day);
  const today = new Date(year, now.getMonth(), now.getDate());

  const start = new Date(today);
  if (startFromTomorrow) {
    start.setDate(start.getDate() + 1);
  }

  const end = new Date(start);
  end.setDate(start.getDate() + (totalDays - 1));

  return eventDate >= start && eventDate <= end;
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

function resolveSkyChannel(channelText: string | undefined): SkyChannelMeta | null {
  if (!channelText) return null;
  const lower = channelText.toLowerCase();
  const found = SKY_CHANNELS.find((c) => lower.includes(c.name.toLowerCase()));
  return found || null;
}

/** Builds only the table HTML (thead + tbody) for a sport; used by single-sport and combined email. */
function buildSportTableHtml(sportKey: SportKey, filtered: RawEvent[]): string {
  const grouped = groupByDate(filtered);
  const iconUrl = SPORT_ICON[sportKey] || '';
  const rows: string[] = [];
  for (const [date, dayEvents] of Object.entries(grouped).sort(([a], [b]) =>
    compareDateLabels(a, b)
  )) {
    // Date row
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

    // Per-date column labels row
    rows.push(
      `<tr>
        <th style="padding:6px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#4b5563; background-color:#e5e7eb; border:1px solid #e5e7eb;">Channel</th>
        <th style="padding:6px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#4b5563; background-color:#e5e7eb; border:1px solid #e5e7eb;">Competition</th>
        <th style="padding:6px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#4b5563; background-color:#e5e7eb; border:1px solid #e5e7eb;">Event</th>
        <th style="padding:6px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#4b5563; background-color:#e5e7eb; border:1px solid #e5e7eb;">Time</th>
        <th style="padding:6px 10px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#4b5563; background-color:#e5e7eb; border:1px solid #e5e7eb;">Priority</th>
      </tr>`
    );
    for (const ev of dayEvents) {
      const high = isHighPriority(sportKey, ev);
      const priorityCell = high
        ? `<td style="
              padding:8px 10px;
              background-color:#b91c1c;
              color:#ffffff;
              font-weight:800;
              font-size:12px;
              text-align:center;
              white-space:nowrap;
              border:2px solid #7f1d1d;
              text-transform:uppercase;
            ">HIGH!</td>`
        : `<td style="
              padding:8px 10px;
              font-size:12px;
              color:#327da8;
              font-weight:600;
              text-align:center;
              white-space:nowrap;
              border:1px solid #e5e7eb;
              background:#ffffff;
            ">Standard</td>`;

      const timeCell = `<td style="padding:8px 10px; white-space:nowrap; font-weight:600; color:#327da8; font-size:13px; border:1px solid #e5e7eb;">
            ${ev.time || 'Scheduled'}
          </td>`;

      const competitionCell = `<td style="padding:8px 10px; font-size:13px; color:${
        high ? '#b91c1c' : '#327da8'
      }; border:1px solid #e5e7eb;">
            ${
              iconUrl
                ? `<img src="${iconUrl}" alt="" style="height:16px; width:16px; vertical-align:middle; margin-right:6px;" />`
                : ''
            }${ev.competition || ''}
          </td>`;

      const eventCell = `<td style="padding:8px 10px; font-size:13px; color:#111827; font-weight:500; border:1px solid #e5e7eb;">
            ${ev.eventName || ''}
          </td>`;

      const channelCell = `<td style="padding:8px 10px; font-size:12px; color:#327da8; border:1px solid #e5e7eb;">
            ${
              ev.channel
                ? (() => {
                    const meta = resolveSkyChannel(ev.channel);
                    if (!meta) {
                      return ev.channel;
                    }
                    const logoPart = meta.logo
                      ? `<img src="${meta.logo}" alt="${meta.name}" style="height:14px; vertical-align:middle; margin-right:4px;" />`
                      : '';
                    return `${logoPart}${ev.channel}`;
                  })()
                : ''
            }
          </td>`;

      rows.push(
        `<tr style="background:#ffffff;">
          ${channelCell}
          ${competitionCell}
          ${eventCell}
          ${timeCell}
          ${priorityCell}
        </tr>`
      );
    }
  }

  return `<table cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; width:100%; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden;">
  <thead>
    <tr>
      <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Channel</th>
      <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Competition</th>
      <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Event</th>
      <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Time</th>
      <th style="padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; text-align:left; color:#ffffff; background-color:#1f2937; font-weight:700; border:1px solid #374151;">Priority</th>
    </tr>
  </thead>
  <tbody>
    ${rows.join('\n')}
  </tbody>
</table>`;
}

function buildHtmlTable(sportKey: SportKey, events: RawEvent[]): string {
  const filtered = events.filter((ev) =>
    isEventInUpcomingWindow(ev.date, 7, true)
  );
  if (!filtered.length) {
    return buildNoEventsHtml(sportKey);
  }
  const sportLabel = SPORT_DISPLAY[sportKey];
  const iconUrl = SPORT_ICON[sportKey] || '';
  const title = `${sportLabel} Sports Schedule`;
  const tableHtml = buildSportTableHtml(sportKey, filtered);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:24px 12px; background:#f3f4f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width:900px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px 24px 28px; box-shadow:0 1px 3px rgba(0,0,0,0.1); border:1px solid #e5e7eb;">
    <div style="display:flex; align-items:center; margin-bottom:8px;">
      <h1 style="margin:0; font-size:22px; font-weight:800; color:#1f2937; letter-spacing:0.02em;">${sportLabel}</h1>
      ${iconUrl ? `<img src="${iconUrl}" alt="" style="height:24px; margin-left:8px; margin-right:2px;" />` : ''}
      <img src="${LOGO_URL}" alt="PlanetSport" style="height:26px; margin-left:8px;" />
      <span style="margin-left:6px; font-size:18px; font-weight:700; color:#1f2937;">Sports Schedule</span>
    </div>
    <p style="margin:0 0 16px; font-size:14px; color:#6b7280;">Upcoming events for the next 7 days.</p>
    ${tableHtml}
  </div>
</body>
</html>`;
}
function buildCombinedEmailHtml(): string {
  const sections: string[] = [];
  for (const key of COMBINED_SPORT_ORDER) {
    const sportLabel = SPORT_DISPLAY[key];
    const iconUrl = SPORT_ICON[key] || '';
    const fileName = key === 'other_sports' ? 'other_sports.json' : `${key}.json`;
    const jsonPath = path.join(OUTPUT_DIR, fileName);
    let events: RawEvent[] = [];
    if (fs.existsSync(jsonPath)) {
      events = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as RawEvent[];
    }
    const filtered = events.filter((ev) =>
      isEventInUpcomingWindow(ev.date, 7, true)
    );
    // Build a short preview of the first couple of fixtures for this sport.
    const previewEvents = filtered.slice(0, 2);
    const previewParts = previewEvents
      .map((ev) => ev.eventName || ev.competition || '')
      .filter(Boolean);
    let previewText = '';
    if (previewParts.length) {
      previewText = previewParts.join(' | ');
      if (filtered.length > previewParts.length) {
        previewText += ` +${filtered.length - previewParts.length} more`;
      }
    }
    const previewHtml = previewText
      ? `<span style="margin-left:8px; font-size:12px; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:420px; display:inline-block; vertical-align:middle;">${previewText}</span>`
      : '';
    const summaryContent = iconUrl
      ? `<img src="${iconUrl}" alt="" style="height:18px; vertical-align:middle; margin-right:6px;" /><span style="font-weight:600; color:#1f2937;">${sportLabel}</span>${previewHtml}`
      : `<span style="font-weight:600; color:#1f2937;">${sportLabel}</span>${previewHtml}`;
    if (filtered.length > 0) {
      const tableHtml = buildSportTableHtml(key, filtered);
      sections.push(
        `<details style="margin-bottom:12px; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden; background:#ffffff;">
          <summary style="padding:12px 16px; cursor:pointer; list-style:none; display:flex; align-items:center; background:#f9fafb; font-size:15px; user-select:none;">
            <span style="margin-right:8px; color:#6b7280;">▶</span>
            ${summaryContent}
          </summary>
          <div style="padding:0 12px 12px;">
            ${tableHtml}
          </div>
        </details>`
      );
    } else {
      sections.push(
        `<details style="margin-bottom:12px; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden; background:#ffffff;">
          <summary style="padding:12px 16px; cursor:pointer; list-style:none; display:flex; align-items:center; background:#f9fafb; font-size:15px; user-select:none;">
            <span style="margin-right:8px; color:#6b7280;">▶</span>
            ${summaryContent}
          </summary>
          <p style="margin:12px 16px; font-size:14px; color:#059669;">✅ ${sportLabel} – No Schedule ✅</p>
        </details>`
      );
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Sky Sports Weekly Schedule – All sports</title>
</head>
<body style="margin:0; padding:24px 12px; background:#f3f4f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width:900px; margin:0 auto; background:#ffffff; border-radius:8px; padding:24px 24px 28px; box-shadow:0 1px 3px rgba(0,0,0,0.1); border:1px solid #e5e7eb;">
    <div style="display:flex; align-items:center; margin-bottom:8px;">
      <img src="${LOGO_URL}" alt="PlanetSport" style="height:28px; margin-right:10px;" />
      <span style="font-size:22px; font-weight:800; color:#1f2937;">Sports Schedule</span>
    </div>
    <p style="margin:0 0 20px; font-size:14px; color:#6b7280;">
      Upcoming events for the next 7 days. Expand a sport to see its schedule.
    </p>
    ${sections.join('\n')}
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

  const combinedHtml = buildCombinedEmailHtml();
  const combinedPath = path.join(OUTPUT_DIR, 'email-combined.html');
  fs.writeFileSync(combinedPath, combinedHtml, 'utf8');
  console.log(`✅ Wrote combined email HTML to ${combinedPath}`);
}

if (require.main === module) {
  main();
}

