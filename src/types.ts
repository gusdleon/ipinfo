// types.ts - Type definitions for enhanced IP information API

export interface CloudflareRequestData {
  // Geographic information
  country?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;
  latitude?: string;
  longitude?: string;
  continent?: string;
  
  // Network information
  asn?: number;
  asOrganization?: string;
  colo?: string; // Cloudflare datacenter
  httpProtocol?: string;
  tlsVersion?: string;
  tlsCipher?: string;
  
  // Security information
  botManagement?: {
    score?: number;
    staticResource?: boolean;
    verifiedBot?: boolean;
  };
  
  // Request metadata
  requestPriority?: string;
  weight?: number;
  
  // Edge information
  edgeRequestKeepAliveStatus?: number;
  clientAcceptEncoding?: string;
  clientTcpRtt?: number;
}

export interface IPInfoResponse {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string; // "latitude,longitude"
  postal?: string;
  timezone?: string;
  org?: string;
  asn?: {
    asn: string;
    name: string;
    domain: string;
    route: string;
    type: string;
  };
  company?: {
    name: string;
    domain: string;
    type: string;
  };
  carrier?: {
    name: string;
    mcc: string;
    mnc: string;
  };
  privacy?: {
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
    relay: boolean;
    hosting: boolean;
    service: string;
  };
  abuse?: {
    address: string;
    country: string;
    email: string;
    name: string;
    network: string;
    phone: string;
  };
  domains?: {
    page: number;
    total: number;
    domains: string[];
  };
}

export interface EnhancedIPResponse {
  // Request metadata
  requestId: string;
  timestamp: string;
  processingTime: number;
  
  // IP information
  ip: string;
  ipVersion: 4 | 6;
  
  // Geographic data (enhanced with multiple sources)
  location: {
    country: string;
    countryCode: string;
    region: string;
    city: string;
    postalCode?: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    continent: string;
    accuracy: 'high' | 'medium' | 'low';
    sources: string[]; // Which services provided the data
  };
  
  // Network information
  network: {
    asn: number;
    organization: string;
    isp?: string;
    domain?: string;
    type: string; // hosting, isp, business, etc.
    route?: string;
  };
  
  // Security analysis
  security: {
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
    hosting: boolean;
    threatLevel: 'low' | 'medium' | 'high';
    botScore?: number;
    verifiedBot?: boolean;
    malicious: boolean;
  };
  
  // Connection details (from CF)
  connection: {
    datacenter: string;
    httpProtocol: string;
    tlsVersion?: string;
    tlsCipher?: string;
    tcpRtt?: number;
    edgeLocation: string;
  };
  
  // Additional data
  company?: {
    name: string;
    domain: string;
    type: string;
  };
  
  carrier?: {
    name: string;
    mcc: string;
    mnc: string;
  };
  
  // API metadata
  sources: {
    ipinfo: boolean;
    cloudflare: boolean;
    computed: string[]; // List of computed fields
  };
}

export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

export interface GeolocationResponse {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  postalCode?: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  continent: string;
  accuracy: 'high' | 'medium' | 'low';
  sources: string[];
}

export interface SecurityResponse {
  ip: string;
  vpn: boolean;
  proxy: boolean;
  tor: boolean;
  hosting: boolean;
  threatLevel: 'low' | 'medium' | 'high';
  botScore?: number;
  verifiedBot?: boolean;
  malicious: boolean;
  riskFactors: string[];
}

export interface NetworkResponse {
  ip: string;
  asn: number;
  organization: string;
  isp?: string;
  type: string;
  route?: string;
  datacenter: string;
  httpProtocol: string;
  tlsVersion?: string;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}