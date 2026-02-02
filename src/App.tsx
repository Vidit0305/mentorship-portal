import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MenteeDashboard from "./pages/MenteeDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import FindMentors from "./pages/FindMentors";
import MyRequests from "./pages/MyRequests";
import MyMentor from "./pages/MyMentor";
import MentorRequests from "./pages/MentorRequests";
import QueryView from "./pages/QueryView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 3 seconds on initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="iilm-mentorship-theme">
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="iilm-mentorship-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/mentee-dashboard" element={<MenteeDashboard />} />
              <Route path="/mentor-dashboard" element={<MentorDashboard />} />
              <Route path="/find-mentors" element={<FindMentors />} />
              <Route path="/my-requests" element={<MyRequests />} />
              <Route path="/my-mentor" element={<MyMentor />} />
              <Route path="/mentor-requests" element={<MentorRequests />} />
              <Route path="/query/:token" element={<QueryView />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
