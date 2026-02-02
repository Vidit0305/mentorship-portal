import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ArrowRight, Users, BookOpen, Award, CheckCircle, MessageSquare, Star, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
const Index = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const {
    toast
  } = useToast();
  const handleSubmitFeedback = () => {
    if (rating === 0) {
      toast({
        title: "Please rate your experience",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    // Send feedback via email
    const subject = encodeURIComponent(`Mentorship Portal Feedback - ${rating} Stars`);
    const body = encodeURIComponent(`Rating: ${rating}/5 Stars\n\nFeedback:\n${feedback}`);
    window.open(`mailto:vidit.sharma0305@gmail.com?subject=${subject}&body=${body}`, '_blank');
    
    toast({
      title: "Thank you for your feedback!",
      description: "Your email client has been opened to send the feedback.",
    });
    setFeedbackOpen(false);
    setRating(0);
    setFeedback("");
  };
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Top Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex flex-col items-center">
              <h1 className="font-display font-semibold text-lg text-foreground">
                IILM UNIVERSITY
              </h1>
              <span className="text-[10px] text-primary font-medium italic -mt-1">Mentorship Portal</span>
            </div>

            {/* Center Navigation Links */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              <button onClick={() => document.getElementById('features')?.scrollIntoView({
              behavior: 'smooth'
            })} className="text-sm text-muted-foreground hover:text-primary transition-colors relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
              <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({
              behavior: 'smooth'
            })} className="text-sm text-muted-foreground hover:text-primary transition-colors relative group">
                How it Works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
              <button onClick={() => setAboutOpen(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
              <button onClick={() => setFeedbackOpen(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors relative group">
                Send Feedback
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
            </div>
            
            <ThemeToggle />
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center justify-center gap-4 pb-3 text-xs">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({
            behavior: 'smooth'
          })} className="text-muted-foreground hover:text-primary transition-colors">
              Features
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({
            behavior: 'smooth'
          })} className="text-muted-foreground hover:text-primary transition-colors">
              How it Works
            </button>
            <button onClick={() => setAboutOpen(true)} className="text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </button>
            <button onClick={() => setFeedbackOpen(true)} className="text-muted-foreground hover:text-primary transition-colors">
              Feedback
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex-1">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-tight mb-6">
              Find Your Perfect
              <span className="block italic text-primary">Mentor</span>
            </h2>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Connect with experienced seniors, alumni, and faculty to guide your academic and professional journey.
            </p>
          </ScrollReveal>

          {/* Role Selection - Simple Buttons */}
          <ScrollReveal delay={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?role=mentee">
                <Button variant="heroPrimary" className="min-w-[200px] hover-glow">
                  I am a Mentee <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>

              <Link to="/auth?role=mentor">
                <Button variant="heroSecondary" className="min-w-[200px] hover-lift">
                  I am a Mentor <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h3 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4 text-center">
              Platform Features
            </h3>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
              Everything you need to connect with the right mentors and grow your career.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{
            icon: Users,
            title: "Verified Mentors",
            description: "Connect with verified seniors, alumni, and faculty members."
          }, {
            icon: BookOpen,
            title: "Structured Requests",
            description: "Submit clear mentorship requests with your goals and expectations."
          }, {
            icon: CheckCircle,
            title: "Track Progress",
            description: "Monitor your mentorship requests and active connections."
          }, {
            icon: Award,
            title: "Grow Together",
            description: "Build meaningful relationships that support your journey."
          }].map((feature, index) => <ScrollReveal key={index} delay={index * 100}>
                <div className="feature-card h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-serif text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </ScrollReveal>)}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h3 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4 text-center">
                How It Works
              </h3>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
                A simple process to connect students with the right mentors.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[{
              step: "01",
              title: "Create Profile",
              description: "Sign up and complete your profile with your interests and goals."
            }, {
              step: "02",
              title: "Find Mentors",
              description: "Browse mentors filtered by expertise, domain, and availability."
            }, {
              step: "03",
              title: "Connect & Grow",
              description: "Send requests, get accepted, and start your mentorship journey."
            }].map((item, index) => <ScrollReveal key={index} delay={index * 150} direction="up">
                  <div className="text-center group">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                      <span className="text-primary font-bold text-xl">{item.step}</span>
                    </div>
                    <h4 className="font-serif text-xl font-semibold text-foreground mb-2">{item.title}</h4>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </ScrollReveal>)}
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <Footer />

      {/* About Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              About IILM University
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="cookies">Cookies</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="space-y-4 pt-4">
              <p className="text-muted-foreground">
                The IILM University Mentorship Portal is an education platform built for students who want
                to connect with experienced mentors for guidance on their academic and professional journey.
              </p>
              <h4 className="font-serif font-semibold text-foreground">Our Mission</h4>
              <p className="text-muted-foreground">
                To make mentorship accessible, transparent, and meaningful for everyone —
                whether you're just starting your journey or already making your final career choices.
              </p>
              <h4 className="font-serif font-semibold text-foreground">Features</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Verified mentor profiles</li>
                <li>Structured mentorship requests</li>
                <li>Real-time request tracking</li>
                <li>Secure and private communication</li>
              </ul>
            </TabsContent>
            <TabsContent value="privacy" className="space-y-4 pt-4">
              <p className="text-muted-foreground">
                We take your privacy seriously. All personal data is encrypted and stored securely.
                We do not share your information with third parties without your consent.
              </p>
            </TabsContent>
            <TabsContent value="terms" className="space-y-4 pt-4">
              <p className="text-muted-foreground">
                By using this platform, you agree to our terms of service. Users must maintain
                professional conduct and respect the mentorship guidelines.
              </p>
            </TabsContent>
            <TabsContent value="cookies" className="space-y-4 pt-4">
              <p className="text-muted-foreground">
                We use cookies to enhance your experience. These cookies help us remember your
                preferences and provide personalized features.
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
            </div>
            <DialogTitle className="font-serif text-xl text-center">
              We'd love to hear from you!
            </DialogTitle>
            <p className="text-center text-muted-foreground text-sm">
              Share your thoughts, suggestions, or report any issues you've encountered
            </p>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground">Rate your experience</label>
              <div className="flex justify-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                    <Star className={`w-8 h-8 transition-colors ${star <= rating ? "fill-warning text-warning" : "text-muted-foreground hover:text-warning"}`} />
                  </button>)}
              </div>
            </div>
            <div>
              <Textarea placeholder="Share your feedback, suggestions, or report issues..." value={feedback} onChange={e => setFeedback(e.target.value)} className="min-h-[120px]" maxLength={150} />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {feedback.length} / 150 characters
              </p>
            </div>
            <Button onClick={handleSubmitFeedback} className="w-full" variant="heroPrimary">
              <Send className="w-4 h-4 mr-2" /> Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Index;