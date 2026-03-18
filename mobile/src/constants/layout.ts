// ─── Floating tab bar — single source of truth ────────────────────────────────

/** Visual height of the floating tab bar */
export const TAB_BAR_HEIGHT = 64;

/** Gap between the bottom edge of the screen and the tab bar (no safe area) */
export const TAB_BAR_BOTTOM = 24;

/** Left / right margin that creates the floating island gap */
export const TAB_BAR_SIDE = 16;

// ─── Derived values ───────────────────────────────────────────────────────────

/** Distance from screen bottom to the top edge of the floating nav bar */
export const NAV_TOP = TAB_BAR_BOTTOM + TAB_BAR_HEIGHT; // 88

/**
 * `bottom` value for action buttons (FABs, sticky bars) that must sit
 * just above the floating nav bar.
 */
export const ABOVE_NAV = NAV_TOP + 8; // 96

/**
 * `paddingBottom` for list/scroll content that has a FAB above the nav bar
 * (clears both the FAB and the nav bar).
 * 56 = FAB height, 12 = gap
 */
export const CONTENT_BOTTOM_FAB = ABOVE_NAV + 56 + 12; // 164

/**
 * `paddingBottom` for list/scroll content with no extra button
 * (only needs to clear the floating nav bar).
 */
export const CONTENT_BOTTOM = NAV_TOP + 20; // 108
