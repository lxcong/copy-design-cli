export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET";

export interface DesignAnalysis {
  theme: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    error: string;
    success: string;
  };
  typography: {
    fontFamily: string;
    h1: { size: string; weight: number };
    h2: { size: string; weight: number };
    h3: { size: string; weight: number };
    body: { size: string; weight: number };
    caption: { size: string; weight: number };
  };
  spacing: {
    baseUnit: string;
    values: number[];
  };
  layout: {
    description: string;
    maxWidth: string;
    columns: number;
  };
  components: {
    buttonRadius: string;
    cardRadius: string;
    cardShadow: string;
    inputBorder: string;
  };
  designPrompt: string;
}

export const VIEWPORTS: Record<DeviceType, { width: number; height: number }> = {
  DESKTOP: { width: 1440, height: 900 },
  MOBILE: { width: 390, height: 844 },
  TABLET: { width: 820, height: 1180 },
};
