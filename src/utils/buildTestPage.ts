export default function buildTestPage(args: {
    codeLang: string,
    js      : string
}) {

    const brython_script = `/assets/brython/brython(1)-web.js`;
    //const brython_script = "https://cdnjs.cloudflare.com/ajax/libs/brython/3.13.0/brython.min.js";

    let js = args.js;
    if( args.codeLang === "bry")
        js = "request()";

    return `<!DOCTYPE html>
    <head>
        <style>
            body {
                margin: 0;
                background-color: white;
                white-space: pre-wrap;
            }
        </style>
        ${ args.codeLang === "bry"
            ? `<script type="text/javascript" src="${brython_script}"></script>`
            : ""
        }
        <script type="module">
            await LISSContext.initializeFakers(globalThis);

            ${js}
        </script>
    </head>
    <body></body>
</html>
`;

}