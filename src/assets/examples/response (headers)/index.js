// /response (headers)/GET.js

export default async function() {
    return new Response(null, {
        headers: {
            "Content-Type": "foo"
        }
    });
}