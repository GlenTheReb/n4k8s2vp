export const number = (value: number | null | undefined, digits = 0) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-GB", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(value);
export const signed = (value: number | null | undefined) =>
  value == null ? "—" : `${value > 0 ? "+" : ""}${number(value)}`;
export const ukDate = (iso: string, withTime = false) =>
  !iso || Number.isNaN(Date.parse(iso))
    ? "Select a date"
    : new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        day: "2-digit",
        month: "short",
        ...(withTime
          ? { hour: "2-digit", minute: "2-digit" }
          : { year: "numeric" }),
      }).format(new Date(iso));
export const ukTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
export const nextDay = (day: string) =>
  !day || Number.isNaN(Date.parse(day))
    ? ""
    : new Date(new Date(day + "T00:00:00Z").getTime() + 86400000)
        .toISOString()
        .slice(0, 10);
