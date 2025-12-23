# Enhanced IP Information API

A comprehensive IP intelligence API built on Cloudflare Workers that combines rich Cloudflare edge data with external IP intelligence services to provide enhanced geolocation, security analysis, and network information.

## 🚀 Features

- **Rich Cloudflare Data Integration**: Leverages Cloudflare's CF object for detailed edge location, security, and performance data
- **Multi-Source Intelligence**: Combines Cloudflare data with IPInfo.io for comprehensive IP analysis
- **Enhanced Security Analysis**: Advanced bot detection, VPN/Proxy identification, and threat level assessment
- **Precise Geolocation**: Multi-source location data with accuracy scoring
- **Network Intelligence**: ASN information, ISP details, and connection quality metrics
- **Performance Insights**: Connection analysis, protocol detection, and processing time metrics
- **CORS Enabled**: Full cross-origin support for web applications
- **Comprehensive Error Handling**: Detailed error responses with request tracking
- **Backwards Compatible**: Maintains existing API endpoints while adding enhanced functionality

## 📚 API Endpoints

### Enhanced Endpoints (New)

#### `GET /` - Enhanced Own IP Information
Get comprehensive information about your own IP address with rich Cloudflare data.
```bash
curl https://gusdleon.com/
```

**Response includes:**
- Enhanced IP information with multi-source data
- Client-specific request analysis
- Performance metrics and connection details
- Security assessment with bot detection

#### `GET /api/enhanced/{ip}` - Comprehensive IP Analysis
Get complete enhanced IP information combining all available data sources.
```bash
curl https://gusdleon.com/api/enhanced/8.8.8.8
```

**Features:**
- Multi-source data aggregation and validation
- Location accuracy assessment
- Security threat analysis
- Network intelligence and performance metrics

#### `GET /api/geolocation/{ip}` - Focused Geolocation
Get precise geolocation information with accuracy scoring.
```bash
curl https://gusdleon.com/api/geolocation/8.8.8.8
```

**Returns:**
- Country, region, city, postal code
- Coordinates with accuracy assessment
- Timezone and continent information
- Data source attribution

#### `GET /api/security/{ip}` - Security Analysis
Get comprehensive security and threat analysis.
```bash
curl https://gusdleon.com/api/security/8.8.8.8
```

**Analyzes:**
- VPN/Proxy/Tor detection
- Bot management scores
- Threat level assessment
- Risk factor identification

#### `GET /api/network/{ip}` - Network Intelligence
Get detailed network and connectivity information.
```bash
curl https://gusdleon.com/api/network/8.8.8.8
```

**Provides:**
- ASN and ISP information
- Connection quality metrics
- Protocol analysis (HTTP version, TLS)
- Datacenter and edge location details

### Legacy Endpoints (Maintained for Backwards Compatibility)

#### `GET /api/ipv4info/{ip}` - IPv4 Information
```bash
curl https://gusdleon.com/api/ipv4info/8.8.8.8
```

#### `GET /api/ipv6info/{ip}` - IPv6 Information
```bash
curl https://gusdleon.com/api/ipv6info/2001:4860:4860::8888
```

## 🔍 Example Responses

### Enhanced IP Response
```json
{
  "requestId": "req_1640995200000_abc123def",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "processingTime": 150,
  "ip": "8.8.8.8",
  "ipVersion": 4,
  "location": {
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
  },
  "network": {
    "asn": 15169,
    "organization": "Google LLC",
    "type": "hosting",
    "route": "8.8.8.0/24"
  },
  "security": {
    "vpn": false,
    "proxy": false,
    "tor": false,
    "hosting": true,
    "threatLevel": "low",
    "botScore": 85,
    "verifiedBot": true,
    "malicious": false
  },
  "connection": {
    "datacenter": "San Francisco, US",
    "httpProtocol": "HTTP/3",
    "tlsVersion": "TLSv1.3",
    "edgeLocation": "SFO"
  },
  "sources": {
    "ipinfo": true,
    "cloudflare": true,
    "computed": ["location_accuracy"]
  }
}
```

### Security Analysis Response
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

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Cloudflare Workers account
- IPInfo.io API token

### Setup
```bash
# Clone the repository
git clone https://github.com/gusdleon/ipinfo.git
cd ipinfo

# Install dependencies
npm install

# Configure environment variables
# Add IPInfoToken to your Cloudflare Workers environment
```

### Local Development
```bash
# Start development server
npm run start
# or
wrangler dev
```

### Deployment
```bash
# Deploy to Cloudflare Workers
npm run deploy
# or
wrangler publish
```

## 🔧 Configuration

### Environment Variables
- `IPInfoToken`: Your IPInfo.io API token for enhanced IP data

### Wrangler Configuration
The `wrangler.toml` file contains routing and environment configuration for Cloudflare Workers.

## 📊 Data Sources

1. **Cloudflare CF Object**: Rich edge data including geolocation, security metrics, and connection details
2. **IPInfo.io**: Comprehensive IP intelligence database
3. **Computed Metrics**: Enhanced analytics like threat scoring and connection quality assessment

## 🚦 Rate Limits and Caching

- Enhanced endpoints: 5-minute cache for optimal balance of freshness and performance
- Geolocation data: 10-minute cache (relatively stable)
- Security data: 5-minute cache (more dynamic)
- Network data: 1-hour cache (most stable)
- Own IP data: No cache (always fresh)

## 🔒 Security Features

- **Bot Detection**: Cloudflare Bot Management integration
- **Threat Analysis**: Multi-factor threat level assessment
- **VPN/Proxy Detection**: Advanced anonymization service identification
- **Risk Scoring**: Comprehensive risk factor analysis

## 🌍 Global Performance

- **Edge Deployment**: Runs on Cloudflare's global edge network
- **Low Latency**: Sub-50ms response times from 200+ locations
- **High Availability**: 99.9%+ uptime with automatic failover
- **DDoS Protection**: Built-in protection against attacks

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support and questions, please open an issue on GitHub.