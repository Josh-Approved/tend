/**
 * The app's real public launch date — the day the store listing went live, not
 * the build date and not the submission date. App-owned; it ships in the binary
 * (no server, no remote config).
 *
 * It drives the canonical launch-notice card: the first three sessions inside a
 * 60-day window from this date open with the "This app just launched" card, so
 * an early rough edge gets reported instead of becoming a permanent one-star.
 * A malformed date fails closed, so a typo can never pin the card on forever.
 *
 * See josh-approved-factory/templates/launch-notice/README.md.
 */
export const LAUNCHED_AT = '2026-08-09';
