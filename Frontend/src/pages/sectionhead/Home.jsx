import SectionHeadDashboard from "@/components/SectionHeadDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, API_URLS } from "@/config/api";
import { useState, useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const isMechanical = user.role === 2;
  const departmentName = isMechanical ? "Mechanical" : "Chemical";
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiRequest(
          `${
            API_URLS.getSectionHeadStats
          }?department=${departmentName.toLowerCase()}`
        );
        if (response.ok) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [departmentName]);

  return <SectionHeadDashboard stats={stats} departmentName={departmentName} />;
}
