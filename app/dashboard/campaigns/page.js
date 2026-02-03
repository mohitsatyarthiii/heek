"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Search,
  PlusCircle,
  Calendar,
  User,
  DollarSign,
  Building,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Eye,
  Edit,
  Trash2,
  Users,
  Target,
  FileText,
  TrendingUp,
} from "lucide-react";

/* ===========================
   NOTION-STYLE HELPERS
=========================== */

const StatusDot = ({ status }) => {
  const colorMap = {
    planning: "bg-gray-400",
    active: "bg-green-500",
    paused: "bg-yellow-500",
    completed: "bg-blue-500",
    cancelled: "bg-red-500",
  };

  const labelMap = {
    planning: "Planning",
    active: "Active",
    paused: "Paused",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${colorMap[status] || "bg-gray-400"}`} />
      <span className="text-xs font-medium">
        {labelMap[status] || status}
      </span>
    </div>
  );
};

const ProgressBar = ({ progress, status }) => {
  const colorMap = {
    planning: "bg-gray-400",
    active: "bg-green-500",
    paused: "bg-yellow-500",
    completed: "bg-blue-500",
    cancelled: "bg-red-500",
  };

  return (
    <div className="space-y-1">
      <div className="w-full bg-accent rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full ${colorMap[status]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{progress.toFixed(0)}%</span>
        <span className="capitalize">{status}</span>
      </div>
    </div>
  );
};

/* ===========================
   MAIN PAGE
=========================== */

export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCampaigns(),
        checkPermissions(),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setCanCreate(["admin", "manager"].includes(profile?.role));
  };

  const fetchCampaigns = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        assigned_creator:creators!assigned_creator (id, name),
        assigned_team_member:profiles!assigned_team_member (id, name, email)
        `
      )
      .order("created_at", { ascending: false });

    setCampaigns(data || []);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const q = search.toLowerCase();

    const matchesSearch =
      c.brand_name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.assigned_team_member?.name?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredCampaigns.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatBudget = (c) => {
    if (c.budget_min && c.budget_max) {
      return `₹${c.budget_min.toLocaleString()} - ₹${c.budget_max.toLocaleString()}`;
    }
    if (c.budget_min) return `From ₹${c.budget_min.toLocaleString()}`;
    if (c.budget_max) return `Up to ₹${c.budget_max.toLocaleString()}`;
    return "Not set";
  };

  const calculateProgress = (c) => {
    if (c.status === "completed") return 100;
    if (c.status === "cancelled") return 0;
    if (!c.start_date || !c.end_date) return 0;

    const now = new Date();
    const start = new Date(c.start_date);
    const end = new Date(c.end_date);

    const total = end - start;
    const elapsed = now - start;

    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const handleExport = () => {
    const csv =
      "Brand,Status,Budget,Dates,Assigned To,Description\n" +
      campaigns
        .map(
          (c) =>
            `"${c.brand_name || ""}","${c.status}","${formatBudget(
              c
            )}","${
              c.start_date
                ? new Date(c.start_date).toLocaleDateString()
                : ""
            } - ${
              c.end_date
                ? new Date(c.end_date).toLocaleDateString()
                : ""
            }","${c.assigned_team_member?.name || ""}","${
              c.description?.replace(/"/g, '""') || ""
            }"`
        )
        .join("\n");

    const uri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const a = document.createElement("a");
    a.href = uri;
    a.download = `campaigns_${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    a.click();
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
      <div className="max-w-[1800px] mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3 p-2 bg-card border border-border rounded-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <div>
              <h1 className="text-sm font-bold">Campaigns</h1>
              <p className="text-xs text-muted-foreground">
                {filteredCampaigns.length} results
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3 w-3" />
            </Button>

            {canCreate && (
              <Button
                size="sm"
                onClick={() => router.push("/dashboard/campaigns/new")}
              >
                <PlusCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* NOTION-STYLE TABLE */}
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-accent">
                <tr className="border-b border-border">
                  {[
                    "Campaign",
                    "Status",
                    "Budget",
                    "Timeline",
                    "Team",
                    "Creator",
                    "Progress",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-2 text-left font-semibold border-r border-border"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pageData.map((c) => {
                  const progress = calculateProgress(c);

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-border hover:bg-accent/30"
                    >
                      {/* CAMPAIGN */}
                      <td className="p-2 border-r border-border min-w-[220px]">
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 bg-primary/10 rounded flex items-center justify-center">
                            <Building className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium truncate">
                              {c.brand_name}
                            </p>
                            {c.description && (
                              <p className="text-[10px] text-muted-foreground line-clamp-1">
                                {c.description}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              ID: {c.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="p-2 border-r border-border">
                        <StatusDot status={c.status} />
                      </td>

                      {/* BUDGET */}
                      <td className="p-2 border-r border-border">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span className="font-medium">
                            {formatBudget(c)}
                          </span>
                        </div>
                      </td>

                      {/* TIMELINE */}
                      <td className="p-2 border-r border-border">
                        {c.start_date ? (
                          <>
                            <div className="font-medium">
                              {new Date(c.start_date).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short" }
                              )}{" "}
                              →{" "}
                              {c.end_date
                                ? new Date(c.end_date).toLocaleDateString(
                                    "en-IN",
                                    { day: "numeric", month: "short" }
                                  )
                                : "Ongoing"}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            No dates
                          </span>
                        )}
                      </td>

                      {/* TEAM */}
                      <td className="p-2 border-r border-border">
                        {c.assigned_team_member ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-primary" />
                            <span>
                              {c.assigned_team_member.name ||
                                c.assigned_team_member.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* CREATOR */}
                      <td className="p-2 border-r border-border">
                        {c.assigned_creator ? (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-blue-500" />
                            <span>{c.assigned_creator.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* PROGRESS */}
                      <td className="p-2 border-r border-border min-w-[120px]">
                        <ProgressBar
                          progress={progress}
                          status={c.status}
                        />
                      </td>

                      {/* ACTIONS */}
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/campaigns/${c.id}`)
                          }
                        >
                          <Eye className="h-3 w-3" />
                        </Button>

                        {canCreate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/campaigns/edit/${c.id}`
                              )
                            }
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <p>
            {startIndex + 1} -{" "}
            {Math.min(
              startIndex + itemsPerPage,
              filteredCampaigns.length
            )}{" "}
            of {filteredCampaigns.length}
          </p>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setCurrentPage((p) => Math.max(p - 1, 1))
              }
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>

            <span className="px-2">{currentPage}</span>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(p + 1, totalPages)
                )
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
