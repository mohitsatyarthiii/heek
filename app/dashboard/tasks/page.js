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
  Filter,
  PlusCircle,
  Calendar,
  User,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Eye,
  Edit,
  Trash2,
  Users,
  Flag,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";

/* =========================
   NOTION-STYLE HELPERS
========================= */

const StatusDot = ({ status }) => {
  const map = {
    todo: "bg-gray-400",
    in_progress: "bg-blue-500",
    review: "bg-purple-500",
    blocked: "bg-red-500",
    done: "bg-green-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${map[status] || "bg-gray-400"}`} />
      <span className="text-xs capitalize">
        {status.replace("_", " ")}
      </span>
    </div>
  );
};

const PriorityTag = ({ priority }) => {
  const color =
    priority === "high"
      ? "bg-red-100 text-red-700 border-red-300"
      : priority === "medium"
      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
      : "bg-green-100 text-green-700 border-green-300";

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded border ${color} capitalize`}
    >
      {priority || "medium"}
    </span>
  );
};

/* =========================
   MAIN PAGE
========================= */

export default function TasksPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTasks(), fetchUsers(), checkPermissions()]);
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

  const fetchUsers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email")
      .order("name");

    setUsers(data || []);
  };

  const fetchTasks = async () => {
    const supabase = createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let query = supabase.from("tasks").select("*");

    if (profile?.role === "associate") {
      query = query.eq("assigned_to", user.id);
    }

    const { data: tasksData } = await query.order("created_at", {
      ascending: false,
    });

    if (!tasksData) {
      setTasks([]);
      return;
    }

    const enriched = await Promise.all(
      tasksData.map(async (t) => {
        const [{ data: assigned }, { data: creator }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id,name,email")
            .eq("id", t.assigned_to)
            .single(),
          supabase
            .from("creators")
            .select("id,name")
            .eq("id", t.creator_id)
            .single(),
        ]);

        return {
          ...t,
          assigned_user: assigned || null,
          creator: creator || null,
        };
      })
    );

    setTasks(enriched);
  };

  /* -------- FILTERING (same logic) -------- */
  const filteredTasks = tasks.filter((t) => {
    const q = search.toLowerCase();

    const matchesSearch =
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.assigned_user?.name?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || t.status === statusFilter;
    const matchesAssignee =
      assigneeFilter === "all" || t.assigned_to === assigneeFilter;
    const matchesPriority =
      priorityFilter === "all" || t.priority === priorityFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesAssignee &&
      matchesPriority
    );
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredTasks.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const isOverdue = (task) => {
    if (!task.due_date || task.status === "done") return false;
    return new Date(task.due_date) < new Date();
  };

  const handleExport = () => {
    const csv =
      "Title,Status,Priority,Due Date,Assignee,Creator\n" +
      tasks
        .map(
          (t) =>
            `"${t.title}","${t.status}","${t.priority || "medium"}","${
              t.due_date || ""
            }","${t.assigned_user?.name || ""}","${
              t.creator?.name || ""
            }"`
        )
        .join("\n");

    const uri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const a = document.createElement("a");
    a.href = uri;
    a.download = `tasks_${new Date()
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
        {/* ===== HEADER (NOTION STYLE) ===== */}
        <div className="flex justify-between items-center mb-3 p-2 bg-card border border-border rounded-sm">
          <div className="flex items-center gap-2">
            <CheckCheck className="h-4 w-4 text-blue-500" />
            <div>
              <h1 className="text-sm font-bold">Task Board</h1>
              <p className="text-xs text-muted-foreground">
                {filteredTasks.length} results
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
                onClick={() => router.push("/dashboard/tasks/new")}
              >
                <PlusCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* ===== SEARCH BAR ===== */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* ===== NOTION STYLE SPREADSHEET TABLE ===== */}
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-accent">
                <tr className="border-b border-border">
                  {[
                    "Task",
                    "Status",
                    "Priority",
                    "Due Date",
                    "Assignee",
                    "Creator",
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
                {pageData.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b border-border hover:bg-accent/30 ${
                      isOverdue(t) ? "bg-red-50/10" : ""
                    }`}
                  >
                    {/* TASK */}
                    <td className="p-2 border-r border-border min-w-[220px]">
                      <div className="flex items-start gap-2">
                        <div className="h-6 w-6 bg-primary/10 rounded flex items-center justify-center">
                          <Flag className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium truncate">
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="p-2 border-r border-border">
                      <StatusDot status={t.status} />
                    </td>

                    {/* PRIORITY */}
                    <td className="p-2 border-r border-border">
                      <PriorityTag priority={t.priority} />
                    </td>

                    {/* DUE DATE */}
                    <td className="p-2 border-r border-border">
                      {t.due_date
                        ? new Date(t.due_date).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* ASSIGNEE */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {t.assigned_user?.name ||
                            t.assigned_user?.email ||
                            "Unassigned"}
                        </span>
                      </div>
                    </td>

                    {/* CREATOR */}
                    <td className="p-2 border-r border-border">
                      {t.creator?.name || "—"}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/tasks/${t.id}`)
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
                              `/dashboard/tasks/edit/${t.id}`
                            )
                          }
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== PAGINATION ===== */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <p>
            {startIndex + 1} -{" "}
            {Math.min(
              startIndex + itemsPerPage,
              filteredTasks.length
            )}{" "}
            of {filteredTasks.length}
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
