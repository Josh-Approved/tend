/**
 * Per-app brand accent — the ONE additional color this app declares
 * (file-type tags, progress fills, the app-icon glyph). In-app only:
 * never a primary CTA, never replaces approval green, never on marketing
 * surfaces. See josh-approved-design-system § Color.
 *
 * This file is APP-OWNED. `sync.mjs design-system-native` creates it once —
 * migrating the accent out of a pre-existing colors.ts if it finds one —
 * and never overwrites it again. Edit the hex here; colors.ts derives the
 * light and dark background washes from it, so one declaration is enough.
 */

// Warm dusty rose — tender, intimate, unmistakably warm (a soft clay undertone,
// hue ~5° vs the slightly cool mauve ~354° it replaced), while staying muted and
// reading as rose, not terracotta. In-app accent only; coexists with approval
// green. A touch deeper than the old rose, which also lifts the urgency-text
// contrast on paper. Finalized 2026-06-27.
export const APP_ACCENT = '#B5645C';
