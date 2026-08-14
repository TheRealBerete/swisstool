import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-1 mb-8">
          <h1 className="font-headline-lg text-headline-lg text-primary">
            SwissTool
          </h1>
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Precision Utility
          </p>
        </div>
        <LoginForm next={next ?? "/clipboard"} />
      </div>
    </main>
  );
}
