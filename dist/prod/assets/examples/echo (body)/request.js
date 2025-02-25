const r = await fetch("/echo (body)", {
    method: "POST",
    body: "Hello ;)"
});

print_response(r);