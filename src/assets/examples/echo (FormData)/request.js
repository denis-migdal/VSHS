const body = new FormData();
body.set("a", "42")
body.set("b", "1337")

const r = await fetch("/echo (FormData)", {
    method : "POST",
    body
});

print_response(r);