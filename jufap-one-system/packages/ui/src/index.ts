export const designTokens = {
  color: {
    navy: "#0B174F",
    navyStrong: "#07113F",
    blue: "#1473E6",
    blueSoft: "#EAF3FF",
    background: "#F4F6FA",
    surface: "#FFFFFF",
    surfaceMuted: "#F8F9FC",
    text: "#202B43",
    muted: "#6B7487",
    line: "#E5E9F1",
    positive: "#0E7C66",
    positiveSoft: "#E7F6F1",
    attention: "#A65A08",
    attentionSoft: "#FFF3DF",
    critical: "#C33D4A",
    criticalSoft: "#FDECEE",
  },
  radius: {
    small: 10,
    medium: 14,
    large: 18,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
  },
  typography: {
    kpi: "clamp(1.8rem, 3vw, 2.6rem)",
    title: "clamp(1.35rem, 2vw, 2rem)",
    body: "0.925rem",
    label: "0.75rem",
  },
} as const;

export const executiveLayout = {
  maxPrimaryKpisPerSection: 4,
  sidebarWidth: 248,
  topbarHeight: 72,
  contentMaxWidth: 1540,
} as const;
