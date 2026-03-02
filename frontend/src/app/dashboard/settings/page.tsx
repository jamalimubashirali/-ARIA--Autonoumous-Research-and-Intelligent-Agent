import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Check } from "lucide-react";

export default async function SettingsPage() {
  const user = await currentUser();
  // In a real app we would fetch the user's subscription from DB
  const plan = "Free Trial";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Settings & Billing
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences and subscription.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your personal account details managed by Clerk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold text-sm mr-2">Email:</span>
              <span className="text-sm text-muted-foreground">
                {user?.emailAddresses[0]?.emailAddress || "Loading..."}
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => {
                // In a real implementation, redirect to Clerk user profile or use Clerk's <UserProfile />
              }}
            >
              Manage Account via Clerk
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>
              You are currently on the {plan} plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col sm:flex-row items-center justify-between p-6">
              <div className="space-y-1 mb-4 sm:mb-0">
                <h3 className="font-semibold">Pro Plan</h3>
                <p className="text-sm text-muted-foreground">
                  $49/month for unlimited reports.
                </p>
                <ul className="text-sm text-muted-foreground mt-4 space-y-2">
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
                <Button>Upgrade to Pro</Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 py-4 px-6 flex justify-between items-center rounded-b-lg">
            <span className="text-sm text-muted-foreground">
              Powered by Stripe
            </span>
            <Button variant="outline" size="sm">
              Manage Billing
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
