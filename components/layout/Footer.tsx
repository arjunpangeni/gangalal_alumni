import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getBsYear } from "@/lib/utils";
import { NETWORK_NAME } from "@/lib/brand";
import { FooterLink } from "./FooterLink";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/35 py-10 transition-surface dark:bg-muted/22 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 sm:text-left md:grid-cols-4 md:text-left">
          <div className="col-span-1 flex flex-col items-center sm:col-span-2 sm:items-start md:col-span-1 md:items-start">
            <Link href="/" className="mb-3 flex items-center justify-center gap-2 text-lg font-bold text-foreground sm:justify-start">
              <div className="flex size-8 items-center justify-center rounded-lg gradient-primary shadow-sm">
                <GraduationCap className="size-5 text-white" />
              </div>
              <span>{NETWORK_NAME}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Building stronger connections for students and graduates across Nepal.
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">Community</h3>
            <ul className="flex flex-col items-center space-y-2 text-sm sm:items-start">
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
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">Content</h3>
            <ul className="flex flex-col items-center space-y-2 text-sm sm:items-start">
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
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">Account</h3>
            <ul className="flex flex-col items-center space-y-2 text-sm sm:items-start">
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
