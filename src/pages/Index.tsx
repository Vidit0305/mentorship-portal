import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, Award, CheckCircle } from "lucide-react";
import menteeIcon from "@/assets/mentee-icon.png";
import mentorIcon from "@/assets/mentor-icon.png";

const Index = () => {
  return (
    <div className="min-h-screen hero-gradient">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-xl font-semibold text-foreground">
            MentorConnect
          </h1>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-tight mb-6 animate-fade-in">
            Find Your Perfect
            <span className="block italic text-primary">Mentor</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Connect with experienced seniors, alumni, and faculty to guide your academic and professional journey.
          </p>

          {/* Role Selection */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth?role=mentee">
              <Button variant="roleCard" size="role" className="group">
                <div className="w-24 h-24 mb-4 rounded-2xl overflow-hidden bg-accent/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <img src={menteeIcon} alt="Mentee" className="w-20 h-20 object-contain" />
                </div>
                <span className="font-serif text-xl font-semibold text-foreground">I am a Mentee</span>
                <span className="text-sm text-muted-foreground mt-1">Looking for guidance</span>
              </Button>
            </Link>

            <Link to="/auth?role=mentor">
              <Button variant="roleCard" size="role" className="group">
                <div className="w-24 h-24 mb-4 rounded-2xl overflow-hidden bg-accent/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <img src={mentorIcon} alt="Mentor" className="w-20 h-20 object-contain" />
                </div>
                <span className="font-serif text-xl font-semibold text-foreground">I am a Mentor</span>
                <span className="text-sm text-muted-foreground mt-1">Ready to guide others</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4 text-center">
            How MentorConnect Works
          </h3>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
            A transparent process designed to connect students with the right mentors for meaningful guidance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Find Mentors",
                description: "Browse verified mentors filtered by expertise, domain, and availability."
              },
              {
                icon: BookOpen,
                title: "Send Requests",
                description: "Submit structured mentorship requests with your goals and expectations."
              },
              {
                icon: CheckCircle,
                title: "Get Connected",
                description: "Mentors review your profile and accept requests that match their expertise."
              },
              {
                icon: Award,
                title: "Grow Together",
                description: "Build meaningful mentorship relationships that support your journey."
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
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 MentorConnect. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
