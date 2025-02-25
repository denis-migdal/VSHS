// /echo (Uint8Array)/POST.js

export default async function(request) {
    const received = await request.bytes();
    return new Response(received);
}