// /echo (Blob)/POST.js

export default async function(request) {
    const received = await request.blob();
    return new Response(received);
}