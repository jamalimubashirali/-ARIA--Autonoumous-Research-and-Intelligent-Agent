import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlassActionButton } from "@/components/ui/glass-action-button";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Check, Settings, CreditCard } from "lucide-react";

export default async function SettingsPage() {
  const user = await currentUser();
  const plan = "Free Trial";

  return (
    <div className="space-y-8 max-w-4xl mx-auto mt-4 pb-20 px-4">
      <div className="space-y-2 flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-cyan-500/10 mb-3">
          <Settings className="w-6 h-6 text-cyan-500" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">
          Settings & Billing
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Manage your account preferences and subscription.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border border-border/40 dark:border-white/5 bg-card/40 dark:bg-zinc-900/20 backdrop-blur-2xl shadow-lg dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-foreground">
              Account Information
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your personal account details managed by Clerk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold text-sm mr-2 text-foreground">
                Email:
              </span>
              <span className="text-sm text-muted-foreground">
                {user?.emailAddresses[0]?.emailAddress || "Loading..."}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 dark:border-white/5 bg-card/40 dark:bg-zinc-900/20 backdrop-blur-2xl shadow-lg dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-foreground">Subscription Plan</CardTitle>
            <CardDescription className="text-muted-foreground">
              You are currently on the {plan} plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-border/40 dark:border-transparent bg-background/50 dark:bg-black/20 backdrop-blur-2xl dark:ring-1 dark:ring-white/10 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-center justify-between p-6">
              <div className="space-y-1 mb-4 sm:mb-0">
                <h3 className="font-semibold text-foreground text-lg">
                  Pro Plan
                </h3>
                <p className="text-sm text-muted-foreground">
                  $49/month for unlimited reports.
                </p>
                <ul className="text-sm text-muted-foreground mt-4 space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-cyan-500" /> Advanced web
                    scraping
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-cyan-500" /> Custom
                    domains
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-cyan-500" /> Priority
                    support
                  </li>
                </ul>
              </div>
              <div className="flex-col flex gap-2 w-full sm:w-auto">
                <GlassActionButton
                  glowColor="cyan"
                  className="px-6 py-3 !rounded-full font-semibold"
                >
                  Upgrade to Pro
                </GlassActionButton>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/40 dark:border-white/5 py-4 px-6 flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Powered by Stripe
            </span>
            <GlassActionButton
              glowColor="cyan"
              className="px-4 py-2 !rounded-full text-sm font-semibold"
            >
              Manage Billing
            </GlassActionButton>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
