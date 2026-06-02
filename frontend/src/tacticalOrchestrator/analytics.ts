export class AnalyticsTracker {
  private static instance: AnalyticsTracker;

  private constructor() {}

  public static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  /**
   * Tracks a tactical learning telemetry milestone.
   */
  public track(eventName: string, data: any = {}): void {
    const timestamp = new Date().toISOString();
    console.log(`[Analytics] [${timestamp}] Event: "${eventName}" | Data:`, data);
    
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('football_atlas_analytics', {
        detail: { eventName, data, timestamp }
      });
      window.dispatchEvent(customEvent);
    }
  }
}

export const analyticsTracker = AnalyticsTracker.getInstance();
