/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import handleIPv4 from './ipv4.js';
import handleIPv6 from './ipv6.js';
import handleOwnIP from './fetchIPApi.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.length == 13 || url.pathname.length == 14) {
      return handleOwnIP.fetch(request.headers.get('CF-Connecting-IP'), env);
    }
    if (url.pathname.startsWith("/api/ipv4info")) {
      return handleIPv4.fetch(request, env);
    }
    if (url.pathname.startsWith("/api/ipv6info")) {
      return handleIPv6.fetch(request, env);
    }
  },
};