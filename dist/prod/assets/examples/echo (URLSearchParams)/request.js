const r = await fetch("/echo (URLSearchParams)", {
    method : "POST",
    body   : new URLSearchParams({a:"42", b:"1337"})
});

print_response(r);