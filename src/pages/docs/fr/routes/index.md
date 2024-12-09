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

# Définir une route

## Paramètres de routes

Il est fréquent de traiter un ensemble d'URL suivant le même format (e.g. <js-code>/produits/<var>$ID</var></js-code> ) par le même *request handler* :
- `/produits/1` ;
- `/produits/2` ;
- `/produits/3` ;
- etc.

<js-code><var>$ID</var></js-code> est alors un **paramètre de route** et sera indiqué par son nom entre accolades, i.e. <js-code><var>{ID}</var></js-code>.<br/>
Il suffit ainsi de créer un fichier <js-code>/produits/{ID}/GET.ts</js-code> pour définir un *request handler* associé à cet ensemble d'URL.

Le second paramètre des requests handlers contient, entres autres :
- `path` : la route traitée ;
- `vars` : les paramètres de routes.

<vshs-playground name="echo (vars)" show="index.code,output">
</vshs-playground>
<div style="text-align:right"><a href="../../../playground/?example=echo (vars)"><i>Tester l'exemple dans le bac à sable</i></a></div>

## Route par défaut

En cas d'erreur non-traitée, ou de route non-trouvée, la requête sera redirigée vers la **route par défaut** `/default/GET`.

💡 Vous pouvez ainsi définir un *request handler* par défaut via le fichier `$ROUTES/default/GET.*`.

En cas d'erreurs, ce *request handler* sera appelé avec des propriétés additionnelles pour son second argument :
- `.error` : l'erreur reçue.
- `.route` : le second argument du premier *request handler* appelé.

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
        <tr><th>Tous</th><td><js-code>--default</js-code></td><td><js-code>default</js-code></td></tr>
        <tr><th>Route non trouvée</th><td><js-code>--not-found</js-code></td><td><js-code>not_found</js-code></td></tr>
        <tr><th>Erreur non-capturée</th><td><js-code>--internal-error</js-code></td><td><js-code>internal_error</js-code></td></tr>
    </tbody>
</table>

## [TODO] Assets

System (helper ?)

--assets
--assets-prefix
    + options

</main>
    </body>
</html>