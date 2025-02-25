// /echo (url search)/GET.js

export default async function(request) {
    const url    = new URL(request.url);
    const search = new URLSearchParams(url.search);
    return new Response(search);
}