"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/theme-context";
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
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Tag,
  Layers,
  Hash,
  DollarSign,
  Star,
  Briefcase,
  Languages,
  Users,
  CheckCircle,
  Loader2,
  Trash2,
  History,
  Edit,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  XCircle,
  CheckCheck,
  AlertTriangle,
  Verified,
  BadgeCheck,
  Ban,
  RefreshCw,
} from "lucide-react";

/* =========================
   STATUS BADGE COMPONENT
========================= */
const CreatorStatusBadge = ({ status, isVerified }) => {
  const statusConfig = {
    pending: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-300",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: <Clock className="h-3 w-3" />,
      label: "Pending"
    },
    active: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-300",
      border: "border-green-200 dark:border-green-800",
      icon: <CheckCircle className="h-3 w-3" />,
      label: "Active"
    },
    inactive: {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-700 dark:text-gray-300",
      border: "border-gray-200 dark:border-gray-700",
      icon: <XCircle className="h-3 w-3" />,
      label: "Inactive"
    },
    blocked: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-200 dark:border-red-800",
      icon: <Ban className="h-3 w-3" />,
      label: "Blocked"
    },
  };

  const { bg, text, border, icon, label } = statusConfig[status] || statusConfig.pending;

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${bg} ${text} ${border} flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium`}>
        {icon}
        {label}
      </Badge>
      
      {isVerified ? (
        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium">
          <BadgeCheck className="h-3 w-3" />
          Verified
        </Badge>
      ) : (
        <Badge variant="outline" className="border-border text-muted-foreground flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium">
          <ShieldAlert className="h-3 w-3" />
          Unverified
        </Badge>
      )}
    </div>
  );
};

/* =========================
   EDIT CREATOR PAGE - FIXED VERSION
========================= */
export default function EditCreatorPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creator, setCreator] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    primary_market: "",
    primary_category: "",
    secondary_categories: [],
    sub_niches: [],
    typical_deliverables: [],
    past_rate_notes: "",
    brand_friendly_score: "",
    management_type: "",
    content_language: "",
    audience_geo_split: "",
    status: "pending",
    is_verified: false,
    verified_at: null,
    verified_by: null,
  });

  // Options for dropdowns
  const categories = [
    "Fashion", "Beauty", "Lifestyle", "Travel", "Food",
    "Fitness", "Technology", "Gaming", "Entertainment", "Education",
    "Business", "Finance", "Parenting", "Health", "Sports",
    "Music", "Art", "Photography", "Comedy", "News", "DIY", "Cars"
  ];

  const countries = [
    "India", "USA", "UK", "Canada", "Australia",
    "Germany", "France", "Japan", "South Korea", "Singapore",
    "UAE", "Brazil", "Mexico", "Spain", "Italy",
    "Netherlands", "Sweden", "Norway", "Denmark", "Switzerland",
    "Indonesia", "Thailand", "Vietnam", "Malaysia", "Philippines"
  ];

  const managementTypes = [
    "Self-Managed", "Agency", "Management Company", "Hybrid", "Exclusive", "Talent Agency"
  ];

  const brandFriendlyScores = [
    { value: "1", label: "1 - Not brand friendly" },
    { value: "2", label: "2 - Somewhat brand friendly" },
    { value: "3", label: "3 - Neutral" },
    { value: "4", label: "4 - Brand friendly" },
    { value: "5", label: "5 - Very brand friendly" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending", icon: <Clock className="h-3 w-3" />, color: "yellow" },
    { value: "active", label: "Active", icon: <CheckCircle className="h-3 w-3" />, color: "green" },
    { value: "inactive", label: "Inactive", icon: <XCircle className="h-3 w-3" />, color: "gray" },
    { value: "blocked", label: "Blocked", icon: <Ban className="h-3 w-3" />, color: "red" },
  ];

  useEffect(() => {
    if (user) {
      fetchCreator();
      checkPermissions();
    }
  }, [user, params.id]);

  const checkPermissions = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const admin = profile?.role === 'admin';
      const manager = profile?.role === 'manager';
      
      setIsAdmin(admin);
      setIsManager(manager);
      setCanEdit(admin || manager);
      
    } catch (err) {
      console.error("Error checking permissions:", err);
    }
  };

  // 🔥 FIXED: Alag se profiles fetch karo, relationship ke bina
  const fetchCreator = async () => {
    setLoading(true);
    setError("");
    
    try {
      const supabase = createClient();
      
      // 1. Pehle creator fetch karo
      const { data: creatorData, error: fetchError } = await supabase
        .from("creators")
        .select("*")
        .eq("id", params.id)
        .single();

      if (fetchError) throw fetchError;
      
      if (!creatorData) {
        throw new Error("Creator not found");
      }

      // 2. Created by user details fetch karo alag se
      let createdByUser = null;
      if (creatorData.created_by) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", creatorData.created_by)
          .single();
        createdByUser = userData;
      }

      // 3. Verified by user details fetch karo alag se
      let verifiedByUser = null;
      if (creatorData.verified_by) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", creatorData.verified_by)
          .single();
        verifiedByUser = userData;
      }

      // 4. Updated by user details fetch karo alag se
      let updatedByUser = null;
      if (creatorData.updated_by) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", creatorData.updated_by)
          .single();
        updatedByUser = userData;
      }

      // 5. Combine all data
      const completeCreatorData = {
        ...creatorData,
        created_by_user: createdByUser,
        verified_by_user: verifiedByUser,
        updated_by_user: updatedByUser,
      };

      setCreator(completeCreatorData);
      
      // Set form data
      setFormData({
        name: creatorData.name || "",
        email: creatorData.email || "",
        phone: creatorData.phone || "",
        country: creatorData.country || "",
        primary_market: creatorData.primary_market || "",
        primary_category: creatorData.primary_category || "",
        secondary_categories: creatorData.secondary_categories || [],
        sub_niches: creatorData.sub_niches || [],
        typical_deliverables: creatorData.typical_deliverables || [],
        past_rate_notes: creatorData.past_rate_notes || "",
        brand_friendly_score: creatorData.brand_friendly_score?.toString() || "",
        management_type: creatorData.management_type || "",
        content_language: creatorData.content_language || "",
        audience_geo_split: creatorData.audience_geo_split || "",
        status: creatorData.status || "pending",
        is_verified: creatorData.is_verified || false,
        verified_at: creatorData.verified_at || null,
        verified_by: creatorData.verified_by || null,
      });

    } catch (err) {
      console.error("Error fetching creator:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value === "none" ? null : value }));
  };

  const handleArrayChange = (name, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [name]: array }));
  };

  const handleStatusChange = async (newStatus) => {
    if (!canEdit) {
      setError("You don't have permission to change status");
      return;
    }
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleVerification = async (verify) => {
    if (!isAdmin && !isManager) {
      setError("Only Admin and Manager can verify creators");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      
      const updates = {
        is_verified: verify,
        verified_at: verify ? new Date().toISOString() : null,
        verified_by: verify ? user.id : null,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      const { error: updateError } = await supabase
        .from("creators")
        .update(updates)
        .eq("id", params.id);

      if (updateError) throw updateError;

      setFormData(prev => ({
        ...prev,
        ...updates
      }));

      setSuccess(verify ? "Creator verified successfully!" : "Verification removed");
      fetchCreator();
      
    } catch (err) {
      console.error("Error updating verification:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEdit) {
      setError("You don't have permission to edit creators");
      return;
    }
    
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      const updateData = {
        name: formData.name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        country: formData.country || null,
        primary_market: formData.primary_market || null,
        primary_category: formData.primary_category || null,
        secondary_categories: formData.secondary_categories,
        sub_niches: formData.sub_niches,
        typical_deliverables: formData.typical_deliverables,
        past_rate_notes: formData.past_rate_notes || null,
        brand_friendly_score: formData.brand_friendly_score ? parseInt(formData.brand_friendly_score) : null,
        management_type: formData.management_type || null,
        content_language: formData.content_language || null,
        audience_geo_split: formData.audience_geo_split || null,
        status: formData.status,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      if (isAdmin || isManager) {
        updateData.is_verified = formData.is_verified;
        if (formData.is_verified && !formData.verified_by) {
          updateData.verified_at = new Date().toISOString();
          updateData.verified_by = user.id;
        }
      }

      const { error: updateError } = await supabase
        .from("creators")
        .update(updateData)
        .eq("id", params.id);

      if (updateError) throw updateError;

      setSuccess("Creator updated successfully!");
      fetchCreator();
      
    } catch (err) {
      console.error("Error updating creator:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setError("Only Admin can delete creators");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      
      const { error: deleteError } = await supabase
        .from("creators")
        .delete()
        .eq("id", params.id);

      if (deleteError) throw deleteError;

      router.push("/dashboard/creators");
      router.refresh();
      
    } catch (err) {
      console.error("Error deleting creator:", err);
      setError(err.message);
      setShowDeleteDialog(false);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading creator details...</p>
      </div>
    );
  }

  if (error && !creator) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-background">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard/creators")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Creators
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Edit Creator</h1>
                {creator && (
                  <CreatorStatusBadge 
                    status={creator.status} 
                    isVerified={creator.is_verified} 
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                ID: {params.id.slice(0, 8)}... • Last updated: {formatDate(creator?.updated_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isAdmin || isManager) && (
              <>
                {!formData.is_verified ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerification(true)}
                    disabled={saving}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <BadgeCheck className="h-4 w-4 mr-2" />
                    Verify Creator
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerification(false)}
                    disabled={saving}
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Remove Verification
                  </Button>
                )}
              </>
            )}

            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
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

        {(isAdmin || isManager) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Status Management Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Status Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={formData.status === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusChange(option.value)}
                      disabled={saving || !canEdit}
                      className={
                        formData.status === option.value
                          ? `bg-${option.color}-600 hover:bg-${option.color}-700 text-white`
                          : 'border-border text-foreground hover:bg-accent'
                      }
                    >
                      {option.icon}
                      <span className="ml-2">{option.label}</span>
                    </Button>
                  ))}
                </div>
                {creator?.status !== formData.status && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Status will be updated from {creator?.status} to {formData.status}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Verification Info Card - FIXED: Alag se fetch kiya hua data */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  Verification Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      {formData.is_verified ? (
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          <BadgeCheck className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {creator?.verified_by_user && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Verified By</span>
                        <span className="text-sm font-medium text-foreground">
                          {creator.verified_by_user.name || creator.verified_by_user.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Verified At</span>
                        <span className="text-sm text-foreground">
                          {formatDate(creator.verified_at)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Form */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-foreground">Creator Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Edit creator details and preferences
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Creator name"
                      required
                      disabled={saving || !canEdit}
                      className="pl-9 bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="creator@example.com"
                      disabled={saving || !canEdit}
                      className="pl-9 bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      disabled={saving || !canEdit}
                      className="pl-9 bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-foreground">Country</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Select 
                      value={formData.country || "none"} 
                      onValueChange={(value) => handleSelectChange('country', value)}
                      disabled={saving || !canEdit}
                    >
                      <SelectTrigger className="pl-9 bg-background border-border text-foreground">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Select country</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_market" className="text-foreground">Primary Market</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="primary_market"
                      name="primary_market"
                      value={formData.primary_market}
                      onChange={handleChange}
                      placeholder="e.g., India, US, Global"
                      disabled={saving || !canEdit}
                      className="pl-9 bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_category" className="text-foreground">
                    Primary Category <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Select 
                      value={formData.primary_category || "none"} 
                      onValueChange={(value) => handleSelectChange('primary_category', value)}
                      disabled={saving || !canEdit}
                      required
                    >
                      <SelectTrigger className="pl-9 bg-background border-border text-foreground">
                        <SelectValue placeholder="Select primary category" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Select category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_categories" className="text-foreground">Secondary Categories</Label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="secondary_categories"
                      name="secondary_categories"
                      value={formData.secondary_categories?.join(', ')}
                      onChange={(e) => handleArrayChange('secondary_categories', e.target.value)}
                      placeholder="Fashion, Beauty, Lifestyle"
                      disabled={saving || !canEdit}
                      className="pl-9 bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Separate with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub_niches" className="text-foreground">Sub Niches</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sub_niches"
                      name="sub_niches"
                      value={formData.sub_niches?.join(', ')}
                      onChange={(e) => handleArrayChange('sub_niches', e.target.value)}
                      placeholder="Sustainable Fashion, Skincare, Travel"
                      disabled={saving || !canEdit}
                      className="pl-9 bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Separate with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typical_deliverables" className="text-foreground">Typical Deliverables</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="typical_deliverables"
                      name="typical_deliverables"
                      value={formData.typical_deliverables?.join(', ')}
                      onChange={(e) => handleArrayChange('typical_deliverables', e.target.value)}
                      placeholder="Instagram Posts, YouTube Videos"
                      disabled={saving || !canEdit}
                      className="pl-9 bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Separate with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand_friendly_score" className="text-foreground">Brand Friendly Score (1-5)</Label>
                  <div className="relative">
                    <Star className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Select 
                      value={formData.brand_friendly_score || "none"} 
                      onValueChange={(value) => handleSelectChange('brand_friendly_score', value)}
                      disabled={saving || !canEdit}
                    >
                      <SelectTrigger className="pl-9 bg-background border-border text-foreground">
                        <SelectValue placeholder="Select score" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Select score</SelectItem>
                        {brandFriendlyScores.map((score) => (
                          <SelectItem key={score.value} value={score.value}>
                            {score.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="management_type" className="text-foreground">Management Type</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Select 
                      value={formData.management_type || "none"} 
                      onValueChange={(value) => handleSelectChange('management_type', value)}
                      disabled={saving || !canEdit}
                    >
                      <SelectTrigger className="pl-9 bg-background border-border text-foreground">
                        <SelectValue placeholder="Select management type" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Select type</SelectItem>
                        {managementTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content_language" className="text-foreground">Content Language</Label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="content_language"
                      name="content_language"
                      value={formData.content_language}
                      onChange={handleChange}
                      placeholder="Hindi, English, Tamil"
                      disabled={saving || !canEdit}
                      className="pl-9 bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience_geo_split" className="text-foreground">Audience Geo Split</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="audience_geo_split"
                      name="audience_geo_split"
                      value={formData.audience_geo_split}
                      onChange={handleChange}
                      placeholder="India 70%, US 20%, Others 10%"
                      disabled={saving || !canEdit}
                      className="pl-9 bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="past_rate_notes" className="text-foreground">Past Rate Notes</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="past_rate_notes"
                    name="past_rate_notes"
                    value={formData.past_rate_notes}
                    onChange={handleChange}
                    placeholder="Notes about past rates, collaborations, pricing..."
                    rows={4}
                    disabled={saving || !canEdit}
                    className="pl-9 bg-background border-border text-foreground focus:border-primary"
                  />
                </div>
              </div>

              {/* Metadata Section - FIXED: Alag se fetch kiya hua data */}
              <Card className="bg-accent/30 border-border">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Created By</p>
                      <p className="text-sm font-medium text-foreground">
                        {creator?.created_by_user?.name || creator?.created_by_user?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(creator?.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium text-foreground">
                        {creator?.updated_by_user?.name || creator?.updated_by_user?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(creator?.updated_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Creator ID</p>
                      <p className="text-sm font-mono text-foreground break-all">
                        {creator?.id}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              {canEdit && (
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
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
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-border max-w-md w-full">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Delete Creator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-foreground mb-2">
                Are you sure you want to delete <strong>{creator?.name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={saving}
                  className="border-border text-foreground hover:bg-accent"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Forever
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}