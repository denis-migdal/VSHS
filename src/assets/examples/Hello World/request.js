const r = await fetch("/Hello World");

document.body.textContent = await r.text();