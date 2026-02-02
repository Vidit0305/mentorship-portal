import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfYear, startOfDay, format, subMonths, subDays, subYears, eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval } from "date-fns";

export type ChartFilterType = "day" | "month" | "year";

interface ChartDataPoint {
  label: string;
  mentors: number;
}

export const useUserChartData = (userId: string | undefined, filterType: ChartFilterType = "month") => {
  const [rawData, setRawData] = useState<{ started_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchMentorshipData = async () => {
      setLoading(true);
      try {
        // Fetch all accepted mentorships for user
        const { data: mentorships } = await supabase
          .from("active_mentorships")
          .select("started_at")
          .eq("mentee_id", userId)
          .order("started_at", { ascending: true });

        setRawData(mentorships || []);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorshipData();

    // Real-time subscription
    const channel = supabase
      .channel("mentorships_chart")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_mentorships",
          filter: `mentee_id=eq.${userId}`,
        },
        () => {
          fetchMentorshipData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const chartData = useMemo((): ChartDataPoint[] => {
    const now = new Date();
    let intervals: Date[];
    let formatStr: string;

    switch (filterType) {
      case "day":
        // Last 7 days
        intervals = eachDayOfInterval({
          start: subDays(now, 6),
          end: now,
        });
        formatStr = "MMM d";
        break;
      case "year":
        // Last 3 years
        intervals = eachYearOfInterval({
          start: subYears(now, 2),
          end: now,
        });
        formatStr = "yyyy";
        break;
      case "month":
      default:
        // Last 6 months
        intervals = eachMonthOfInterval({
          start: subMonths(now, 5),
          end: now,
        });
        formatStr = "MMM";
        break;
    }

    return intervals.map((date) => {
      let count = 0;
      
      rawData.forEach((item) => {
        const itemDate = new Date(item.started_at);
        
        switch (filterType) {
          case "day":
            if (startOfDay(itemDate) <= startOfDay(date)) count++;
            break;
          case "year":
            if (startOfYear(itemDate) <= startOfYear(date)) count++;
            break;
          case "month":
          default:
            if (startOfMonth(itemDate) <= startOfMonth(date)) count++;
            break;
        }
      });

      return {
        label: format(date, formatStr),
        mentors: count,
      };
    });
  }, [rawData, filterType]);

  return { chartData, loading };
};
