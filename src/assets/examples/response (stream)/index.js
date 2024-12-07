// /response (stream)/GET.js

async function callback(writer) {

    try {
        writer.closed.finally( () => {
            console.warn("connexion closed");
        });

        for(let i = 0; i < 3; ++i)
            await writer.write(`${i}\n`);

        writer.close();
    } catch(e) {
        console.warn(`Error: ${e}`);
        writer.abort();
    }
}

export default async function() {

    const {readable, writable} = new TransformStream();

    callback(writable.getWriter());

    return new Response(readable.pipeThrough(new TextEncoderStream()) );
}