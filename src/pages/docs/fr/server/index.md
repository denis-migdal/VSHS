<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf8"/>
        <title>VSHS</title>
        <!--
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="cyan" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="black" />
        -->
        <meta name="color-scheme" content="dark light">
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link   href="./index.css"  rel="stylesheet" blocking="render">
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/brython/3.13.0/brython.min.js"></script>
        <script  src="./index.js"  type="module"     blocking="render" async></script>
    </head>
    <body>
        <main>

# Démarrer et requêter le serveur HTTP

L'intégralité du serveur est contenu dans le fichier `./VSHS.ts`. Les autres fichiers contiennent les exemples, tests, et documentations.

## Démo et tests

Vous pouvez lancer le serveur de démonstration via la commande `deno task demo`. Une fois le serveur lancé :
- lancez les tests unitaires via la commande `deno task test`.
- utilisez le serveur au sein du [bac à sable](../../../playground/) en cochant l'option "Server" présente en haut de la page.

## Démarrer le serveur

### En ligne de commandes (CLI)

Un serveur VSHS peut être lancé en lignes de commandes via `./VSHS.ts $ROUTES`, avec `$ROUTES` le dossier contenant les *requests handlers*.

💡 L'option `--help` permet d'afficher l'usage de la commande.

### Via Deno

`VSHS.ts` exporte par défaut une fonction `startHTTPServer(opts)` permettant de lancer un serveur. `startHTTPServer(opts)` accepte plusieurs options :
- `routes` : le chemin du dossier contenant les *requests handlers*, ou un ensemble de routes.
-  `hostname`/`port` : l'ip/port sur lequel le serveur HTTP va écouter.

Par exemple :
```ts
// myserver.ts
import startHTTPServer from "VSHS";

startHTTPServer({
    routes: "..."
});
```

Vous pouvez ensuite lancer votre serveur via la commande : `run --allow-all myserver.ts`.

💡 Lors du développement vous pouvez utiliser les options suivantes :
- `--check` : vérifier les types TypeScripts ;
- `--watch=./` : relancer le serveur lorsque les fichiers du dossier `./` sont modifiés.

💡 Vous pouvez aussi [configurer Deno](https://docs.deno.com/runtime/fundamentals/configuration/) via les fichiers ̀`deno.json` et `package.json`


## Requêter le serveur

### En ligne de commandes (CLI)

curl/wget

You can then send HTTP queries to the server with the command `curl`:

```shell
curl -X $HTTP_METHOD -d "$BODY" -w "\n\nStatus code:%{http_code}\n" "$URL"
```
```shell
curl -w "\n" -X GET http://localhost:8080/hello-world
```
```shell
curl -w "\n" -X POST -d '{"body": "A"}' http://localhost:8080/params/C?url=B
```
```shell
curl -d "..." -H "Content-Type: ..."
```

telnet

wscat

### Via JavaScript/Brython

- fetch
    -> cache / redirect
    -> method
    -> Request or url (+ body)
    -> cf build request for body data
    -> await response
        -> status/statusText
        -> cf read request to read data
- EventSource
- WebSocket

</main>
    </body>
</html>