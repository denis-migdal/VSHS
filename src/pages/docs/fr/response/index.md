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

# Construire une réponse HTTP (à retourner)

Pour répondre à une requête HTTP, il suffit de retourner une instance de [`Response`](https://developer.mozilla.org/fr/docs/Web/API/Response).

## Indiquer le contenu de la réponse

En général vous souhaiterez envoyer des données au format JSON grâce à la **méthode statique** `Response.json()` :

<vshs-playground name="response (json)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (json)"><i>Tester l'exemple dans le bac à sable</i></a></div>

Vous pouvez aussi utiliser le **constructeur** de `Response` afin d'envoyer différent types de données (cliquez pour afficher) :

<details>
    <summary><b>Texte</b> : avec <js-code>string</js-code>.</summary>
    <vshs-playground name="response (string)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (string)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Paires clefs-valeurs</b> : avec <a href="https://developer.mozilla.org/fr/docs/Web/API/URLSearchParams"><js-code>URLSearchParams</js-code></a> ou <a href="https://developer.mozilla.org/fr/docs/Web/API/FormData"><js-code>FormData</js-code></a>.</summary>
    <vshs-playground name="response (URLSearchParams)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (URLSearchParams)"><i>Tester l'exemple dans le bac à sable</i></a></div>
    <vshs-playground name="response (FormData)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (FormData)"><i>Tester l'exemple dans le bac à sable</i></a></div>
    💡 Préférez les <js-code>URLFormParams</js-code> aux <js-code>FormData</js-code>, le format de ces derniers changeant en fonction de la plateforme utilisée.
</details>
<details>
    <summary><b>Données binaires</b> : usuellement avec <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array"><js-code>Uint8Array</js-code></a>, mais aussi <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer"><js-code>ArrayBuffer</js-code></a>, <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/TypedArray"><js-code>TypedArray</js-code></a>, ou <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/DataView"><js-code>DataView</js-code></a>.</summary>
    <vshs-playground name="response (Uint8Array)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (Uint8Array)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Fichiers</b> : avec <a href="https://developer.mozilla.org/fr/docs/Web/API/Blob"><js-code>Blob</js-code></a> ou <a href="https://developer.mozilla.org/fr/docs/Web/API/File"><js-code>File</js-code></a>.</summary>
    <vshs-playground name="response (Blob)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (Blob)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Flux</b> : avec <a href="https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream"><js-code>ReadableStream</js-code></a>.</summary>
    Cf <a href="#flux-et-server-sent-events">Flux et Server-Sent Events</a>.
</details>

💡 Si vous ne retournez aucun <js-code>Response</js-code>, VSHS en retournera un automatiquement :

<vshs-playground name="response (none)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (none)"><i>Tester l'exemple dans le bac à sable</i></a></div>

💡 Pour des réponses constantes, vous pouvez construire un <js-code>Response</js-code> global que vous clonerez dans le *request handler* :
<vshs-playground name="response (clone)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (clone)"><i>Tester l'exemple dans le bac à sable</i></a></div>

## Gestion des erreurs

### Codes de status HTTP

Lors de la construction d'un `Response`, il est possible d'indiquer un code de status HTTP ainsi qu'un texte descriptif :
<vshs-playground name="response (status)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (status)"><i>Tester l'exemple dans le bac à sable</i></a></div>

⚠ Actuellement, Deno ne supporte pas les `statusText` personnalisés.

💡 Vous pouvez aussi lancer (*throw*) un `Response` qui sera automatiquement retourné :
<vshs-playground name="response (throw response)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (throw response)"><i>Tester l'exemple dans le bac à sable</i></a></div>

### Erreurs et Exceptions

Par défaut, les exceptions/erreurs lancées qui ne sont pas des `Response` sont convertis en une `Response` avec un status 500 et un corps contenant le message d'erreur (statusText n'étant pas supporté par Deno) :
<vshs-playground name="response (error)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (error)"><i>Tester l'exemple dans le bac à sable</i></a></div>

### Redirections

💡 Vous pouvez effectuer une redirection grâce à la **méthode statique** `Response.redirect()` :
<vshs-playground name="response (redirect)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (redirect)"><i>Tester l'exemple dans le bac à sable</i></a></div>

Son premier paramètre est l'URL vers laquelle rediriger, et son second paramètre (facultatif) le code de status HTTP :
- `307` : redirection temporaire ;
- `308` : redirection permanente.

## En-tête

Vous pouvez préciser des en-têtes à inclure à la réponse HTTP via une instance [`Headers`](https://developer.mozilla.org/fr/docs/Web/API/Headers), ou via un tableau associatif :

<vshs-playground name="response (headers)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (headers)"><i>Tester l'exemple dans le bac à sable</i></a></div>
 

## Flux et Server-Sent Events

Il est aussi possible de retourner des flux grâce à l'<a href="https://developer.mozilla.org/en-US/docs/Web/API/Streams_API">API Streams</a>. Elle permet des opérations de bas niveau sur les flux :
- l'encodage/décodage d'un flux avec [`TextEncoderStream`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoderStream)/[`TextDecoderStream`](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoderStream).
- la compression/décompression d'un flux avec [`CompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream)/[`DecompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream).
- ainsi que des opérations arbitraires via [`TransformStream`](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream).

<details>
    <summary>Cliquez ici pour afficher un exemple de flux.</summary>
    <vshs-playground name="response (stream)" show="index.code,output">
    </vshs-playground>
    <div style="text-align:right"><a href="../../../playground/?example=response (stream)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>

💡 Pour des opérations de haut niveau, il convient d'utiliser des designs patterns décorateurs sur `writable.getWriter()` et `readable.getReader()` :

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

`SSEResponse` prend en paramètre :
- un callback appelé avec `writer` et `..args` en paramètres ;
- (facultatif) un `ResponseInit` permettant de configurer le `Response`;
- (facultatif) une liste d'arguments `...args` transmis au callback.

## Websockets

Les [`WebSocket`](https://developer.mozilla.org/fr/docs/Web/API/WebSocket) permettent des communications bidirectionnelles asynchrones entre le navigateur et le serveur :
- `send(data)` permet d'envoyer des données ;
- `addEventListener('message', ({data}) => {})` permet d'écouter les données reçues. 

<vshs-playground name="response (WebSocket)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=response (WebSocket)"><i>Tester l'exemple dans le bac à sable</i></a></div>

⚠ Vous devez attendre que la connexion soit ouverte avant d'envoyer des données (i.e. attendre l'événement `open`).

💡 Progressivement, les WebSockets ont vocation à être remplacés par l'API [`WebTransport`](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API). Cependant, comme pour les flux, il s'agit d'une API bas niveau.

</main>
    </body>
</html>