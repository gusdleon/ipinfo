//ipv4.js - Enhanced IPv4 handler with better validation and error handling
import handleIP from './fetchIPApi.js'

export default {
    async fetch(request, env) {
        try {
            const url = new URL(request.url);
            const ip = url.pathname.slice(14); // Remove "/api/ipv4info/"
            
            if (!ip) {
                return new Response(JSON.stringify({
                    error: {
                        code: 'MISSING_IP',
                        message: 'IPv4 address is required in the URL path'
                    },
                    timestamp: new Date().toISOString()
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Enhanced IPv4 validation
            const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
            if (ipv4Regex.test(ip)) {
                return handleIP.fetch(ip, env);
            } else {
                return new Response(JSON.stringify({
                    error: {
                        code: 'INVALID_IPV4',
                        message: 'Invalid IPv4 address format. Please provide a valid IPv4 address.',
                        provided: ip
                    },
                    timestamp: new Date().toISOString()
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
        } catch (error) {
            return new Response(JSON.stringify({
                error: {
                    code: 'PROCESSING_ERROR',
                    message: 'An error occurred while processing the IPv4 request',
                    details: error instanceof Error ? error.message : 'Unknown error'
                },
                timestamp: new Date().toISOString()
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
}