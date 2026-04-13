import type { Metadata } from "next";
import { getCommitteeMembersForPublic } from "@/lib/server/committee";
import { AboutPageClient } from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About",
  description: "About the school and alumni forum.",
};

export const revalidate = 60;

export default async function AboutPage() {
  const committee = await getCommitteeMembersForPublic();
  return <AboutPageClient committee={committee} />;
}
