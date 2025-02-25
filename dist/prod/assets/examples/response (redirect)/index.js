// /response (redirect)/GET.js

export default async function(request) {
    const url    = new URL(request.url);
    const target = url.origin + "/echo (url)";
    return Response.redirect(target);
}