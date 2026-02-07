import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MenteeDashboard from "./pages/MenteeDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import FindMentors from "./pages/FindMentors";
import MyRequests from "./pages/MyRequests";
import MyMentor from "./pages/MyMentor";
import MentorRequests from "./pages/MentorRequests";
import MyMentees from "./pages/MyMentees";
import MentorQueries from "./pages/MentorQueries";
import MyQueries from "./pages/MyQueries";
import QueryView from "./pages/QueryView";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import DeanDashboard from "./pages/DeanDashboard";
import HodDashboard from "./pages/HodDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
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
              <Route path="/my-mentees" element={<MyMentees />} />
              <Route path="/mentor-queries" element={<MentorQueries />} />
              <Route path="/my-queries" element={<MyQueries />} />
              <Route path="/query/:token" element={<QueryView />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/dean-dashboard" element={<DeanDashboard />} />
              <Route path="/hod-dashboard" element={<HodDashboard />} />
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
