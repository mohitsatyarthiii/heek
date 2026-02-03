"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/theme-context";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Download,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Globe,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Plus,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

/* ===========================
   HELPER COMPONENTS (NOTION STYLE)
=========================== */

const StatusDot = ({ status }) => {
  const colors = {
    active: "bg-green-500",
    pending: "bg-yellow-500",
    inactive: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || "bg-gray-400"}`}></span>
      <span className="text-xs capitalize">{status}</span>
    </div>
  );
};

const ScoreStars = ({ score }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${
            s <= Math.round(score || 0)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-400"
          }`}
        />
      ))}
    </div>
  );
};

const PlatformTag = ({ platform }) => {
  const p = platform.toLowerCase();
  let Icon = null;
  let color = "text-gray-400";

  if (p.includes("youtube")) {
    Icon = Youtube;
    color = "text-red-500";
  } else if (p.includes("instagram")) {
    Icon = Instagram;
    color = "text-pink-500";
  } else if (p.includes("twitter") || p.includes("x")) {
    Icon = Twitter;
    color = "text-blue-400";
  } else if (p.includes("facebook")) {
    Icon = Facebook;
    color = "text-blue-600";
  } else if (p.includes("linkedin")) {
    Icon = Linkedin;
    color = "text-blue-700";
  }

  return (
    <div className="flex items-center gap-1 bg-accent px-1.5 py-0.5 rounded text-xs border border-border">
      {Icon && <Icon className={`h-3 w-3 ${color}`} />}
      <span className="text-xs">{platform}</span>
    </div>
  );
};

/* ===========================
   MAIN PAGE
=========================== */

export default function CreatorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    checkPermissions();
    fetchCreators();
  }, []);

  const checkPermissions = async () => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "associate";
    setCanCreate(role === "admin" || role === "manager");
  };

  const fetchCreators = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("creators")
      .select("*")
      .order("created_at", { ascending: false });

    setCreators(data || []);
    setLoading(false);
  };

  const filteredCreators = creators.filter((c) => {
    const q = search.toLowerCase();

    const matchesSearch =
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.primary_category?.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q);

    if (filter === "verified") return matchesSearch && c.is_verified;
    if (filter === "active") return matchesSearch && c.status === "active";
    if (filter === "pending") return matchesSearch && c.status === "pending";
    if (filter === "inactive") return matchesSearch && c.status === "inactive";
    if (filter === "high_score") return matchesSearch && c.brand_friendly_score >= 4;

    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredCreators.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredCreators.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-3 p-2 bg-card border border-border rounded-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <div>
              <h1 className="text-sm font-bold">Design Hires</h1>
              <p className="text-xs text-muted-foreground">
                {filteredCreators.length} results
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={fetchCreators}>
              <RefreshCw className="h-3 w-3" />
            </Button>

            {canCreate && (
              <Button size="sm" onClick={() => router.push("/dashboard/creators/new")}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <Button variant="outline" onClick={() => setFilter("verified")}>
            Verified
          </Button>
          <Button variant="outline" onClick={() => setFilter("active")}>
            Active
          </Button>
          <Button variant="outline" onClick={() => setFilter("pending")}>
            Pending
          </Button>
          <Button variant="outline" onClick={() => setFilter("all")}>
            Clear
          </Button>
        </div>

        {/* NOTION STYLE TABLE */}
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">

            <table className="w-full text-xs border-collapse">
              <thead className="bg-accent">
                <tr className="border-b border-border">
                  {[
                    "Creator",
                    "Role",
                    "Available?",
                    "Skill",
                    "Starting Date",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="p-2 text-left font-semibold border-r border-border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pageData.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border hover:bg-accent/30"
                  >

                    {/* CREATOR */}
                    <td className="p-2 border-r border-border">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-primary/10 rounded flex items-center justify-center">
                          <span className="text-xs font-bold">
                            {c.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="p-2 border-r border-border">
                      <span className="px-2 py-1 bg-accent rounded">
                        {c.primary_category || "Designer"}
                      </span>
                    </td>

                    {/* AVAILABLE */}
                    <td className="p-2 border-r border-border text-center">
                      {c.is_verified ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400 mx-auto" />
                      )}
                    </td>

                    {/* SKILL (STARS) */}
                    <td className="p-2 border-r border-border">
                      <ScoreStars score={c.brand_friendly_score || 0} />
                    </td>

                    {/* START DATE */}
                    <td className="p-2 border-r border-border">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>

                    {/* STATUS */}
                    <td className="p-2 border-r border-border">
                      <StatusDot status={c.status} />
                    </td>

                    {/* ACTIONS */}
                    <td className="p-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/creators/${c.id}`)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>

                      {canCreate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/creators/edit/${c.id}`)}
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

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <p>
            {startIndex + 1} -{" "}
            {Math.min(startIndex + itemsPerPage, filteredCreators.length)} of{" "}
            {filteredCreators.length}
          </p>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>

            <span className="px-2">{currentPage}</span>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
