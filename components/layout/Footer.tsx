import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getBsYear } from "@/lib/utils";
import { NETWORK_NAME } from "@/lib/brand";
import { FooterLink } from "./FooterLink";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-muted/40 py-10 dark:bg-muted/25 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <Link href="/" className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
              <div className="flex size-8 items-center justify-center rounded-lg gradient-primary shadow-sm">
                <GraduationCap className="size-5 text-white" />
              </div>
              <span>{NETWORK_NAME}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Building stronger connections for students and graduates across Nepal.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <FooterLink href="/members">Members</FooterLink>
              </li>
              <li>
                <FooterLink href="/mentorship">Mentorship</FooterLink>
              </li>
              <li>
                <FooterLink href="/events">Events</FooterLink>
              </li>
              <li>
                <FooterLink href="/jobs">Jobs</FooterLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">Content</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <FooterLink href="/articles">Articles</FooterLink>
              </li>
              <li>
                <FooterLink href="/gallery">Gallery</FooterLink>
              </li>
              <li>
                <FooterLink href="/about">About</FooterLink>
              </li>
              <li>
                <FooterLink href="/contact">Contact</FooterLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">Account</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <FooterLink href="/auth/login">Sign In</FooterLink>
              </li>
              <li>
                <FooterLink href="/dashboard">Dashboard</FooterLink>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/70 pt-6 text-center text-xs text-muted-foreground">
          © {getBsYear()} BS {NETWORK_NAME}
        </div>
      </div>
    </footer>
  );
}
