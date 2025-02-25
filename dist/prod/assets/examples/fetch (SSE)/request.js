const source = new EventSource("/fetch (SSE)");

source.addEventListener('close', () => {
    source.close();
})

source.addEventListener('message', (event) => {
    document.body.append(event.data);
});