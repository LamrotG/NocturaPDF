import React from "react";

// Minimal hand-rolled stroke icon set (no icon library dependency) shared by
// TopAppBar/SecondaryToolbar/SettingsPanel. Each is a plain 18x18 SVG.
function Icon({ children, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const SunIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Icon>
);

export const MoonIcon = (p) => (
  <Icon {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
);

export const MonitorIcon = (p) => (
  <Icon {...p}>
    <rect x="2" y="4" width="20" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </Icon>
);

export const MaximizeIcon = (p) => (
  <Icon {...p}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
  </Icon>
);

export const MinimizeIcon = (p) => (
  <Icon {...p}>
    <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
  </Icon>
);

export const SidebarIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </Icon>
);

export const ChevronLeftIcon = (p) => (
  <Icon {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);

export const ChevronRightIcon = (p) => (
  <Icon {...p}>
    <path d="M9 18l6-6-6-6" />
  </Icon>
);

export const PlusIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const SearchIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </Icon>
);

export const ZoomInIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
  </Icon>
);

export const ZoomOutIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35M8 11h6" />
  </Icon>
);

export const FitWidthIcon = (p) => (
  <Icon {...p}>
    <rect x="6" y="4" width="12" height="16" rx="1" />
    <path d="M2 12h2M20 12h2" />
  </Icon>
);

export const FitPageIcon = (p) => (
  <Icon {...p}>
    <rect x="4" y="6" width="16" height="12" rx="1" />
    <path d="M12 2v2M12 20v2" />
  </Icon>
);

export const MenuIcon = (p) => (
  <Icon {...p}>
    <path d="M4 12h16M4 6h16M4 18h16" />
  </Icon>
);

export const XIcon = (p) => (
  <Icon {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Icon>
);

// Feature-card icons (landing page "Reading Experience" section).

export const OfflineIcon = (p) => (
  <Icon {...p}>
    <path d="M3 3l18 18" />
    <path d="M8.5 16.5a5 5 0 0 1 4.5-2.5M5.5 13a8 8 0 0 1 3-1.87M19 13a8 8 0 0 0-2.3-1.6M9.5 5.5A8 8 0 0 1 20 12" />
    <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const NoAccountIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.2-3.6 4.3-6 8-6s6.8 2.4 8 6" />
    <path d="M3 3l18 18" />
  </Icon>
);

export const InstantIcon = (p) => (
  <Icon {...p}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
  </Icon>
);

export const MinimalIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 3v18" />
  </Icon>
);

export const SpeedIcon = (p) => (
  <Icon {...p}>
    <path d="M12 21a9 9 0 1 1 9-9" />
    <path d="M12 12l4-4M4 12h1M12 4v1M6.5 6.5l.7.7" />
  </Icon>
);

export const FocusIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
  </Icon>
);
