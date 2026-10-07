import LoginForm from "@/app/login/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const initialMode = params.mode === "signup" ? "signup" : params.mode === "reset" ? "reset" : "signin";
  return <LoginForm initialMode={initialMode} />;
}
