// /response (SSE)/GET.js

class SSEWriter {
    #writer;
    constructor(writer) {
        this.#writer = writer;
    }

    sendEvent(data, name = 'message') {
        return this.#writer.write(
`event: ${name}
data: ${JSON.stringify(data)}

`);
    }
}

async function callback(writer) {

    try {
        writer.closed.finally( () => {
            console.warn("connexion closed");
        });

        const sse = new SSEWriter(writer);

        console.warn("SSE");

        for(let i = 0; i < 3; ++i)
            await sse.sendEvent({i});

        console.warn("close");
        writer.close();
    } catch(e) {
        console.warn(`Error: ${e}`);
        writer.abort();
    }
}

export default async function() {

    const {readable, writable} = new TransformStream();

    callback(writable.getWriter());

    const encoder = new TextEncoderStream()
    const stream = readable.pipeThrough(encoder);
    return new Response(stream, {
        headers: {
            "content-type": "text/event-stream"
        }
    });
}