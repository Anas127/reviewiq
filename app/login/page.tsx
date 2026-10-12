import LoginForm from "@/app/login/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; redirect?: string; auth_error?: string }>;
}) {
  const params = await searchParams;
  const initialMode = params.mode === "signup" ? "signup" : params.mode === "reset" ? "reset" : "signin";
  const returnTo = params.redirect === "/review" || params.redirect?.startsWith("/oauth/consent?authorization_id=") ? params.redirect : undefined;
  return <LoginForm initialMode={initialMode} returnTo={returnTo} authError={params.auth_error === "1"} />;
}
