# API Usage Examples

This document provides comprehensive examples of using the Enhanced IP Information API.

## Quick Start

### Get Your Own IP Information (Enhanced)
```bash
curl https://gusdleon.com/
```

This returns rich information about your own IP including Cloudflare edge data:
```json
{
  "requestId": "req_1640995200000_abc123def",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "processingTime": 125,
  "ip": "203.0.113.1",
  "ipVersion": 4,
  "location": {
    "country": "United States",
    "countryCode": "US",
    "region": "California",
    "city": "San Francisco",
    "timezone": "America/Los_Angeles",
    "coordinates": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "continent": "North America",
    "accuracy": "high",
    "sources": ["cloudflare", "ipinfo"]
  },
  "network": {
    "asn": 13335,
    "organization": "Cloudflare, Inc.",
    "type": "hosting"
  },
  "security": {
    "vpn": false,
    "proxy": false,
    "tor": false,
    "hosting": false,
    "threatLevel": "low",
    "botScore": 95,
    "verifiedBot": false,
    "malicious": false
  },
  "connection": {
    "datacenter": "San Francisco, US",
    "httpProtocol": "HTTP/3",
    "tlsVersion": "TLSv1.3",
    "edgeLocation": "SFO"
  },
  "client": {
    "headers": {
      "userAgent": "curl/7.68.0",
      "cfRay": "7f1234567890abcd-SFO"
    },
    "isBot": false,
    "requestMethod": "GET"
  },
  "performance": {
    "processingTime": 125,
    "edgeLocation": "SFO",
    "protocol": "HTTP/3",
    "tlsVersion": "TLSv1.3"
  }
}
```

## Enhanced Endpoints

### Comprehensive IP Analysis
```bash
curl https://gusdleon.com/api/enhanced/8.8.8.8
```

Get complete enhanced IP information combining all data sources.

### Focused Geolocation
```bash
curl https://gusdleon.com/api/geolocation/8.8.8.8
```

Returns:
```json
{
  "ip": "8.8.8.8",
  "country": "United States",
  "countryCode": "US",
  "region": "California",
  "city": "Mountain View",
  "timezone": "America/Los_Angeles",
  "coordinates": {
    "latitude": 37.4056,
    "longitude": -122.0775
  },
  "continent": "North America",
  "accuracy": "high",
  "sources": ["cloudflare", "ipinfo"]
}
```

### Security Analysis
```bash
curl https://gusdleon.com/api/security/8.8.8.8
```

Returns:
```json
{
  "ip": "8.8.8.8",
  "vpn": false,
  "proxy": false,
  "tor": false,
  "hosting": true,
  "threatLevel": "low",
  "botScore": 85,
  "verifiedBot": true,
  "malicious": false,
  "riskFactors": ["Hosting/datacenter IP"]
}
```

### Network Intelligence
```bash
curl https://gusdleon.com/api/network/8.8.8.8
```

Returns:
```json
{
  "ip": "8.8.8.8",
  "asn": 15169,
  "organization": "Google LLC",
  "type": "hosting",
  "route": "8.8.8.0/24",
  "datacenter": "Mountain View, US",
  "httpProtocol": "HTTP/3",
  "tlsVersion": "TLSv1.3",
  "connectionQuality": "excellent"
}
```

## Analytics and Monitoring

### Get API Analytics
```bash
curl https://gusdleon.com/analytics
```

Returns comprehensive usage statistics:
```json
{
  "analytics": {
    "summary": {
      "totalRequests": 15420,
      "requestsLastHour": 234,
      "requestsLast24Hours": 5678,
      "averageProcessingTime": 145
    },
    "endpoints": [
      { "endpoint": "enhanced", "count": 8500 },
      { "endpoint": "geolocation", "count": 3200 },
      { "endpoint": "security", "count": 2100 }
    ],
    "countries": [
      { "country": "US", "count": 6789 },
      { "country": "GB", "count": 2345 },
      { "country": "DE", "count": 1876 }
    ],
    "performance": {
      "averageResponseTime": 145,
      "fastestRequest": 45,
      "slowestRequest": 1200
    }
  },
  "cache": {
    "enhanced": { "size": 150, "maxEntries": 200 },
    "ipinfo": { "size": 320, "maxEntries": 500 }
  }
}
```

### Recent Requests
```bash
curl https://gusdleon.com/analytics/recent?limit=10
```

### System Health
```bash
curl https://gusdleon.com/analytics/health
```

## JavaScript/Browser Examples

### Simple IP Lookup
```javascript
async function getMyIPInfo() {
  try {
    const response = await fetch('https://gusdleon.com/');
    const data = await response.json();
    console.log('My IP:', data.ip);
    console.log('Location:', `${data.location.city}, ${data.location.country}`);
    console.log('ISP:', data.network.organization);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Security Check
```javascript
async function checkIPSecurity(ip) {
  try {
    const response = await fetch(`https://gusdleon.com/api/security/${ip}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('Error:', data.error.message);
      return;
    }
    
    console.log(`Security Analysis for ${ip}:`);
    console.log(`Threat Level: ${data.threatLevel}`);
    console.log(`VPN: ${data.vpn ? 'Yes' : 'No'}`);
    console.log(`Proxy: ${data.proxy ? 'Yes' : 'No'}`);
    console.log(`Bot Score: ${data.botScore || 'N/A'}`);
    
    if (data.riskFactors.length > 0) {
      console.log('Risk Factors:', data.riskFactors.join(', '));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
checkIPSecurity('8.8.8.8');
```

### Geolocation with Map Integration
```javascript
async function getLocationAndShowOnMap(ip) {
  try {
    const response = await fetch(`https://gusdleon.com/api/geolocation/${ip}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('Error:', data.error.message);
      return;
    }
    
    const { latitude, longitude } = data.coordinates;
    
    // Example with Google Maps (replace with your preferred mapping library)
    const map = new google.maps.Map(document.getElementById('map'), {
      zoom: 10,
      center: { lat: latitude, lng: longitude }
    });
    
    new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: map,
      title: `${data.city}, ${data.country}`
    });
    
    console.log(`Location: ${data.city}, ${data.country}`);
    console.log(`Accuracy: ${data.accuracy}`);
    console.log(`Data Sources: ${data.sources.join(', ')}`);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Node.js Examples

### Batch IP Analysis
```javascript
const https = require('https');

async function analyzeIPs(ipList) {
  const results = [];
  
  for (const ip of ipList) {
    try {
      const response = await fetch(`https://gusdleon.com/api/enhanced/${ip}`);
      const data = await response.json();
      results.push(data);
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error analyzing ${ip}:`, error);
      results.push({ ip, error: error.message });
    }
  }
  
  return results;
}

// Usage
const ips = ['8.8.8.8', '1.1.1.1', '208.67.222.222'];
analyzeIPs(ips).then(results => {
  console.log('Analysis Results:', JSON.stringify(results, null, 2));
});
```

### Express.js Middleware
```javascript
const express = require('express');
const app = express();

// Middleware to analyze visitor IPs
async function ipAnalysisMiddleware(req, res, next) {
  const clientIP = req.headers['cf-connecting-ip'] || 
                   req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.connection.remoteAddress;
  
  if (clientIP) {
    try {
      const response = await fetch(`https://gusdleon.com/api/security/${clientIP}`);
      const securityData = await response.json();
      
      // Add security info to request object
      req.ipSecurity = securityData;
      
      // Log suspicious activity
      if (securityData.threatLevel === 'high') {
        console.log(`High-risk IP detected: ${clientIP}`, securityData.riskFactors);
      }
    } catch (error) {
      console.error('IP analysis failed:', error);
    }
  }
  
  next();
}

app.use(ipAnalysisMiddleware);

app.get('/protected', (req, res) => {
  if (req.ipSecurity && req.ipSecurity.threatLevel === 'high') {
    return res.status(403).json({
      error: 'Access denied due to security concerns',
      riskFactors: req.ipSecurity.riskFactors
    });
  }
  
  res.json({ message: 'Access granted', security: req.ipSecurity });
});
```

## Python Examples

### Using requests library
```python
import requests
import json

def get_ip_info(ip):
    """Get comprehensive IP information"""
    try:
        response = requests.get(f'https://gusdleon.com/api/enhanced/{ip}')
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

def security_check(ip):
    """Check IP security status"""
    try:
        response = requests.get(f'https://gusdleon.com/api/security/{ip}')
        response.raise_for_status()
        data = response.json()
        
        print(f"Security Analysis for {ip}:")
        print(f"  Threat Level: {data['threatLevel']}")
        print(f"  VPN: {'Yes' if data['vpn'] else 'No'}")
        print(f"  Proxy: {'Yes' if data['proxy'] else 'No'}")
        print(f"  Malicious: {'Yes' if data['malicious'] else 'No'}")
        
        if data['riskFactors']:
            print(f"  Risk Factors: {', '.join(data['riskFactors'])}")
            
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

# Usage examples
ip_info = get_ip_info('8.8.8.8')
if ip_info:
    print(json.dumps(ip_info, indent=2))

security_data = security_check('8.8.8.8')
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": {
    "code": "INVALID_IP",
    "message": "Invalid IP address format. Please provide a valid IPv4 address.",
    "provided": "invalid.ip"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "req_1640995200000_error123"
}
```

Common error codes:
- `INVALID_IP`: Invalid IP address format
- `MISSING_IP`: IP address not provided
- `PROCESSING_ERROR`: Internal processing error
- `IPINFO_ERROR`: External API error
- `ENDPOINT_NOT_FOUND`: Unknown endpoint

## Rate Limits and Best Practices

1. **Rate Limiting**: Be respectful with request frequency
2. **Caching**: Results are cached appropriately (5-60 minutes depending on endpoint)
3. **Error Handling**: Always check for error responses
4. **Request ID**: Use the requestId for debugging and support
5. **CORS**: All endpoints support cross-origin requests

## Legacy Endpoint Compatibility

The API maintains backwards compatibility with original endpoints:

```bash
# Legacy IPv4 endpoint (still works)
curl https://gusdleon.com/api/ipv4info/8.8.8.8

# Legacy IPv6 endpoint (still works)  
curl https://gusdleon.com/api/ipv6info/2001:4860:4860::8888
```