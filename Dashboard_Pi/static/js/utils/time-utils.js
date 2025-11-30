// Utility for formatting timestamps into human friendly relative strings
class TimeUtils {
  static formatRelativeTime(input) {
    let ms;
    if (typeof input === 'number') ms = input;
    else if (input instanceof Date) ms = input.getTime();
    else if (typeof input === 'string') ms = new Date(input).getTime();
    else ms = NaN;

    if (!ms || Number.isNaN(ms)) return 'unknown';

    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 0) return 'in the future';
    if (s < 1) return 'now';
    if (s === 1) return 'one second ago';
    if (s < 60) return `${s} seconds ago`;
    const m = Math.floor(s / 60);
    if (m === 1) return 'one minute ago';
    if (m < 60) return `${m} minutes ago`;
    const h = Math.floor(m / 60);
    if (h === 1) return 'one hour ago';
    if (h < 24) return `${h} hours ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'one day ago';
    return `${d} days ago`;
  }
}

window.TimeUtils = TimeUtils;
