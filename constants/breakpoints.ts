export type ScreenBreakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export const SCREEN_BREAKPOINTS: Record<ScreenBreakpoint, number> = {
    mobile: 480,
    tablet: 768,
    laptop: 1024,
    desktop: 1200,
}