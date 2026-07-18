import { Container } from "@/components/ui/Container";
import { IconGithub, IconTwitter, IconYoutube } from "@/components/icons/Icons";
import { siteConfig } from "@/lib/config";

const footerLinks = [
  { label: "GitHub", href: siteConfig.social.github },
  { label: "Documentation", href: siteConfig.social.docs },
  { label: "Privacy", href: siteConfig.social.privacy },
  { label: "Terms", href: siteConfig.social.terms },
  { label: "YouTube", href: siteConfig.social.youtube },
  { label: "Twitter", href: siteConfig.social.twitter },
];

export function Footer() {
  return (
    <footer className="border-t border-border pb-10 pt-14">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold tracking-[0.04em]">
              {siteConfig.name}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Interactive DevOps learning platform.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={siteConfig.social.github}
                aria-label="GitHub"
                className="rounded-lg border border-white/10 p-2 text-muted transition hover:border-secondary/30 hover:text-secondary"
              >
                <IconGithub size={18} />
              </a>
              <a
                href={siteConfig.social.youtube}
                aria-label="YouTube"
                className="rounded-lg border border-white/10 p-2 text-muted transition hover:border-secondary/30 hover:text-secondary"
              >
                <IconYoutube size={18} />
              </a>
              <a
                href={siteConfig.social.twitter}
                aria-label="Twitter"
                className="rounded-lg border border-white/10 p-2 text-muted transition hover:border-secondary/30 hover:text-secondary"
              >
                <IconTwitter size={18} />
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted transition hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted/80 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>{siteConfig.tagline}</p>
        </div>
      </Container>
    </footer>
  );
}
