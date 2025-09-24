// handlers/network.ts - Network-focused endpoint

import { EnhancedIPService } from '../enhancedIPService.js';

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const service = new EnhancedIPService(env.IPInfoToken);
    const url = new URL(request.url);
    
    // Extract IP from URL path
    const pathParts = url.pathname.split('/');
    const ip = pathParts[pathParts.length - 1];
    
    if (!ip) {
      return new Response(JSON.stringify({
        error: {
          code: 'MISSING_IP',
          message: 'IP address is required in the URL path'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

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
      const result = await service.getNetworkInfo(ip, request);
      
      return new Response(JSON.stringify(result, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour (network data is relatively stable)
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while processing the request'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
};