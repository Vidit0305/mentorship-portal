import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseRealtimeNotificationsOptions {
  userId: string | null;
  role: "mentee" | "mentor";
  onNewRequest?: () => void;
}

export function useRealtimeNotifications({ 
  userId, 
  role, 
  onNewRequest 
}: UseRealtimeNotificationsOptions) {
  const { toast } = useToast();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Only mentors should get real-time notifications for new requests
    if (role !== "mentor") return;

    const channel = supabase
      .channel('mentorship-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentorship_requests',
          filter: `mentor_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('New mentorship request:', payload);
          
          // Fetch the mentee's name
          const { data: menteeProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", payload.new.mentee_id)
            .single();
          
          const menteeName = menteeProfile?.full_name || "A student";
          
          toast({
            title: "🔔 New Mentorship Request!",
            description: `${menteeName} has sent you a mentorship request.`,
            duration: 5000,
          });

          onNewRequest?.();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, role, toast, onNewRequest]);
}
