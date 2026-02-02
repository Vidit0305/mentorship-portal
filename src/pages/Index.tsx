import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { ArrowRight, Users, BookOpen, Award, CheckCircle, MessageSquare, X, Star, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      toast({
        title: "Please rate your experience",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Thank you for your feedback!",
      description: "We appreciate your input.",
    });
    setFeedbackOpen(false);
    setRating(0);
    setFeedback("");
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-semibold text-xl text-foreground" style={{ fontFamily: "Georgia, serif" }}>
              IILM UNIVERSITY
            </h1>
            <span className="text-xs text-muted-foreground">Mentorship Portal</span>
          </div>
          
          <ThemeToggle />
        </div>
        
        {/* Center Navigation Links - Below header on separate line */}
        <div className="flex items-center justify-center gap-6 md:gap-10 mt-4 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
          <button 
            onClick={() => setAboutOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </button>
          <button 
            onClick={() => setFeedbackOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Send Feedback
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex-1">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-tight mb-6 animate-fade-in">
            Find Your Perfect
            <span className="block italic text-primary">Mentor</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Connect with experienced seniors, alumni, and faculty to guide your academic and professional journey.
          </p>

          {/* Role Selection - Simple Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth?role=mentee">
              <Button variant="heroPrimary" className="min-w-[200px]">
                I am a Mentee <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link to="/auth?role=mentor">
              <Button variant="heroSecondary" className="min-w-[200px]">
                I am a Mentor <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4 text-center">
            Platform Features
          </h3>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
            Everything you need to connect with the right mentors and grow your career.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Verified Mentors",
                description: "Connect with verified seniors, alumni, and faculty members."
              },
              {
                icon: BookOpen,
                title: "Structured Requests",
                description: "Submit clear mentorship requests with your goals and expectations."
              },
              {
                icon: CheckCircle,
                title: "Track Progress",
                description: "Monitor your mentorship requests and active connections."
              },
              {
                icon: Award,
                title: "Grow Together",
                description: "Build meaningful relationships that support your journey."
              }
            ].map((feature, index) => (
              <div key={index} className="feature-card animate-slide-up" style={{ animationDelay: `${0.1 * index}s` }}>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-serif text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20 bg-accent/30">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4 text-center">
            How It Works
          </h3>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
            A simple process to connect students with the right mentors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Profile",
                description: "Sign up and complete your profile with your interests and goals."
              },
              {
                step: "02",
                title: "Find Mentors",
                description: "Browse mentors filtered by expertise, domain, and availability."
              },
              {
                step: "03",
                title: "Connect & Grow",
                description: "Send requests, get accepted, and start your mentorship journey."
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-xl">{item.step}</span>
                </div>
                <h4 className="font-serif text-xl font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6">
            Ready to start your mentorship journey?
          </h3>
          <p className="text-muted-foreground mb-8">
            Join our community of students and mentors committed to growth and success.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?role=mentee">
              <Button variant="heroPrimary">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth?role=mentor">
              <Button variant="heroSecondary">
                Become a Mentor <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
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
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= rating
                          ? "fill-warning text-warning"
                          : "text-muted-foreground hover:text-warning"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Textarea
                placeholder="Share your feedback, suggestions, or report issues..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[120px]"
                maxLength={150}
              />
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
    </div>
  );
};

export default Index;
