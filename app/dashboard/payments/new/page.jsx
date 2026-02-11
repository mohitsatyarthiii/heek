"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  Plus,
  Trash2,
} from "lucide-react";

export default function NewPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [campaigns, setCampaigns] = useState([]);
  const [creators, setCreators] = useState([]);
  const [users, setUsers] = useState([]);

  // Multiple creators ke liye state
  const [selectedCreators, setSelectedCreators] = useState([
    { creator_id: "none", amount: "", commission_percentage: "" },
  ]);

  const [formData, setFormData] = useState({
    payment_title: "",
    payment_description: "",
    total_amount: "",
    currency: "USD",
    payment_method: "bank_transfer",
    payment_reference: "",
    payment_date: "",
    due_date: "",
    campaign_id: "none",
    paid_by: "",
    status: "draft",
    notes: "",
    invoice_number: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      await Promise.all([fetchCampaigns(), fetchCreators(), fetchUsers()]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setFetching(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campaigns")
        .select(
          "id, brand_name, creator_name, person, commercials_locked, creators_price",
        )
        .order("brand_name");

      if (!error && data) {
        setCampaigns(data);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
    }
  };

  const fetchCreators = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("creators")
        .select("id, name, email, primary_category")
        .order("name");

      if (!error && data) {
        setCreators(data);
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
      setCreators([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .order("name");

      if (!error && data) {
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Creator selection handlers
  const handleCreatorChange = (index, field, value) => {
    const updatedCreators = [...selectedCreators];
    updatedCreators[index][field] = value;

    // Agar creator select kiya hai to uska default commission set karo
    if (field === "creator_id" && value !== "none") {
      const creator = creators.find((c) => c.id === value);
      // Yahan aap apne logic ke hisaab se commission percentage set kar sakte ho
      // Example: based on creator category, past performance, etc.
      if (creator) {
        // Default commission - 10% for now, aap apne rules laga sakte ho
        updatedCreators[index].commission_percentage = "10";
      }
    }

    setSelectedCreators(updatedCreators);

    // Total amount recalculate karo
    calculateTotalAmount(updatedCreators);
  };

  const addCreator = () => {
    setSelectedCreators([
      ...selectedCreators,
      { creator_id: "none", amount: "", commission_percentage: "" },
    ]);
  };

  const removeCreator = (index) => {
    if (selectedCreators.length > 1) {
      const updatedCreators = selectedCreators.filter((_, i) => i !== index);
      setSelectedCreators(updatedCreators);
      calculateTotalAmount(updatedCreators);
    }
  };

  const calculateTotalAmount = (creatorsList) => {
    const total = creatorsList.reduce((sum, creator) => {
      return sum + (parseFloat(creator.amount) || 0);
    }, 0);

    setFormData((prev) => ({
      ...prev,
      total_amount: total.toString(),
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-fill creators when campaign is selected
    if (name === "campaign_id" && value !== "none") {
      const campaign = campaigns.find((c) => c.id === value);
      if (campaign) {
        // Campaign se associated creators fetch karo
        fetchCampaignCreators(value);

        // Auto-suggest amount from campaign's creator price
        if (campaign.creators_price) {
          // Agar ek hi creator hai to uska amount set karo
          if (selectedCreators.length === 1) {
            const updatedCreators = [...selectedCreators];
            updatedCreators[0].amount = campaign.creators_price.toString();
            setSelectedCreators(updatedCreators);
            calculateTotalAmount(updatedCreators);
          }
        }
      }
    }
  };

  const fetchCampaignCreators = async (campaignId) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campaign_creators") // Assume aapke paas ye table hai
        .select("creator_id, commission_percentage, amount")
        .eq("campaign_id", campaignId);

      if (!error && data && data.length > 0) {
        // Campaign ke multiple creators set karo
        const campaignCreators = data.map((c) => ({
          creator_id: c.creator_id,
          amount: c.amount?.toString() || "",
          commission_percentage: c.commission_percentage?.toString() || "10",
        }));
        setSelectedCreators(campaignCreators);
        calculateTotalAmount(campaignCreators);
      }
    } catch (error) {
      console.error("Error fetching campaign creators:", error);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `INV-${year}${month}-${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      // Check if user has permission
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!["admin", "manager", "associate"].includes(profile?.role)) {
        throw new Error("You don't have permission to create payments");
      }

      // Auto-generate invoice number if not provided
      let invoiceNumber = formData.invoice_number;
      if (!invoiceNumber) {
        invoiceNumber = generateInvoiceNumber();
      }

      // Pehle main payment record create karo
      const paymentData = {
        payment_title: formData.payment_title,
        payment_description: formData.payment_description,
        payment_amount: parseFloat(formData.total_amount) || 0,
        currency: formData.currency,
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference || null,
        payment_date: formData.payment_date || null,
        due_date: formData.due_date || null,
        campaign_id:
          formData.campaign_id === "none" ? null : formData.campaign_id,
        paid_by: formData.paid_by || null,
        status: formData.status,
        notes: formData.notes || null,
        invoice_number: invoiceNumber,
        created_by: user.id,
      };

      const { data: payment, error: insertError } = await supabase
        .from("payments")
        .insert([paymentData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Ab multiple creators ke payments create karo
      if (payment && selectedCreators.length > 0) {
        const creatorPayments = selectedCreators
          .filter(
            (c) =>
              c.creator_id !== "none" && c.amount && parseFloat(c.amount) > 0,
          )
          .map((creator) => ({
            payment_id: payment.id,
            creator_id: creator.creator_id,
            amount: parseFloat(creator.amount),
            commission_percentage: creator.commission_percentage
              ? parseFloat(creator.commission_percentage)
              : null,
            status: formData.status,
            created_by: user.id,
          }));

        if (creatorPayments.length > 0) {
          const { error: creatorPaymentError } = await supabase
            .from("payment_creators") // Is table mein multiple creators store honge
            .insert(creatorPayments);

          if (creatorPaymentError) {
            throw creatorPaymentError;
          }
        }
      }

      setSuccess("Payment created successfully!");
      setTimeout(() => {
        router.push("/dashboard/payments");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to create payment");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment form...</p>
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
              <h1 className="text-2xl font-bold text-foreground">
                Create New Payment
              </h1>
              <p className="text-sm text-muted-foreground">
                Add a new payment record with multiple creators
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-foreground">
                  Payment Details
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Fill in the payment information below
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Title */}
                <div className="space-y-2">
                  <Label htmlFor="payment_title" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Payment Title *
                    </span>
                  </Label>
                  <Input
                    id="payment_title"
                    name="payment_title"
                    value={formData.payment_title}
                    onChange={handleChange}
                    placeholder="e.g., Creator Fees for Nike Campaign"
                    required
                    disabled={loading}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Invoice Number */}
                <div className="space-y-2">
                  <Label htmlFor="invoice_number" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Invoice Number
                    </span>
                  </Label>
                  <Input
                    id="invoice_number"
                    name="invoice_number"
                    value={formData.invoice_number}
                    onChange={handleChange}
                    placeholder="Will auto-generate if left empty"
                    disabled={loading}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Total Amount */}
                <div className="space-y-2">
                  <Label htmlFor="total_amount" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total Amount (USD) *
                    </span>
                  </Label>
                  <Input
                    id="total_amount"
                    name="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    disabled={true} // Auto-calculated hai
                    className="bg-muted border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated from creator allocations
                  </p>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-foreground">
                    Currency
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      handleSelectChange("currency", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campaign */}
                <div className="space-y-2">
                  <Label htmlFor="campaign_id" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Linked Campaign (Optional)
                    </span>
                  </Label>
                  <Select
                    value={formData.campaign_id}
                    onValueChange={(value) =>
                      handleSelectChange("campaign_id", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-[300px]">
                      <SelectItem value="none" className="text-foreground">
                        None
                      </SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem
                          key={campaign.id}
                          value={campaign.id}
                          className="text-foreground"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{campaign.brand_name}</span>
                            {campaign.creators_price && (
                              <span className="text-xs text-muted-foreground">
                                ${campaign.creators_price}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="payment_method" className="text-foreground">
                    Payment Method
                  </Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      handleSelectChange("payment_method", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Paid By */}
                <div className="space-y-2">
                  <Label htmlFor="paid_by" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Paid By (Optional)
                    </span>
                  </Label>
                  <Select
                    value={formData.paid_by}
                    onValueChange={(value) =>
                      handleSelectChange("paid_by", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select payer" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-[300px]">
                      <SelectItem
                        value="not-specified"
                        className="text-foreground"
                      >
                        Not specified
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id}
                          className="text-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <span>{user.name || user.email}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              ({user.role})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
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
                    disabled={loading}
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
                    disabled={loading}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-foreground">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleSelectChange("status", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="draft" className="text-foreground">
                        Draft
                      </SelectItem>
                      <SelectItem value="pending" className="text-foreground">
                        Pending
                      </SelectItem>
                      <SelectItem value="approved" className="text-foreground">
                        Approved
                      </SelectItem>
                      <SelectItem
                        value="processing"
                        className="text-foreground"
                      >
                        Processing
                      </SelectItem>
                      <SelectItem value="on_hold" className="text-foreground">
                        On Hold
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Reference */}
                <div className="space-y-2">
                  <Label
                    htmlFor="payment_reference"
                    className="text-foreground"
                  >
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
                    placeholder="Transaction ID / Reference number"
                    disabled={loading}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>
              </div>

              {/* Multiple Creators Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <Label className="text-foreground font-medium">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Creators Allocation *
                    </span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCreator}
                    disabled={loading}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Creator
                  </Button>
                </div>

                {selectedCreators.map((creator, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-muted/50 rounded-lg relative"
                  >
                    <div className="md:col-span-5">
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Select Creator
                      </Label>
                      <Select
                        value={creator.creator_id}
                        onValueChange={(value) =>
                          handleCreatorChange(index, "creator_id", value)
                        }
                        disabled={loading}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select creator" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border max-h-[300px]">
                          <SelectItem
                            value="select-creator"
                            className="text-foreground"
                          >
                            Choose creator...
                          </SelectItem>
                          {creators.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={c.id}
                              className="text-foreground"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{c.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {c.primary_category}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-3">
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Commission %
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={creator.commission_percentage}
                        onChange={(e) =>
                          handleCreatorChange(
                            index,
                            "commission_percentage",
                            e.target.value,
                          )
                        }
                        placeholder="10%"
                        disabled={loading}
                        className="bg-background border-border text-foreground focus:border-primary"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Amount (USD) *
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={creator.amount}
                        onChange={(e) =>
                          handleCreatorChange(index, "amount", e.target.value)
                        }
                        placeholder="0.00"
                        required
                        disabled={loading}
                        className="bg-background border-border text-foreground focus:border-primary"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-end justify-end">
                      {selectedCreators.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCreator(index)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <p className="text-xs text-muted-foreground mt-2">
                  * Add multiple creators and specify individual amounts. Total
                  amount will be calculated automatically.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="payment_description"
                  className="text-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id="payment_description"
                  name="payment_description"
                  value={formData.payment_description}
                  onChange={handleChange}
                  placeholder="Payment details, purpose, notes..."
                  rows={3}
                  disabled={loading}
                  className="bg-background border-border text-foreground focus:border-primary"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground">
                  Internal Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Internal notes, reminders, special instructions..."
                  rows={2}
                  disabled={loading}
                  className="bg-background border-border text-foreground focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/payments")}
                  disabled={loading}
                  className="border-border text-foreground hover:bg-accent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Payment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
