const r = await fetch("/echo (json)", {
    method : "POST",
    body   : self.JSON.stringify({a:42}),
    headers: {
        "Content-Type": "application/json"
    }
});

print_response(r);