// types.js - Type definitions and validation for enhanced IP information API

/**
 * Data structure definitions for documentation purposes.
 * These are implemented as JSDoc comments rather than TypeScript interfaces.
 */

/**
 * @typedef {Object} CloudflareRequestData
 * @property {string} [country] - Country code
 * @property {string} [region] - Region/state
 * @property {string} [city] - City name
 * @property {string} [postalCode] - Postal/ZIP code
 * @property {string} [timezone] - Timezone identifier
 * @property {string} [latitude] - Latitude coordinate
 * @property {string} [longitude] - Longitude coordinate
 * @property {string} [continent] - Continent code
 * @property {number} [asn] - Autonomous System Number
 * @property {string} [asOrganization] - AS organization name
 * @property {string} [colo] - Cloudflare datacenter code
 * @property {string} [httpProtocol] - HTTP protocol version
 * @property {string} [tlsVersion] - TLS version
 * @property {string} [tlsCipher] - TLS cipher suite
 * @property {Object} [botManagement] - Bot management data
 * @property {number} [botManagement.score] - Bot score
 * @property {boolean} [botManagement.staticResource] - Static resource flag
 * @property {boolean} [botManagement.verifiedBot] - Verified bot flag
 * @property {string} [requestPriority] - Request priority
 * @property {number} [weight] - Request weight
 * @property {number} [edgeRequestKeepAliveStatus] - Edge keep-alive status
 * @property {string} [clientAcceptEncoding] - Client accept encoding
 * @property {number} [clientTcpRtt] - TCP round-trip time
 */

/**
 * @typedef {Object} EnhancedIPResponse
 * @property {string} requestId - Unique request identifier
 * @property {string} timestamp - ISO timestamp
 * @property {number} processingTime - Processing time in ms
 * @property {string} ip - IP address
 * @property {number} ipVersion - IP version (4 or 6)
 * @property {Object} location - Location information
 * @property {Object} network - Network information
 * @property {Object} security - Security analysis
 * @property {Object} connection - Connection details
 * @property {Object} [company] - Company information
 * @property {Object} [carrier] - Carrier information
 * @property {Object} sources - Data sources used
 */

/**
 * @typedef {Object} APIErrorResponse
 * @property {Object} error - Error details
 * @property {string} error.code - Error code
 * @property {string} error.message - Error message
 * @property {*} [error.details] - Additional error details
 * @property {string} timestamp - Error timestamp
 * @property {string} requestId - Request identifier
 */

// Validation functions
export const validateIPVersion = (ip) => {
  if (!ip) return { valid: false, version: null, error: 'IP address is required' };
  
  // IPv4 validation
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
  if (ipv4Regex.test(ip)) {
    return { valid: true, version: 4 };
  }
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
  if (ipv6Regex.test(ip)) {
    return { valid: true, version: 6 };
  }
  
  return { valid: false, version: null, error: 'Invalid IP address format' };
};