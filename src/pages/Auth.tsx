import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address").refine(
  (email) => email.endsWith(".edu"),
  { message: "Please use your university email (.edu)" }
);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "mentee";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Check user's role in the database
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile) {
          // Redirect based on the role stored in database
          const dashboardPath = profile.role === "mentor" ? "/mentor-dashboard" : "/mentee-dashboard";
          navigate(dashboardPath);
        } else {
          // New user - redirect based on URL role
          const dashboardPath = role === "mentor" ? "/mentor-dashboard" : "/mentee-dashboard";
          navigate(dashboardPath);
        }
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Check user's role in the database
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile) {
          const dashboardPath = profile.role === "mentor" ? "/mentor-dashboard" : "/mentee-dashboard";
          navigate(dashboardPath);
        } else {
          const dashboardPath = role === "mentor" ? "/mentor-dashboard" : "/mentee-dashboard";
          navigate(dashboardPath);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, role]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (isSignUp && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              role: role,
            }
          }
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Oops!",
              description: "Looks like you already have an account. Try signing in instead!",
              variant: "destructive",
              duration: 5000,
            });
          } else {
            throw error;
          }
        } else {
          // Update profile with role
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("profiles").update({ role: role as "mentee" | "mentor" }).eq("user_id", user.id);
          }
          
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account, or sign in if email confirmation is disabled.",
          });
        }
      } else {
        // Sign in - first authenticate
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Hmm, that didn't work",
              description: "Double-check your email and password and give it another try!",
              variant: "destructive",
              duration: 5000,
            });
          } else {
            throw error;
          }
        } else if (data.user) {
          // Check if the user's role matches the selected role
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", data.user.id)
            .single();
          
          if (profile && profile.role !== role) {
            // User is trying to login with wrong role
            await supabase.auth.signOut();
            toast({
              title: "Wrong portal!",
              description: `This account is registered as a ${profile.role}. Please use the ${profile.role} login instead.`,
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Something went wrong",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
            IILM UNIVERSITY
          </h1>
          <span className="text-sm text-primary font-medium italic">Mentorship Portal</span>
        </div>

        <h2 className="font-serif text-4xl xl:text-5xl font-semibold text-foreground leading-tight mb-6">
          {role === "mentor" ? "Guide the next" : "Find your path."}
          <span className="block italic text-primary">
            {role === "mentor" ? "generation." : "Reveal your potential."}
          </span>
        </h2>

        <p className="text-muted-foreground text-lg max-w-md mb-8">
          {role === "mentor" 
            ? "Share your experience and help students navigate their academic and professional journey."
            : "Connect with experienced mentors who can guide you toward your goals."}
        </p>

        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-foreground font-medium">Secure & Private</span>
          <span className="text-muted-foreground">Your data is always protected.</span>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col px-6 md:px-12 xl:px-20 py-6">
        {/* Top bar with back link and theme toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          <div className="lg:hidden" />
          <ThemeToggle />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                IILM UNIVERSITY
              </h1>
              <span className="text-sm text-primary font-medium italic">Mentorship Portal</span>
            </div>

            <div className="text-center mb-8">
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h3>
              <p className="text-muted-foreground">
                {isSignUp 
                  ? `Sign up as a ${role} to get started.`
                  : "Enter your credentials to continue."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-card border-border"
                  required
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-card border-border pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl bg-card border-border pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="heroPrimary"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? "Sign Up" : "Sign In"} <span className="ml-1">→</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-foreground font-semibold hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign up for free"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
