// /response (URLSearchParams)/GET.js

export default async function() {
    const params = new URLSearchParams({
        a: 42,
        b: 1337
    });
    return new Response(params);
}