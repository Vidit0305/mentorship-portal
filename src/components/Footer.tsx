import { useState } from "react";
import { forwardRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const footerLinks = [
  { label: "Privacy Policy", tab: "privacy" },
  { label: "Terms & Conditions", tab: "terms" },
  { label: "Disclaimer", tab: "disclaimer" },
  { label: "Community Guidelines", tab: "community" },
  { label: "Cookie Policy", tab: "cookies" },
  { label: "Refund & Cancellation", tab: "refund" },
];

export const Footer = forwardRef<HTMLElement>((props, ref) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("privacy");

  const handleLinkClick = (tab: string) => {
    setActiveTab(tab);
    setDialogOpen(true);
  };

  return (
    <>
      <footer ref={ref} className="border-t border-border bg-background" {...props}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-2 mb-4">
            {footerLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => handleLinkClick(link.tab)}
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

      {/* About Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              About IILM University
            </DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="cookies">Cookies</TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="disclaimer">Disclaimer</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
              <TabsTrigger value="refund">Refund</TabsTrigger>
            </TabsList>
            
            <TabsContent value="privacy" className="space-y-4 pt-4">
              <h4 className="font-serif font-semibold text-foreground">Privacy Policy</h4>
              <p className="text-muted-foreground">
                We take your privacy seriously. All personal data is encrypted and stored securely.
                We do not share your information with third parties without your consent.
              </p>
              <p className="text-muted-foreground">
                The IILM University Mentorship Portal collects minimal data necessary to provide
                our mentorship services, including your name, email, and academic information.
              </p>
            </TabsContent>
            
            <TabsContent value="terms" className="space-y-4 pt-4">
              <h4 className="font-serif font-semibold text-foreground">Terms & Conditions</h4>
              <p className="text-muted-foreground">
                By using this platform, you agree to our terms of service. Users must maintain
                professional conduct and respect the mentorship guidelines.
              </p>
              <p className="text-muted-foreground">
                All users must be affiliated with IILM University and use their official @iilm.edu
                email address to access the platform.
              </p>
            </TabsContent>
            
            <TabsContent value="cookies" className="space-y-4 pt-4">
              <h4 className="font-serif font-semibold text-foreground">Cookie Policy</h4>
              <p className="text-muted-foreground">
                We use cookies to enhance your experience. These cookies help us remember your
                preferences and provide personalized features.
              </p>
              <p className="text-muted-foreground">
                Essential cookies are required for the platform to function properly, including
                authentication and session management.
              </p>
            </TabsContent>
            
            <TabsContent value="disclaimer" className="space-y-4 pt-4">
              <h4 className="font-serif font-semibold text-foreground">Disclaimer</h4>
              <p className="text-muted-foreground">
                The advice and guidance provided through this platform is for informational purposes only.
                IILM University and its mentors are not liable for decisions made based on mentorship sessions.
              </p>
              <p className="text-muted-foreground">
                Users are encouraged to verify information and seek professional advice when necessary.
              </p>
            </TabsContent>
            
            <TabsContent value="community" className="space-y-4 pt-4">
              <h4 className="font-serif font-semibold text-foreground">Community Guidelines</h4>
              <p className="text-muted-foreground">
                All users must treat each other with respect and professionalism. Harassment,
                discrimination, or inappropriate behavior will not be tolerated.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Be respectful and courteous in all interactions</li>
                <li>Maintain confidentiality of shared information</li>
                <li>Report any misconduct to administrators</li>
                <li>Follow the scheduled mentorship commitments</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="refund" className="space-y-4 pt-4">
              <h4 className="font-serif font-semibold text-foreground">Refund & Cancellation</h4>
              <p className="text-muted-foreground">
                The IILM University Mentorship Portal is a free service provided to all IILM students,
                alumni, and faculty. There are no fees associated with using this platform.
              </p>
              <p className="text-muted-foreground">
                Users may cancel their mentorship connections at any time through their dashboard.
                Mentors and mentees are encouraged to communicate openly about any scheduling changes.
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
});

Footer.displayName = "Footer";
