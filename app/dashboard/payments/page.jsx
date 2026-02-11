"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CreditCard,
  DollarSign,
  Building,
  Users,
  FileText,
  CheckCheck,
  AlertTriangle,
  TrendingUp,
  Receipt,
  Wallet,
  Percent,
  Hash,
  Mail,
  Instagram,
  Youtube,
  Twitter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

/* =========================
   CREATOR AVATAR WITH COLOR
========================= */
const CreatorAvatar = ({ name, email, category, showDetails = false }) => {
  if (!name) return null;
  
  const colors = [
    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  ];
  
  const colorIndex = (name.length + name.charCodeAt(0)) % colors.length;
  const colorClass = colors[colorIndex];
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CR';

  return (
    <div className="flex items-center gap-2 group/avatar">
      <div className={`h-7 w-7 rounded-md ${colorClass} border flex items-center justify-center font-semibold text-xs shadow-sm transition-all group-hover/avatar:scale-110`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-foreground text-xs truncate">{name}</span>
          {category && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================
   PAYMENT STATUS BADGE
========================= */
const PaymentStatusBadge = ({ status }) => {
  const config = {
    draft: {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-700 dark:text-gray-300",
      border: "border-gray-200 dark:border-gray-700",
      icon: <FileText className="h-3 w-3" />,
      label: "Draft"
    },
    pending: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-300",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: <Clock className="h-3 w-3" />,
      label: "Pending"
    },
    approved: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800",
      icon: <CheckCircle className="h-3 w-3" />,
      label: "Approved"
    },
    processing: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-200 dark:border-purple-800",
      icon: <RefreshCw className="h-3 w-3" />,
      label: "Processing"
    },
    completed: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-300",
      border: "border-green-200 dark:border-green-800",
      icon: <CheckCheck className="h-3 w-3" />,
      label: "Completed"
    },
    cancelled: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-200 dark:border-red-800",
      icon: <XCircle className="h-3 w-3" />,
      label: "Cancelled"
    },
    rejected: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-200 dark:border-red-800",
      icon: <XCircle className="h-3 w-3" />,
      label: "Rejected"
    },
    on_hold: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-700 dark:text-orange-300",
      border: "border-orange-200 dark:border-orange-800",
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "On Hold"
    }
  };
  
  const { bg, text, border, icon, label } = config[status] || config.draft;
  
  return (
    <Badge className={`${bg} ${text} ${border} inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium`}>
      {icon}
      {label}
    </Badge>
  );
};

/* =========================
   AMOUNT DISPLAY
========================= */
const PaymentAmount = ({ amount, currency = "USD" }) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount || 0);

  return (
    <div className="flex items-center gap-1">
      <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
      <span className="font-semibold text-foreground text-sm">{formattedAmount}</span>
    </div>
  );
};

/* =========================
   STATUS UPDATE DROPDOWN
========================= */
const StatusUpdateDropdown = ({ currentStatus, onStatusChange, canManage }) => {
  const statusOptions = [
    { value: "draft", label: "Draft", icon: <FileText className="h-3.5 w-3.5" /> },
    { value: "pending", label: "Pending", icon: <Clock className="h-3.5 w-3.5" /> },
    { value: "approved", label: "Approved", icon: <CheckCircle className="h-3.5 w-3.5" /> },
    { value: "processing", label: "Processing", icon: <RefreshCw className="h-3.5 w-3.5" /> },
    { value: "completed", label: "Completed", icon: <CheckCheck className="h-3.5 w-3.5" /> },
    { value: "cancelled", label: "Cancelled", icon: <XCircle className="h-3.5 w-3.5" /> },
    { value: "on_hold", label: "On Hold", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  ];

  if (!canManage) {
    return <PaymentStatusBadge status={currentStatus} />;
  }

  return (
    <Select value={currentStatus} onValueChange={onStatusChange}>
      <SelectTrigger className="h-7 w-[110px] border-0 bg-transparent hover:bg-accent p-0 px-2 gap-1 text-xs">
        <PaymentStatusBadge status={currentStatus} />
      </SelectTrigger>
      <SelectContent className="bg-card border-border min-w-[140px]">
        <SelectItem value="draft" className="text-xs">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Draft
          </div>
        </SelectItem>
        <SelectItem value="pending" className="text-xs">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </div>
        </SelectItem>
        <SelectItem value="approved" className="text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5" />
            Approved
          </div>
        </SelectItem>
        <SelectItem value="processing" className="text-xs">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Processing
          </div>
        </SelectItem>
        <SelectItem value="completed" className="text-xs">
          <div className="flex items-center gap-2">
            <CheckCheck className="h-3.5 w-3.5" />
            Completed
          </div>
        </SelectItem>
        <SelectItem value="cancelled" className="text-xs text-destructive">
          <div className="flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
          </div>
        </SelectItem>
        <SelectItem value="on_hold" className="text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            On Hold
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

/* =========================
   GOOGLE DOCS STYLE HEADER
========================= */
const GoogleDocsHeader = ({ title, subtitle, onRefresh, onExport, onNew }) => {
  return (
    <div className="border-b border-border bg-card sticky top-0 z-10 px-6 py-3">
      <div className="max-w-[1800px] mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 px-3 text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport} className="h-8 px-3 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          {onNew && (
            <Button size="sm" onClick={onNew} className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              New Payment
            </Button>
          )}
        </div>
      </div>
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
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: null });
  const itemsPerPage = 15;

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchPayments(),
        fetchCampaigns(),
        fetchCreators(),
        checkPermissions(),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please check RLS policies.");
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setCanCreate(["admin", "manager", "associate"].includes(profile?.role));
      setCanManage(["admin", "manager"].includes(profile?.role));
    } catch (err) {
      console.error("Error checking permissions:", err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("campaigns")
        .select("id, brand_name")
        .order("brand_name");
      setCampaigns(data || []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setCampaigns([]);
    }
  };

  const fetchCreators = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("creators")
        .select("id, name, email, primary_category")
        .order("name");
      setCreators(data || []);
    } catch (err) {
      console.error("Error fetching creators:", err);
      setCreators([]);
    }
  };

  const fetchPayments = async () => {
    try {
      const supabase = createClient();
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          *,
          campaign:campaigns!campaign_id (id, brand_name),
          paid_by_user:profiles!paid_by (id, name, email),
          approved_by_user:profiles!approved_by (id, name, email),
          created_by_user:profiles!created_by (id, name, email)
        `)
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      if (!paymentsData || paymentsData.length === 0) {
        setPayments([]);
        return;
      }

      const paymentsWithCreators = await Promise.all(
        paymentsData.map(async (payment) => {
          try {
            const { data: paymentCreators, error: pcError } = await supabase
              .from("payment_creators")
              .select(`
                id,
                amount,
                commission_percentage,
                status,
                creator:creators!creator_id (
                  id,
                  name,
                  email,
                  primary_category
                )
              `)
              .eq("payment_id", payment.id);

            if (pcError) throw pcError;

            return {
              ...payment,
              payment_creators: paymentCreators || [],
              creator_count: paymentCreators?.length || 0
            };
          } catch (err) {
            console.error(`Error fetching creators for payment ${payment.id}:`, err);
            return {
              ...payment,
              payment_creators: [],
              creator_count: 0
            };
          }
        })
      );

      setPayments(paymentsWithCreators);
    } catch (err) {
      console.error("fetchPayments error:", err);
      setError(err.message);
      setPayments([]);
    }
  };

  const handleStatusUpdate = async (paymentId, newStatus) => {
    if (!canManage) {
      alert("You don't have permission");
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
      fetchPayments();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!canManage) {
      alert("You don't have permission to delete");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", deleteDialog.id);

      if (error) throw error;
      
      setDeleteDialog({ open: false, id: null, title: null });
      fetchPayments();
    } catch (err) {
      console.error("Error deleting payment:", err);
      alert("Failed to delete payment");
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();

    const matchesSearch =
      p.payment_title?.toLowerCase().includes(q) ||
      p.invoice_number?.toLowerCase().includes(q) ||
      p.campaign?.brand_name?.toLowerCase().includes(q) ||
      p.payment_creators?.some(pc => pc.creator?.name?.toLowerCase().includes(q));

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesCampaign = campaignFilter === "all" || p.campaign_id === campaignFilter;
    const matchesCreator = creatorFilter === "all" || 
      p.payment_creators?.some(pc => pc.creator_id === creatorFilter);

    return matchesSearch && matchesStatus && matchesCampaign && matchesCreator;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.payment_amount || 0), 0);
  const completedAmount = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.payment_amount || 0), 0);
  const pendingAmount = filteredPayments
    .filter(p => ['pending', 'approved'].includes(p.status))
    .reduce((sum, p) => sum + (p.payment_amount || 0), 0);

  const handleExport = () => {
    const headers = ['Invoice', 'Title', 'Total', 'Status', 'Campaign', 'Creators', 'Amounts', 'Commissions', 'Date'];
    const rows = payments.map(p => [
      p.invoice_number || '',
      p.payment_title,
      `$${p.payment_amount || 0}`,
      p.status,
      p.campaign?.brand_name || '',
      p.payment_creators?.map(pc => pc.creator?.name || '').join('; ') || '',
      p.payment_creators?.map(pc => `$${pc.amount || 0}`).join('; ') || '',
      p.payment_creators?.map(pc => `${pc.commission_percentage || 0}%`).join('; ') || '',
      p.payment_date || ''
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="h-10 w-10 border-3 border-border border-t-primary rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-muted-foreground">Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-background">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="text-base font-semibold text-destructive mb-1">Error Loading Data</h3>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData} variant="destructive" size="sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GoogleDocsHeader
        title="Payments"
        subtitle={`${filteredPayments.length} payments • Total: ${formatCurrency(totalAmount)}`}
        onRefresh={fetchData}
        onExport={handleExport}
        onNew={canCreate ? () => router.push("/dashboard/payments/new") : null}
      />

      <div className="max-w-[1800px] mx-auto px-6 py-5">
        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-lg font-semibold text-foreground">{filteredPayments.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Completed</p>
                  <p className="text-lg font-semibold text-foreground">
                    {payments.filter(p => p.status === 'completed').length}
                  </p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">{formatCurrency(completedAmount)}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
                  <p className="text-lg font-semibold text-foreground">
                    {payments.filter(p => ['pending', 'approved'].includes(p.status)).length}
                  </p>
                  <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-0.5">{formatCurrency(pendingAmount)}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-md flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">This Month</p>
                  <p className="text-lg font-semibold text-foreground">
                    {payments.filter(p => {
                      const d = new Date(p.created_at);
                      const n = new Date();
                      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
                    }).length}
                  </p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">+12% vs last month</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-md flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Compact */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background border-border focus:bg-background rounded-md"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-background border-border rounded-md">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border rounded-md">
              <Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-xs">
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.brand_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={creatorFilter} onValueChange={setCreatorFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border rounded-md">
              <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Creator" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-xs">
              <SelectItem value="all">All Creators</SelectItem>
              {creators.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sleek Table with Grid Lines */}
        <div className="border border-border rounded-md overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                    Invoice / Payment
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                    Campaign
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                    Creators & Commissions
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                    Paid By
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.map((payment, idx) => (
                  <tr 
                    key={payment.id} 
                    className="hover:bg-accent/30 transition-colors"
                  >
                    {/* Invoice / Payment */}
                    <td className="px-3 py-2.5 border-r border-border align-top">
                      <div className="flex items-start gap-2">
                        <div className="h-7 w-7 bg-muted rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground text-xs">{payment.payment_title}</p>
                          {payment.invoice_number && (
                            <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Hash className="h-2.5 w-2.5" />
                              {payment.invoice_number}
                            </p>
                          )}
                          {payment.payment_description && (
                            <p className="text-[9px] text-muted-foreground line-clamp-1 max-w-[200px]">
                              {payment.payment_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2.5 border-r border-border align-top">
                      <PaymentAmount amount={payment.payment_amount} />
                      <p className="text-[9px] text-muted-foreground mt-1 capitalize">
                        {payment.payment_method?.replace('_', ' ') || 'bank transfer'}
                      </p>
                    </td>

                    {/* Status with Dropdown */}
                    <td className="px-3 py-2.5 border-r border-border align-top">
                      <StatusUpdateDropdown
                        currentStatus={payment.status}
                        onStatusChange={(value) => handleStatusUpdate(payment.id, value)}
                        canManage={canManage}
                      />
                      {payment.approved_by_user && payment.status === 'approved' && (
                        <p className="text-[9px] text-muted-foreground mt-1.5">
                          by {payment.approved_by_user.name?.split(' ')[0] || 'User'}
                        </p>
                      )}
                    </td>

                    {/* Campaign */}
                    <td className="px-3 py-2.5 border-r border-border align-top">
                      {payment.campaign ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-foreground">{payment.campaign.brand_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Creators & Commissions */}
                    <td className="px-3 py-2.5 border-r border-border align-top">
                      {payment.payment_creators && payment.payment_creators.length > 0 ? (
                        <div className="space-y-2">
                          {payment.payment_creators.map((pc, idx) => (
                            <div key={pc.id || idx} className="flex items-start justify-between gap-3">
                              <CreatorAvatar
                                name={pc.creator?.name}
                                category={pc.creator?.primary_category}
                              />
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {pc.commission_percentage > 0 && (
                                  <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                                    {pc.commission_percentage}%
                                  </span>
                                )}
                                <span className="text-xs font-medium text-foreground">
                                  ${pc.amount?.toLocaleString() || 0}
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          {payment.payment_creators.length > 1 && (
                            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-dashed border-border">
                              <span className="text-[9px] font-medium text-muted-foreground">Total</span>
                              <span className="text-xs font-bold text-foreground">
                                {formatCurrency(payment.payment_creators.reduce((sum, pc) => sum + (pc.amount || 0), 0))}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span className="text-xs italic">No creators</span>
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-3 py-2.5 border-r border-border align-top">
                      {payment.payment_date ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-foreground">
                              {new Date(payment.payment_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          {payment.due_date && (
                            <p className={`text-[9px] flex items-center gap-1 ${
                              new Date(payment.due_date) < new Date() && payment.status !== 'completed' 
                                ? 'text-destructive' 
                                : 'text-muted-foreground'
                            }`}>
                              <Clock className="h-2.5 w-2.5" />
                              Due {new Date(payment.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Paid By */}
                    <td className="px-3 py-2.5 border-r border-border align-top">
                      {payment.paid_by_user ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 bg-muted rounded-full flex items-center justify-center">
                            <User className="h-2.5 w-2.5 text-muted-foreground" />
                          </div>
                          <span className="text-xs text-foreground">
                            {payment.paid_by_user.name?.split(' ')[0] || payment.paid_by_user.email?.split('@')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Actions - Only Edit & Delete */}
                    <td className="px-3 py-2.5 align-top">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/payments/edit/${payment.id}`)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                          title="Edit Payment"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ 
                              open: true, 
                              id: payment.id, 
                              title: payment.payment_title 
                            })}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                            title="Delete Payment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center mb-3">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">No payments found</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {search ? "Try adjusting your search filters" : "Create your first payment record"}
              </p>
              {canCreate && !search && (
                <Button onClick={() => router.push("/dashboard/payments/new")} size="sm" className="h-8 text-xs">
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  New Payment
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Pagination - Compact */}
        {filteredPayments.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-[10px] text-muted-foreground">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredPayments.length)}</span>{' '}
              of <span className="font-medium">{filteredPayments.length}</span> payments
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0 border-border rounded-md"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (currentPage <= 2) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 1) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 w-7 p-0 text-xs rounded-md ${
                      currentPage === pageNum 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0 border-border rounded-md"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-destructive/10 rounded-md flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Delete Payment</h3>
                  <p className="text-[10px] text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-foreground mb-2">
                Are you sure you want to delete{' '}
                <span className="font-semibold">"{deleteDialog.title}"</span>?
              </p>
              <p className="text-[10px] text-muted-foreground">
                All associated data including creator allocations will be permanently removed.
              </p>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialog({ open: false, id: null, title: null })}
                className="h-8 px-3 text-xs border-border"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="h-8 px-3 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}