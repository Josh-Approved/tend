/** Styles for PersonDetailScreen — split out to keep the screen under the size ceiling. */

import { StyleSheet } from 'react-native';
import { fontFamily, space, target, type as ty, hairline, radius, boundedContent, type Colors } from '../theme';

export function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    pressed: { opacity: 0.6 },
    // Generous bottom padding so the last fields clear the keyboard on both OSes
    // (and so the floating Save button never sits over the final input).
    content: { ...boundedContent, paddingHorizontal: space.s5, paddingBottom: 120 },
    nameInput: { ...ty.md, fontFamily: fontFamily.sansSemibold, color: c.fg, paddingVertical: space.s4 },
    // The action group ("log a catch-up") — a subtle card that separates the one
    // thing you DO here from the information about the person below it.
    actionCard: {
      backgroundColor: c.bgSubtle,
      borderRadius: radius.md,
      padding: space.s4,
      marginTop: space.s2,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginTop: space.s2 },
    chip: {
      paddingHorizontal: space.s4,
      paddingVertical: space.s2,
      borderRadius: radius.pill,
      backgroundColor: c.bgSubtle,
      borderWidth: hairline,
      borderColor: c.hairline,
    },
    chipOn: { backgroundColor: c.fg, borderColor: c.fg },
    chipText: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fg },
    chipTextOn: { color: c.bg, fontFamily: fontFamily.sansSemibold },
    input: {
      minHeight: target.min,
      paddingHorizontal: space.s4,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fg,
    },
    logNote: {
      marginTop: space.s3,
      minHeight: target.min * 1.6,
      paddingTop: space.s3,
      paddingBottom: space.s3,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.s2,
      minHeight: target.min,
      borderRadius: radius.md,
      backgroundColor: c.inkButton,
      paddingHorizontal: space.s5,
      marginTop: space.s3,
    },
    primaryBtnText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.inkButtonText },
    status: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted, paddingTop: space.s3, textAlign: 'center' },
    sectionLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingTop: space.s7,
      paddingBottom: space.s3,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: space.s3,
      paddingVertical: space.s2,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    // Quieter than sectionLabel — it lives INSIDE the action card, so no big
    // top gap and no uppercase shout competing with the card's own header.
    historyLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingTop: space.s5,
      paddingBottom: space.s2,
    },
    historyDate: { ...ty.sm, fontFamily: fontFamily.sansSemibold, color: c.fgMuted, width: 56 },
    historyText: { ...ty.sm, flex: 1, fontFamily: fontFamily.sans, color: c.fg },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s3,
      minHeight: target.min,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    listRowText: { ...ty.base, flex: 1, fontFamily: fontFamily.sans, color: c.fg },
    convBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s2,
      minHeight: target.min,
      paddingHorizontal: space.s4,
      marginTop: space.s3,
      borderRadius: radius.md,
      borderWidth: hairline,
      borderColor: c.hairlineStrong,
    },
    convBtnText: { ...ty.base, fontFamily: fontFamily.sans, color: c.fg },
    deleteRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s8, paddingVertical: space.s3 },
    deleteText: { ...ty.base, fontFamily: fontFamily.sans, color: c.fgMuted },
    // Floating Save (new-person mode only) — ink-button pill, bottom-right, same
    // visual language as PeopleScreen's fab but labeled.
    saveFab: {
      position: 'absolute',
      right: space.s6,
      bottom: space.s7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s2,
      height: 52,
      paddingHorizontal: space.s6,
      borderRadius: radius.pill,
      backgroundColor: c.inkButton,
    },
    saveFabText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.inkButtonText },
    saveFabDisabled: { opacity: 0.4 },
    fabPressed: { opacity: 0.85 },
  });
}
