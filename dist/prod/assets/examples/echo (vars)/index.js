// /echo (vars)/{P}/GET.js

export default async function(request, {vars}) {
    return Response.json(vars);
}