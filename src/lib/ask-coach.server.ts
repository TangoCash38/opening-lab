/**
 * Free-text Ask the coach is off. Move notes are read on the client.
 * POST stays so an old client gets a clear refusal instead of a model call.
 */
export async function askCoachPost(): Promise<Response> {
  return Response.json(
    { error: "Ask the coach is off" },
    { status: 404, headers: { "cache-control": "no-store" } },
  );
}
