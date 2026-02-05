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
} from "lucide-react";

export default function EditPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [payment, setPayment] = useState(null);
  
  const [formData, setFormData] = useState({
    payment_amount: "",
    status: "draft",
    payment_date: "",
    due_date: "",
    payment_method: "bank_transfer",
    payment_reference: "",
    notes: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchPayment();
    }
  }, [params.id]);

  const fetchPayment = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          campaign:campaigns!campaign_id (id, brand_name, creator_name),
          creator:creators!creator_id (id, name),
          paid_by_user:profiles!paid_by (id, name, email),
          approved_by_user:profiles!approved_by (id, name, email),
          created_by_user:profiles!created_by (id, name, email)
        `)
        .eq("id", params.id)
        .single();

      if (error) throw error;

      if (data) {
        setPayment(data);
        // Format data for form - only editable fields
        setFormData({
          payment_amount: data.payment_amount?.toString() || "",
          status: data.status || "draft",
          payment_date: data.payment_date ? data.payment_date.split('T')[0] : "",
          due_date: data.due_date ? data.due_date.split('T')[0] : "",
          payment_method: data.payment_method || "bank_transfer",
          payment_reference: data.payment_reference || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      console.error("Error fetching payment:", error);
      setError("Failed to load payment");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

      if (!profile) {
        throw new Error("User profile not found");
      }

      // Check if user can edit
      const canEdit = ['admin', 'manager'].includes(profile.role) || 
                      user.id === payment.created_by;

      if (!canEdit) {
        throw new Error("You don't have permission to edit this payment");
      }

      // Only update editable fields
      const updateData = {
        payment_amount: parseFloat(formData.payment_amount) || 0,
        status: formData.status,
        payment_date: formData.payment_date || null,
        due_date: formData.due_date || null,
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      };

      // If status is being approved and user is admin/manager, set approved_by
      if (formData.status === 'approved' && ['admin', 'manager'].includes(profile.role)) {
        updateData.approved_by = user.id;
      }

      const { error: updateError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", params.id);

      if (updateError) {
        throw updateError;
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

  const getStatusBadge = (status) => {
    const config = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      rejected: "bg-red-100 text-red-800",
      on_hold: "bg-orange-100 text-orange-800",
    };

    return config[status] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment data...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Payment not found</h3>
          <p className="text-muted-foreground mt-2">The payment you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/payments")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard/payments")}
              className="border-border text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Payment</h1>
              <p className="text-sm text-muted-foreground">
                Update payment details - Limited editing allowed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={`${getStatusBadge(payment.status)} capitalize`}>
              {payment.status}
            </Badge>
            {payment.invoice_number && (
              <Badge variant="outline" className="text-xs">
                {payment.invoice_number}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Read-only Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Info Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Payment Title</Label>
                      <p className="font-medium text-foreground">{payment.payment_title}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Invoice Number</Label>
                      <p className="font-medium text-foreground">{payment.invoice_number || "—"}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Description</Label>
                      <p className="text-foreground">
                        {payment.payment_description || (
                          <span className="text-muted-foreground italic">No description</span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Currency</Label>
                      <p className="font-medium text-foreground">{payment.currency}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Linked Entities Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5" />
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
                      {payment.campaign.creator_name && (
                        <p className="text-sm text-muted-foreground">
                          Creator: {payment.campaign.creator_name}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {payment.creator && (
                    <div>
                      <Label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Creator
                      </Label>
                      <p className="font-medium text-foreground">{payment.creator.name}</p>
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
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Editable Fields */}
          <div className="space-y-6">
            {/* Editable Fields Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground">Edit Payment</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update amount and status only
                </p>
              </CardHeader>
              
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center gap-2 text-sm border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-md flex items-center gap-2 text-sm border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      {success}
                    </div>
                  )}

                  {/* Current Amount Display */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Current Amount</Label>
                    <div className="p-3 bg-accent rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-xl font-bold text-foreground">
                          {formatCurrency(payment.payment_amount, payment.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_amount" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Update Amount *
                      </span>
                    </Label>
                    <Input
                      id="payment_amount"
                      name="payment_amount"
                      type="number"
                      step="0.01"
                      value={formData.payment_amount}
                      onChange={handleChange}
                      placeholder="Enter new amount"
                      required
                      disabled={saving}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-foreground">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleSelectChange('status', value)}
                      disabled={saving}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="draft" className="text-foreground">Draft</SelectItem>
                        <SelectItem value="pending" className="text-foreground">Pending</SelectItem>
                        <SelectItem value="approved" className="text-foreground">Approved</SelectItem>
                        <SelectItem value="processing" className="text-foreground">Processing</SelectItem>
                        <SelectItem value="completed" className="text-foreground">Completed</SelectItem>
                        <SelectItem value="cancelled" className="text-foreground">Cancelled</SelectItem>
                        <SelectItem value="rejected" className="text-foreground">Rejected</SelectItem>
                        <SelectItem value="on_hold" className="text-foreground">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_method" className="text-foreground">Payment Method</Label>
                    <Select 
                      value={formData.payment_method} 
                      onValueChange={(value) => handleSelectChange('payment_method', value)}
                      disabled={saving}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_date" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Payment Date
                      </span>
                    </Label>
                    <Input
                      id="payment_date"
                      name="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={handleChange}
                      disabled={saving}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="due_date" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Due Date
                      </span>
                    </Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleChange}
                      disabled={saving}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  {/* Payment Reference */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_reference" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Reference
                      </span>
                    </Label>
                    <Input
                      id="payment_reference"
                      name="payment_reference"
                      value={formData.payment_reference}
                      onChange={handleChange}
                      placeholder="Transaction ID / Reference"
                      disabled={saving}
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
                      disabled={saving}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

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
                      className="bg-primary text-primary-foreground hover:opacity-90"
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
                    onClick={() => router.push(`/dashboard/payments/new`)}
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
                      View Linked Campaign
                    </Button>
                  )}
                  
                  {payment.creator_id && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/creators/${payment.creator_id}`)}
                      className="w-full justify-start border-border text-foreground hover:bg-accent"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Linked Creator
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