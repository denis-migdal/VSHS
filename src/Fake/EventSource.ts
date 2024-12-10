const EventSource = globalThis.EventSource;

export function getFakeEventSource(use_server: string|null) {

    if( use_server )
        return class EventSourceServer extends EventSource {
            constructor(url: string) {
                super(`${use_server}${url}`);
            }
        }

    return EventSourceFake;
}

// @ts-ignore
class EventSourceFake extends EventTarget implements EventSource {
    constructor(url: string) {
        super();
        this.url = url;


        console.warn("build");

        globalThis.fetch(url).then( async (response) => {

            console.warn("answer");

            this.readyState = this.OPEN;
            this.dispatchEvent( new Event("open") );

            const reader = response.body!.pipeThrough(new TextDecoderStream).getReader();

            let buffer = "";
            let chunk = await reader.read();

            console.warn("chunk", chunk);

            while( ! chunk.done ) {

                console.warn("chunk received");

                buffer += chunk.value!;

                let pos = buffer.indexOf("\n\n");
                while( pos !== -1) {

                    let event = buffer.slice(0, pos);

                    const data = Object.fromEntries( event.split("\n").map( l => l.split(": ") ) );

                    data.event ??= "message";

                    console.warn("dispatch", data);

                    this.dispatchEvent( new MessageEvent(data.event, {data: data.data}) )

                    buffer = buffer.slice(pos + 2);
                    pos = buffer.indexOf("\n\n");
                }

                chunk = await reader.read();
            }
        });

        //TODO: get the response + read stream + dispatchEvent
    }
    onerror  : ((this: EventSource, ev: Event       ) => any) | null = null;
    onmessage: ((this: EventSource, ev: MessageEvent) => any) | null = null;
    onopen   : ((this: EventSource, ev: Event       ) => any) | null = null;
    close(): void {
        this.readyState = this.CLOSED;
    }

    readyState: number = 0;

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSED = 2;

    // not implemented
    url: string;
    withCredentials: boolean = false;
}