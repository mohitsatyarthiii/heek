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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Video,
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
      label: "Draft",
    },
    pending: {
      icon: <Clock className="h-3 w-3" />,
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
      label: "Pending",
    },
    approved: {
      icon: <CheckCircle className="h-3 w-3" />,
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-300",
      label: "Approved",
    },
    live: {
      icon: <Video className="h-3 w-3" />,
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300",
      label: "Live",
    },
    rejected: {
      icon: <XCircle className="h-3 w-3" />,
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300",
      label: "Rejected",
    },
  };

  const { icon, bg, text, border, label } =
    config[status] || config.draft;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${bg} ${text} ${border}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
};

export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [executions, setExecutions] = useState([]);
  const [creatorsList, setCreatorsList] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  /* ========== MAIN FETCH (SAME AS YOUR ORIGINAL) ========== */
  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // SAME AS YOUR FIRST WORKING CODE
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      setExecutions(data || []);

      // extra lists for dropdowns
      await Promise.all([
        fetchCreators(),
        fetchTeamMembers(),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("creators")
      .select("name")
      .order("name", { ascending: true });

    setCreatorsList(data || []);
  };

  const fetchTeamMembers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .in("role", ["admin", "manager", "team"]);

    setTeamMembers(data || []);
  };

  /* ===== INLINE UPDATE (TEXT BASED, LIKE YOUR OLD DB) ===== */
  const updateField = async (id, field, value) => {
    const supabase = createClient();
    await supabase
      .from("campaigns")
      .update({ [field]: value })
      .eq("id", id);

    fetchData();
  };

  const filteredExecutions = executions.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.creator_name?.toLowerCase().includes(q) ||
      e.brand_name?.toLowerCase().includes(q) ||
      e.person?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredExecutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredExecutions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-3 p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
          <h1 className="text-sm font-bold">Executions</h1>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-3 w-3" />
            </Button>

            <Button
              size="sm"
              onClick={() => router.push("/dashboard/campaigns/new")}
            >
              <PlusCircle className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search executions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* TABLE (SAME DATA AS BEFORE) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-gray-300 dark:border-gray-700">
            <thead className="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white font-bold border-b-2 border-black">
              <tr>
                {[
                  "Creator Name",
                  "Brand Name",
                  "Deliverables",
                  "Commercials",
                  "Creator Price",
                  "Profit",
                  "Commission",
                  "Person",
                  "Video Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="p-2 border border-gray-400 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {pageData.map((e) => (
                <tr key={e.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">

                  {/* ✅ CREATOR DROPDOWN (TEXT BASED — MATCHES YOUR OLD DB) */}
                  <td className="p-2 border border-gray-300">
                    <select
                      className="w-full bg-transparent"
                      value={e.creator_name || ""}
                      onChange={(ev) =>
                        updateField(e.id, "creator_name", ev.target.value)
                      }
                    >
                      <option value="">Select Creator</option>
                      {creatorsList.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2 border border-gray-300">
                    {e.brand_name || "—"}
                  </td>

                  <td className="p-2 border border-gray-300">
                    {e.deliverables || "—"}
                  </td>

                  <td className="p-2 border border-gray-300">
                    {formatCurrency(e.commercials_locked)}
                  </td>

                  <td className="p-2 border border-gray-300">
                    {formatCurrency(e.creators_price)}
                  </td>

                  <td className="p-2 border border-gray-300">
                    {formatCurrency(e.profit)}
                  </td>

                  <td className="p-2 border border-gray-300">
                    {e.commission || "—"}
                  </td>

                  {/* ✅ PERSON DROPDOWN (TEXT BASED) */}
                  <td className="p-2 border border-gray-300">
                    <select
                      className="w-full bg-transparent"
                      value={e.person || ""}
                      onChange={(ev) =>
                        updateField(e.id, "person", ev.target.value)
                      }
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* VIDEO STATUS */}
                  <td className="p-2 border border-gray-300">
                    <select
                      className="w-full bg-transparent mb-1"
                      value={e.video_status || "draft"}
                      onChange={(ev) =>
                        updateField(e.id, "video_status", ev.target.value)
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="live">Live</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <VideoStatusBadge status={e.video_status || "draft"} />
                  </td>

                  {/* ACTIONS */}
                  <td className="p-2 border border-gray-300 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/campaigns/${e.id}`)
                      }
                    >
                      <Eye className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/campaigns/edit/${e.id}`)
                      }
                    >
                      <Edit className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (
                          confirm(
                            "Are you sure you want to delete this execution?"
                          )
                        ) {
                          const supabase = createClient();
                          await supabase
                            .from("campaigns")
                            .delete()
                            .eq("id", e.id);
                          fetchData();
                        }
                      }}
                      className="text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <p>
            {startIndex + 1} -{" "}
            {Math.min(
              startIndex + itemsPerPage,
              filteredExecutions.length
            )}{" "}
            of {filteredExecutions.length}
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
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
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
