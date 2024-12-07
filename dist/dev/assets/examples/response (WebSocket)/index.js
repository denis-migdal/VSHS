// /response (WebSocket)/GET.js

export default async function(request) {

    const w = Deno.upgradeWebSocket(request);

    w.socket.addEventListener("message", ({data}) => {
        w.socket.send(data);
    });

    return w.response;
}