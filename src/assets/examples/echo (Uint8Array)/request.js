const r = await fetch("/echo (Uint8Array)", {
    method : "POST",
    body   : new Uint8Array([65, 66, 67])
});

print_response(r);