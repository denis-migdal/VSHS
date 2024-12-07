const w = new WebSocket("/response (WebSocket)");

w.addEventListener("message", ({data})=> {
    document.body.textContent = data;
});

w.addEventListener("open", () => {
    w.send("Hello");
})