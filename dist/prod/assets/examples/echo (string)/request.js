const r = await fetch("/echo (string)", {
    method : "POST",
    body   : "foo"
});

print_response(r);