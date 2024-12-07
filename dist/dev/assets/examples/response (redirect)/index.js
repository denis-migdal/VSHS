// /response (redirect)/GET.js

export default async function(_, route) {
    const target = route.url.origin + "/echo (url)";
    return Response.redirect(target);
}