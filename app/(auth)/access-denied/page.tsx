import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { I18nText } from "@/components/i18n/I18nText";

export default async function AccessDeniedPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user?.status === "approved") redirect("/dashboard");

  const isBanned = session.user?.status === "banned";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30 mx-auto mb-6">
          <ShieldX className="size-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3">
          {isBanned ? <I18nText id="authPages.accountBanned" fallback="Account Banned" /> : <I18nText id="authPages.applicationRejected" fallback="Application Rejected" />}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isBanned
            ? <I18nText id="authPages.bannedDesc" fallback="Your account has been banned. If you believe this is a mistake, please contact our support team." />
            : <I18nText id="authPages.rejectedDesc" fallback="Your membership application was not approved. If you believe this is an error, please contact us." />}
        </p>
        <div className="flex flex-col gap-3 items-center">
          <a href="mailto:gangalalalumni@school.edu.np" className={buttonVariants({ variant: "outline" })}><I18nText id="authPages.contactSupport" fallback="Contact Support" /></a>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <Button variant="ghost" type="submit" className="text-muted-foreground"><I18nText id="auth.signOut" fallback="Sign Out" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}
