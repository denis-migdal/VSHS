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
    <body code-langs="js,bry">
        <main>

# Lire une requête HTTP reçue

La requête HTTP reçue est donnée par le premier argument du *request handler* sous la forme d'une instance de [<script type='c-js'>Request</script>](https://developer.mozilla.org/fr/docs/Web/API/Request).

## Lire le contenu de la réponse

En général vous souhaiterez lire les données au format JSON grâce à la méthode asynchrone <script type='c-js'>.json()</script> :

<vshs-playground name="echo (json)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (json)"><i>Tester l'exemple dans le bac à sable</i></a></div>

<script type="c-js">Response</script> possède différentes méthodes asynchrones permettant de lire différent types de données (cliquez pour afficher) :

<details>
    <summary><b>Texte</b> : avec <script type="c-js">.text()</script>, retourne un <script type="c-js">string</script>.</summary>
    <vshs-playground name="echo (string)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (string)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Paires clefs-valeurs</b> : avec <script type="c-js">.formData()</script>, retourne un <a href="https://developer.mozilla.org/fr/docs/Web/API/FormData"><script type="c-js">FormData</script></a> (peut servir à initialiser un  <a href="https://developer.mozilla.org/fr/docs/Web/API/URLSearchParams"><script type="c-js">URLSearchParams</script></a>).</summary>
    <vshs-playground name="echo (URLSearchParams)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (URLSearchParams)"><i>Tester l'exemple dans le bac à sable</i></a></div>
    <vshs-playground name="echo (FormData)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (FormData)"><i>Tester l'exemple dans le bac à sable</i></a></div>
    💡 Préférez les <js-code>URLFormParams</js-code> aux <js-code>FormData</js-code>, le format de ces derniers changeant en fonction de la plateforme utilisée.
</details>
<details>
    <summary><b>Données binaires</b> : avec <script type="c-js">.bytes()</script>, retourne un <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array"><script type="c-js">Uint8Array</script></a>, ou <script type="c-js">.arrayBuffer()</script>, retourne un <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer"><script type="c-js">ArrayBuffer</script></a>.</summary>
    <vshs-playground name="echo (Uint8Array)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (Uint8Array)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Fichiers</b> : avec <script type="c-js">.blob()</script>, retourne un <a href="https://developer.mozilla.org/fr/docs/Web/API/Blob"><script type="c-js">Blob</script></a>.</summary>
    <vshs-playground name="echo (Blob)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (Blob)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Flux</b> : avec <script type="c-js">.body</script>, retourne un <a href="https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream"><script type="c-js">ReadableStream</script></a>.</summary>
    <vshs-playground name="echo (body)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (body)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>

⚠ Le corps de la requête ne peut être lue qu'une seule fois. La propriété <script type="c-js">.bodyUsed</script> indique s'il a été lu.

## Extraire des informations de l'URL

L'URL utilisée pour générer la requête est stockée dans <script type="c-js">request.url</script>. À partir de celle-ci vous pouvez générer un <script type="c-js">URLSearchParams</script> afin de manipuler les paramètres transmis via l'URL :

<vshs-playground name="echo (url search)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (url search)"><i>Tester l'exemple dans le bac à sable</i></a></div>

## En-tête

Vous pouvez accéder aux en-têtes de la requête via la propriété <script type="c-js">.headers</script> retournant une instance de [<script type="c-js">Headers</script>](https://developer.mozilla.org/fr/docs/Web/API/Headers).

<vshs-playground name="echo (body)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (body)"><i>Tester l'exemple dans le bac à sable</i></a></div>



</main>
    </body>
</html>