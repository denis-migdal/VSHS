// /response (SSE Helper)/GET.js

async function callback(writer, ...args) {

    writer.closed.finally( () => {
        // connexion closed
    });

    for(let i = 0; i < 3; ++i)
        await writer.sendEvent({i});

    writer.close();
}

export default async function() {
    const args = [];
    return VSHS.SSEResponse(callback, {}, ...args);
}