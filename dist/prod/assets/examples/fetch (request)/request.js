const req = new Request("/fetch (request)", {
    method : "POST",
    body   : "foo"
});

const r = await fetch(req);

print_response(r);