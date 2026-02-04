export type SportKey =
  | 'football'
  | 'cricket'
  | 'f1'
  | 'golf'
  | 'rugby_union'
  | 'rugby_league'
  | 'racing'
  | 'tennis'
  | 'boxing'
  | 'nfl'
  | 'darts'
  | 'basketball'
  | 'netball'
  | 'other_sports';

export interface RawEvent {
  sport: string;
  sportKey: SportKey;
  date: string;
  time: string;
  competition: string;
  eventName: string;
  channel: string;
}

export interface SportEvents {
  sportKey: SportKey;
  sportDisplayName: string;
  events: RawEvent[];
}

