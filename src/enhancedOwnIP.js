// enhancedOwnIP.js - Enhanced service for client's own IP with rich Cloudflare data

import { EnhancedIPService } from './enhancedIPService.js';
import { extractCloudflareData, generateRequestId, calculateProcessingTime } from './cloudflareUtils.js';

export default {
  async fetch(request, env) {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    try {
      // Get client IP from Cloudflare headers
      const clientIP = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For')?.split(',')[0] || 
                      'unknown';
      
      if (clientIP === 'unknown') {
        return new Response(JSON.stringify({
          error: {
            code: 'NO_CLIENT_IP',
            message: 'Unable to determine client IP address'
          },
          timestamp: new Date().toISOString(),
          requestId
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

      const service = new EnhancedIPService(env.IPInfoToken);
      
      // Get enhanced IP information including rich Cloudflare data
      const result = await service.getEnhancedIPInfo(clientIP, request);
      
      // Add additional client-specific metadata
      if ('requestId' in result) {
        const enhancedResult = result;
        
        // Add request analysis
        const requestAnalysis = {
          userAgent: request.headers.get('User-Agent') || '',
          acceptLanguage: request.headers.get('Accept-Language') || '',
          acceptEncoding: request.headers.get('Accept-Encoding') || '',
          dnt: request.headers.get('DNT') || '',
          referer: request.headers.get('Referer') || '',
          origin: request.headers.get('Origin') || '',
          
          // Cloudflare-specific headers
          cfRay: request.headers.get('CF-Ray') || '',
          cfVisitor: request.headers.get('CF-Visitor') || '',
          cfConnectingIP: request.headers.get('CF-Connecting-IP') || '',
          cfCountry: request.headers.get('CF-IPCountry') || '',
        };

        // Enhanced response with client-specific data
        const clientEnhancedResponse = {
          ...enhancedResult,
          client: {
            headers: requestAnalysis,
            isBot: enhancedResult.security.botScore ? enhancedResult.security.botScore < 30 : false,
            isVerifiedBot: enhancedResult.security.verifiedBot || false,
            requestMethod: request.method,
            url: request.url,
            cfRay: requestAnalysis.cfRay,
          },
          performance: {
            processingTime: calculateProcessingTime(startTime),
            edgeLocation: enhancedResult.connection.edgeLocation,
            protocol: enhancedResult.connection.httpProtocol,
            tlsVersion: enhancedResult.connection.tlsVersion,
            tcpRtt: enhancedResult.connection.tcpRtt,
          }
        };

        return new Response(JSON.stringify(clientEnhancedResponse, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache own IP data
            'CF-Cache-Status': 'DYNAMIC',
          }
        });
      }

      // If error response, return as-is
      return new Response(JSON.stringify(result, null, 2), {
        status: 'error' in result ? 400 : 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while processing the request',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString(),
        requestId
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