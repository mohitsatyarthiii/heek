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
import { Checkbox } from "@/components/ui/checkbox";
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
  Users,
  DollarSign,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  Video,
  Package,
  CreditCard,
  TrendingUp,
  Percent,
  Target,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function EditExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [execution, setExecution] = useState(null);
  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]);
  
  const [formData, setFormData] = useState({
    creator_name: "",
    brand_name: "",
    deliverables: "",
    commercials_locked: "",
    creators_price: "",
    profit: "",
    commission: "",
    person: "",
    video_status: "draft",
    description: "",
    status: "planning",
    start_date: "",
    end_date: "",
    assigned_creator: "none",
    assigned_team_member: "",
    required_platforms: [],
    status_notes: "",
    campaign_notes: "",
  });

  // Social media platforms for multi-select
  const socialPlatforms = [
    { id: "instagram", name: "Instagram", icon: "📸" },
    { id: "youtube", name: "YouTube", icon: "🎬" },
    { id: "tiktok", name: "TikTok", icon: "🎵" },
    { id: "facebook", name: "Facebook", icon: "👥" },
    { id: "twitter", name: "Twitter/X", icon: "🐦" },
    { id: "linkedin", name: "LinkedIn", icon: "💼" },
    { id: "pinterest", name: "Pinterest", icon: "📌" },
    { id: "snapchat", name: "Snapchat", icon: "👻" },
    { id: "whatsapp", name: "WhatsApp", icon: "💬" },
    { id: "telegram", name: "Telegram", icon: "✈️" },
  ];

  // Video status options
  const videoStatusOptions = [
    { value: "draft", label: "Draft", icon: <FileText className="h-4 w-4" /> },
    { value: "pending", label: "Pending", icon: <Clock className="h-4 w-4" /> },
    { value: "approved", label: "Approved", icon: <CheckCircle className="h-4 w-4" /> },
    { value: "live", label: "Live", icon: <Video className="h-4 w-4" /> },
    { value: "rejected", label: "Rejected", icon: <XCircle className="h-4 w-4" /> },
  ];

  // Commission options
  const commissionOptions = [
    "10%",
    "15%",
    "20%",
    "25%",
    "30%",
    "Fixed Amount",
    "Performance Based",
    "$150 POC & 4500",
    "Custom"
  ];

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchExecution(),
        fetchUsers(),
        fetchCreators(),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load execution data");
    } finally {
      setLoading(false);
    }
  };

  const fetchExecution = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          assigned_creator:creators!assigned_creator (id, name),
          assigned_team_member:profiles!assigned_team_member (id, name, email)
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (data) {
        setExecution(data);
        // Format data for form
        setFormData({
          creator_name: data.creator_name || "",
          brand_name: data.brand_name || "",
          deliverables: data.deliverables || "",
          commercials_locked: data.commercials_locked || "",
          creators_price: data.creators_price || "",
          profit: data.profit || "",
          commission: data.commission || "",
          person: data.person || "",
          video_status: data.video_status || "draft",
          description: data.description || "",
          status: data.status || "planning",
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          assigned_creator: data.assigned_creator?.id || "none",
          assigned_team_member: data.assigned_team_member?.id || "",
          required_platforms: Array.isArray(data.required_platforms) ? data.required_platforms : [],
          status_notes: data.status_notes || "",
          campaign_notes: data.campaign_notes || "",
        });
      }
    } catch (error) {
      console.error("Error fetching execution:", error);
      setError("Failed to load execution");
    }
  };

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let query = supabase.from('profiles').select('id, email, name, role');

      if (['admin', 'manager'].includes(profile?.role)) {
        query = query.order('name');
      } else {
        query = query.eq('id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
  };

  const fetchCreators = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('creators')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error("Failed to fetch creators:", error);
      setCreators([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-calculate profit when commercials or creator price changes
    if (name === 'commercials_locked' || name === 'creators_price') {
      setTimeout(calculateProfit, 100);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Handle special cases
    if (name === 'creator_name') {
      // Find creator by name and set assigned_creator
      const creator = creators.find(c => c.name === value);
      if (creator) {
        setFormData(prev => ({ ...prev, assigned_creator: creator.id }));
      }
    }
    
    if (name === 'person') {
      // Find user by name and set assigned_team_member
      const user = users.find(u => u.name === value);
      if (user) {
        setFormData(prev => ({ ...prev, assigned_team_member: user.id }));
      }
    }
  };

  const handlePlatformChange = (platformId) => {
    setFormData(prev => {
      const platforms = [...prev.required_platforms];
      if (platforms.includes(platformId)) {
        return { ...prev, required_platforms: platforms.filter(p => p !== platformId) };
      } else {
        return { ...prev, required_platforms: [...platforms, platformId] };
      }
    });
  };

  const calculateProfit = () => {
    const commercials = parseFloat(formData.commercials_locked) || 0;
    const creatorPrice = parseFloat(formData.creators_price) || 0;
    const profit = commercials - creatorPrice;
    
    // Only auto-calculate if profit field is empty or matches the calculated value
    if (!formData.profit || Math.abs(parseFloat(formData.profit) - profit) < 0.01) {
      setFormData(prev => ({ ...prev, profit: profit.toString() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      
      // Check if user has permission
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!['admin', 'manager'].includes(profile?.role)) {
        throw new Error("You don't have permission to edit executions");
      }

      // Calculate profit if not set
      let profit = parseFloat(formData.profit) || 0;
      if (!formData.profit && formData.commercials_locked && formData.creators_price) {
        const commercials = parseFloat(formData.commercials_locked) || 0;
        const creatorPrice = parseFloat(formData.creators_price) || 0;
        profit = commercials - creatorPrice;
      }

      // Prepare update data
      const updateData = {
        creator_name: formData.creator_name,
        brand_name: formData.brand_name,
        deliverables: formData.deliverables,
        commercials_locked: formData.commercials_locked ? parseFloat(formData.commercials_locked) : 0,
        creators_price: formData.creators_price ? parseFloat(formData.creators_price) : 0,
        profit: profit,
        commission: formData.commission,
        person: formData.person,
        video_status: formData.video_status,
        description: formData.description,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        assigned_creator: formData.assigned_creator === "none" ? null : formData.assigned_creator,
        assigned_team_member: formData.assigned_team_member || null,
        required_platforms: formData.required_platforms,
        status_notes: formData.status_notes,
        campaign_notes: formData.campaign_notes,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', params.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess("Execution updated successfully!");
      setTimeout(() => {
        router.push(`/dashboard/campaigns/${params.id}`);
        router.refresh();
      }, 1500);
      
    } catch (err) {
      setError(err.message || "Failed to update execution");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this execution? This action cannot be undone.")) {
      return;
    }

    setSaving(true);
    setError("");
    
    try {
      const supabase = createClient();
      
      // Check if user has permission
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!['admin', 'manager'].includes(profile?.role)) {
        throw new Error("You don't have permission to delete executions");
      }

      const { error: deleteError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', params.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess("Execution deleted successfully!");
      setTimeout(() => {
        router.push("/dashboard/campaigns");
        router.refresh();
      }, 1500);
      
    } catch (err) {
      setError(err.message || "Failed to delete execution");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading execution data...</p>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Execution not found</h3>
          <p className="text-muted-foreground mt-2">The execution you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/campaigns")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Executions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push(`/dashboard/campaigns/${params.id}`)}
              className="border-border text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Execution</h1>
              <p className="text-sm text-muted-foreground">
                Update execution details
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-foreground">Edit Execution Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update the execution information below
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
                {/* Creator Name */}
                <div className="space-y-2">
                  <Label htmlFor="creator_name" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Creator Name *
                    </span>
                  </Label>
                  <Select 
                    value={formData.creator_name} 
                    onValueChange={(value) => handleSelectChange('creator_name', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select or enter creator name" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-[300px]">
                      <SelectItem value="custom" className="text-muted-foreground">
                        Type new name...
                      </SelectItem>
                      {creators.map((creator) => (
                        <SelectItem key={creator.id} value={creator.name} className="text-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {creator.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="creator_name_input"
                    name="creator_name"
                    value={formData.creator_name}
                    onChange={handleChange}
                    placeholder="Enter creator name"
                    required
                    disabled={saving}
                    className="mt-2 bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Brand Name */}
                <div className="space-y-2">
                  <Label htmlFor="brand_name" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Brand Name *
                    </span>
                  </Label>
                  <Input
                    id="brand_name"
                    name="brand_name"
                    value={formData.brand_name}
                    onChange={handleChange}
                    placeholder="Enter brand name"
                    required
                    disabled={saving}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Deliverables */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="deliverables" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Deliverables *
                    </span>
                  </Label>
                  <Textarea
                    id="deliverables"
                    name="deliverables"
                    value={formData.deliverables}
                    onChange={handleChange}
                    placeholder="Describe what needs to be delivered"
                    required
                    rows={2}
                    disabled={saving}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Commercials Locked */}
                <div className="space-y-2">
                  <Label htmlFor="commercials_locked" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Commercials Locked ($) *
                    </span>
                  </Label>
                  <Input
                    id="commercials_locked"
                    name="commercials_locked"
                    type="number"
                    step="0.01"
                    value={formData.commercials_locked}
                    onChange={(e) => {
                      handleChange(e);
                      setTimeout(calculateProfit, 100);
                    }}
                    placeholder="e.g., 2000"
                    required
                    disabled={saving}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Creator's Price */}
                <div className="space-y-2">
                  <Label htmlFor="creators_price" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Creator's Price ($) *
                    </span>
                  </Label>
                  <Input
                    id="creators_price"
                    name="creators_price"
                    type="number"
                    step="0.01"
                    value={formData.creators_price}
                    onChange={(e) => {
                      handleChange(e);
                      setTimeout(calculateProfit, 100);
                    }}
                    placeholder="e.g., 1500"
                    required
                    disabled={saving}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Profit */}
                <div className="space-y-2">
                  <Label htmlFor="profit" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Profit ($)
                    </span>
                  </Label>
                  <Input
                    id="profit"
                    name="profit"
                    type="number"
                    step="0.01"
                    value={formData.profit}
                    onChange={handleChange}
                    placeholder="Auto-calculated or enter manually"
                    disabled={saving}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated: ${(parseFloat(formData.commercials_locked || 0) - parseFloat(formData.creators_price || 0)).toFixed(2)}
                  </p>
                </div>

                {/* Commission */}
                <div className="space-y-2">
                  <Label htmlFor="commission" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Commission
                    </span>
                  </Label>
                  <Select 
                    value={formData.commission} 
                    onValueChange={(value) => handleSelectChange('commission', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select commission type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="no_commission" className="text-foreground">
                        No commission
                      </SelectItem>
                      {commissionOptions.map((option, index) => (
                        <SelectItem key={index} value={option} className="text-foreground">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.commission === 'no_commission' ? null : (
                    <Input
                      id="commission_custom"
                      name="commission"
                      value={!commissionOptions.includes(formData.commission) && formData.commission !== 'no_commission' ? formData.commission : ""}
                      onChange={handleChange}
                      placeholder="Enter custom commission"
                      disabled={saving}
                      className="mt-2 bg-background border-border text-foreground focus:border-primary"
                    />
                  )}
                </div>

                {/* Person */}
                <div className="space-y-2">
                  <Label htmlFor="person" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Person *
                    </span>
                  </Label>
                  <Select 
                    value={formData.person} 
                    onValueChange={(value) => handleSelectChange('person', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select or enter person name" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-[300px]">
                      <SelectItem value="custom" className="text-muted-foreground">
                        Type new name...
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.name || user.email} className="text-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {user.name || user.email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="person_input"
                    name="person"
                    value={formData.person}
                    onChange={handleChange}
                    placeholder="Enter person name"
                    required
                    disabled={saving}
                    className="mt-2 bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Video Status */}
                <div className="space-y-2">
                  <Label htmlFor="video_status" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video Status *
                    </span>
                  </Label>
                  <Select 
                    value={formData.video_status} 
                    onValueChange={(value) => handleSelectChange('video_status', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select video status" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {videoStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-foreground">
                          <div className="flex items-center gap-2">
                            {option.icon}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="planning" className="text-foreground">Planning</SelectItem>
                      <SelectItem value="active" className="text-foreground">Active</SelectItem>
                      <SelectItem value="completed" className="text-foreground">Completed</SelectItem>
                      <SelectItem value="cancelled" className="text-foreground">Cancelled</SelectItem>
                      <SelectItem value="on_hold" className="text-foreground">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-foreground">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date ? formData.start_date.split('T')[0] : ''}
                      onChange={handleChange}
                      className="pl-10 bg-background border-border text-foreground focus:border-primary"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-foreground">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date ? formData.end_date.split('T')[0] : ''}
                      onChange={handleChange}
                      className="pl-10 bg-background border-border text-foreground focus:border-primary"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Social Media Platforms - Multi-select */}
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-foreground">Required Platforms (Select multiple)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {socialPlatforms.map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`platform-${platform.id}`}
                          checked={formData.required_platforms.includes(platform.id)}
                          onCheckedChange={() => handlePlatformChange(platform.id)}
                          disabled={saving}
                        />
                        <Label
                          htmlFor={`platform-${platform.id}`}
                          className="text-sm font-normal cursor-pointer flex items-center gap-2"
                        >
                          <span>{platform.icon}</span>
                          {platform.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the execution details, goals, and requirements..."
                    rows={3}
                    disabled={saving}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Status Notes */}
                <div className="space-y-2">
                  <Label htmlFor="status_notes" className="text-foreground">Status Notes</Label>
                  <Textarea
                    id="status_notes"
                    name="status_notes"
                    value={formData.status_notes}
                    onChange={handleChange}
                    placeholder="Current status updates, progress..."
                    rows={3}
                    disabled={saving}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                {/* Execution Notes */}
                <div className="space-y-2">
                  <Label htmlFor="campaign_notes" className="text-foreground">Execution Notes</Label>
                  <Textarea
                    id="campaign_notes"
                    name="campaign_notes"
                    value={formData.campaign_notes}
                    onChange={handleChange}
                    placeholder="Additional notes, special instructions..."
                    rows={3}
                    disabled={saving}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/campaigns/${params.id}`)}
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
                      Update Execution
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