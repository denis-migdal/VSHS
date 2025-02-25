// /echo (json)/POST.js

export default async function(request) {
    const received = await request.json();
    return Response.json(received);
}