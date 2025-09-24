// fetchIPApi.js - Enhanced legacy IP API handler

export default {
    async fetch(clientIP, env) {
        try {
            if (!clientIP) {
                return new Response(JSON.stringify({
                    error: {
                        code: 'NO_CLIENT_IP',
                        message: 'Unable to determine client IP address'
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

            const fetchUrl = `https://ipinfo.io/${clientIP}/json?token=${env.IPInfoToken}`;
            const init = {
                method: "GET",
                headers: {
                    "content-type": "application/json;charset=UTF-8",
                },
            };
            
            const response = await fetch(fetchUrl, init);
            
            if (!response.ok) {
                return new Response(JSON.stringify({
                    error: {
                        code: 'IPINFO_ERROR',
                        message: `IPInfo API returned status ${response.status}`
                    },
                    timestamp: new Date().toISOString()
                }), {
                    status: response.status,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Parse and re-format response to ensure consistent headers
            const data = await response.json();
            
            return new Response(JSON.stringify(data, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Cache-Control': 'public, max-age=300'
                }
            });
        } catch (error) {
            return new Response(JSON.stringify({
                error: {
                    code: 'PROCESSING_ERROR',
                    message: 'Failed to process IP information request',
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
