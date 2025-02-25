import execute from "@LISS/src/utils/execute";
import fakeFetch from "./fakeFetch";
import fakeHandler from "./fakeHandler";

export default function initializeFakers(args: {
                                    server: string|null,
                                    code  : string,
                                    codeLang: string,
                                    path: string,
                                    request: string
                                }) {

    return async (ctx: any) => {

        if( args.codeLang === "bry") {
            ctx.request = () => {
                // @ts-ignore
                execute(args.request, "bry");
            }
        }

        await fakeHandler(ctx, args.code,   args.codeLang);
        fakeFetch  (ctx, args.server, args.codeLang, args.path);

        ctx.print_response = async (r: Response) => {
            ctx.document.body.textContent = 
`${r.status}: ${r.statusText}
${r.headers.get("content-type")}

${await r.text()}`
        
        }
    }

    /*
    import {
        getFakeEventSource,
        getFakeWebSocket
    } from "/index.js";

const EventSource = window.EventSource = getFakeEventSource(${server}, handler);
const WebSocket   = window.WebSocket   = getFakeWebSocket  (${server}, handler);

*/
}