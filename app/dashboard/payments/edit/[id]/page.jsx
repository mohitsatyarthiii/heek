"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  Save,
  Calendar,
  User,
  CreditCard,
  DollarSign,
  Building,
  Users,
  FileText,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Eye,
  Plus,
  Trash2,
  Percent,
  Wallet,
  Receipt,
  Clock,
  XCircle,
  CheckCheck,
  RefreshCw,
  Hash,
  Mail,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";

// ==================== STATUS BADGE COMPONENT ====================
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
    <Badge className={`${bg} ${text} ${border} flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium`}>
      {icon}
      {label}
    </Badge>
  );
};

// ==================== CREATOR AVATAR COMPONENT ====================
const CreatorAvatar = ({ name, email, category }) => {
  if (!name) return null;

  const colors = [
    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
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
    <div className="flex items-center gap-2">
      <div className={`h-8 w-8 rounded-2xl ${colorClass} border flex items-center justify-center font-semibold text-xs shadow-sm`}>
        {initials}
      </div>
      <div>
        <span className="font-medium text-foreground text-sm">{name}</span>
        {category && (
          <span className="text-xs text-muted-foreground ml-1">({category})</span>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN EDIT PAYMENT PAGE ====================
export default function EditPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [payment, setPayment] = useState(null);
  const [creators, setCreators] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);

  // Multiple creators ke liye state
  const [paymentCreators, setPaymentCreators] = useState([]);

  const [formData, setFormData] = useState({
    payment_amount: "",
    status: "draft",
    payment_date: "",
    due_date: "",
    payment_method: "bank_transfer",
    payment_reference: "",
    notes: ""
  });

  // Payment methods
  const paymentMethods = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "upi", label: "UPI" },
    { value: "credit_card", label: "Credit Card" },
    { value: "paypal", label: "PayPal" },
    { value: "cash", label: "Cash" },
    { value: "cheque", label: "Cheque" },
    { value: "other", label: "Other" }
  ];

  useEffect(() => {
    if (params.id && user) {
      fetchPayment();
      fetchCreators();
      checkPermissions();
    }
  }, [params.id, user]);

  // ========== PERMISSIONS CHECK ==========
  const checkPermissions = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();

      if (profile) {
        setIsAdmin(profile.role === 'admin');
        setIsManager(profile.role === 'manager');
        setCanEdit(['admin', 'manager'].includes(profile.role) || user?.id === payment?.created_by);
      }
    } catch (err) {
      console.error("Error checking permissions:", err);
    }
  };

  // ========== FETCH CREATORS ==========
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
    }
  };

  // ========== FETCH PAYMENT WITH CREATORS ==========
  const fetchPayment = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Payment fetch karo
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("id", params.id)
        .single();

      if (paymentError) throw paymentError;
      if (!paymentData) throw new Error("Payment not found");

      // 2. Campaign fetch karo
      let campaignData = null;
      if (paymentData.campaign_id) {
        const { data } = await supabase
          .from("campaigns")
          .select("id, brand_name")
          .eq("id", paymentData.campaign_id)
          .single();
        campaignData = data;
      }

      // 3. User details fetch karo
      const [createdBy, paidBy, approvedBy] = await Promise.all([
        paymentData.created_by ? supabase.from("profiles").select("id, name, email").eq("id", paymentData.created_by).single() : null,
        paymentData.paid_by ? supabase.from("profiles").select("id, name, email").eq("id", paymentData.paid_by).single() : null,
        paymentData.approved_by ? supabase.from("profiles").select("id, name, email").eq("id", paymentData.approved_by).single() : null
      ]);

      // 4. Payment creators fetch karo
      const { data: paymentCreatorsData } = await supabase
        .from("payment_creators")
        .select("*")
        .eq("payment_id", params.id);

      // 5. Creator details fetch karo for each payment creator
      const paymentCreatorsWithDetails = [];
      if (paymentCreatorsData && paymentCreatorsData.length > 0) {
        for (const pc of paymentCreatorsData) {
          const { data: creatorData } = await supabase
            .from("creators")
            .select("id, name, email, primary_category")
            .eq("id", pc.creator_id)
            .single();
          
          paymentCreatorsWithDetails.push({
            ...pc,
            creator: creatorData
          });
        }
      }

      // 6. Complete payment data
      setPayment({
        ...paymentData,
        campaign: campaignData,
        created_by_user: createdBy?.data,
        paid_by_user: paidBy?.data,
        approved_by_user: approvedBy?.data,
        payment_creators: paymentCreatorsWithDetails
      });

      // 7. Payment creators set karo
      if (paymentCreatorsWithDetails.length > 0) {
        setPaymentCreators(paymentCreatorsWithDetails);
      } else {
        setPaymentCreators([{
          creator_id: "",
          amount: "",
          commission_percentage: "",
          isNew: true
        }]);
      }

      // 8. Form data set karo
      setFormData({
        payment_amount: paymentData.payment_amount?.toString() || "",
        status: paymentData.status || "draft",
        payment_date: paymentData.payment_date ? paymentData.payment_date.split('T')[0] : "",
        due_date: paymentData.due_date ? paymentData.due_date.split('T')[0] : "",
        payment_method: paymentData.payment_method || "bank_transfer",
        payment_reference: paymentData.payment_reference || "",
        notes: paymentData.notes || ""
      });

    } catch (err) {
      console.error("Error fetching payment:", err);
      setError(err.message || "Failed to load payment");
    } finally {
      setLoading(false);
    }
  };

  // ========== HANDLE CREATOR CHANGES ==========
  const handleCreatorChange = (index, field, value) => {
    const updated = [...paymentCreators];
    updated[index][field] = value;

    // Creator select kiya toh uski details bhi save karo
    if (field === 'creator_id' && value) {
      const creator = creators.find(c => c.id === value);
      if (creator) {
        updated[index].creator = creator;
      }
    }

    // Amount update karte hi total calculate karo
    if (field === 'amount') {
      const total = updated.reduce((sum, pc) => sum + (parseFloat(pc.amount) || 0), 0);
      setFormData(prev => ({ ...prev, payment_amount: total.toString() }));
    }

    setPaymentCreators(updated);
  };

  // ========== ADD NEW CREATOR ==========
  const addCreator = () => {
    setPaymentCreators([
      ...paymentCreators,
      {
        creator_id: "",
        amount: "",
        commission_percentage: "",
        isNew: true
      }
    ]);
  };

  // ========== REMOVE CREATOR ==========
  const removeCreator = async (index) => {
    const creatorToRemove = paymentCreators[index];

    // Database se delete karo agar existing hai
    if (creatorToRemove.id && !creatorToRemove.isNew) {
      try {
        const supabase = createClient();
        await supabase
          .from("payment_creators")
          .delete()
          .eq("id", creatorToRemove.id);
      } catch (err) {
        console.error("Error deleting creator:", err);
        setError("Failed to delete creator");
        return;
      }
    }

    const updated = paymentCreators.filter((_, i) => i !== index);
    setPaymentCreators(updated);

    // Total recalculate
    const total = updated.reduce((sum, pc) => sum + (parseFloat(pc.amount) || 0), 0);
    setFormData(prev => ({ ...prev, payment_amount: total.toString() }));
  };

  // ========== HANDLE FORM CHANGES ==========
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ========== SUBMIT FORM ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      // Check permissions
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("User profile not found");

      const userRole = profile.role;
      const canUserEdit = ['admin', 'manager'].includes(userRole) || user.id === payment.created_by;

      if (!canUserEdit) {
        throw new Error("You don't have permission to edit this payment");
      }

      // 1. Update payment
      const updateData = {
        payment_amount: parseFloat(formData.payment_amount) || 0,
        status: formData.status,
        payment_date: formData.payment_date || null,
        due_date: formData.due_date || null,
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      };

      // Status approved hai toh approved_by set karo
      if (formData.status === 'approved' && ['admin', 'manager'].includes(userRole)) {
        updateData.approved_by = user.id;
      }

      const { error: updateError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", params.id);

      if (updateError) throw updateError;

      // 2. Update payment creators
      const existingCreators = paymentCreators.filter(pc => pc.id && !pc.isNew);
      const newCreators = paymentCreators.filter(pc => pc.isNew && pc.creator_id && pc.amount);

      // Update existing creators
      for (const pc of existingCreators) {
        await supabase
          .from("payment_creators")
          .update({
            amount: parseFloat(pc.amount) || 0,
            commission_percentage: pc.commission_percentage ? parseFloat(pc.commission_percentage) : null
          })
          .eq("id", pc.id);
      }

      // Add new creators
      if (newCreators.length > 0) {
        const newCreatorRecords = newCreators.map(pc => ({
          payment_id: params.id,
          creator_id: pc.creator_id,
          amount: parseFloat(pc.amount) || 0,
          commission_percentage: pc.commission_percentage ? parseFloat(pc.commission_percentage) : null
        }));

        await supabase
          .from("payment_creators")
          .insert(newCreatorRecords);
      }

      setSuccess("Payment updated successfully!");
      setTimeout(() => {
        router.push("/dashboard/payments");
        router.refresh();
      }, 1500);

    } catch (err) {
      setError(err.message || "Failed to update payment");
    } finally {
      setSaving(false);
    }
  };

  // ========== FORMAT CURRENCY ==========
  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment data...</p>
        </div>
      </div>
    );
  }

  // ========== NOT FOUND STATE ==========
  if (!payment) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md p-6">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Payment not found</h3>
          <p className="text-muted-foreground mt-2">The payment you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/payments")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-background">
      {/* Header - Google Docs Style */}
      <div className="border-b border-border bg-card sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/payments")}
              className="text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Edit Payment</h1>
                <PaymentStatusBadge status={payment.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {payment.payment_title} • Last updated: {formatDate(payment.updated_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {payment.invoice_number && (
              <Badge variant="outline" className="border-border text-foreground flex items-center gap-1 px-3 py-1">
                <Hash className="h-3 w-3" />
                {payment.invoice_number}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Read-Only Warning */}
        {!canEdit && (
          <Card className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    Read-Only Mode
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    You have view-only access. Contact Admin or Manager to make changes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - Payment Info & Creators */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Info Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Payment Title</Label>
                    <p className="font-medium text-foreground">{payment.payment_title}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <p className="text-foreground">
                      {payment.payment_description || <span className="text-muted-foreground italic">No description</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creators & Commissions Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Creators & Commissions
                    {paymentCreators.filter(c => c.creator_id).length > 0 && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 ml-2">
                        {paymentCreators.filter(c => c.creator_id).length} assigned
                      </Badge>
                    )}
                  </CardTitle>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCreator}
                      disabled={saving}
                      className="border-border text-foreground hover:bg-accent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Creator
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {paymentCreators.map((pc, index) => (
                    <div
                      key={index}
                      className="p-4 bg-accent/30 rounded-lg border border-border relative"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Creator Select */}
                        <div className="md:col-span-5">
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Select Creator
                          </Label>
                          <Select
                            value={pc.creator_id || ""}
                            onValueChange={(value) => handleCreatorChange(index, 'creator_id', value)}
                            disabled={saving || !canEdit}
                          >
                            <SelectTrigger className="bg-background border-border text-foreground">
                              <SelectValue placeholder="Choose creator..." />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border max-h-[300px]">
                              <SelectItem value="_select">Select a creator</SelectItem>
                              {creators.map((creator) => (
                                <SelectItem key={creator.id} value={creator.id}>
                                  {creator.name}
                                  {creator.primary_category && ` (${creator.primary_category})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {pc.creator && (
                            <div className="mt-2">
                              <CreatorAvatar
                                name={pc.creator.name}
                                email={pc.creator.email}
                                category={pc.creator.primary_category}
                              />
                            </div>
                          )}
                        </div>

                        {/* Commission Percentage */}
                        <div className="md:col-span-3">
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Commission %
                          </Label>
                          <div className="relative">
                            <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={pc.commission_percentage || ""}
                              onChange={(e) => handleCreatorChange(index, 'commission_percentage', e.target.value)}
                              placeholder="10"
                              disabled={saving || !canEdit}
                              className="pl-9 bg-background border-border text-foreground focus:border-primary"
                            />
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="md:col-span-3">
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Amount *
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pc.amount || ""}
                              onChange={(e) => handleCreatorChange(index, 'amount', e.target.value)}
                              placeholder="0.00"
                              required
                              disabled={saving || !canEdit}
                              className="pl-9 bg-background border-border text-foreground focus:border-primary"
                            />
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div className="md:col-span-1 flex items-end justify-end">
                          {paymentCreators.length > 1 && canEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCreator(index)}
                              disabled={saving}
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-full h-10 w-10 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total Amount Display */}
                  {paymentCreators.filter(c => c.amount).length > 1 && (
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
                      <span className="text-sm font-medium text-muted-foreground">
                        Total to all creators
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(paymentCreators.reduce((sum, pc) => sum + (parseFloat(pc.amount) || 0), 0))}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Linked Entities Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Linked Entities
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payment.campaign && (
                    <div>
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Campaign
                      </Label>
                      <p className="font-medium text-foreground">{payment.campaign.brand_name}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Created By
                    </Label>
                    <p className="font-medium text-foreground">
                      {payment.created_by_user?.name || payment.created_by_user?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                  {payment.paid_by_user && (
                    <div>
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Paid By
                      </Label>
                      <p className="font-medium text-foreground">
                        {payment.paid_by_user.name || payment.paid_by_user.email}
                      </p>
                    </div>
                  )}
                  {payment.approved_by_user && payment.status === 'approved' && (
                    <div>
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4" />
                        Approved By
                      </Label>
                      <p className="font-medium text-foreground">
                        {payment.approved_by_user.name || payment.approved_by_user.email}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Edit Form */}
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Edit Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm border border-destructive/20">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-md flex items-center gap-2 text-sm border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      {success}
                    </div>
                  )}

                  {/* Current Amount Display */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Current Amount</Label>
                    <div className="p-3 bg-accent rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-xl font-bold text-foreground">
                          {formatCurrency(payment.payment_amount, payment.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_amount" className="text-foreground">
                      Update Amount *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="payment_amount"
                        name="payment_amount"
                        type="number"
                        step="0.01"
                        value={formData.payment_amount}
                        onChange={handleChange}
                        placeholder="Enter new amount"
                        required
                        disabled={saving || !canEdit}
                        className="pl-9 bg-background border-border text-foreground focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-foreground">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                      disabled={saving || !canEdit}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_method" className="text-foreground">Payment Method</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => handleSelectChange('payment_method', value)}
                      disabled={saving || !canEdit}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_date" className="text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Payment Date
                    </Label>
                    <Input
                      id="payment_date"
                      name="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={handleChange}
                      disabled={saving || !canEdit}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="due_date" className="text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Due Date
                    </Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleChange}
                      disabled={saving || !canEdit}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  {/* Payment Reference */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_reference" className="text-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Reference
                    </Label>
                    <Input
                      id="payment_reference"
                      name="payment_reference"
                      value={formData.payment_reference}
                      onChange={handleChange}
                      placeholder="Transaction ID / Reference"
                      disabled={saving || !canEdit}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-foreground">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Internal notes..."
                      rows={3}
                      disabled={saving || !canEdit}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  {/* Submit Button */}
                  {canEdit && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/dashboard/payments")}
                        disabled={saving}
                        className="border-border text-foreground hover:bg-accent"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Update Payment
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/payments/new")}
                    className="w-full justify-start border-border text-foreground hover:bg-accent"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Create New Payment
                  </Button>
                  {payment.campaign_id && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/campaigns/${payment.campaign_id}`)}
                      className="w-full justify-start border-border text-foreground hover:bg-accent"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Campaign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}