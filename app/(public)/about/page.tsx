import type { Metadata } from "next";
import { NETWORK_NAME } from "@/lib/brand";
import { PageShell, PageHeader } from "@/components/layout/Page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageShell narrow>
      <PageHeader title={`About ${NETWORK_NAME}`} description="Our mission and what you can do on the platform." />
      <div className="rounded-2xl border border-border/80 bg-card/50 p-6 shadow-sm ring-1 ring-border/40 dark:bg-card/40 sm:p-8">
      <div className="prose prose-neutral max-w-none space-y-6 dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground">
        <p className="text-lg text-muted-foreground">
          {NETWORK_NAME} is a Nepal-based student and alumni community platform.
        </p>
        <h2>Our Mission</h2>
        <p>
          We help members reconnect, collaborate, and support each other through mentorship, events, and shared opportunities.
        </p>
        <h2>What We Offer</h2>
        <ul>
          <li><strong>Directory:</strong> Discover verified members.</li>
          <li><strong>Mentorship:</strong> Learn from experienced seniors.</li>
          <li><strong>Articles & News:</strong> Share useful updates and stories.</li>
          <li><strong>Events:</strong> Track reunions and community programs.</li>
          <li><strong>Jobs:</strong> Explore openings from the network.</li>
        </ul>
        <h2>Joining {NETWORK_NAME}</h2>
        <p>
          Sign in with Google and complete your profile. Admins verify each account before public visibility.
        </p>
      </div>
      </div>
    </PageShell>
  );
}
