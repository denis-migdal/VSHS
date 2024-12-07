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

# Documentation VSHS

VSHS vous permet de créer très facilement votre propre serveur Web HTTP.

Pour cela, il vous suffit de définir une fonction (*request handler*) qui répondra aux requêtes reçues par votre serveur, avec :
- en **entrée**, la *requête HTTP* ([`Request`](https://developer.mozilla.org/fr/docs/Web/API/Request)) reçue ;
- en **sortie**, la *réponse HTTP* ([`Response`](https://developer.mozilla.org/fr/docs/Web/API/Response)) à retourner.


<vshs-playground name="echo (url)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../playground/?example=echo (url)"><i>Tester l'exemple dans le bac à sable</i></a></div>

💡 Vous pouvez changer le langage (JavaScript ou Brython) via l'icône en haut à droite de la page.<br/>
💡 [TODO] Learn more about playground.

Les *requests handlers* sont définis dans un dossier <js-code class="d4rk"><var>$ROUTES</var></js-code> de votre choix. Les requêtes HTTP effectuées sur la route (≈ensemble d'URL) <js-code class="d4rk"><var>$PATH</var></js-code> sont alors traitées par les *requests handlers* définis dans le sous-dossier <js-code class="d4rk"><var>$ROUTES</var>/<var>$PATH</var>/</js-code>.<br/>
Par exemple, les requêtes HTTP effectuées sur l'URL <js-code class="d4rk">/foo/faa</js-code> seront traitées par les *requests handlers* contenus dans le sous-dossier <js-code class="d4rk"><var>$ROUTES</var>/foo/faa/</js-code>.

Dans ce sous-dossier, chaque fichier défini le *request handler* qui traitera la méthode HTTP de même nom.
Par exemple, la requête HTTP <js-code>GET /foo/faa</js-code> sera traitée par le *request handler* contenu dans le fichier <js-code class="d4rk"><var>$ROUTES</var>/foo/faa/GET.ts</js-code> (ou <js-code>.js</js-code>/<js-code>.bry</js-code>).

⚠ Pour que les *requests handlers* puissent être correctement chargés dans VSHS :
- Les fichiers JavaScript (.js) et TypeScript (.ts) doivent faire un export par défaut du *request handler* (<j-code>export default</js-code>).
- Les fichiers Brython doivent nommer le *request handler* <py-code>RequestHandler</py-code>.

Vous pouvez en apprendre plus sur la manière d'utiliser VSHS via les liens suivants :
- [TODO] Démarrer et requêter le serveur HTTP.
    + API/CMD line ?
- [Construire une réponse HTTP (à retourner)](./response) ;
- [TODO] Lire une requête HTTP reçue.
- [TODO] Les routes/Définir des routes (?)
    + assets/static
    + error code ?

+ remove dead code... (parse/generate/HTTP Error)

</main>
    </body>
</html>