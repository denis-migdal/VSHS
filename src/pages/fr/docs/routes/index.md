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

# Définir une route

## Paramètres de routes

Il est fréquent de traiter un ensemble d'URL suivant le même format (e.g. <script type="c-text">/produits/<h>$ID</h></script>) par le même *request handler* :
- `/produits/1` ;
- `/produits/2` ;
- `/produits/3` ;
- etc.

<script type="c-text"><h>$ID</h></script> est alors un <b>paramètre de route</b> et sera indiqué par son nom entre accolades, i.e. <script type="c-text">{ID}</script>.<br/>Il suffit ainsi de créer un fichier <script type="c-text">/produits/{ID}/GET.ts</script> pour définir un <i>request handler</i> associé à cet ensemble d'URL.

Le second paramètre des requests handlers contient, entres autres :
- <script type="c-js">.path</script> : la route traitée ;
- <script type="c-js">.vars</script> : les paramètres de routes.

<vshs-playground name="echo (vars)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (vars)"><i>Tester l'exemple dans le bac à sable</i></a></div>

## Route par défaut

En cas d'erreur non-traitée, ou de route non-trouvée, la requête sera redirigée vers la **route par défaut** <script type="c-text">/default/GET</script>.

💡 Vous pouvez ainsi définir un *request handler* par défaut via le fichier <script type="c-text"><h>$ROUTES</h>/default/GET.<h>$EXT</h></script>.

En cas d'erreurs, ce *request handler* sera appelé avec des propriétés additionnelles pour son second argument :
- <script type="c-js">.error</script> : l'erreur reçue.
- <script type="c-js">.route</script> : le second argument du premier *request handler* appelé.

💡 Vous pouvez redéfinir la route par défaut via les options suivantes :

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
        <tr><th></th><th>CLI</th><th>TS</th></tr>
    </thead>
    <tbody>
        <tr><th>Tous</th><td><script type="c-shell">--default</script></td><td><script type="c-js">.default</script></td></tr>
        <tr><th>Route non trouvée</th><td><script type="c-shell">--not_found</script></td><td><script type="c-js">.not_found</script></td></tr>
        <tr><th>Erreur non-capturée</th><td><script type="c-shell">--internal_error</script></td><td><script type="c-js">.internal_error</script></td></tr>
    </tbody>
</table>

## Assets

Les assets sont des fichiers statiques lus par le serveur puis renvoyés comme réponse.

VSHS offre quelques helpers pour cela :
- <script type="c-js">VSHS.fetchAsset(<h>$PATH</h>)</script> : retourne un <script type="c-js">ReadableStream</script> sur le fichier (lance une exception si n'existe pas).
- <script type="c-js">VSHS.getMime(<h>$PATH</h>)</script> : retourne le type-mime à partir du nom de fichier.

Pa défault, si une route n'est pas trouvée (et si le chemin commence par la valeur indiquée par <script type="c-js">.assets_prefix</script>), VSHS servira, s'il existe, le fichier correspondant.

<table>
    <thead>
        <tr><th></th><th>CLI</th><th>TS</th></tr>
    </thead>
    <tbody>
        <tr><th>Dossier contenant les assets</th><td><script type="c-shell">--assets</script></td><td><script type="c-js">.assets</script></td></tr>
        <tr><th>Préfixe du chemin</th><td><script type="c-shell">--assets_prefix</script></td><td><script type="c-js">.assets_prefix</script></td></tr>
    </tbody>
</table>

</main>
    </body>
</html>