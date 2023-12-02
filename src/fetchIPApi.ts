//fetchIPApi.js

export default {
    async fetch(request, env) {
        const fetchurl = "https://ipinfo.io/" + request + "/json?token=" + env.IPInfoToken;
        const init = {
            method: "GET",
            headers: {
                "content-type": "application/json;charset=UTF-8",
            },
        };
        const respuesta = await fetch(fetchurl, init);
        return new Response(respuesta.body);
    }
}
