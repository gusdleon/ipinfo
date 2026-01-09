/**
 * Enhanced IP Information API - Cloudflare Workers
 * 
 * Provides comprehensive IP information combining Cloudflare's rich edge data
 * with external IP intelligence services for enhanced geolocation, security,
 * and network analysis.
 * 
 * Enhanced Features:
 * - Rich Cloudflare CF object data integration
 * - Multi-source data aggregation and validation
 * - Specialized endpoints for different use cases
 * - Advanced security and bot detection
 * - Performance metrics and connection analysis
 */

// Legacy handlers (maintained for backwards compatibility)
import handleIPv4 from './ipv4.js';
import handleIPv6 from './ipv6.js';
import handleOwnIP from './fetchIPApi.js';

// Enhanced handlers with rich Cloudflare data
import handleEnhanced from './handlers/enhanced.js';
import handleGeolocation from './handlers/geolocation.js';
import handleSecurity from './handlers/security.js';
import handleNetwork from './handlers/network.js';
import handleAnalytics from './handlers/analytics.js';
import handleEnhancedOwnIP from './enhancedOwnIP.js';

/**
 * API Documentation endpoint
 * @returns {Response} API documentation response
 */
function getAPIDocumentation() {
  const docs = {
    title: "Enhanced IP Information API",
    description: "Comprehensive IP intelligence combining Cloudflare edge data with external sources",
    version: "2.0.0",
    baseUrl: "https://gusdleon.com",
    endpoints: {
      // Enhanced endpoints
      "GET /": {
        description: "Get enhanced information about your own IP address with rich Cloudflare data",
        features: ["Client IP detection", "Cloudflare edge data", "Request analysis", "Performance metrics"],
        response: "EnhancedIPResponse with client-specific data"
      },
      "GET /api/enhanced/{ip}": {
        description: "Get comprehensive enhanced IP information",
        parameters: { ip: "IPv4 or IPv6 address" },
        features: ["Multi-source data aggregation", "Location accuracy assessment", "Security analysis", "Network intelligence"],
        response: "EnhancedIPResponse"
      },
      "GET /api/geolocation/{ip}": {
        description: "Get focused geolocation information",
        parameters: { ip: "IPv4 or IPv6 address" },
        features: ["Multi-source location data", "Accuracy scoring", "Timezone information"],
        response: "GeolocationResponse"
      },
      "GET /api/security/{ip}": {
        description: "Get security and threat analysis",
        parameters: { ip: "IPv4 or IPv6 address" },
        features: ["VPN/Proxy detection", "Bot analysis", "Threat level assessment", "Risk factors"],
        response: "SecurityResponse"
      },
      "GET /api/network/{ip}": {
        description: "Get network and connectivity information",
        parameters: { ip: "IPv4 or IPv6 address" },
        features: ["ASN information", "ISP details", "Connection quality", "Protocol analysis"],
        response: "NetworkResponse"
      },
      "GET /analytics": {
        description: "Get API usage analytics and performance metrics",
        features: ["Request statistics", "Performance metrics", "Cache efficiency", "Geographic distribution"],
        response: "Analytics summary with cache statistics"
      },
      "GET /analytics/recent": {
        description: "Get recent API requests for debugging",
        parameters: { limit: "Number of recent requests (max 200)" },
        response: "Recent requests array"
      },
      "GET /analytics/health": {
        description: "Get system health and status information",
        response: "Health status with key metrics"
      },
      
      // Legacy endpoints (backwards compatibility)
      "GET /api/ipv4info/{ip}": {
        description: "Legacy IPv4 information (redirects to ipinfo.io)",
        deprecated: true,
        parameters: { ip: "IPv4 address" }
      },
      "GET /api/ipv6info/{ip}": {
        description: "Legacy IPv6 information (redirects to ipinfo.io)",
        deprecated: true,
        parameters: { ip: "IPv6 address" }
      }
    },
    dataSources: [
      "Cloudflare CF object (edge data, geolocation, security)",
      "IPInfo.io (comprehensive IP intelligence)",
      "Computed metrics (threat scoring, connection quality)"
    ],
    features: [
      "CORS enabled for all endpoints",
      "Response caching with appropriate TTL",
      "Comprehensive error handling",
      "Request ID tracking",
      "Processing time metrics"
    ]
  };

  return new Response(JSON.stringify(docs, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight for all requests
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
      // API Documentation (root path)
      if (pathname === '/' || pathname === '/docs') {
        return getAPIDocumentation();
      }

      // Enhanced own IP endpoint (enhanced version of legacy behavior)
      if (pathname.length <= 2 || pathname === '/ip' || pathname === '/me') {
        return handleEnhancedOwnIP.fetch(request, env);
      }

      // Enhanced endpoints
      if (pathname.startsWith('/api/enhanced/')) {
        return handleEnhanced.fetch(request, env);
      }

      if (pathname.startsWith('/api/geolocation/')) {
        return handleGeolocation.fetch(request, env);
      }

      if (pathname.startsWith('/api/security/')) {
        return handleSecurity.fetch(request, env);
      }

      if (pathname.startsWith('/api/network/')) {
        return handleNetwork.fetch(request, env);
      }

      // Analytics endpoints
      if (pathname.startsWith('/analytics')) {
        return handleAnalytics.fetch(request, env);
      }

      // Legacy endpoints (backwards compatibility)
      if (pathname.startsWith('/api/ipv4info')) {
        return handleIPv4.fetch(request, env);
      }

      if (pathname.startsWith('/api/ipv6info')) {
        return handleIPv6.fetch(request, env);
      }

      // Legacy own IP detection (maintain backwards compatibility)
      if (pathname.length === 13 || pathname.length === 14) {
        return handleOwnIP.fetch(request.headers.get('CF-Connecting-IP'), env);
      }

      // 404 for unknown endpoints
      return new Response(JSON.stringify({
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: `Endpoint '${pathname}' not found. Visit / for API documentation.`
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      // Global error handler
      return new Response(JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  },
};