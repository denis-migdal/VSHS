<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf8"/>
        <title>VSHS</title>
        <meta name="color-scheme" content="dark light">
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link   href="/skeleton/index.css"  rel="stylesheet">
        <script  src="/skeleton/index.js"  type="module"     blocking="render" async></script>
    </head>
    <body class="hide_h1">
        <main>

# Démarrer et requêter le serveur HTTP

L'intégralité du serveur est contenu dans le fichier <script type="c-text">./VSHS.ts</script>. Les autres fichiers contiennent les exemples, tests, et documentations.

## Démo et tests

Vous pouvez lancer le serveur de démonstration via la commande <script type="c-shell">deno task demo</script>. Une fois le serveur lancé :
- lancez les tests unitaires via la commande <script type="c-shell">deno task test</script>.
- utilisez le serveur au sein du [bac à sable](../../../playground/) en cochant l'option "Server" présente en haut de la page.

## Démarrer le serveur

### En ligne de commandes (CLI)

Un serveur VSHS peut être lancé en lignes de commandes via <script type="c-shell">./VSHS.ts <h>$ROUTES</h></script>, avec <script type="c-shell"><h>$ROUTES</h></script> le dossier contenant les *requests handlers*.

💡 L'option <script type="c-shell">--help</script> permet d'afficher l'usage de la commande.

### Via Deno (TypeScript)

<script type="c-text">VSHS.ts</script> exporte par défaut une fonction <script type="c-js">startHTTPServer(<h>$OPTS</h>)</script> permettant de lancer un serveur. Elle accepte plusieurs options :
- <script type="c-js">.routes</script> : le chemin du dossier contenant les *requests handlers*, ou un ensemble de routes.
- <script type="c-js">.hostname</script> : l'ip sur lequel le serveur HTTP va écouter.
- <script type="c-js">.port</script> : le port sur lequel le serveur HTTP va écouter.
- ...

Par exemple :
<script type="c-ts">
    // myserver.ts
    import startHTTPServer from "VSHS";

    startHTTPServer({
        routes: <h>$ROUTES</h>
    });
</script>

Vous pouvez ensuite lancer votre serveur via la commande : <script type="c-shell">run --allow-all myserver.ts</script>.

💡 Lors du développement vous pouvez utiliser les options suivantes :
- <script type="c-shell">--check</script> : vérifier les types TypeScripts ;
- <script type="c-shell">--watch=<h>$DIR</h></script> : relancer le serveur lorsque les fichiers du dossier <script type="c-shell"><h>$DIR</h></script> sont modifiés.

💡 Vous pouvez aussi [configurer Deno](https://docs.deno.com/runtime/fundamentals/configuration/) via les fichiers <script type="c-text">deno.json</script> et <script type="c-text">package.json</script>


## Requêter le serveur

### En ligne de commandes (CLI)

#### Requêtes HTTP avec curl/wget

Les commandes <script type="c-shell">curl</script> et <script type="c-shell">wget</script> permettent d'envoyer des requêtes HTTP à un serveur et d'afficher sa réponse. Leur usage est décrit par le tableau ci-dessous :
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
        <tr><th>Envoyer une requête</th><td><script type="c-shell">curl <h>$URL</h></script></td><td><script type="c-shell">wget -qO- <h>$URL</h></script></td></tr>
        <tr><th>Méthode HTTP</th><td><script type="c-shell">-X <h>$HTTP_METHOD</h></script></td><td><script type="c-shell">--method=<h>$HTTP_METHOD</h></script></td></tr>
        <tr><th>Données</th><td><script type="c-shell">-d <h>$DATA</h></script></td><td><script type="c-shell">--body-data=<h>$DATA</h></script></td></tr>
        <tr><th>Ajouter en-tête</th><td><script type="c-shell">-H "<h>$NAME</h>: <h>$VALUE</h>"</script></td><td><script type="c-shell">--header="<h>$NAME</h>: <h>$VALUE</h>"</script></td></tr>
        <tr><th>En-tête de la réponse</th><td><script type="c-shell">-i</script></td><td>
<script type="c-shell">-S</script></td></tr>
        <tr><th>Afficher les en-têtes</th><td><script type="c-shell">-v</script></td><td>
<script type="c-shell">--debug</script></td></tr>
    </tbody>
</table>

**Exemple 1 :**

<script type="c-shell">
    $ curl -X GET "http://localhost:8080/Hello%20World" -w "

    Content    : %{content_type}
    Status code: %{http_code}
    "
</script>
Résultat :
<script type="c-text">
    Hello World ;)

    Content    : text/plain;charset=UTF-8
    Status code: 200
</script>

**Exemple 2 :**

<script type="c-shell">
    $ curl -X POST -d '{"A": 42}' "http://localhost:8080/echo%20(body)" -w "\n"
</script>
Résultat :
<script type="c-text">
    {"A": 42}
</script>

💡 L'option <script type="c-shell">-w</script> de <script type="c-shell">curl</script> permet de formatter la sortie, notamment en affichant :<br/>
- <script type="c-shell">content_type</script>
- <script type="c-shell">http_code</script>

#### WebSockets

La commande <script type="c-shell">wscat -c <h>$URL</h></script> permet de se connecter au serveur via un WebSocket, e.g. :
<script type="c-shell">
    $ wscat -c "http://localhost:8080/response (WebSocket)"
</script>
Résultat :
<script type="c-text">
    Connected (press CTRL+C to quit)
    > Hello
    < Hello
</script>

💡 <script type="c-shell">wscat</script> s'installe via la commande <script type="c-shell">npm install -g wscat</script> (requiert les droits administrateur).

#### TCP

Vous pouvez requêter le serveur directement en TCP via la commande <script type="c-shell">nc <h>$HOST</h> <h>$PORT</h></script>.

Cependant, il vous faudra écrire vous même les requêtes HTTP, e.g.
<script type="c-shell">
    $ nc localhost 8080
    POST /echo%20(body) HTTP/1.1
    Content-Type: plain/text
    Content-Length: 5

    Hello
</script>

💡 L'option <script type="c-shell">-l</script> démarre un serveur TCP, permettant alors de recevoir des requêtes HTTP générées par e.g. <script type="c-shell">curl</script>.

### Via JavaScript/Brython

#### Envoyer une requête avec fetch

La fonction asynchrone <script type="c-js">fetch(<h>$URL</h><h>[, $RequestInit]</h>)</script> envoie une requête HTTP et retourne un <script type="c-js">Response</script>.

<vshs-playground name="echo (string)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (string)"><i>Tester l'exemple dans le bac à sable</i></a></div>

<script type="c-js">RequestInit</script> peut contenir les champs suivants :
- <script type="c-js">.method</script> : la méthode HTTP à utiliser (e.g. <script type="c-http">GET</script>) ;
- <script type="c-js">.body</script> : le corps de la requête HTTP ;
- <script type="c-js">.headers</script> : des en-têtes HTTP à ajouter à la requête ;
- <script type="c-js">.cache</script> : la politique de cache à utiliser ;

💡 Vous pouvez aussi construire un <script type="c-js">Request</script> et le donner en paramètre de <script type="c-js">fetch(<h>$REQUEST</h>)</script> :

<vshs-playground name="fetch (request)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=fetch (request)"><i>Tester l'exemple dans le bac à sable</i></a></div>

💡 La construction d'un <script type="c-js">Request</script> est similaire par bien des aspects à la construction d'un <script type="c-js">Response</script>.

💡 Pour répéter une requête, clonez le <script type="c-js">Request</script> avant de le transmettre à <script type="c-js">fetch</script> : <script type="c-js">fetch(<h>$REQUEST</h>.clone())</script>.

<vshs-playground name="fetch (clone)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=fetch (clone)"><i>Tester l'exemple dans le bac à sable</i></a></div>

⚠ Contrairement à <script type="c-js">Response</script>, <script type="c-js">Request</script> ne dispose pas pour le moment d'une méthode statique <script type="c-js">.json()</script> (cf [issue](https://github.com/whatwg/fetch/issues/1791)).<br/>
Il convient alors d'utiliser le code suivant :


<vshs-playground name="echo (json)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (json)"><i>Tester l'exemple dans le bac à sable</i></a></div>

#### Lire une réponse

<script type="c-js">await fetch(<h>$URL</h>)</script> retourne un <script type="c-js">Response</script> représentant la réponse du serveur.

💡 La lecture d'un <script type="c-js">Response</script> est similaire par bien des aspects à la lecture d'un <script type="c-js">Request</script>. Il possède par ailleurs les propriétés suivantes :
- <script type="c-js">.ok</script> : indique si la réponse représente un succès ;
- <script type="c-js">.status</script> : le code de status HTTP ;
- <script type="c-js">.statusText</script> : un message décrivant le code de status HTTP ;
- <script type="c-js">.headers</script> : les en-têtes de la réponse HTTP.

<vshs-playground name="fetch (read)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=fetch (read)"><i>Tester l'exemple dans le bac à sable</i></a></div>

#### EventSource


Les [Server-Sent Events](https://developer.mozilla.org/fr/docs/Web/API/Server-sent_events) permettent de recevoir progressivement des données du serveur.

On peut alors utiliser <script type="c-js">new EventSource(<h>$URL</h>)</script> afin de lire les événements envoyés par le serveur :

<vshs-playground name="fetch (SSE)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=fetch (SSE)"><i>Tester l'exemple dans le bac à sable</i></a></div>

💡 Progressivement, <script type="c-js">EventSource</script> a vocation à être remplacé par les flux fetch. Cependant, il s'agit d'une API bas niveau.

#### WebSocket

Les [<script type="c-js">WebSocket</script>](https://developer.mozilla.org/fr/docs/Web/API/WebSocket) permettent des communications bidirectionnelles asynchrones entre le navigateur et le serveur :
- <script type="c-js">new WebSocket(<h>$URL</h>)</script> permet d'initialiser un nouveau WebSocket ;
- <script type="c-js">send(<h>$DATA</h>)</script> permet d'envoyer des données ;
- <script type="c-js">addEventListener('message', <h>({data}) => {}</h>)</script> permet d'écouter les données reçues. 

<vshs-playground name="response (WebSocket)" show="request.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (WebSocket)"><i>Tester l'exemple dans le bac à sable</i></a></div>

⚠ Vous devez attendre que la connexion soit ouverte avant d'envoyer des données (i.e. attendre l'événement <script type="c-js">open</script>).

💡 Progressivement, les WebSockets ont vocation à être remplacés par l'API [<script type="c-js">WebTransport</script type="c-js">](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API). Cependant, comme pour les flux, il s'agit d'une API bas niveau.

</main>
    </body>
</html>