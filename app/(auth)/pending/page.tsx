import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";

export default async function PendingPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  if (session.user?.status === "approved") redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30 mx-auto mb-6">
          <Clock className="size-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Verification Pending</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for signing up! Your account is awaiting verification by our admin team.
          You&apos;ll receive an email notification once your account is approved.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Signed in as: <strong>{session.user?.email}</strong>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            <Home className="mr-2 size-4" />
            Back to Home
          </Link>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <Button variant="ghost" type="submit">Sign Out</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
