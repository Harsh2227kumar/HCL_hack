"use client";

import { useEffect, useState } from "react";
import ReadinessGauge from "@/components/dashboard/ReadinessGauge";
import SkillGapBars from "@/components/dashboard/SkillGapBars";
import BottleneckCallout from "@/components/dashboard/BottleneckCallout";
import PathTimeline from "@/components/dashboard/PathTimeline";
import PathEvolutionStrip from "@/components/dashboard/PathEvolutionStrip";
import PathwayMetricsCard from "@/components/dashboard/PathwayMetricsCard";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard?userId=test-user");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (!data) return <div className="p-8">Failed to load data.</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 p-4 gap-4">
      {/* Sidebar: Goal Summary & Gaps */}
      <aside className="w-full md:w-1/4 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Goal Readiness</h2>
          <ReadinessGauge readinessScore={data.readinessScore || 0} />
        </div>
        
        {data.bottleneck && (
          <BottleneckCallout bottleneck={data.bottleneck} />
        )}

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Skill Gaps</h2>
          <SkillGapBars gaps={data.gaps || []} />
        </div>
      </aside>

      {/* Main Area: Path Timeline */}
      <main className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow space-y-6">
        <h1 className="text-2xl font-bold">Your Learning Pathway</h1>
        <PathEvolutionStrip pathHistory={data.pathHistory || []} />
        <PathTimeline phases={data.phases || []} />
      </main>

      {/* Right Panel: Insights & Metrics */}
      <aside className="w-full md:w-1/4 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Pathway Metrics</h2>
          <PathwayMetricsCard metrics={data.metrics || {}} />
        </div>
      </aside>
    </div>
  );
}
