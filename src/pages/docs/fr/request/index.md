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

# Lire une requête HTTP reçue

La requête HTTP reçue est donnée par le premier argument du *request handler* sous la forme d'une instance de [`Request`](https://developer.mozilla.org/fr/docs/Web/API/Request).

## Lire le contenu de la réponse

En général vous souhaiterez lire les données au format JSON grâce à la méthode asynchrone `.json()` :

<vshs-playground name="echo (json)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (json)"><i>Tester l'exemple dans le bac à sable</i></a></div>

Vous pouvez aussi utiliser d'autres méthodes asynchrone de `Response` afin de lire différent types de données (cliquez pour afficher) :

<details>
    <summary><b>Texte</b> : avec <js-code>.text()</js-code>, retourne un <js-code>string</js-code>.</summary>
    <vshs-playground name="echo (string)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (string)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Paires clefs-valeurs</b> : avec <js-code>.formData()</js-code>, retourne un <a href="https://developer.mozilla.org/fr/docs/Web/API/FormData"><js-code>FormData</js-code></a> (peut servir à initialiser un  <a href="https://developer.mozilla.org/fr/docs/Web/API/URLSearchParams"><js-code>URLSearchParams</js-code></a>).</summary>
    <vshs-playground name="echo (URLSearchParams)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (URLSearchParams)"><i>Tester l'exemple dans le bac à sable</i></a></div>
    <vshs-playground name="echo (FormData)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (FormData)"><i>Tester l'exemple dans le bac à sable</i></a></div>
    💡 Préférez les <js-code>URLFormParams</js-code> aux <js-code>FormData</js-code>, le format de ces derniers changeant en fonction de la plateforme utilisée.
</details>
<details>
    <summary><b>Données binaires</b> : usuellement avec <js-code>.bytes()</js-code>, retourne un <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array"><js-code>Uint8Array</js-code></a>, mais aussi <js-code>.arrayBuffer()</js-code>, retourne un <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer"><js-code>ArrayBuffer</js-code></a>.</summary>
    <vshs-playground name="echo (Uint8Array)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (Uint8Array)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Fichiers</b> : avec `.blob()`, retourne un <a href="https://developer.mozilla.org/fr/docs/Web/API/Blob"><js-code>Blob</js-code></a>.</summary>
    <vshs-playground name="echo (Blob)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (Blob)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>
<details>
    <summary><b>Flux</b> : avec <js-code>.body</js-code>, retourne un <a href="https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream"><js-code>ReadableStream</js-code></a>.</summary>
    <vshs-playground name="echo (body)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (body)"><i>Tester l'exemple dans le bac à sable</i></a></div>
</details>

⚠ Le corps de la requête ne peut être lue qu'une seule fois. La propriété `.bodyUsed` indique s'il a été lu.

## Extraire des informations de l'URL

+ method ?

## En-tête

[TODO]

</main>
    </body>
</html>