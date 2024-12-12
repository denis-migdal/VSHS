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

### Via Deno (TypeScript)

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

#### Requêtes HTTP avec curl/wget

Les commandes `curl` et `wget` permettent d'envoyer des requêtes HTTP à un serveur et d'afficher sa réponse. Leur usage est décrit par le tableau ci-dessous :
<style>
table, th, td {
  border: 1px solid grey;
  border-collapse: collapse;
}

tbody th {
    text-align: left;
}

th,td {
  padding: 5px;
}
</style>
<table>
    <thead>
        <tr><td></td><th>curl</th><th>wget</th></tr>
    </thead>
    <tbody>
        <tr><th>Envoyer une requête</th><td>curl "$URL"</td><td>wget -qO- "$URL"</td></tr>
        <tr><th>Méthode HTTP</th><td>-X GET</td><td>--method=GET</td></tr>
        <tr><th>Données</th><td>-d 'Hello'</td><td>--body-data='Hello'</td></tr>
        <tr><th>Ajouter en-tête</th><td>-H "Content-Type: ..."</td><td>
--header="Content-Type: ..."</td></tr>
        <tr><th>En-tête de la réponse</th><td>-i</td><td>
-S</td></tr>
        <tr><th>Afficher les en-têtes</th><td>-v</td><td>
--debug</td></tr>
    </tbody>
</table>

Par exemple :
```shell
$ curl -X GET "http://localhost:8080/Hello%20World" -w "

Content    : %{content_type}
Status code: %{http_code}
"
Hello World ;)

Content    : text/plain;charset=UTF-8
Status code: 200
```
```shell
$ curl -X POST -d '{"A": 42}' "http://localhost:8080/echo%20(body)" -w "\n"
{"A": 42}
```

💡 L'option `-w` de `curl` permet de formatter la sortie, notamment en affichant :<br/>
- `content_type`
- `http_code`

#### WebSockets

La commande `wscat -c $URL` permet de se connecter au serveur via un WebSocket, e.g. :
```
wscat -c "http://localhost:8080/response (WebSocket)"
Connected (press CTRL+C to quit)
> Hello
< Hello
```

💡 `wscat` s'installe via la commande `npm install -g wscat` (requiert les droits administrateur).

#### TCP

Vous pouvez requêter le serveur directement en TCP via la commande `nc $HOST $PORT`.

Cependant, il vous faudra écrire vous même les requêtes HTTP, e.g.
```
$ nc localhost 8080
POST /echo%20(body) HTTP/1.1
Content-Type: plain/text
Content-Length: 5

Hello
```

💡 L'option `-l` démarre un serveur TCP, permettant alors de recevoir des requêtes HTTP générées par e.g. `curl`.

### Via JavaScript/Brython

#### Envoyer une requête avec fetch

La fonction asynchrone <js-code>fetch(<var>$URL</var>[, <var>$RequestInit</var>])</js-code> envoie une requête HTTP et retourne un `Response`.

<vshs-playground name="echo (string)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (string)"><i>Tester l'exemple dans le bac à sable</i></a></div>

`RequestInit` peut contenir les champs suivants :
- `method` : la méthode HTTP à utiliser (e.g. `GET`) ;
- `body` : le corps de la requête HTTP ;
- `headers` : des en-têtes HTTP à ajouter à la requête ;
- `cache` : la politique de cache à utiliser ;

💡 Vous pouvez aussi construire un `Request` et le donner en paramètre de `fetch()`:

<vshs-playground name="fetch (request)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=fetch (request)"><i>Tester l'exemple dans le bac à sable</i></a></div>

💡 La construction d'un `Request` est similaire par bien des aspects à la construction d'un `Response`.

💡 Pour répéter une requête, vous pouvez construire un <js-code>Request</js-code> que vous clonerez avant de le transmettre à `fetch()`.

<vshs-playground name="fetch (clone)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=fetch (clone)"><i>Tester l'exemple dans le bac à sable</i></a></div>

⚠ Contrairement à `Response`, `Request` ne dispose pas pour le moment d'une méthode statique `.json()` (cf [issue](https://github.com/whatwg/fetch/issues/1791)).<br/>
Il convient alors d'utiliser :


<vshs-playground name="echo (json)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (json)"><i>Tester l'exemple dans le bac à sable</i></a></div>

#### Lire une réponse

`await fetch()` retourne un `Response` représentant la réponse du serveur.

💡 La lecture d'un `Response` est similaire par bien des aspects à la lecture d'un `Request`.

`Response` a les propriétés suivantes :
- `.ok` : indique si la réponse représente un succès ;
- `.status` : le code de status HTTP ;
- `.statusText` : un message décrivant le code de status HTTP ;
- `.headers` : les en-têtes de la réponse HTTP.

<vshs-playground name="fetch (read)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=fetch (read)"><i>Tester l'exemple dans le bac à sable</i></a></div>

#### EventSource


Les [Server-Sent Events](https://developer.mozilla.org/fr/docs/Web/API/Server-sent_events) permettent de recevoir progressivement des données du serveur.

On peut alors utiliser `new EventSource(url)` afin de lire les événements envoyés par le serveur :

<vshs-playground name="fetch (SSE)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=fetch (SSE)"><i>Tester l'exemple dans le bac à sable</i></a></div>

💡 Progressivement, `EventSource` a vocation à être remplacé par les flux fetch. Cependant, il s'agit d'une API bas niveau.

#### WebSocket

Les [`WebSocket`](https://developer.mozilla.org/fr/docs/Web/API/WebSocket) permettent des communications bidirectionnelles asynchrones entre le navigateur et le serveur :
- `new WebSocket(url)` permet d'initialiser un nouveau WebSocket ;
- `send(data)` permet d'envoyer des données ;
- `addEventListener('message', ({data}) => {})` permet d'écouter les données reçues. 

<vshs-playground name="response (WebSocket)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (WebSocket)"><i>Tester l'exemple dans le bac à sable</i></a></div>

⚠ Vous devez attendre que la connexion soit ouverte avant d'envoyer des données (i.e. attendre l'événement `open`).

💡 Progressivement, les WebSockets ont vocation à être remplacés par l'API [`WebTransport`](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API). Cependant, comme pour les flux, il s'agit d'une API bas niveau.


aaaaaaaaaaaaa\
<c>fetch(<d><e>$URL</e></d><d>[, <e>$RequestInit</e>]</d>)</c>\
bbbbbbbbbbbbb

<style>
c {
    padding:0 .5rem;
    margin: 0 .2rem;
    white-space: nowrap;
    background: #F1F1F1;
    border: 1px solid #E1E1E1;
    border-radius: 4px;
    color:black;

    & > d {

        padding: 0 .5rem;
        margin: 0 .2rem;
        white-space: nowrap;
        background: lightblue;
        font-style: italic;
        border: 1px dashed blue;
        color: gray;
        border-radius: 4px;

        & e {
            color: #ff8c00;
            font-weight: bold;
            font-style: normal;
        }
    }
}
</style>


<script type="c-js">
    const a = 2+2;

    console.log("Hello World"<h>[, $a]</h>);
</script>

aaaaa\
cc <script type="c-js">const a = 2+2<h>[, $a]</h>;</script> cc\
bbbbbb

</main>
    </body>
</html>