import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { guestStart, guestStatus, guestSubmit } from "@/lib/chatgpt-guest";
import { accountStart, accountStatus, accountSubmit, authenticateMcpAccount, type McpAccount } from "@/lib/mcp-account";
import { LANGUAGES, ROLES, SENIORITIES } from "@/lib/practice-options";

export const runtime = "nodejs";
export const maxDuration = 120;

function toolResult(value: unknown) {
  return {
    structuredContent: value as Record<string, unknown>,
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
  };
}

function toolError(error: unknown) {
  console.error("ReviewIQ MCP tool failed", error instanceof Error ? error.message : "Unknown error");
  return { isError: true, content: [{ type: "text" as const, text: "ReviewIQ could not complete that request. Please try again later. A credit is only used when grading is saved." }] };
}

function authRequired() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://reviewiq-ruby.vercel.app").replace(/\/$/, "");
  return {
    isError: true,
    content: [{ type: "text" as const, text: "Connect your ReviewIQ account to continue reviewing in ChatGPT." }],
    _meta: {
      "mcp/www_authenticate": `Bearer resource_metadata="${siteUrl}/.well-known/oauth-protected-resource", error="invalid_token", error_description="Connect a ReviewIQ account"`,
    },
  };
}

function createServer(account: McpAccount | null) {
  const server = new McpServer(
    { name: "reviewiq", version: "1.0.0" },
    { instructions: "ReviewIQ provides realistic code review practice and grades written findings. Guests can complete two reviews. After that, use the authenticated account tools so users can continue in ChatGPT with their existing ReviewIQ account and credits. Present exercise code without revealing hidden bugs. Never display purchase offers or initiate checkout." },
  );

  server.registerTool("guest_review_status", {
    title: "Check ReviewIQ guest reviews",
    description: "Check how many of the two ChatGPT guest reviews this user has completed and whether they can start another.",
    inputSchema: {},
    _meta: { securitySchemes: [{ type: "noauth" }] },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  }, async (_args, context) => {
    try { return toolResult(await guestStatus(context._meta?.["openai/subject"])); }
    catch (error) { return toolError(error); }
  });

  server.registerTool("start_review", {
    title: "Start a ReviewIQ code review",
    description: "Generate a realistic code review exercise for the user's selected role, language, and seniority. Requires a ChatGPT user identifier. No guest review is used until grading completes.",
    inputSchema: {
      role: z.enum(ROLES),
      language: z.enum(LANGUAGES),
      seniority: z.enum(SENIORITIES),
    },
    _meta: { securitySchemes: [{ type: "noauth" }] },
    annotations: { readOnlyHint: false, openWorldHint: true, destructiveHint: false },
  }, async (config, context) => {
    try { return toolResult(await guestStart(context._meta?.["openai/subject"], config)); }
    catch (error) { return toolError(error); }
  });

  server.registerTool("submit_review", {
    title: "Grade a ReviewIQ guest review",
    description: "Grade the user's written review against the hidden planted defects in the exercise token. One guest review is used only after successful grading and saving. Pass the token returned by start_review unchanged.",
    inputSchema: {
      exerciseToken: z.string().min(30).max(30000),
      userReview: z.string().trim().min(1).max(5000),
    },
    _meta: { securitySchemes: [{ type: "noauth" }] },
    annotations: { readOnlyHint: false, openWorldHint: true, destructiveHint: false },
  }, async ({ exerciseToken, userReview }, context) => {
    try { return toolResult(await guestSubmit(context._meta?.["openai/subject"], exerciseToken, userReview)); }
    catch (error) { return toolError(error); }
  });

  server.registerTool("get_profile", {
    title: "Get connected ReviewIQ profile",
    description: "Identify the connected ReviewIQ account represented by the current OAuth credentials.",
    inputSchema: {},
    outputSchema: { id: z.string().min(1), email: z.string().optional() },
    _meta: { "openai/profile": true, securitySchemes: [{ type: "oauth2", scopes: [] }] },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  }, async () => account ? toolResult({ id: account.id, ...(account.email ? { email: account.email } : {}) }) : authRequired());

  server.registerTool("account_review_status", {
    title: "Check ReviewIQ account credits",
    description: "Read the connected ReviewIQ account's remaining review credits.",
    inputSchema: {},
    _meta: { securitySchemes: [{ type: "oauth2", scopes: [] }] },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  }, async () => {
    if (!account) return authRequired();
    try { return toolResult(await accountStatus(account)); }
    catch (error) { return toolError(error); }
  });

  server.registerTool("start_account_review", {
    title: "Start a ReviewIQ account review",
    description: "Generate a realistic code review exercise using the connected ReviewIQ account. Requires at least one existing review credit; generation alone does not consume it.",
    inputSchema: { role: z.enum(ROLES), language: z.enum(LANGUAGES), seniority: z.enum(SENIORITIES) },
    _meta: { securitySchemes: [{ type: "oauth2", scopes: [] }] },
    annotations: { readOnlyHint: false, openWorldHint: true, destructiveHint: false },
  }, async (config) => {
    if (!account) return authRequired();
    try { return toolResult(await accountStart(account, config)); }
    catch (error) { return toolError(error); }
  });

  server.registerTool("submit_account_review", {
    title: "Grade a ReviewIQ account review",
    description: "Grade the connected user's review against hidden planted defects. One existing ReviewIQ credit is used only when grading and saving succeed.",
    inputSchema: { exerciseToken: z.string().min(30).max(30000), userReview: z.string().trim().min(1).max(5000) },
    _meta: { securitySchemes: [{ type: "oauth2", scopes: [] }] },
    annotations: { readOnlyHint: false, openWorldHint: true, destructiveHint: false },
  }, async ({ exerciseToken, userReview }) => {
    if (!account) return authRequired();
    try { return toolResult(await accountSubmit(account, exerciseToken, userReview)); }
    catch (error) { return toolError(error); }
  });

  return server;
}

export async function POST(request: Request) {
  let method: string | undefined;
  try { method = (await request.clone().json()).method; } catch { /* malformed requests are handled by the transport */ }
  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const account = bearer ? await authenticateMcpAccount(bearer) : null;
  const server = createServer(account);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  // This SDK release only accepts security schemes in tool _meta. MCP clients
  // also require the top-level tool field, so mirror it in tools/list responses.
  if (method !== "tools/list" || !response.headers.get("content-type")?.includes("application/json")) return response;
  const body = await response.json();
  if (!Array.isArray(body?.result?.tools)) return Response.json(body, { status: response.status, headers: response.headers });
  for (const tool of body.result.tools) {
    if (Array.isArray(tool._meta?.securitySchemes)) tool.securitySchemes = tool._meta.securitySchemes;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return Response.json(body, { status: response.status, headers });
}

export async function GET() {
  return new Response("Streamable HTTP MCP requests use POST.", { status: 405, headers: { Allow: "POST" } });
}
