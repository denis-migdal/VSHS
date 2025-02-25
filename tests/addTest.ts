
export default async function addTest(
	test_name  : string,
	request    : Request|string,
	expected_response: Partial<ExpectedAnswer>
) {

	if(typeof request === "string")
		request = new Request(encodeURI(request));

	for(let use_brython of ["true", "false"]) {
		const lang = use_brython === "true" ? "bry" : "js";
		Deno.test(`${test_name} (${lang})`, {sanitizeResources: false}, async() => {

			const r = request.clone();
			r.headers.set("use-brython", use_brython);
			await assertResponse(await fetch(r), expected_response);
		});
	}
}


function uint_equals(a: Uint8Array, b: Uint8Array) {

	if(b.byteLength !== b.byteLength)
		return false;

	for(let i = 0; i < a.byteLength; ++i)
		if(a.at(i) !== b.at(i))
			return false;
	return true;
}

type ExpectedAnswer = {
	status    : number,
	statusText: string,
	body  : string|Uint8Array|null,
	mime  : string|null,
};

export async function assertResponse(response: Response, {
	status = 200,
	body   = null,
	mime   = null,
	statusText = "OK"

}: Partial<ExpectedAnswer>) {

	if(response.status !== status) {
		throw new Error(`\x1b[1;31mWrong status code:\x1b[0m
\x1b[1;31m- ${response.status}\x1b[0m
\x1b[1;32m+ ${status}\x1b[0m`);
	}

	if(response.statusText !== statusText) {
		throw new Error(`\x1b[1;31mWrong status text:\x1b[0m
\x1b[1;31m- ${response.statusText}\x1b[0m
\x1b[1;32m+ ${statusText}\x1b[0m`);
	}

	let rep_mime = response.headers.get('Content-Type');
	if( mime === null && rep_mime === "application/octet-stream")
		rep_mime = null;
	if( rep_mime !== mime ) {
		throw new Error(`\x1b[1;31mWrong mime-type:\x1b[0m
\x1b[1;31m- ${rep_mime}\x1b[0m
\x1b[1;32m+ ${mime}\x1b[0m`);
		}

	if( body instanceof Uint8Array ) {
		const rep = new Uint8Array(await response.bytes());
		if( ! uint_equals(body, rep) )
			throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
	} else {

		const rep_text = await response.text();
		if( rep_text !== body && (body !== null || rep_text !== "") )
			throw new Error(`\x1b[1;31mWrong body:\x1b[0m
\x1b[1;31m- ${rep_text}\x1b[0m
\x1b[1;32m+ ${body}\x1b[0m`);
	}
}
