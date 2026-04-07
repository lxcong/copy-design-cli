export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET";

export interface ColorToken {
  name: string;
  hex: string;
  role: string;
}

export interface DesignAnalysis {
  overview: string;
  colors: ColorToken[];
  typography: string;
  elevation: string;
  components: string;
  dosAndDonts: string;
}

export const VIEWPORTS: Record<DeviceType, { width: number; height: number }> = {
  DESKTOP: { width: 1440, height: 900 },
  MOBILE: { width: 390, height: 844 },
  TABLET: { width: 820, height: 1180 },
};
