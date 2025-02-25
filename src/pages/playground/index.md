<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf8"/>
        <title>VSHS Playground</title>
        <meta name="color-scheme" content="dark light">
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link   href="/skeleton/index.css"  rel="stylesheet">
        <script  src="/skeleton/index.js"  type="module"     blocking="render" async></script>
        <script  src="./index.js"  type="module"     blocking="render" async></script>
    </head>
    <body code-langs="js,bry">
        <main>
            <header>
                <select></select> - <input type="checkbox"/> Server: <input value="http://localhost:8080" />
            </header>
            <vshs-playground show="index.code,output,request.code"
                             >
            </vshs-playground>
        </main>
    </body>
</html>