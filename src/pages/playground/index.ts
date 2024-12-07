import "../../../libs/LISS/src/pages/docs/skeleton/";

import "./code/vshs-playground/VSHSPlayground";


const examples = [
    "Hello World",
    "echo (url)",
    "echo (body)",
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
    "response (WebSocket)",
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
if( example !== null) {
    setExample(example);
}