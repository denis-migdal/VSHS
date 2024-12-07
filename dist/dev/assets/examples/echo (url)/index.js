// /echo (url)/GET.js

export default async function(request) {
    return new Response(request.url);
}