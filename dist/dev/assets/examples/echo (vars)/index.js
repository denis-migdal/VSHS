// /echo (vars)/{P}/GET.js

export default async function(request, {vars}) {
    console.warn(vars);
    return Response.json(vars);
}