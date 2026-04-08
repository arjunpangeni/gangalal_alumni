"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getBsYear } from "@/lib/utils";
import { FooterLink } from "./FooterLink";
import { useI18n } from "@/components/i18n/I18nProvider";

export function Footer() {
  const { messages } = useI18n();
  return (
    <footer className="border-t border-border/60 bg-muted/35 py-10 transition-surface dark:bg-muted/22 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 sm:text-left md:grid-cols-4 md:text-left">
          <div className="col-span-1 flex flex-col items-center sm:col-span-2 sm:items-start md:col-span-1 md:items-start">
            <Link href="/" className="mb-3 flex items-center justify-center gap-2 text-lg font-bold text-foreground sm:justify-start">
              <div className="flex size-8 items-center justify-center rounded-lg gradient-primary shadow-sm">
                <GraduationCap className="size-5 text-white" />
              </div>
              <span>{messages.brand.name}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {messages.footer.description}
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">{messages.footer.community}</h3>
            <ul className="flex flex-col items-center space-y-2 text-sm sm:items-start">
              <li>
                <FooterLink href="/members">{messages.nav.members}</FooterLink>
              </li>
              <li>
                <FooterLink href="/mentorship">{messages.nav.mentorship}</FooterLink>
              </li>
              <li>
                <FooterLink href="/events">{messages.nav.events}</FooterLink>
              </li>
              <li>
                <FooterLink href="/jobs">{messages.nav.jobs}</FooterLink>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">{messages.footer.content}</h3>
            <ul className="flex flex-col items-center space-y-2 text-sm sm:items-start">
              <li>
                <FooterLink href="/articles">{messages.nav.articles}</FooterLink>
              </li>
              <li>
                <FooterLink href="/gallery">{messages.nav.gallery}</FooterLink>
              </li>
              <li>
                <FooterLink href="/about">{messages.footer.about}</FooterLink>
              </li>
              <li>
                <FooterLink href="/contact">{messages.footer.contact}</FooterLink>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">{messages.footer.account}</h3>
            <ul className="flex flex-col items-center space-y-2 text-sm sm:items-start">
              <li>
                <FooterLink href="/login">{messages.auth.signIn}</FooterLink>
              </li>
              <li>
                <FooterLink href="/dashboard">{messages.auth.dashboard}</FooterLink>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/70 pt-6 text-center text-xs text-muted-foreground sm:text-sm">
          <p className="mb-3">
            {messages.footer.builtBy}{" "}
            <a
              href={messages.footer.developerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              {messages.footer.developerName}
            </a>
          </p>
          <p>
            © {getBsYear()} BS {messages.brand.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
