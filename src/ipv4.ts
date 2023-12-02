//ipv4.js
import handleIP from './fetchIPApi.js'

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const ip = url.pathname.slice(14);
        const regexn = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
        if (regexn.test(ip)) {
            return handleIP.fetch(ip, env);
        } else {
            return new Response("Ese no es un formato de IPv4 correcta", { status: 404 });
        }
    }
}