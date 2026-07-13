const MONTHS: Record<string, number> = {
  janv: 0,
  janvier: 0,
  fevr: 1,
  fevrier: 1,
  'fevr.': 1,
  'fevrier.': 1,
  mars: 2,
  avr: 3,
  avril: 3,
  mai: 4,
  juin: 5,
  juil: 6,
  juillet: 6,
  aout: 7,
  sept: 8,
  septembre: 8,
  oct: 9,
  octobre: 9,
  nov: 10,
  novembre: 10,
  dec: 11,
  decembre: 11,
};

export function parseEventDateToDate(value: string): Date | null {
  const normalized = value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
  const match = normalized.match(/^(\d{1,2})\s+([a-z.]+)\s+(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = MONTHS[match[2]] ?? MONTHS[match[2].replace(/\.+$/g, '')];
  const year = Number(match[3]);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }

  return new Date(year, month, day, 18, 0, 0);
}
