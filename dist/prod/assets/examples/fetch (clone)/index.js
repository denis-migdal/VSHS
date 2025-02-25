// /echo (string)/POST.js

export default async function(request) {
    const received = await request.text();
    return new Response(received);
}