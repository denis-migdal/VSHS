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
    <body class="hide_h1">
        <main>

# Construire une réponse HTTP (à retourner)

Pour répondre à une requête HTTP, il suffit de retourner une instance de [<script type="c-js">Response</script>](https://developer.mozilla.org/fr/docs/Web/API/Response).

## Indiquer le contenu de la réponse

En général vous souhaiterez envoyer des données au format JSON grâce à la **méthode statique** <script type="c-js">Response.json()</script> :

<vshs-playground name="response (json)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (json)"><i>Tester l'exemple dans le bac à sable</i></a></div>

Vous pouvez aussi utiliser le **constructeur** de <script type="c-js">Response</script> afin d'envoyer différent types de données (cliquez pour afficher) :

<details>
    <summary><b>Texte</b> : avec <script type="c-js">string</script>.</summary>
    <vshs-playground name="response (string)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (string)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Paires clefs-valeurs</b> : avec <a href="https://developer.mozilla.org/fr/docs/Web/API/URLSearchParams"><script type="c-js">URLSearchParams</script></a> ou <a href="https://developer.mozilla.org/fr/docs/Web/API/FormData"><script type="c-js">FormData</script></a>.</summary>
    <vshs-playground name="response (URLSearchParams)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (URLSearchParams)"><i>Tester l'exemple dans le bac à sable</i></a></div>
    <vshs-playground name="response (FormData)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (FormData)"><i>Tester l'exemple dans le bac à sable</i></a></div>
    💡 Préférez les <js-code>URLFormParams</js-code> aux <js-code>FormData</js-code>, le format de ces derniers changeant en fonction de la plateforme utilisée.
</details>
<details>
    <summary><b>Données binaires</b> : usuellement avec <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array"><script type="c-js">Uint8Array</script></a>, mais aussi <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer"><script type="c-js">ArrayBuffer</script></a>, <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/TypedArray"><script type="c-js">TypedArray</script></a>, ou <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/DataView"><script type="c-js">DataView</script></a>.</summary>
    <vshs-playground name="response (Uint8Array)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (Uint8Array)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Fichiers</b> : avec <a href="https://developer.mozilla.org/fr/docs/Web/API/Blob"><script type="c-js">Blob</script></a> ou <a href="https://developer.mozilla.org/fr/docs/Web/API/File"><script type="c-js">File</script></a>.</summary>
    <vshs-playground name="response (Blob)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (Blob)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Flux</b> : avec <a href="https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream"><script type="c-js">ReadableStream</script></a>.</summary>
    Cf <a href="#flux-et-server-sent-events">Flux et Server-Sent Events</a>.
</details>

💡 Si vous ne retournez aucun <script type="c-js">Response</script>, VSHS en retournera un automatiquement :

<vshs-playground name="response (none)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (none)"><i>Tester l'exemple dans le bac à sable</i></a></div>

💡 Pour des réponses constantes, vous pouvez construire un <js-code>Response</js-code> global que vous clonerez dans le *request handler* :
<vshs-playground name="response (clone)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (clone)"><i>Tester l'exemple dans le bac à sable</i></a></div>

## Gestion des erreurs

### Codes de status HTTP

Lors de la construction d'un <script type="c-js">Response</script>, il est possible d'indiquer un code de status HTTP ainsi qu'un texte descriptif :
<vshs-playground name="response (status)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (status)"><i>Tester l'exemple dans le bac à sable</i></a></div>

⚠ Actuellement, Deno ne supporte pas les <script type="c-js">.statusText</script> personnalisés.

💡 Vous pouvez aussi lancer (*throw*) un <script type="c-js">Response</script> qui sera automatiquement retourné :
<vshs-playground name="response (throw response)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (throw response)"><i>Tester l'exemple dans le bac à sable</i></a></div>

### Erreurs et Exceptions

Par défaut, les exceptions/erreurs lancées qui ne sont pas des <script type="c-js">Response</script> sont convertis en une <script type="c-js">Response</script> avec un status <script type="c-js">500</script> et un corps contenant le message d'erreur (<script type="c-js">.statusText</script> n'étant pas supporté par Deno) :
<vshs-playground name="response (error)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (error)"><i>Tester l'exemple dans le bac à sable</i></a></div>

### Redirections

💡 Vous pouvez effectuer une redirection grâce à la **méthode statique** <script type="c-js">Response.redirect(<h>$URL</h><h>[, $HTTP_CODE]</h>)</script> :
<vshs-playground name="response (redirect)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (redirect)"><i>Tester l'exemple dans le bac à sable</i></a></div>

Son premier paramètre est l'URL vers laquelle rediriger, et son second paramètre (facultatif) le code de status HTTP :
- <script type="c-js">307</script> : redirection temporaire ;
- <script type="c-js">308</script> : redirection permanente.

## En-tête

Vous pouvez préciser des en-têtes à inclure à la réponse HTTP via une instance [<script type="c-js">Headers</script>](https://developer.mozilla.org/fr/docs/Web/API/Headers), ou via un tableau associatif :

<vshs-playground name="response (headers)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (headers)"><i>Tester l'exemple dans le bac à sable</i></a></div>
 

## Flux et Server-Sent Events

Il est aussi possible de retourner des flux grâce à l'<a href="https://developer.mozilla.org/en-US/docs/Web/API/Streams_API">API Streams</a>. Elle permet des opérations de bas niveau sur les flux :
- l'encodage/décodage d'un flux avec [<script type="c-js">TextEncoderStream</script>](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoderStream)/[<script type="c-js">TextDecoderStream</script>](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoderStream).
- la compression/décompression d'un flux avec [<script type="c-js">CompressionStream</script>](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream)/[<script type="c-js">DecompressionStream</script>](https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream).
- ainsi que des opérations arbitraires via [<script type="c-js">TransformStream</script>](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream).

<details>
    <summary>Cliquez ici pour afficher un exemple de flux.</summary>
    <vshs-playground name="response (stream)" show="index.code,output">
    </vshs-playground>
    <div style="text-align:right"><a href="../../../playground/?example=response (stream)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>

💡 Pour des opérations de haut niveau, il convient d'utiliser des designs patterns décorateurs sur <script type="c-js">writable.getWriter()</script> et <script type="c-js">readable.getReader()</script> :

<details>
    <summary>Cliquez ici pour afficher un exemple d'implémentation de Server-Sent Events.</summary>
    <vshs-playground name="response (SSE)" show="index.code,output">
    </vshs-playground>
    <div style="text-align:right"><a href="../../../playground/?example=response (SSE)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>

💡 VSHS fournit un *helper* permettant d'aisément retourner une réponse Server-Sent Event :
<vshs-playground name="response (SSE Helper)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (SSE Helper)"><i>Tester l'exemple dans le bac à sable</i></a></div>

<script type="c-js">VSHS.SSEResponse(<h>$CALLBACK</h><h>[, $ResponseInit[, ...$ARGS]]</h>)</script> prend en paramètre :
- un callback <script type="c-js">(writer<h>[, ...$ARGS]</h>) => void</script> ;
- (facultatif) un <script type="c-js">ResponseInit</script> permettant de configurer le <script type="c-js">Response</script> renvoyé ;
- (facultatif) une liste d'arguments <script type="c-js"><h>...$ARGS</h></script> transmis au callback.

## Websockets

Les [<script type="c-js">WebSocket</script>](https://developer.mozilla.org/fr/docs/Web/API/WebSocket) permettent des communications bidirectionnelles asynchrones entre le navigateur et le serveur :
- <script type="c-js">send(<h>$DATA</h>)</script> permet d'envoyer des données ;
- <script type="c-js">addEventListener('message', <h>({data}) => {}</h>)</script> permet d'écouter les données reçues. 

<vshs-playground name="response (WebSocket)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (WebSocket)"><i>Tester l'exemple dans le bac à sable</i></a></div>

⚠ Vous devez attendre que la connexion soit ouverte avant d'envoyer des données (i.e. attendre l'événement <script type="c-js">open</script>).

💡 Progressivement, les WebSockets ont vocation à être remplacés par l'API [<script type="c-js">WebTransport</script>](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API). Cependant, comme pour les flux, il s'agit d'une API bas niveau.

</main>
    </body>
</html>