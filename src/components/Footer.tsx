import { useState } from "react";
import { forwardRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import aboutDialogImage from "@/assets/about-dialog.png";

const footerLinks = [
  { label: "Privacy Policy" },
  { label: "Terms & Conditions" },
  { label: "Disclaimer" },
  { label: "Community Guidelines" },
  { label: "Cookie Policy" },
  { label: "Refund & Cancellation" },
];

export const Footer = forwardRef<HTMLElement>((props, ref) => {
  const [imageOpen, setImageOpen] = useState(false);

  return (
    <>
      <footer ref={ref} className="border-t border-border bg-background" {...props}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-2 mb-4">
            {footerLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => setImageOpen(true)}
                className="text-[10px] md:text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] md:text-xs text-muted-foreground">
            © 2026 Mentorship Portal. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Image Dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <img
            src={aboutDialogImage}
            alt="About IILM University"
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>
    </>
  );
});

Footer.displayName = "Footer";
