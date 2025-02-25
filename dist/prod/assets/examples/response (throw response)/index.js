// /response (throw response)/GET.js

export default async function() {
    throw new Response(null, {
        status: 501
    });
}