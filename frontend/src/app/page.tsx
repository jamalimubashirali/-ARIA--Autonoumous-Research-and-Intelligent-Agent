import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          Autonomous Research & Intelligence Agent
        </h1>
        <p className="text-xl text-muted-foreground">
          Transform unstructured research requests into structured,
          domain-specific intelligence reports in minutes.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="h-12 px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="h-12 px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
