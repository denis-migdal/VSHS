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


## Routes par défaut

### Code d'erreurs

### Fichiers statics/assets


</main>
    </body>
</html>