import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCommitteeMembersForPublic } from "@/lib/server/committee";

export const metadata: Metadata = {
  title: "हाम्रो बारेमा",
  description: "विद्यालय र साथीहरू बीच जोड्ने साझा मञ्च।",
};

/** ISR: at most this often; committee admin APIs also call revalidatePath("/about") after changes. */
export const revalidate = 60;

export default async function AboutPage() {
  const committee = await getCommitteeMembersForPublic();

  return (
    <PageShell narrow>
      <article lang="ne" className="space-y-10 text-foreground">
        <header className="space-y-2 border-b border-border/60 pb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">हाम्रो बारेमा</h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            यो प्लेटफर्म विद्यालयका पूर्व विद्यार्थी र वर्तमान समुदायलाई जोड्न, अनुभव साझा गर्न र एक अर्कालाई सहयोग गर्न बनाइएको हो।
            हामी प्रमाणित सदस्यहरू, कार्यक्रम, साझा अवसर र मार्गदर्शन मार्फत सम्बन्धलाई बलियो बनाउँछौं।
          </p>
        </header>

        <section className="rounded-2xl border border-border/80 bg-card/50 p-6 shadow-sm ring-1 ring-border/40 dark:bg-card/40 sm:p-8">
          <div className="prose prose-neutral max-w-none space-y-6 dark:prose-invert prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
            <h2 className="text-xl font-semibold">हाम्रो उद्देश्य</h2>
            <p>
              पूर्व विद्यार्थी र विद्यालय परिवार बीच भावनात्मक र व्यावहारिक सम्बन्ध कायम राख्नु, नयाँ पुस्तालाई अनुभवी साथीहरूसँग जोड्नु,
              र सामूहिक प्रगतिका लागि साझा अवसरहरू सिर्जना गर्नु हाम्रो मुख्य लक्ष्य हो।
            </p>
            <h2 className="text-xl font-semibold">हामी के–के प्रदान गर्छौं</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong className="text-foreground">सदस्य निर्देशिका:</strong> प्रमाणित साथीहरू खोज्नुहोस्।</li>
              <li><strong className="text-foreground">मेन्टरशिप:</strong> अनुभवी दाजु–दिदीहरूसँग सिक्नुहोस्।</li>
              <li><strong className="text-foreground">लेख तथा समाचार:</strong> ज्ञान र अनुभव साझा गर्नुहोस्।</li>
              <li><strong className="text-foreground">कार्यक्रमहरू:</strong> पुनर्मिलन र भेटघाट ट्र्याक गर्नुहोस्।</li>
              <li><strong className="text-foreground">रोजगारी:</strong> सञ्जालभित्रका अवसरहरू हेर्नुहोस्।</li>
            </ul>
            <h2 className="text-xl font-semibold">सदस्यता</h2>
            <p>
              Google मार्फत साइन इन गरी प्रोफाइल पूरा गर्नुहोस्। सार्वजनिक देखिन कडा प्रमाणीकरण पछि एडमिन टोलीले खाता स्वीकृत गर्छ।
            </p>
          </div>
        </section>

        {committee.length > 0 ? (
          <section lang="ne" className="space-y-4">
            <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">कार्यसमिति</h2>
            <p className="text-sm text-muted-foreground">
              समितिका सदस्यहरू (प्रदर्शन क्रम सम्बन्धित प्राथमिकताअनुसार)।
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {committee.map((m) => (
                <li
                  key={m._id}
                  className="flex flex-col items-center rounded-xl border border-border/80 bg-card/60 p-4 text-center shadow-sm ring-1 ring-border/30 dark:bg-card/50"
                >
                  <Avatar className="size-24 shrink-0 border border-border">
                    {m.photo ? <AvatarImage src={m.photo} alt="" className="object-cover" /> : null}
                    <AvatarFallback className="text-lg font-medium">{m.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <p className="mt-3 font-semibold text-foreground">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.post}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </PageShell>
  );
}
