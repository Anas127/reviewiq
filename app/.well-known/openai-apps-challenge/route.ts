const challengeToken = "xQVLeDyO0pYjvS4G9mixydP2StlvAcIWVbpEk5wM0E8";

export function GET() {
  return new Response(challengeToken, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
