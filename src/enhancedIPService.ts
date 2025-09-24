// enhancedIPService.ts - Enhanced IP information service combining multiple data sources

import type { 
  IPInfoResponse, 
  EnhancedIPResponse, 
  CloudflareRequestData,
  GeolocationResponse,
  SecurityResponse,
  NetworkResponse,
  APIErrorResponse 
} from './types.js';
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

export class EnhancedIPService {
  private ipinfoToken: string;

  constructor(ipinfoToken: string) {
    this.ipinfoToken = ipinfoToken;
  }

  /**
   * Get enhanced IP information combining Cloudflare and IPInfo data
   */
  async getEnhancedIPInfo(ip: string, request: Request): Promise<EnhancedIPResponse | APIErrorResponse> {
    const startTime = Date.now();
    const requestId = generateRequestId();

    try {
      // Validate IP address
      const validation = validateIP(ip);
      if (!validation.valid) {
        return this.createErrorResponse('INVALID_IP', validation.error!, requestId);
      }

      // Extract Cloudflare data
      const cfData = extractCloudflareData(request);
      
      // Fetch IPInfo data
      const ipinfoData = await this.fetchIPInfoData(ip);
      
      // Combine and enhance the data
      const enhancedResponse = this.combineData(ip, validation.version!, cfData, ipinfoData, requestId, startTime);
      
      return enhancedResponse;
    } catch (error) {
      return this.createErrorResponse(
        'PROCESSING_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        requestId
      );
    }
  }

  /**
   * Get focused geolocation information
   */
  async getGeolocation(ip: string, request: Request): Promise<GeolocationResponse | APIErrorResponse> {
    const requestId = generateRequestId();

    try {
      const validation = validateIP(ip);
      if (!validation.valid) {
        return this.createErrorResponse('INVALID_IP', validation.error!, requestId);
      }

      const cfData = extractCloudflareData(request);
      const ipinfoData = await this.fetchIPInfoData(ip);

      const sources: string[] = [];
      let accuracy: 'high' | 'medium' | 'low' = 'low';

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

      return {
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
    } catch (error) {
      return this.createErrorResponse(
        'PROCESSING_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        requestId
      );
    }
  }

  /**
   * Get security-focused information
   */
  async getSecurityInfo(ip: string, request: Request): Promise<SecurityResponse | APIErrorResponse> {
    const requestId = generateRequestId();

    try {
      const validation = validateIP(ip);
      if (!validation.valid) {
        return this.createErrorResponse('INVALID_IP', validation.error!, requestId);
      }

      const cfData = extractCloudflareData(request);
      const ipinfoData = await this.fetchIPInfoData(ip);

      const riskFactors: string[] = [];
      
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
      return this.createErrorResponse(
        'PROCESSING_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        requestId
      );
    }
  }

  /**
   * Get network-focused information
   */
  async getNetworkInfo(ip: string, request: Request): Promise<NetworkResponse | APIErrorResponse> {
    const requestId = generateRequestId();

    try {
      const validation = validateIP(ip);
      if (!validation.valid) {
        return this.createErrorResponse('INVALID_IP', validation.error!, requestId);
      }

      const cfData = extractCloudflareData(request);
      const ipinfoData = await this.fetchIPInfoData(ip);

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
      return this.createErrorResponse(
        'PROCESSING_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        requestId
      );
    }
  }

  /**
   * Fetch data from IPInfo API
   */
  private async fetchIPInfoData(ip: string): Promise<IPInfoResponse | null> {
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
   * Combine data from multiple sources into enhanced response
   */
  private combineData(
    ip: string,
    ipVersion: 4 | 6,
    cfData: CloudflareRequestData,
    ipinfoData: IPInfoResponse | null,
    requestId: string,
    startTime: number
  ): EnhancedIPResponse {
    const coordinates = this.extractCoordinates(cfData, ipinfoData);
    const sources: string[] = [];
    const computedFields: string[] = [];

    if (cfData.country) sources.push('cloudflare');
    if (ipinfoData) sources.push('ipinfo');

    // Determine location accuracy
    let locationAccuracy: 'high' | 'medium' | 'low' = 'low';
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
   */
  private extractCoordinates(cfData: CloudflareRequestData, ipinfoData: IPInfoResponse | null) {
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
   */
  private createErrorResponse(code: string, message: string, requestId: string): APIErrorResponse {
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