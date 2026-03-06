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
        <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-primary/10 mb-3">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
          Settings & Billing
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl">
          Manage your account preferences and subscription.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-black/20 backdrop-blur-3xl ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-zinc-100">Account Information</CardTitle>
            <CardDescription className="text-zinc-500">
              Your personal account details managed by Clerk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold text-sm mr-2 text-zinc-300">
                Email:
              </span>
              <span className="text-sm text-zinc-500">
                {user?.emailAddresses[0]?.emailAddress || "Loading..."}
              </span>
            </div>
          </CardContent>
          <CardFooter className="border-t border-white/5 pt-4">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              Manage Account via Clerk
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-black/20 backdrop-blur-3xl ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-zinc-100">Subscription Plan</CardTitle>
            <CardDescription className="text-zinc-500">
              You are currently on the {plan} plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl ring-1 ring-white/10 bg-black/20 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-center justify-between p-6">
              <div className="space-y-1 mb-4 sm:mb-0">
                <h3 className="font-semibold text-zinc-100 text-lg">
                  Pro Plan
                </h3>
                <p className="text-sm text-zinc-500">
                  $49/month for unlimited reports.
                </p>
                <ul className="text-sm text-zinc-400 mt-4 space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" /> Advanced web
                    scraping
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" /> Custom
                    domains
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" /> Priority
                    support
                  </li>
                </ul>
              </div>
              <div className="flex-col flex gap-2 w-full sm:w-auto">
                <GlassActionButton
                  glowColor="cyan"
                  className="px-8 !rounded-full font-semibold"
                >
                  Upgrade to Pro
                </GlassActionButton>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-white/5 py-4 px-6 flex justify-between items-center">
            <span className="text-sm text-zinc-600 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Powered by Stripe
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              Manage Billing
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
