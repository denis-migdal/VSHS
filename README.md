<div align="center">
  <h1>VSHS : Very Simple HTTP Server</h1>

  <p>Build very easily an HTTP server in TS, JS, or Brython.</p>
</div>

Documentation (fr) : https://denis-migdal.github.io/VSHS/dist/dev/pages/docs/fr/

## Build documentation

- `npm run build`
- `npm run watch`

# OLD

### Routes variables

The `route` parameter has two components:

- `path` is the route path, e.g. `/params/{name}/GET.ts`. Letters in between braces represents a variable, corresponding to set of letters (except `/`). Hence a single route path can match several URL, e.g.:
  
  - `/params/faa`
  - `/params/fuu`

- `vars` is an object whose keys are the path variables names and whose values their values in the current URL, e.g.:
  
  - `{name: "faa"}`
  - `{name: "fuu"}`

### Mime-type

| Return            | Mime                                              |
| ----------------- | ------------------------------------------------- |
| `string`          | `text/plain`                                      |
| `URLSearchParams` | `application/x-www-form-urlencoded`               |
| `FormData`        | `application/x-www-form-urlencoded`               |
| `Uint8Array`      | `application/octet-stream`                        |
| `Blob`            | `blob.type`<br/>or<br/>`application/octet-stream` |
| `any`             | `application/json`                                |
| `SSEResponse`     | `text/event-stream`                               |

| Mime                                | Result               |
| ----------------------------------- | -------------------- |
| No body                             | `null`               |
| `text/plain`                        | `string` or `Object` |
| `application/x-www-form-urlencoded` | `Object`             |
| `application/json`                  | `Object`             |
| `application/octet-stream`          | `Uint8Array`         |
| others                              | `Blob`               |

💡 The default mime-types set by the client are :

| Source            | Mime-type                           |
| ----------------- | ----------------------------------- |
| `string`          | `text/plain`                        |
| `URLSearchParams` | `application/x-www-form-urlencoded` |
| `FormData`        | `application/x-www-form-urlencoded` |
| `Uint8Array`      | None                                |
| `Blob`            | `blob.type` or none                 |
| `curl -d`         | `application/x-www-form-urlencoded` |

💡 To provide an explicit mime-type in the query :

```typescript
fetch('...', {body: ..., headers: {"Content-Type", "..."})
```

### Static ressources

You can also provide a directory containing static files 

```ts
startHTTPServer({
  port: 8080,
  hostname: 'localhost',
  routes: '/routes',
  static: '/assets'
});
```