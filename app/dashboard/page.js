"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  RefreshCw,
  ChevronRight,
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle,
  XCircle,
  Flag,
  Target,
  FileText,
  CheckSquare,
  AlertTriangle,
  Users,
  TrendingUp,
} from "lucide-react";

/* ===========================
   STATUS + PRIORITY HELPERS
=========================== */

const taskStatusColor = (status) => {
  const map = {
    todo: "bg-gray-100 dark:bg-gray-800 text-gray-700",
    in_progress: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    review: "bg-purple-100 dark:bg-purple-900/30 text-purple-700",
    blocked: "bg-red-100 dark:bg-red-900/30 text-red-700",
    done: "bg-green-100 dark:bg-green-900/30 text-green-700",
  };
  return map[status] || "bg-gray-100 text-gray-700";
};

const taskStatusIcon = (status) => {
  const map = {
    todo: <Clock className="h-3 w-3" />,
    in_progress: <PlayCircle className="h-3 w-3" />,
    review: <AlertTriangle className="h-3 w-3" />,
    blocked: <XCircle className="h-3 w-3" />,
    done: <CheckCircle className="h-3 w-3" />,
  };
  return map[status] || <Clock className="h-3 w-3" />;
};

const priorityColor = (p) => {
  const map = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };
  return map[p] || "bg-gray-100 text-gray-700";
};

const priorityIcon = (p) => {
  const map = {
    high: <Flag className="h-3 w-3 fill-red-500" />,
    medium: <Flag className="h-3 w-3 fill-yellow-500" />,
    low: <Flag className="h-3 w-3 fill-green-500" />,
  };
  return map[p] || <Flag className="h-3 w-3 text-gray-500" />;
};

const campaignStatusColor = (s) => {
  const map = {
    planning: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[s] || "bg-gray-100 text-gray-700";
};

const campaignStatusIcon = (s) => {
  const map = {
    planning: <Clock className="h-3 w-3" />,
    active: <PlayCircle className="h-3 w-3" />,
    paused: <AlertTriangle className="h-3 w-3" />,
    completed: <CheckCircle className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
  };
  return map[s] || <Clock className="h-3 w-3" />;
};

/* ===========================
   MAIN COMPONENT
=========================== */

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [assignedRequirements, setAssignedRequirements] = useState([]);
  const [assignedCampaigns, setAssignedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .single();

    if (profile?.name) {
      setUserName(profile.name.split(" ")[0]);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", user.id)
        .order("due_date", { ascending: true })
        .limit(15);

      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select("*")
        .eq("assigned_team_member", user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      setAssignedRequirements(tasksData || []);
      setAssignedCampaigns(campaignsData || []);
    } finally {
      setLoading(false);
    }
  };

  const isTaskOverdue = (task) => {
    if (!task.due_date || task.status === "done") return false;
    const due = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const stats = {
    totalTasks: assignedRequirements.length,
    overdueTasks: assignedRequirements.filter(isTaskOverdue).length,
    tasksDueToday: assignedRequirements.filter((t) => {
      if (!t.due_date) return false;
      return (
        new Date(t.due_date).toDateString() === new Date().toDateString()
      );
    }).length,
    activeCampaigns: assignedCampaigns.filter(
      (c) => c.status === "active"
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-[1800px] mx-auto space-y-4">

        {/* ===== HEADER ===== */}
        <div className="flex justify-between items-center p-3 bg-card border border-border rounded-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-sm font-bold">Welcome, {userName || "User"}</h1>
              <p className="text-xs text-muted-foreground">
                Your assigned work overview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" variant="outline" onClick={fetchDashboardData}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* ===== STATS ROW (compact) ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            {
              label: "Total Tasks",
              value: stats.totalTasks,
              icon: <CheckSquare className="h-4 w-4 text-blue-500" />,
              bg: "bg-blue-50",
            },
            {
              label: "Overdue",
              value: stats.overdueTasks,
              icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
              bg: "bg-red-50",
            },
            {
              label: "Due Today",
              value: stats.tasksDueToday,
              icon: <Clock className="h-4 w-4 text-yellow-500" />,
              bg: "bg-yellow-50",
            },
            {
              label: "Active Campaigns",
              value: stats.activeCampaigns,
              icon: <Target className="h-4 w-4 text-green-500" />,
              bg: "bg-green-50",
            },
          ].map((s) => (
            <Card key={s.label} className="bg-card border">
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
                <div className={`p-1.5 rounded ${s.bg}`}>{s.icon}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ===== TWO TABLE LAYOUT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ===== ASSIGNED TASKS ===== */}
          <Card className="bg-card border overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b bg-accent/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold">ASSIGNED TASKS</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/tasks")}
              >
                View All <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-accent/20">
                  <tr className="border-b">
                    <th className="p-2 text-left">Task</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Priority</th>
                    <th className="p-2 text-left">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedRequirements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No tasks assigned
                      </td>
                    </tr>
                  ) : (
                    assignedRequirements.map((t) => {
                      const overdue = isTaskOverdue(t);

                      return (
                        <tr
                          key={t.id}
                          className={`border-b hover:bg-accent/30 cursor-pointer ${
                            overdue ? "bg-red-50/20" : ""
                          }`}
                          onClick={() => router.push(`/dashboard/tasks/${t.id}`)}
                        >
                          <td className="p-2">
                            <p className="font-medium truncate">{t.title}</p>
                            {t.description && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {t.description}
                              </p>
                            )}
                          </td>

                          <td className="p-2">
                            <Badge className={`flex items-center gap-1 ${taskStatusColor(t.status)}`}>
                              {taskStatusIcon(t.status)}
                              {t.status.replace("_", " ")}
                            </Badge>
                          </td>

                          <td className="p-2">
                            <Badge className={`flex items-center gap-1 ${priorityColor(t.priority)}`}>
                              {priorityIcon(t.priority)}
                              {t.priority || "medium"}
                            </Badge>
                          </td>

                          <td className="p-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className={overdue ? "text-red-600 font-medium" : ""}>
                              {t.due_date
                                ? new Date(t.due_date).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ===== ASSIGNED CAMPAIGNS ===== */}
          <Card className="bg-card border overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b bg-accent/30">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm font-semibold">ASSIGNED CAMPAIGNS</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/campaigns")}
              >
                View All <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-accent/20">
                  <tr className="border-b">
                    <th className="p-2 text-left">Campaign</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Budget</th>
                    <th className="p-2 text-left">Start</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No campaigns assigned
                      </td>
                    </tr>
                  ) : (
                    assignedCampaigns.map((c) => {
                      const start = c.start_date
                        ? new Date(c.start_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })
                        : "—";

                      const budget = c.budget_min
                        ? `₹${Math.round(c.budget_min / 1000)}K+`
                        : c.budget_max
                        ? `Up to ₹${Math.round(c.budget_max / 1000)}K`
                        : "—";

                      return (
                        <tr
                          key={c.id}
                          className="border-b hover:bg-accent/30 cursor-pointer"
                          onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                        >
                          <td className="p-2">
                            <p className="font-medium truncate">{c.brand_name}</p>
                            {c.description && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {c.description}
                              </p>
                            )}
                          </td>

                          <td className="p-2">
                            <Badge className={`flex items-center gap-1 ${campaignStatusColor(c.status)}`}>
                              {campaignStatusIcon(c.status)}
                              {c.status}
                            </Badge>
                          </td>

                          <td className="p-2 font-medium">{budget}</td>

                          <td className="p-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {start}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ===== WORK SUMMARY ===== */}
        <Card className="bg-card border">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold">WORK SUMMARY</h3>
              <p className="text-xs text-muted-foreground">
                {stats.overdueTasks > 0
                  ? `${stats.overdueTasks} overdue tasks`
                  : stats.tasksDueToday > 0
                  ? `${stats.tasksDueToday} due today`
                  : "All tasks up to date"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/dashboard/tasks")}
              >
                <CheckSquare className="h-3 w-3 mr-1" /> Tasks
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/dashboard/campaigns")}
              >
                <Target className="h-3 w-3 mr-1" /> Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
