import fs from 'fs';
import path from 'path';
import { RawEvent, SportKey, SportEvents } from '../src/models/Event';

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');
const RAW_EVENTS_PATH = path.join(OUTPUT_DIR, 'rawEvents.json');

const SPORT_LABELS: Record<SportKey, string> = {
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

function loadRawEvents(): RawEvent[] {
  if (!fs.existsSync(RAW_EVENTS_PATH)) {
    throw new Error(`rawEvents.json not found at ${RAW_EVENTS_PATH}. Run npm run extract first.`);
  }
  const data = JSON.parse(fs.readFileSync(RAW_EVENTS_PATH, 'utf8')) as RawEvent[];
  return data;
}

function splitBySport(events: RawEvent[]): SportEvents[] {
  const buckets: Record<SportKey, RawEvent[]> = {
    football: [],
    cricket: [],
    f1: [],
    golf: [],
    rugby_union: [],
    rugby_league: [],
    racing: [],
    tennis: [],
    boxing: [],
    nfl: [],
    darts: [],
    basketball: [],
    netball: [],
    other_sports: []
  };

  for (const ev of events) {
    const key: SportKey = ev.sportKey ?? 'other_sports';
    if (!buckets[key]) {
      buckets.other_sports.push(ev);
    } else {
      buckets[key].push(ev);
    }
  }

  const result: SportEvents[] = [];
  for (const [key, list] of Object.entries(buckets) as [SportKey, RawEvent[]][]) {
    if (!list.length) continue;
    result.push({
      sportKey: key,
      sportDisplayName: SPORT_LABELS[key],
      events: list
    });
  }
  return result;
}

function main() {
  const events = loadRawEvents();
  const sports = splitBySport(events);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const s of sports) {
    const fileName =
      s.sportKey === 'other_sports' ? 'other_sports.json' : `${s.sportKey}.json`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(s.events, null, 2), 'utf8');
    console.log(`✅ Wrote ${s.events.length} events to ${filePath}`);
  }
}

if (require.main === module) {
  main();
}

