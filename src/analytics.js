// analytics.js - Request analytics and insights

/**
 * @typedef {Object} RequestAnalytics
 * @property {string} timestamp - ISO timestamp
 * @property {string} ip - IP address
 * @property {string} endpoint - API endpoint used
 * @property {string} [userAgent] - User agent string
 * @property {string} [country] - Country code
 * @property {string} [datacenter] - Datacenter code
 * @property {number} processingTime - Processing time in ms
 * @property {number} status - HTTP status code
 * @property {string} requestId - Request ID
 */

export class AnalyticsService {
  constructor() {
    this.analyticsData = [];
    this.maxEntries = 1000; // Keep last 1000 requests in memory
  }

  /**
   * Record a request for analytics
   * @param {RequestAnalytics} analytics - Analytics data
   */
  recordRequest(analytics) {
    this.analyticsData.push(analytics);
    
    // Keep only the most recent entries
    if (this.analyticsData.length > this.maxEntries) {
      this.analyticsData = this.analyticsData.slice(-this.maxEntries);
    }
  }

  /**
   * Get analytics summary
   * @returns {Object} Analytics summary
   */
  getAnalyticsSummary() {
    if (this.analyticsData.length === 0) {
      return {
        totalRequests: 0,
        message: 'No analytics data available yet'
      };
    }

    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentData = this.analyticsData.filter(req => 
      new Date(req.timestamp).getTime() > oneHourAgo
    );
    
    const dailyData = this.analyticsData.filter(req => 
      new Date(req.timestamp).getTime() > oneDayAgo
    );

    // Endpoint usage stats
    const endpointStats = this.analyticsData.reduce((acc, req) => {
      acc[req.endpoint] = (acc[req.endpoint] || 0) + 1;
      return acc;
    }, {});

    // Country stats
    const countryStats = this.analyticsData
      .filter(req => req.country)
      .reduce((acc, req) => {
        acc[req.country] = (acc[req.country] || 0) + 1;
        return acc;
      }, {});

    // Average processing time
    const avgProcessingTime = this.analyticsData.reduce((sum, req) => 
      sum + req.processingTime, 0
    ) / this.analyticsData.length;

    // Status code distribution
    const statusCodes = this.analyticsData.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalRequests: this.analyticsData.length,
        requestsLastHour: recentData.length,
        requestsLast24Hours: dailyData.length,
        averageProcessingTime: Math.round(avgProcessingTime),
        dataRetentionLimit: this.maxEntries
      },
      endpoints: Object.entries(endpointStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count })),
      countries: Object.entries(countryStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([country, count]) => ({ country, count })),
      statusCodes,
      performance: {
        averageResponseTime: Math.round(avgProcessingTime),
        fastestRequest: Math.min(...this.analyticsData.map(r => r.processingTime)),
        slowestRequest: Math.max(...this.analyticsData.map(r => r.processingTime))
      }
    };
  }

  /**
   * Get recent requests (for debugging)
   * @param {number} [limit=50] - Number of requests to return
   * @returns {RequestAnalytics[]} Recent requests
   */
  getRecentRequests(limit = 50) {
    return this.analyticsData
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Clear analytics data
   */
  clearAnalytics() {
    this.analyticsData = [];
  }
}

// Global analytics instance
export const globalAnalytics = new AnalyticsService();