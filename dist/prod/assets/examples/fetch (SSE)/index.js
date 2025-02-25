// /fetch (SSE)/GET.js

export default async function() {

    const events = `event: message
data: {"i":0}

event: message
data: {"i":1}

event: message
data: {"i":2}

event: close

`;

    return new Response(events, {
        headers: {
            "Content-Type": "text/event-stream"
        }
    });
}