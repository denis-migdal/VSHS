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

# Documentation VSHS

VSHS vous permet de créer très facilement votre propre serveur Web HTTP.

Pour cela, il vous suffit de définir une fonction (*request handler*) qui répondra aux requêtes reçues par votre serveur, avec :
- en **entrée**, la *requête HTTP* ([<script type="c-js">Request</script>](https://developer.mozilla.org/fr/docs/Web/API/Request)) reçue ;
- en **sortie**, la *réponse HTTP* ([<script type="c-js">Response</script>](https://developer.mozilla.org/fr/docs/Web/API/Response)) à retourner.


<vshs-playground name="echo (url)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../playground/?example=echo (url)"><i>Tester l'exemple dans le bac à sable</i></a></div>

💡 Vous pouvez changer le langage (JavaScript ou Brython) via l'icône en haut à droite de la page.<br/>
💡 [TODO] Learn more about playground.

Les *requests handlers* sont définis dans un dossier <script type="c-text"><h>$ROUTES</h></script> de votre choix. Les requêtes HTTP effectuées sur la route (≈ensemble d'URL) <script type="c-text"><h>$PATH</h></script> sont alors traitées par les *requests handlers* définis dans le sous-dossier <script type="c-text"><h>$ROUTES</h>/<h>$PATH</h>/</script>.<br/>
Par exemple, les requêtes HTTP effectuées sur l'URL <script type="c-text">/foo/faa</script> seront traitées par les *requests handlers* contenus dans le sous-dossier <script type="c-text"><h>$ROUTES</h>/foo/faa/</script>.

Dans ce sous-dossier, chaque fichier défini le *request handler* qui traitera la méthode HTTP de même nom.
Par exemple, la requête HTTP <script type="c-text">GET /foo/faa</script> sera traitée par le *request handler* contenu dans le fichier <script type="c-text"><h>$ROUTES</h>/foo/faa/GET.ts</script>\
(ou <script type="c-text">GET.js</script>/<script type="c-text">GET.bry</script>).

⚠ Pour que les *requests handlers* puissent être correctement chargés dans VSHS :
- Les fichiers TypeScript/JavaScript doivent faire un export par défaut du *request handler* (<script type="c-js">export default</script>).
- Les fichiers Brython doivent nommer le *request handler* <script type="c-python">RequestHandler</script>.

Vous pouvez en apprendre plus sur la manière d'utiliser VSHS via les liens suivants :
- [Démarrer et requêter le serveur HTTP](./server) ;
- [Construire une réponse HTTP (à retourner)](./response) ;
- [Lire une requête HTTP reçue](./request) ;
- [Définir une route](./routes).

</main>
    </body>
</html>