import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfYear, startOfDay, format, subMonths, subDays, subYears, eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval } from "date-fns";

export type ChartFilterType = "day" | "month" | "year";

interface ChartDataPoint {
  label: string;
  received: number;
  accepted: number;
  rejected: number;
}

interface RequestData {
  created_at: string;
  status: string;
  updated_at: string;
}

export const useMentorChartData = (userId: string | undefined, filterType: ChartFilterType = "month") => {
  const [rawData, setRawData] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchRequestData = async () => {
      setLoading(true);
      try {
        // Fetch all mentorship requests for this mentor
        const { data: requests } = await supabase
          .from("mentorship_requests")
          .select("created_at, status, updated_at")
          .eq("mentor_id", userId)
          .order("created_at", { ascending: true });

        setRawData(requests || []);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();

    // Real-time subscription
    const channel = supabase
      .channel("mentor_requests_chart")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mentorship_requests",
          filter: `mentor_id=eq.${userId}`,
        },
        () => {
          fetchRequestData();
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
      let received = 0;
      let accepted = 0;
      let rejected = 0;

      rawData.forEach((item) => {
        const itemDate = new Date(item.created_at);
        let inRange = false;

        switch (filterType) {
          case "day":
            inRange = startOfDay(itemDate).getTime() === startOfDay(date).getTime();
            break;
          case "year":
            inRange = startOfYear(itemDate).getTime() === startOfYear(date).getTime();
            break;
          case "month":
          default:
            inRange = startOfMonth(itemDate).getTime() === startOfMonth(date).getTime();
            break;
        }

        if (inRange) {
          received++;
          if (item.status === "accepted") accepted++;
          if (item.status === "rejected") rejected++;
        }
      });

      return {
        label: format(date, formatStr),
        received,
        accepted,
        rejected,
      };
    });
  }, [rawData, filterType]);

  return { chartData, loading };
};
