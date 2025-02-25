// /response (Uint8Array)/GET.js

export default async function() {
    const bytes = new Uint8Array([72, 101, 108, 108, 111])
    return new Response(bytes);
}