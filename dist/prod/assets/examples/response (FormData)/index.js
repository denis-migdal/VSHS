// /response (FormData)/GET.js

export default async function() {
    const params = new FormData();
    params.set("a", 42);
    params.set("b", 1337);
    return new Response(params);
}