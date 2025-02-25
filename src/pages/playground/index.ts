import "@VSHS/pages/skeleton/";

import "@VSHS/components/vshs-playground/";


const examples = [
    "Hello World",
    "echo (url)",
    "echo (url search)",
    "echo (body)",
    "echo (json)",
    "echo (string)",
    "echo (URLSearchParams)",
    "echo (FormData)",
    "echo (Uint8Array)",
    "echo (Blob)",
    "echo (vars)",
    "response (json)",
    "response (string)",
    "response (URLSearchParams)",
    "response (FormData)",
    "response (Uint8Array)",
    "response (Blob)",
    "response (none)",
    "response (clone)",
    "response (redirect)",
    "response (status)",
    "response (throw response)",
    "response (error)",
    "response (stream)",
    "response (SSE)",
    "response (SSE Helper)",
    "response (WebSocket)",
    "response (headers)",
    "fetch (request)",
    "fetch (clone)",
    "fetch (read)",
    "fetch (SSE)"
];

// liss-playground
const playground = document.querySelector<HTMLElement>('vshs-playground')!;
function setExample(name: string) {
    selector.value = name;
    //playground.removeAttribute('show');
    playground.setAttribute('name', name);
}

// init server

const server     = document.querySelector<HTMLInputElement>('input:not([type="checkbox"])')!;
const use_server = document.querySelector<HTMLInputElement>('input[type="checkbox"]')!;


function updateServer() {

    const use = use_server.checked;
    const value = server.value;

    if( ! use || value === "") {
        playground.toggleAttribute('server', false);
        return;
    }

    playground.setAttribute('server', server.value);
}

    server.addEventListener('change', updateServer);
use_server.addEventListener('change', updateServer);
updateServer();

// init select

const selector = document.querySelector<HTMLSelectElement>('select')!;
//const webcomp_name = document.querySelector<HTMLInputElement>('input')!;

for(let example of examples)
    selector.append( new Option(example, example));

selector.addEventListener('change', () => {
    const url = new URL(location as any);
    url.searchParams.set("example", selector.value);
    history.pushState({}, "", url);

    setExample(selector.value);
});

// init current example

const searchParams = new URLSearchParams(location.search);
const example = searchParams.get('example');
setExample(example ?? selector.value);