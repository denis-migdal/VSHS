// /response (Blob)/GET.js

export default async function() {
    const file = new Blob(["a,b"],{
        type: "text/csv"
    });
    return new Response(file);
}