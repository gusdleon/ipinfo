// enhancedIPService.js - Enhanced IP information service combining multiple data sources

import { 
  extractCloudflareData, 
  getContinentName, 
  getDatacenterLocation,
  assessConnectionQuality,
  assessThreatLevel,
  generateRequestId,
  calculateProcessingTime,
  validateIP
} from './cloudflareUtils.js';
import { 
  ipinfoCache, 
  enhancedCache, 
  CACHE_TTL, 
  generateCacheKey, 
  cachedFetch 
} from './cacheUtils.js';
import { globalAnalytics } from './analytics.js';

export class EnhancedIPService {
  /**
   * @param {string} ipinfoToken - IPInfo.io API token
   */
  constructor(ipinfoToken) {
    this.ipinfoToken = ipinfoToken;
  }

  /**
   * Get enhanced IP information combining Cloudflare and IPInfo data
   * @param {string} ip - IP address to analyze
   * @param {Request} request - Request object
   * @returns {Promise<Object>} Enhanced IP response or error
   */
  async getEnhancedIPInfo(ip, request) {
    const startTime = Date.now();
    const requestId = generateRequestId();

    try {
      // Validate IP address
      const validation = validateIP(ip);
      if (!validation.valid) {
        this.recordAnalytics(ip, 'enhanced', request, 400, startTime, requestId);
        return this.createErrorResponse('INVALID_IP', validation.error, requestId);
      }

      // Try cache first
      const cacheKey = generateCacheKey('enhanced', ip);
      const cached = enhancedCache.get(cacheKey);
      if (cached) {
        this.recordAnalytics(ip, 'enhanced', request, 200, startTime, requestId);
        return { ...cached, requestId, processingTime: calculateProcessingTime(startTime) };
      }

      // Extract Cloudflare data
      const cfData = extractCloudflareData(request);
      
      // Fetch IPInfo data with caching
      const ipinfoData = await this.fetchIPInfoDataCached(ip);
      
      // Combine and enhance the data
      const enhancedResponse = this.combineData(ip, validation.version, cfData, ipinfoData, requestId, startTime);
      
      // Cache the result
      enhancedCache.set(cacheKey, enhancedResponse, CACHE_TTL.ENHANCED_IP);
      
      this.recordAnalytics(ip, 'enhanced', request, 200, startTime, requestId);
      return enhancedResponse;
    } catch (error) {
      this.recordAnalytics(ip, 'enhanced', request, 500, startTime, requestId);
      return this.createErrorResponse(
        'PROCESSING_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        requestId
      );
    }
  }

  /**
   * Get focused geolocation information
   * @param {string} ip - IP address to analyze
   * @param {Request} request - Request object
   * @returns {Promise<Object>} Geolocation response or error
   */
  async getGeolocation(ip, request) {
    const startTime = Date.now();
    const requestId = generateRequestId();

    try {
      const validation = validateIP(ip);
      if (!validation.valid) {
        this.recordAnalytics(ip, 'geolocation', request, 400, startTime, requestId);
        return this.createErrorResponse('INVALID_IP', validation.error, requestId);
      }

      // Try cache first
      const cacheKey = generateCacheKey('geolocation', ip);
      const cached = enhancedCache.get(cacheKey);
      if (cached) {
        this.recordAnalytics(ip, 'geolocation', request, 200, startTime, requestId);
        return cached;
      }

      const cfData = extractCloudflareData(request);
      const ipinfoData = await this.fetchIPInfoDataCached(ip);

      const sources = [];
      let accuracy = 'low';

      // Determine location from multiple sources
      const country = cfData.country || ipinfoData?.country || '';
      const region = cfData.region || ipinfoData?.region || '';
      const city = cfData.city || ipinfoData?.city || '';

      if (cfData.country) sources.push('cloudflare');
      if (ipinfoData?.country) sources.push('ipinfo');

      // Assess accuracy based on data sources
      if (sources.length >= 2 && cfData.latitude && cfData.longitude) {
        accuracy = 'high';
      } else if (sources.length >= 1) {
        accuracy = 'medium';
      }

      const coordinates = this.extractCoordinates(cfData, ipinfoData);

      const result = {
        ip,
        country,
        countryCode: cfData.country || '',
        region,
        city,
        postalCode: cfData.postalCode || ipinfoData?.postal,
        timezone: cfData.timezone || ipinfoData?.timezone || '',
        coordinates,
        continent: getContinentName(cfData.continent || ''),
        accuracy,
        sources
      };

      // Cache the result
      enhancedCache.set(cacheKey, result, CACHE_TTL.GEOLOCATION);
      
      this.recordAnalytics(ip, 'geolocation', request, 200, startTime, requestId);
      return result;
    } catch (error) {
      this.recordAnalytics(ip, 'geolocation', request, 500, startTime, requestId);
      return this.createErrorResponse(
        'PROCESSING_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        requestId
      );
    }
  }

  /**
   * Get security-focused information
   * @param {string} ip - IP address to analyze
   * @param {Request} request - Request object
   * @returns {Promise<Object>} Security response or error
   */
  async getSecurityInfo(ip, request) {
    const startTime = Date.now();
    const requestId = generateRequestId();

    try {
      const validation = validateIP(ip);
      if (!validation.valid) {
        this.recordAnalytics(ip, 'security', request, 400, startTime, requestId);
        return this.createErrorResponse('INVALID_IP', validation.error, requestId);
      }

      const cfData = extractCloudflareData(request);
      const ipinfoData = await this.fetchIPInfoDataCached(ip);

      const riskFactors = [];
      
      // Analyze security risks
      const vpn = ipinfoData?.privacy?.vpn || false;
      const proxy = ipinfoData?.privacy?.proxy || false;
      const tor = ipinfoData?.privacy?.tor || false;
      const hosting = ipinfoData?.privacy?.hosting || false;

      if (vpn) riskFactors.push('VPN usage detected');
      if (proxy) riskFactors.push('Proxy usage detected');
      if (tor) riskFactors.push('Tor network usage detected');
      if (hosting) riskFactors.push('Hosting/datacenter IP');

      if (cfData.botManagement?.score && cfData.botManagement.score < 50) {
        riskFactors.push('Low bot management score');
      }

      const threatLevel = assessThreatLevel(cfData, ipinfoData?.privacy);
      const malicious = threatLevel === 'high' || (tor && proxy);

      this.recordAnalytics(ip, 'security', request, 200, startTime, requestId);
      return {
        ip,
        vpn,
        proxy,
        tor,
        hosting,
        threatLevel,
        botScore: cfData.botManagement?.score,
        verifiedBot: cfData.botManagement?.verifiedBot,
        malicious,
        riskFactors
      };
    } catch (error) {
      this.recordAnalytics(ip, 'security', request, 500, startTime, requestId);
      return this.createErrorResponse(
        'PROCESSING_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        requestId
      );
    }
  }

  /**
   * Get network-focused information
   * @param {string} ip - IP address to analyze
   * @param {Request} request - Request object
   * @returns {Promise<Object>} Network response or error
   */
  async getNetworkInfo(ip, request) {
    const startTime = Date.now();
    const requestId = generateRequestId();

    try {
      const validation = validateIP(ip);
      if (!validation.valid) {
        this.recordAnalytics(ip, 'network', request, 400, startTime, requestId);
        return this.createErrorResponse('INVALID_IP', validation.error, requestId);
      }

      const cfData = extractCloudflareData(request);
      const ipinfoData = await this.fetchIPInfoDataCached(ip);

      this.recordAnalytics(ip, 'network', request, 200, startTime, requestId);
      return {
        ip,
        asn: cfData.asn || (ipinfoData?.asn ? parseInt(ipinfoData.asn.asn.replace('AS', '')) : 0),
        organization: cfData.asOrganization || ipinfoData?.org || '',
        isp: ipinfoData?.org,
        type: ipinfoData?.asn?.type || 'unknown',
        route: ipinfoData?.asn?.route,
        datacenter: getDatacenterLocation(cfData.colo || ''),
        httpProtocol: cfData.httpProtocol || 'unknown',
        tlsVersion: cfData.tlsVersion,
        connectionQuality: assessConnectionQuality(cfData)
      };
    } catch (error) {
      this.recordAnalytics(ip, 'network', request, 500, startTime, requestId);
      return this.createErrorResponse(
        'PROCESSING_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        requestId
      );
    }
  }

  /**
   * Fetch data from IPInfo API
   * @param {string} ip - IP address
   * @returns {Promise<Object|null>} IPInfo data or null
   */
  async fetchIPInfoData(ip) {
    try {
      const fetchUrl = `https://ipinfo.io/${ip}/json?token=${this.ipinfoToken}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      });

      if (!response.ok) {
        console.warn(`IPInfo API error: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch IPInfo data:', error);
      return null;
    }
  }

  /**
   * Fetch data from IPInfo API with caching
   * @param {string} ip - IP address
   * @returns {Promise<Object|null>} Cached or fresh IPInfo data
   */
  async fetchIPInfoDataCached(ip) {
    const cacheKey = generateCacheKey('ipinfo', ip);
    
    return cachedFetch(
      ipinfoCache,
      cacheKey,
      () => this.fetchIPInfoData(ip),
      CACHE_TTL.IPINFO_DATA
    );
  }

  /**
   * Record analytics for request tracking
   * @param {string} ip - IP address
   * @param {string} endpoint - Endpoint name
   * @param {Request} request - Request object
   * @param {number} status - HTTP status
   * @param {number} startTime - Start time
   * @param {string} requestId - Request ID
   */
  recordAnalytics(ip, endpoint, request, status, startTime, requestId) {
    const cfData = extractCloudflareData(request);
    
    const analytics = {
      timestamp: new Date().toISOString(),
      ip,
      endpoint,
      userAgent: request.headers.get('User-Agent') || undefined,
      country: cfData.country,
      datacenter: cfData.colo,
      processingTime: calculateProcessingTime(startTime),
      status,
      requestId
    };
    
    globalAnalytics.recordRequest(analytics);
  }

  /**
   * Combine data from multiple sources into enhanced response
   * @param {string} ip - IP address
   * @param {number} ipVersion - IP version (4 or 6)
   * @param {Object} cfData - Cloudflare data
   * @param {Object|null} ipinfoData - IPInfo data
   * @param {string} requestId - Request ID
   * @param {number} startTime - Start time
   * @returns {Object} Enhanced response
   */
  combineData(ip, ipVersion, cfData, ipinfoData, requestId, startTime) {
    const coordinates = this.extractCoordinates(cfData, ipinfoData);
    const sources = [];
    const computedFields = [];

    if (cfData.country) sources.push('cloudflare');
    if (ipinfoData) sources.push('ipinfo');

    // Determine location accuracy
    let locationAccuracy = 'low';
    if (sources.length >= 2 && coordinates.latitude && coordinates.longitude) {
      locationAccuracy = 'high';
      computedFields.push('location_accuracy');
    } else if (sources.length >= 1) {
      locationAccuracy = 'medium';
    }

    return {
      requestId,
      timestamp: new Date().toISOString(),
      processingTime: calculateProcessingTime(startTime),
      
      ip,
      ipVersion,
      
      location: {
        country: cfData.country || ipinfoData?.country || '',
        countryCode: cfData.country || '',
        region: cfData.region || ipinfoData?.region || '',
        city: cfData.city || ipinfoData?.city || '',
        postalCode: cfData.postalCode || ipinfoData?.postal,
        timezone: cfData.timezone || ipinfoData?.timezone || '',
        coordinates,
        continent: getContinentName(cfData.continent || ''),
        accuracy: locationAccuracy,
        sources
      },
      
      network: {
        asn: cfData.asn || (ipinfoData?.asn ? parseInt(ipinfoData.asn.asn.replace('AS', '')) : 0),
        organization: cfData.asOrganization || ipinfoData?.org || '',
        isp: ipinfoData?.org,
        domain: ipinfoData?.asn?.domain,
        type: ipinfoData?.asn?.type || 'unknown',
        route: ipinfoData?.asn?.route,
      },
      
      security: {
        vpn: ipinfoData?.privacy?.vpn || false,
        proxy: ipinfoData?.privacy?.proxy || false,
        tor: ipinfoData?.privacy?.tor || false,
        hosting: ipinfoData?.privacy?.hosting || false,
        threatLevel: assessThreatLevel(cfData, ipinfoData?.privacy),
        botScore: cfData.botManagement?.score,
        verifiedBot: cfData.botManagement?.verifiedBot,
        malicious: assessThreatLevel(cfData, ipinfoData?.privacy) === 'high'
      },
      
      connection: {
        datacenter: getDatacenterLocation(cfData.colo || ''),
        httpProtocol: cfData.httpProtocol || 'unknown',
        tlsVersion: cfData.tlsVersion,
        tlsCipher: cfData.tlsCipher,
        tcpRtt: cfData.clientTcpRtt,
        edgeLocation: cfData.colo || 'unknown'
      },
      
      company: ipinfoData?.company,
      carrier: ipinfoData?.carrier,
      
      sources: {
        ipinfo: !!ipinfoData,
        cloudflare: !!(cfData.country || cfData.colo),
        computed: computedFields
      }
    };
  }

  /**
   * Extract coordinates from available data sources
   * @param {Object} cfData - Cloudflare data
   * @param {Object|null} ipinfoData - IPInfo data
   * @returns {Object} Coordinates object
   */
  extractCoordinates(cfData, ipinfoData) {
    let latitude = 0;
    let longitude = 0;

    // Prefer Cloudflare data if available
    if (cfData.latitude && cfData.longitude) {
      latitude = parseFloat(cfData.latitude);
      longitude = parseFloat(cfData.longitude);
    } else if (ipinfoData?.loc) {
      const [lat, lon] = ipinfoData.loc.split(',');
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);
    }

    return { latitude, longitude };
  }

  /**
   * Create standardized error response
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @param {string} requestId - Request ID
   * @returns {Object} Error response
   */
  createErrorResponse(code, message, requestId) {
    return {
      error: {
        code,
        message
      },
      timestamp: new Date().toISOString(),
      requestId
    };
  }
}