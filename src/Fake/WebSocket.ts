const WebSocket = globalThis.WebSocket;

export function getFakeWebSocket(use_server: string|null) {

    if( use_server )
        return class WebSocketServer extends WebSocket {
            constructor(url: string) {
                super(`${use_server}${url}`);
            }
        }

    return WebSocketFake;
}

globalThis.Deno = {
    upgradeWebSocket: function(request: Request) {

        const socket   = new WebSocketFake(null);
        const response = new Response();

        (response as any).websocket = socket;

        return {
            socket,
            response
        }
    }
}

//TODO implemente Deno.upgrade => return fake Response + ServerWebSocket...

class WebSocketFake extends EventTarget implements WebSocket {

    other: WebSocketFake|null = null;

    constructor(url: string|null) {
        super();

        if( url === null)
            return;

        this.url = url;

        globalThis.fetch(url).then( async (response) => {

            this.other = (response as any).websocket;
            this.other!.other = this;

            this.readyState = this.OPEN;
            this.dispatchEvent( new Event("open") );
            this.other!.dispatchEvent( new Event("open") );

        });


    }

    close(code?: number, reason?: string): void {
        this.readyState = this.CLOSED;
        let event: CloseEventInit = {};
        if( code !== undefined)
            event.code = code;
        if( reason !== undefined)
            event.reason = reason;

        this.other!.dispatchEvent( new CloseEvent("close", event) );
        this.dispatchEvent( new CloseEvent("close", event) );
    }
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        this.other!.dispatchEvent(new MessageEvent("message", {data}));
    }

    url: string = "";
    
    onclose  : ((this: WebSocket, ev: CloseEvent  ) => any) | null = null;
    onerror  : ((this: WebSocket, ev: Event       ) => any) | null = null;
    onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
    onopen   : ((this: WebSocket, ev: Event       ) => any) | null = null;

    readyState: number = 0;

    readonly CONNECTING = 0;
    readonly OPEN       = 1;
    readonly CLOSING    = 2;
    readonly CLOSED     = 3;

    // not implemented
    binaryType: BinaryType = "arraybuffer";
    bufferedAmount: number = 0;
    extensions: string     = "";
    protocol: string       = "";
}