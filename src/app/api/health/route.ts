export async function GET() {
  return Response.json({
    ok: true,
    service: "ping402",
    ts: new Date().toISOString(),
  });
}
