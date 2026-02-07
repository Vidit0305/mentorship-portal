import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";

const emailSchema = z.string().email("Please enter a valid email address").refine(
  (email) => email.endsWith("iilm.edu"),
  { message: "Please use your IILM University email (ending with iilm.edu)" }
);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "mentee";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
          if (profile.role === "admin") {
            navigate("/admin");
          } else {
            const dashboardPath = profile.role === "mentor" ? "/mentor-dashboard" : "/mentee-dashboard";
            navigate(dashboardPath);
          }
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
          if (profile.role === "admin") {
            navigate("/admin");
          } else {
            const dashboardPath = profile.role === "mentor" ? "/mentor-dashboard" : "/mentee-dashboard";
            navigate(dashboardPath);
          }
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
              role: role, // This is passed to the database trigger
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
          // The database trigger handles creating profiles, user_roles, and mentor/mentee profiles
          toast({
            title: "Account created!",
            description: `Welcome! You've signed up as a ${role}. Please check your email to verify your account, or sign in if email confirmation is disabled.`,
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: {
          hd: "iilm.edu",
        },
      });
      if (error) {
        toast({
          title: "Google Sign-in Failed",
          description: error.message || "Could not sign in with Google. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
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
      setGoogleLoading(false);
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
        {/* Top bar with back link and theme toggle - Toggle always visible on right */}
        <div className="flex items-center justify-between mb-8">
          <div className="lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          <div className="flex-1" />
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
                  placeholder="name@iilm.edu"
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-in */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl gap-3"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>

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
