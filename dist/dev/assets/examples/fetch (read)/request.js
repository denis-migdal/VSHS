const r = await fetch("/fetch (read)");

const status     = r.status;
const statusText = r.statusText;
const type       = r.headers.get("Content-Type")

const content    = await r.text()

document.body.textContent = `${status}: ${statusText}
${type}

${content}`;