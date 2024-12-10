// /echo (URLSearchParams)/POST.js

export default async function(request) {
    let received = await request.formData();
    received = new URLSearchParams(received)
    return new Response(received);
}