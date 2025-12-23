// cloudflareUtils.js - Utilities for extracting and processing Cloudflare data

/**
 * Extract Cloudflare request data from the CF object
 * @param {Request} request - The incoming request
 * @returns {Object} Cloudflare data object
 */
export function extractCloudflareData(request) {
  const cf = request.cf || {};
  
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
 * @param {string} code - Continent code
 * @returns {string} Continent name
 */
export function getContinentName(code) {
  const continents = {
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
 * @param {string} colo - Colo code
 * @returns {string} Datacenter location
 */
export function getDatacenterLocation(colo) {
  // This is a simplified mapping - in production, you'd want a more comprehensive list
  const datacenters = {
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
 * @param {Object} cfData - Cloudflare data object
 * @returns {string} Connection quality rating
 */
export function assessConnectionQuality(cfData) {
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
 * @param {Object} cfData - Cloudflare data object
 * @param {Object} [ipinfoPrivacy] - IPInfo privacy data
 * @returns {string} Threat level
 */
export function assessThreatLevel(cfData, ipinfoPrivacy) {
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
 * @returns {string} Unique request ID
 */
export function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate processing time
 * @param {number} startTime - Start time in milliseconds
 * @returns {number} Processing time in milliseconds
 */
export function calculateProcessingTime(startTime) {
  return Date.now() - startTime;
}

/**
 * Validate IP address format
 * @param {string} ip - IP address to validate
 * @returns {Object} Validation result
 */
export function validateIP(ip) {
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