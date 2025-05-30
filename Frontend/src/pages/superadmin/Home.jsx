import React, { useState, useEffect } from "react";
import SuperadminDashboard from "@/components/SuperadminDashboard";
import { apiRequest, API_URLS } from "@/config/api";

export default function AllDetails() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalTests: 0,
    statuses: {
      Pending: 0,
      "In Progress": 0,
      Completed: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(API_URLS.getSuperadminStats);
        if (response.ok) {
          setStats(response.stats);
        } else {
          setError("Failed to fetch stats");
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStats();

    // Set up auto-refresh every 300 seconds
    const intervalId = setInterval(fetchStats, 300000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <SuperadminDashboard stats={stats} />;
}
