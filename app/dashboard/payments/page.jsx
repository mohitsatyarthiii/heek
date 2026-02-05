"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Eye,
  Edit,
  CreditCard,
  DollarSign,
  Building,
  Users,
  FileText,
  CheckCheck,
  AlertTriangle,
  MoreVertical,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

/* =========================
   PAYMENT STATUS HELPERS
========================= */
const PaymentStatusBadge = ({ status }) => {
  const config = {
    draft: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-300",
      icon: <FileText className="h-3 w-3" />,
      label: "Draft"
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
      icon: <Clock className="h-3 w-3" />,
      label: "Pending"
    },
    approved: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-300",
      icon: <CheckCircle className="h-3 w-3" />,
      label: "Approved"
    },
    processing: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-300",
      icon: <RefreshCw className="h-3 w-3" />,
      label: "Processing"
    },
    completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300",
      icon: <CheckCheck className="h-3 w-3" />,
      label: "Completed"
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300",
      icon: <XCircle className="h-3 w-3" />,
      label: "Cancelled"
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300",
      icon: <XCircle className="h-3 w-3" />,
      label: "Rejected"
    },
    on_hold: {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-300",
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "On Hold"
    }
  };

  const { bg, text, border, icon, label } = config[status] || config.draft;

  return (
    <Badge className={`${bg} ${text} ${border} flex items-center gap-1`}>
      {icon}
      {label}
    </Badge>
  );
};

const PaymentAmount = ({ amount, currency = "USD" }) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="flex items-center gap-1">
      <DollarSign className="h-4 w-4 text-green-600" />
      <span className="font-semibold">{formattedAmount}</span>
    </div>
  );
};

/* =========================
   MAIN PAYMENTS PAGE
========================= */
export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [campaigns, setCampaigns] = useState([]);
  const [creators, setCreators] = useState([]);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPayments(),
        fetchCampaigns(),
        fetchCreators(),
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

    setCanCreate(["admin", "manager", "associate"].includes(profile?.role));
    setCanManage(["admin", "manager"].includes(profile?.role));
  };

  const fetchPayments = async () => {
    const supabase = createClient();
    
    let query = supabase
      .from("payments")
      .select(`
        *,
        campaign:campaigns!campaign_id (id, brand_name, creator_name),
        creator:creators!creator_id (id, name),
        paid_by_user:profiles!paid_by (id, name, email),
        approved_by_user:profiles!approved_by (id, name, email),
        created_by_user:profiles!created_by (id, name, email)
      `)
      .order("created_at", { ascending: false });

    // Apply RLS automatically through Supabase policies
    const { data } = await query;

    setPayments(data || []);
  };

  const fetchCampaigns = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("campaigns")
      .select("id, brand_name, creator_name")
      .order("brand_name");

    setCampaigns(data || []);
  };

  const fetchCreators = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("creators")
      .select("id, name")
      .order("name");

    setCreators(data || []);
  };

  /* -------- FILTERING -------- */
  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();

    const matchesSearch =
      p.payment_title?.toLowerCase().includes(q) ||
      p.payment_description?.toLowerCase().includes(q) ||
      p.payment_reference?.toLowerCase().includes(q) ||
      p.campaign?.brand_name?.toLowerCase().includes(q) ||
      p.creator?.name?.toLowerCase().includes(q) ||
      p.invoice_number?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;

    const matchesCampaign =
      campaignFilter === "all" || p.campaign_id === campaignFilter;

    const matchesCreator =
      creatorFilter === "all" || p.creator_id === creatorFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCampaign &&
      matchesCreator
    );
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredPayments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.payment_amount || 0), 0);
  const completedAmount = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.payment_amount || 0), 0);
  const pendingAmount = filteredPayments
    .filter(p => p.status === 'pending' || p.status === 'approved')
    .reduce((sum, p) => sum + (p.payment_amount || 0), 0);

  const handleStatusUpdate = async (paymentId, newStatus) => {
    if (!canManage) {
      alert("You don't have permission to update payment status");
      return;
    }

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("payments")
        .update({ 
          status: newStatus,
          approved_by: newStatus === 'approved' ? user.id : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", paymentId);

      if (error) throw error;

      // Refresh data
      fetchPayments();
      
      alert(`Payment status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating payment status:", err);
      alert("Failed to update payment status");
    }
  };

  const handleExport = () => {
    const csv =
      "Invoice #,Title,Amount,Status,Campaign,Creator,Paid By,Payment Date,Due Date,Payment Method,Reference\n" +
      payments
        .map(
          (p) =>
            `"${p.invoice_number || ""}","${p.payment_title}","${p.payment_amount}","${p.status}","${p.campaign?.brand_name || ""}","${p.creator?.name || ""}","${p.paid_by_user?.name || ""}","${p.payment_date || ""}","${p.due_date || ""}","${p.payment_method}","${p.payment_reference || ""}"`
        )
        .join("\n");

    const uri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const a = document.createElement("a");
    a.href = uri;
    a.download = `payments_${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    a.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
        {/* ===== HEADER ===== */}
        <div className="flex justify-between items-center mb-3 p-2 bg-card border border-border rounded-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-green-500" />
            <div>
              <h1 className="text-sm font-bold">Payments</h1>
              <p className="text-xs text-muted-foreground">
                {filteredPayments.length} payments • Total: {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3 w-3" />
            </Button>

            {canCreate && (
              <Button
                size="sm"
                onClick={() => router.push("/dashboard/payments/new")}
              >
                <PlusCircle className="h-3 w-3" />
                New Payment
              </Button>
            )}
          </div>
        </div>

        {/* ===== SUMMARY CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(totalAmount)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed Payments</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(completedAmount)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Payments</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(pendingAmount)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== SEARCH & FILTERS ===== */}
        <div className="mb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments by title, reference, invoice, campaign, or creator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[180px] text-xs">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.brand_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={creatorFilter} onValueChange={setCreatorFilter}>
              <SelectTrigger className="w-[180px] text-xs">
                <SelectValue placeholder="All Creators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                {creators.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ===== PAYMENTS TABLE ===== */}
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-accent">
                <tr className="border-b border-border">
                  {[
                    "Payment",
                    "Amount",
                    "Status",
                    "Campaign",
                    "Creator",
                    "Payment Date",
                    "Paid By",
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
                {pageData.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border hover:bg-accent/30"
                  >
                    {/* PAYMENT INFO */}
                    <td className="p-2 border-r border-border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-green-100 rounded flex items-center justify-center">
                            <CreditCard className="h-3 w-3 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{payment.payment_title}</p>
                            {payment.invoice_number && (
                              <p className="text-[10px] text-muted-foreground">
                                Invoice: {payment.invoice_number}
                              </p>
                            )}
                          </div>
                        </div>
                        {payment.payment_description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {payment.payment_description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td className="p-2 border-r border-border">
                      <PaymentAmount amount={payment.payment_amount} currency={payment.currency} />
                      {payment.payment_method && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          via {payment.payment_method}
                        </p>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="p-2 border-r border-border">
                      <div className="space-y-2">
                        <PaymentStatusBadge status={payment.status} />
                        {payment.payment_status && (
                          <Badge variant="outline" className="text-[10px]">
                            {payment.payment_status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* CAMPAIGN */}
                    <td className="p-2 border-r border-border">
                      {payment.campaign ? (
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3 text-blue-500" />
                          <span className="truncate max-w-[120px]">
                            {payment.campaign.brand_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* CREATOR */}
                    <td className="p-2 border-r border-border">
                      {payment.creator ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-purple-500" />
                          <span>{payment.creator.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* PAYMENT DATE */}
                    <td className="p-2 border-r border-border">
                      <div className="space-y-1">
                        {payment.payment_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {payment.due_date && (
                          <p className="text-[10px] text-muted-foreground">
                            Due: {new Date(payment.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* PAID BY */}
                    <td className="p-2 border-r border-border">
                      {payment.paid_by_user ? (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-orange-500" />
                          <span className="truncate max-w-[100px]">
                            {payment.paid_by_user.name || payment.paid_by_user.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-2">
                      <div className="flex items-center gap-1 justify-end">
                        {canManage && (
                          <>
                            <Select
                              value={payment.status}
                              onValueChange={(value) => handleStatusUpdate(payment.id, value)}
                            >
                              <SelectTrigger className="h-6 w-24 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approve</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Complete</SelectItem>
                                <SelectItem value="cancelled">Cancel</SelectItem>
                                <SelectItem value="rejected">Reject</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/payments/edit/${payment.id}`)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
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
              filteredPayments.length
            )}{" "}
            of {filteredPayments.length} payments
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
        {filteredPayments.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-sm">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium mb-1">No payments found</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {search ? "Try a different search term" : "Get started by creating a new payment"}
            </p>
            {canCreate && (
              <Button
                size="sm"
                onClick={() => router.push("/dashboard/payments/new")}
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                New Payment
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}