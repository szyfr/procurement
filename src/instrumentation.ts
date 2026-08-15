/**
 * Boot-time configuration check.
 *
 * Both server-only env vars were previously read at request time, which failed
 * in a way that looked like something else entirely: a missing
 * `FASTAPI_BASE_URL` made every upstream call throw, `getOptionalUser` returned
 * `null`, and every page shell redirected to a login page that could not
 * authenticate anyone either. The deploy came up green and presented as "all
 * users are signed out". Failing here instead makes a misconfigured deploy
 * crash on start, where it belongs.
 */

export async function register() {
  // `register` also runs on the edge runtime, which never reaches FastAPI or
  // signs Ably tokens — the vars are not expected to be present there.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const missing: string[] = [];

  if (!process.env.FASTAPI_BASE_URL) missing.push("FASTAPI_BASE_URL");

  const ablyKey = process.env.ABLY_API_KEY;

  if (!ablyKey) {
    missing.push("ABLY_API_KEY");
  } else if (!ablyKey.includes(":")) {
    // Checked here rather than imported from the token service: pulling the
    // JWT signer into the boot path just to validate a string would put the
    // key-reading code somewhere it is not otherwise needed.
    missing.push("ABLY_API_KEY (malformed — expected 'keyId:keySecret')");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment: ${missing.join(", ")}. ` +
        "See .env.example.",
    );
  }
}
