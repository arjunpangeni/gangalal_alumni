import { ContactForm } from "./ContactForm";
import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { NETWORK_NAME } from "@/lib/brand";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { I18nText } from "@/components/i18n/I18nText";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PageShell className="max-w-5xl">
      <PageHeader
        title={<I18nText id="public.contactTitle" fallback={`Contact ${NETWORK_NAME}`} values={{ name: NETWORK_NAME }} />}
        description={<I18nText id="public.contactDesc" fallback="Questions, support, or partnership inquiries." />}
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="rounded-2xl border border-border/80 bg-card/50 p-6 shadow-sm ring-1 ring-border/40 dark:bg-card/40 sm:p-8">
          <h2 className="mb-5 text-lg font-semibold text-foreground"><I18nText id="public.getInTouch" fallback="Get in touch" /></h2>
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground"><I18nText id="public.email" fallback="Email" /></p>
                <p className="mt-0.5 text-muted-foreground">gangalalalumni@school.edu.np</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="size-4" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-foreground"><I18nText id="public.phone" fallback="Phone" /></p>
                <p className="mt-0.5 text-muted-foreground">+977 01-XXXXXXX</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-4" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-foreground"><I18nText id="public.address" fallback="Address" /></p>
                <p className="mt-0.5 text-muted-foreground">Kathmandu, Nepal</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/50 p-6 shadow-sm ring-1 ring-border/40 dark:bg-card/40 sm:p-8">
          <h2 className="mb-5 text-lg font-semibold text-foreground"><I18nText id="public.sendMessage" fallback="Send a message" /></h2>
          <ContactForm />
        </div>
      </div>
    </PageShell>
  );
}
