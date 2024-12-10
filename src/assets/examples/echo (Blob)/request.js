const r = await fetch("/echo (Blob)", {
    method : "POST",
    body   : new Blob(["a,b"], {
                type: "text/csv"
            })
});

print_response(r);