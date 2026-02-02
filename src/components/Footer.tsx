import { Link } from "react-router-dom";

export function Footer() {
  const footerLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
    { label: "Community Guidelines", href: "/community-guidelines" },
    { label: "Cookie Policy", href: "/cookie-policy" },
    { label: "Refund & Cancellation", href: "/refund" },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4">
          {footerLinks.map((link, index) => (
            <Link
              key={index}
              to={link.href}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © 2026 Edunexinfo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
