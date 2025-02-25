// /response (clone)/GET.js

const response = new Response("ok");

export default async function() {
    return response.clone();
}