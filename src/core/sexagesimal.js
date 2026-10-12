/** Degree/minute/second captions. Values and coordinates remain decimal degrees.
 * Round the total centiseconds first, so carries never produce 60 minutes or
 * 60 seconds. This format is opt-in and does not change other instruments.
 */
export function formatSexagesimal(value) {
    if (!Number.isFinite(value)) return '--';
    const total = Math.round(Math.abs(value) * 360000);
    const degrees = Math.floor(total / 360000);
    const minutes = Math.floor(total / 6000) % 60;
    const seconds = (total % 6000) / 100;
    const sign = value < 0 && total !== 0 ? '\u2212' : '';
    return `${sign}${degrees}\u00b0` + (minutes || seconds ? `${minutes}\u2032` : '') +
        (seconds ? `${seconds}\u2033` : '');
}
