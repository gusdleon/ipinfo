// cloudflareUtils.ts - Utilities for extracting and processing Cloudflare data

import type { CloudflareRequestData } from './types.js';

/**
 * Extract Cloudflare request data from the CF object
 */
export function extractCloudflareData(request: Request): CloudflareRequestData {
  const cf = (request as any).cf || {};
  
  return {
    // Geographic information
    country: cf.country,
    region: cf.region || cf.regionCode,
    city: cf.city,
    postalCode: cf.postalCode,
    timezone: cf.timezone,
    latitude: cf.latitude,
    longitude: cf.longitude,
    continent: cf.continent,
    
    // Network information
    asn: cf.asn,
    asOrganization: cf.asOrganization,
    colo: cf.colo,
    httpProtocol: cf.httpProtocol,
    tlsVersion: cf.tlsVersion,
    tlsCipher: cf.tlsCipher,
    
    // Security information
    botManagement: cf.botManagement ? {
      score: cf.botManagement.score,
      staticResource: cf.botManagement.staticResource,
      verifiedBot: cf.botManagement.verifiedBot,
    } : undefined,
    
    // Request metadata
    requestPriority: cf.requestPriority,
    weight: cf.weight,
    
    // Edge information
    edgeRequestKeepAliveStatus: cf.edgeRequestKeepAliveStatus,
    clientAcceptEncoding: cf.clientAcceptEncoding,
    clientTcpRtt: cf.clientTcpRtt,
  };
}

/**
 * Get continent name from continent code
 */
export function getContinentName(code: string): string {
  const continents: Record<string, string> = {
    'AF': 'Africa',
    'AN': 'Antarctica',
    'AS': 'Asia',
    'EU': 'Europe',
    'NA': 'North America',
    'OC': 'Oceania',
    'SA': 'South America',
  };
  return continents[code] || code;
}

/**
 * Get datacenter location name from colo code
 */
export function getDatacenterLocation(colo: string): string {
  // This is a simplified mapping - in production, you'd want a more comprehensive list
  const datacenters: Record<string, string> = {
    'ATL': 'Atlanta, US',
    'DFW': 'Dallas, US',
    'EWR': 'Newark, US',
    'IAD': 'Ashburn, US',
    'LAX': 'Los Angeles, US',
    'MIA': 'Miami, US',
    'ORD': 'Chicago, US',
    'SJC': 'San Jose, US',
    'SEA': 'Seattle, US',
    'LHR': 'London, UK',
    'CDG': 'Paris, France',
    'FRA': 'Frankfurt, Germany',
    'AMS': 'Amsterdam, Netherlands',
    'SIN': 'Singapore',
    'NRT': 'Tokyo, Japan',
    'HKG': 'Hong Kong',
    'SYD': 'Sydney, Australia',
    'GRU': 'São Paulo, Brazil',
    'YYZ': 'Toronto, Canada',
  };
  return datacenters[colo] || `${colo} Datacenter`;
}

/**
 * Determine connection quality based on various metrics
 */
export function assessConnectionQuality(cfData: CloudflareRequestData): 'excellent' | 'good' | 'fair' | 'poor' {
  let score = 0;
  
  // HTTP/2 or HTTP/3 gets bonus points
  if (cfData.httpProtocol === 'HTTP/3') score += 3;
  else if (cfData.httpProtocol === 'HTTP/2') score += 2;
  else if (cfData.httpProtocol === 'HTTP/1.1') score += 1;
  
  // Modern TLS gets bonus points
  if (cfData.tlsVersion === 'TLSv1.3') score += 2;
  else if (cfData.tlsVersion === 'TLSv1.2') score += 1;
  
  // Low RTT gets bonus points
  if (cfData.clientTcpRtt && cfData.clientTcpRtt < 50) score += 2;
  else if (cfData.clientTcpRtt && cfData.clientTcpRtt < 100) score += 1;
  
  if (score >= 6) return 'excellent';
  if (score >= 4) return 'good';
  if (score >= 2) return 'fair';
  return 'poor';
}

/**
 * Assess threat level based on available security data
 */
export function assessThreatLevel(
  cfData: CloudflareRequestData,
  ipinfoPrivacy?: any
): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // Check bot management score
  if (cfData.botManagement?.score !== undefined) {
    if (cfData.botManagement.score < 30) riskScore += 3;
    else if (cfData.botManagement.score < 50) riskScore += 2;
    else if (cfData.botManagement.score < 80) riskScore += 1;
  }
  
  // Check for VPN/Proxy usage from ipinfo
  if (ipinfoPrivacy) {
    if (ipinfoPrivacy.tor) riskScore += 3;
    if (ipinfoPrivacy.vpn) riskScore += 2;
    if (ipinfoPrivacy.proxy) riskScore += 2;
    if (ipinfoPrivacy.hosting) riskScore += 1;
  }
  
  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate processing time
 */
export function calculateProcessingTime(startTime: number): number {
  return Date.now() - startTime;
}

/**
 * Validate IP address format
 */
export function validateIP(ip: string): { valid: boolean; version?: 4 | 6; error?: string } {
  if (!ip) {
    return { valid: false, error: 'IP address is required' };
  }
  
  // IPv4 regex
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
  if (ipv4Regex.test(ip)) {
    return { valid: true, version: 4 };
  }
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
  if (ipv6Regex.test(ip)) {
    return { valid: true, version: 6 };
  }
  
  return { valid: false, error: 'Invalid IP address format' };
}