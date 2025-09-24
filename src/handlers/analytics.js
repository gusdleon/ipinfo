// handlers/analytics.js - Analytics and insights endpoint

import { globalAnalytics } from '../analytics.js';
import { enhancedCache, ipinfoCache } from '../cacheUtils.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    try {
      // Analytics summary
      if (pathname.endsWith('/analytics') || pathname.endsWith('/analytics/')) {
        const summary = globalAnalytics.getAnalyticsSummary();
        
        return new Response(JSON.stringify({
          analytics: summary,
          cache: {
            enhanced: enhancedCache.getStats(),
            ipinfo: ipinfoCache.getStats()
          },
          timestamp: new Date().toISOString()
        }, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }

      // Recent requests
      if (pathname.endsWith('/analytics/recent')) {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const recentRequests = globalAnalytics.getRecentRequests(Math.min(limit, 200));
        
        return new Response(JSON.stringify({
          recentRequests,
          count: recentRequests.length,
          timestamp: new Date().toISOString()
        }, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }

      // System health endpoint
      if (pathname.endsWith('/analytics/health')) {
        const summary = globalAnalytics.getAnalyticsSummary();
        const cacheStats = {
          enhanced: enhancedCache.getStats(),
          ipinfo: ipinfoCache.getStats()
        };

        // Simple health indicators
        const health = {
          status: 'healthy',
          uptime: 'N/A (Cloudflare Workers)', // Workers don't have persistent uptime
          requestsProcessed: summary.summary?.totalRequests || 0,
          cacheEfficiency: {
            enhanced: `${cacheStats.enhanced.size}/${cacheStats.enhanced.maxEntries}`,
            ipinfo: `${cacheStats.ipinfo.size}/${cacheStats.ipinfo.maxEntries}`
          },
          averageResponseTime: summary.performance?.averageResponseTime || 0,
          timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(health, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }

      // Clear analytics (for admin use)
      if (pathname.endsWith('/analytics/clear') && request.method === 'POST') {
        globalAnalytics.clearAnalytics();
        enhancedCache.clear();
        ipinfoCache.clear();
        
        return new Response(JSON.stringify({
          message: 'Analytics and cache cleared successfully',
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 404 for unknown analytics endpoints
      return new Response(JSON.stringify({
        error: {
          code: 'ANALYTICS_ENDPOINT_NOT_FOUND',
          message: `Analytics endpoint '${pathname}' not found. Available: /analytics, /analytics/recent, /analytics/health`
        },
        timestamp: new Date().toISOString()
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'An error occurred while processing analytics request',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};