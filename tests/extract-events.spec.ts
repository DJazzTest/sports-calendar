import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { RawEvent, SportKey } from '../src/models/Event';

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');
const RAW_EVENTS_PATH = path.join(OUTPUT_DIR, 'rawEvents.json');

function normaliseSportNameToKey(sport: string): SportKey {
  const s = sport.trim().toLowerCase();
  if (s.includes('football') || s.includes('soccer')) return 'football';
  if (s.includes('cricket')) return 'cricket';
  if (s.includes('formula') || s === 'f1' || s.includes('f1')) return 'f1';
  if (s.includes('golf')) return 'golf';
  if (s.includes('rugby league')) return 'rugby_league';
  if (s.includes('rugby union') || (s.includes('rugby') && !s.includes('league'))) return 'rugby_union';
  if (s.includes('racing') || s.includes('race')) return 'racing';
  if (s.includes('tennis')) return 'tennis';
  if (s.includes('boxing')) return 'boxing';
  if (s === 'nfl' || s.includes('nfl') || s.includes('american football')) return 'nfl';
  if (s.includes('darts')) return 'darts';
  if (s.includes('basketball')) return 'basketball';
  if (s.includes('netball')) return 'netball';
  return 'other_sports';
}

test('extract Sky Sports weekly schedule into rawEvents.json', async ({ page }) => {
  await page.goto('https://www.skysports.com/watch/sport-on-sky', {
    waitUntil: 'domcontentloaded'
  });

  // Handle SP Consent iframe cookie banner
  try {
    const consentButton = page
      .frameLocator('iframe[title="SP Consent Message"]')
      .getByRole('button', { name: /accept all/i });
    if (await consentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await consentButton.click().catch(() => {});
      await page.waitForTimeout(1500);
    }
  } catch {
    // If the iframe or button isn't present, just continue
  }

  const allSportsTab = page.getByRole('tab', { name: /all sports/i });
  if (await allSportsTab.isVisible().catch(() => false)) {
    await allSportsTab.click();
  }

  const maxScrolls = 30;
  let lastHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let i = 0; i < maxScrolls; i++) {
    const dayCount = await page.locator('h3.text-h4.-rs-style20').count();
    if (dayCount >= 7) break;
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1500);
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
  }

  const rawEvents: Omit<RawEvent, 'sportKey'>[] = await page.evaluate(() => {
    type BrowserEvent = {
      sport: string;
      date: string;
      time: string;
      competition: string;
      eventName: string;
      channel: string;
    };

    const isDateHeading = (txt: string): boolean => {
      // e.g. "Wed 4th February"
      return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i.test(txt);
    };

    const results: BrowserEvent[] = [];

    const findDateFor = (start: HTMLElement): string => {
      let el: HTMLElement | null = start;
      while (el) {
        // Look backwards through siblings at this level
        let sib: HTMLElement | null = el.previousElementSibling as HTMLElement | null;
        while (sib) {
          if (sib.tagName === 'H3') {
            const txt = (sib.textContent || '').replace(/\s+/g, ' ').trim();
            if (isDateHeading(txt)) {
              return txt;
            }
          }
          sib = sib.previousElementSibling as HTMLElement | null;
        }
        el = el.parentElement as HTMLElement | null;
      }
      return '';
    };

    const groups = Array.from(document.querySelectorAll<HTMLElement>('div.event-group'));

    for (const group of groups) {
      // Sport: nearest previous H3 heading
      let sportHeading: HTMLElement | null = group.previousElementSibling as HTMLElement | null;
      while (sportHeading && sportHeading.tagName !== 'H3') {
        sportHeading = sportHeading.previousElementSibling as HTMLElement | null;
      }
      const sport = (sportHeading?.textContent || '').replace(/\s+/g, ' ').trim() || 'Unknown';

      const dateLabel = findDateFor(group);

      const list = group.querySelector<HTMLUListElement>('ul.row-table.event');
      const para = group.querySelector<HTMLParagraphElement>('p.event-detail');
      if (!list || !para) continue;

      const paraText = (para.textContent || '').replace(/\s+/g, ' ').trim();
      if (!paraText) continue;

      const strongs = Array.from(list.querySelectorAll('strong')).map((s) =>
        (s.textContent || '').replace(/\s+/g, ' ').trim()
      );

      let eventName = '';
      if (strongs.length >= 2) {
        eventName = `${strongs[0]} vs ${strongs[strongs.length - 1]}`;
      } else if (strongs.length === 1) {
        eventName = strongs[0];
      }

      let time = '';
      const liWithTime = Array.from(list.querySelectorAll('li')).find((li) =>
        /\d{1,2}:\d{2}/.test((li.textContent || '').trim())
      );
      if (liWithTime) {
        const m = (liWithTime.textContent || '').match(/(\d{1,2}:\d{2})/);
        if (m) time = m[1];
      }

      let competition = '';
      let channel = '';
      const parts = paraText.split(',');
      if (parts.length > 1) {
        competition = parts[0].trim();
        channel = parts.slice(1).join(',').trim();
      } else {
        competition = paraText;
      }

      results.push({
        sport,
        date: dateLabel,
        time,
        competition,
        eventName,
        channel
      });
    }

    return results;
  });

  const enriched: RawEvent[] = rawEvents.map((e) => ({
    ...e,
    sportKey: normaliseSportNameToKey(e.sport)
  }));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(RAW_EVENTS_PATH, JSON.stringify(enriched, null, 2), 'utf8');
  console.log(`✅ Wrote ${enriched.length} events to ${RAW_EVENTS_PATH}`);

  expect(enriched.length).toBeGreaterThan(0);
});

