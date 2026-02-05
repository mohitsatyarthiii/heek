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
  Eye,
  Edit,
  Users,
  Target,
  FileText,
  Video,
  Package,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Percent,
  Briefcase,
  UserCircle,
  Trash2,
} from "lucide-react";

/* ===========================
   VIDEO STATUS BADGE
=========================== */
const VideoStatusBadge = ({ status }) => {
  const config = {
    draft: {
      icon: <Clock className="h-3 w-3" />,
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-300",
      label: "Draft"
    },
    pending: {
      icon: <Clock className="h-3 w-3" />,
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
      label: "Pending"
    },
    approved: {
      icon: <CheckCircle className="h-3 w-3" />,
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-300",
      label: "Approved"
    },
    live: {
      icon: <Video className="h-3 w-3" />,
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300",
      label: "Live"
    },
    rejected: {
      icon: <XCircle className="h-3 w-3" />,
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300",
      label: "Rejected"
    }
  };

  const { icon, bg, text, border, label } = config[status] || config.draft;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${bg} ${text} ${border}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
};

/* ===========================
   MAIN PAGE
=========================== */
export default function campaignsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [executions, setExecutions] = useState([]);
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
        fetchExecutions(),
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

  const fetchExecutions = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("campaigns")
      .select(`
        *,
        assigned_creator:creators!assigned_creator (id, name),
        assigned_team_member:profiles!assigned_team_member (id, name, email)
      `)
      .order("created_at", { ascending: false });

    setExecutions(data || []);
  };

  const filteredExecutions = executions.filter((e) => {
    const q = search.toLowerCase();

    const matchesSearch =
      e.brand_name?.toLowerCase().includes(q) ||
      e.creator_name?.toLowerCase().includes(q) ||
      e.person?.toLowerCase().includes(q) ||
      e.deliverables?.toLowerCase().includes(q) ||
      e.commission?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredExecutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredExecutions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProfitMargin = (commercials, creatorPrice) => {
    if (!commercials || !creatorPrice) return "0%";
    const margin = ((commercials - creatorPrice) / commercials) * 100;
    return `${margin.toFixed(1)}%`;
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
              <h1 className="text-sm font-bold">Executions</h1>
              <p className="text-xs text-muted-foreground">
                {filteredExecutions.length} results
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const csv = [
                ["Creator Name", "Brand Name", "Deliverables", "Commercials Locked", "Creator's Price", "Profit", "Commission", "Person", "Video Status"],
                ...executions.map(e => [
                  e.creator_name || "",
                  e.brand_name || "",
                  e.deliverables || "",
                  formatCurrency(e.commercials_locked),
                  formatCurrency(e.creators_price),
                  formatCurrency(e.profit),
                  e.commission || "",
                  e.person || "",
                  e.video_status || ""
                ])
              ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

              const uri = encodeURI("data:text/csv;charset=utf-8," + csv);
              const a = document.createElement("a");
              a.href = uri;
              a.download = `executions_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}>
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

        {/* SEARCH & FILTERS */}
        <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search executions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(e) => {
                if (e.target.value === "video_status") {
                  const statuses = ["draft", "pending", "approved", "live", "rejected"];
                  const select = document.createElement("select");
                  // You can implement a custom filter UI here
                }
              }}
            >
              <option value="">Filter by video status</option>
              <option value="live">Live Only</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* EXECUTIONS TABLE */}
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-accent">
                <tr className="border-b border-border">
                  {[
                    { name: "Creator Name", icon: <UserCircle className="h-3 w-3" /> },
                    { name: "Brand Name", icon: <Building className="h-3 w-3" /> },
                    { name: "Deliverables", icon: <Package className="h-3 w-3" /> },
                    { name: "Commercials Locked", icon: <CreditCard className="h-3 w-3" /> },
                    { name: "Creator's Price", icon: <DollarSign className="h-3 w-3" /> },
                    { name: "Profit", icon: <TrendingUp className="h-3 w-3" /> },
                    { name: "Commission", icon: <Percent className="h-3 w-3" /> },
                    { name: "Person", icon: <User className="h-3 w-3" /> },
                    { name: "Video Status", icon: <Video className="h-3 w-3" /> },
                    { name: "Actions", icon: null }
                  ].map((col) => (
                    <th
                      key={col.name}
                      className="p-2 text-left font-semibold border-r border-border"
                    >
                      <div className="flex items-center gap-1">
                        {col.icon}
                        <span>{col.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pageData.map((execution) => (
                  <tr
                    key={execution.id}
                    className="border-b border-border hover:bg-accent/30"
                  >
                    {/* CREATOR NAME */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-blue-100 rounded flex items-center justify-center">
                          <UserCircle className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="font-medium truncate">
                          {execution.creator_name || "—"}
                        </span>
                      </div>
                    </td>

                    {/* BRAND NAME */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-purple-100 rounded flex items-center justify-center">
                          <Building className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="font-medium">
                          {execution.brand_name || "—"}
                        </span>
                      </div>
                    </td>

                    {/* DELIVERABLES */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3 text-gray-500" />
                        <span className="truncate max-w-[150px]">
                          {execution.deliverables || "—"}
                        </span>
                      </div>
                    </td>

                    {/* COMMERCIALS LOCKED */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-green-600" />
                        <span className="font-medium">
                          {formatCurrency(execution.commercials_locked)}
                        </span>
                      </div>
                    </td>

                    {/* CREATOR'S PRICE */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-orange-600" />
                        <span className="font-medium">
                          {formatCurrency(execution.creators_price)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Paid to creator
                      </div>
                    </td>

                    {/* PROFIT */}
                    <td className="p-2 border-r border-border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {execution.profit > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`font-medium ${execution.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(execution.profit)}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {calculateProfitMargin(execution.commercials_locked, execution.creators_price)} margin
                        </div>
                      </div>
                    </td>

                    {/* COMMISSION */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-blue-600" />
                        <span className="font-medium">
                          {execution.commission || "—"}
                        </span>
                      </div>
                    </td>

                    {/* PERSON */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                        <span className="truncate max-w-[100px]">
                          {execution.person || "Unassigned"}
                        </span>
                      </div>
                    </td>

                    {/* VIDEO STATUS */}
                    <td className="p-2 border-r border-border">
                      <VideoStatusBadge status={execution.video_status || "draft"} />
                    </td>

                    {/* ACTIONS */}
                    <td className="p-2">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/campaigns/${execution.id}`)
                          }
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>

                        {canCreate && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/dashboard/campaigns/edit/${execution.id}`)
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this execution?")) {
                                  const supabase = createClient();
                                  await supabase
                                    .from("campaigns")
                                    .delete()
                                    .eq("id", execution.id);
                                  fetchData();
                                }
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        {filteredExecutions.length > 0 && (
          <div className="flex justify-between items-center mt-2 text-xs">
            <p className="text-muted-foreground">
              {startIndex + 1} -{" "}
              {Math.min(startIndex + itemsPerPage, filteredExecutions.length)}{" "}
              of {filteredExecutions.length} executions
            </p>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>

              <span className="px-2 min-w-[2rem] text-center">{currentPage}</span>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {filteredExecutions.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-sm">
            <Target className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium mb-1">No executions found</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {search ? "Try a different search term" : "Get started by creating a new execution"}
            </p>
            {canCreate && (
              <Button
                size="sm"
                onClick={() => router.push("/dashboard/executions/new")}
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                New Execution
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}