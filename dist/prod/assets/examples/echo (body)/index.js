// /echo (body)/POST.js

export default async function(request) {
    return new Response(request.body, {
        headers: request.headers
    });
}