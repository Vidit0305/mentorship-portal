import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 200);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      {/* Header */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-display font-semibold text-lg text-foreground">
          Mentorship Portal
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-8">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-spin-slow" />
            </div>
          </div>
          {/* Rotating ring */}
          <svg
            className="absolute inset-0 w-24 h-24 animate-spin-slow"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="70 200"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-2">
            Preparing your mentorship journey...
          </h1>
          <p className="text-muted-foreground">
            Connecting you with world-class mentors
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 space-y-2">
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>AUTHENTICATING</span>
            <span>{Math.min(Math.round(progress), 100)}%</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-3">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Help Center</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Mentorship Portal. Securely connecting expertise since 2018.
        </p>
      </div>
    </div>
  );
}
