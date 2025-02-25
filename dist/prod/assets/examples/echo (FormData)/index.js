// /echo (FormData)/POST.js

export default async function(request) {
    const received = await request.formData();
    return new Response(received);
}