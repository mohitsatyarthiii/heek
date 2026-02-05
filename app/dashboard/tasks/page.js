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
  Link as LinkIcon,
  ExternalLink,
  File,
} from "lucide-react";

/* =========================
   NOTION-STYLE HELPERS
========================= */

const StatusDot = ({ status }) => {
  const map = {
    todo: "bg-gray-400",
    in_progress: "bg-blue-500",
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
   LINK DISPLAY COMPONENT
========================= */

const LinkDisplay = ({ link }) => {
  if (!link) return <span className="text-muted-foreground">—</span>;

  // Extract domain for display
  const getDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      // If it's not a valid URL, return truncated text
      if (link.length > 30) {
        return `${link.substring(0, 30)}...`;
      }
      return link;
    }
  };

  // Check if it's a file/attachment link
  const isFileLink = link.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i);
  const isImageLink = link.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
  const isVideoLink = link.match(/\.(mp4|mov|avi|mkv|webm)$/i);
  const isDriveLink = link.includes('drive.google.com');
  const isDropboxLink = link.includes('dropbox.com');

  const getIcon = () => {
    if (isFileLink) return <File className="h-3 w-3" />;
    if (isImageLink) return <File className="h-3 w-3" />;
    if (isVideoLink) return <PlayCircle className="h-3 w-3" />;
    if (isDriveLink) return <ExternalLink className="h-3 w-3" />;
    if (isDropboxLink) return <ExternalLink className="h-3 w-3" />;
    return <LinkIcon className="h-3 w-3" />;
  };

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {getIcon()}
      <span className="truncate max-w-[120px] text-xs">
        {getDomain(link)}
      </span>
    </a>
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

    // Enrich tasks with assigned user data (no creator needed now)
    const enriched = await Promise.all(
      tasksData.map(async (t) => {
        const { data: assigned } = await supabase
          .from("profiles")
          .select("id,name,email")
          .eq("id", t.assigned_to)
          .single();

        return {
          ...t,
          assigned_user: assigned || null,
          // No creator field needed
        };
      })
    );

    setTasks(enriched);
  };

  /* -------- FILTERING -------- */
  const filteredTasks = tasks.filter((t) => {
    const q = search.toLowerCase();

    const matchesSearch =
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.assigned_user?.name?.toLowerCase().includes(q) ||
      t.attachment_link?.toLowerCase().includes(q);

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
      "Title,Status,Priority,Due Date,Assignee,Attachment Link\n" +
      tasks
        .map(
          (t) =>
            `"${t.title}","${t.status}","${t.priority || "medium"}","${
              t.due_date || ""
            }","${t.assigned_user?.name || ""}","${
              t.attachment_link || ""
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
              <h1 className="text-sm font-bold">Requirements Board</h1>
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
              placeholder="Search requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <div className="flex flex-wrap gap-2 mb-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-border rounded px-2 py-1 bg-background"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>

          <select 
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-xs border border-border rounded px-2 py-1 bg-background"
          >
            <option value="all">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>

          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-border rounded px-2 py-1 bg-background"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* ===== NOTION STYLE SPREADSHEET TABLE ===== */}
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-accent">
                <tr className="border-b border-border">
                  {[
                    "Requirements",
                    "Status",
                    "Priority",
                    "Due Date",
                    "Assignee",
                    "Attachment Link",
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
                      {t.due_date ? (
                        <div className={`flex items-center gap-1 ${isOverdue(t) ? 'text-red-600' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          {new Date(t.due_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                          {isOverdue(t) && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* ASSIGNEE */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[100px]">
                          {t.assigned_user?.name ||
                            t.assigned_user?.email ||
                            "Unassigned"}
                        </span>
                      </div>
                    </td>

                    {/* ATTACHMENT LINK */}
                    <td className="p-2 border-r border-border">
                      <LinkDisplay link={t.attachment_link} />
                    </td>

                    {/* ACTIONS */}
                    <td className="p-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/tasks/${t.id}`)
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
                                router.push(
                                  `/dashboard/tasks/edit/${t.id}`
                                )
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this requirement?")) {
                                  const supabase = createClient();
                                  await supabase
                                    .from("tasks")
                                    .delete()
                                    .eq("id", t.id);
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

        {/* ===== PAGINATION ===== */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <p className="text-muted-foreground">
            {startIndex + 1} -{" "}
            {Math.min(
              startIndex + itemsPerPage,
              filteredTasks.length
            )}{" "}
            of {filteredTasks.length} requirements
          </p>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setCurrentPage((p) => Math.max(p - 1, 1))
              }
              disabled={currentPage === 1}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>

            <span className="px-2 min-w-[2rem] text-center">{currentPage}</span>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(p + 1, totalPages)
                )
              }
              disabled={currentPage === totalPages}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* ===== EMPTY STATE ===== */}
        {filteredTasks.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-sm">
            <CheckCheck className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium mb-1">No requirements found</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {search ? "Try a different search term" : "Get started by creating a new requirement"}
            </p>
            {canCreate && (
              <Button
                size="sm"
                onClick={() => router.push("/dashboard/tasks/new")}
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                New Requirement
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}