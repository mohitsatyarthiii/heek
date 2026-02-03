"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/theme-context";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  AlertCircle, 
  ArrowLeft, 
  Save, 
  Calendar, 
  User, 
  Users, 
  DollarSign, 
  Building,
  Upload,
  FileText,
  Plus,
  CheckCircle,
  Download,
  X,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Target,
  Globe,
  Layers
} from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]);
  const [uploadMode, setUploadMode] = useState("single"); // "single" or "bulk"
  const [csvData, setCsvData] = useState("");
  const [csvPreview, setCsvPreview] = useState([]);
  
  const [formData, setFormData] = useState({
    brand_name: "",
    description: "",
    budget_min: "",
    budget_max: "",
    status: "planning",
    start_date: "",
    end_date: "",
    assigned_creator: "none",
    assigned_team_member: "",
    target_niches: "",
    target_regions: "",
    required_platforms: "",
    status_notes: "",
    campaign_notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      await Promise.all([fetchUsers(), fetchCreators()]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setFetching(false);
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
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
        throw new Error("You don't have permission to create Execution");
      }

      // Prepare campaign data
      const campaignData = {
        brand_name: formData.brand_name,
        description: formData.description,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        assigned_creator: formData.assigned_creator === "none" ? null : formData.assigned_creator,
        assigned_team_member: formData.assigned_team_member || null,
        target_niches: formData.target_niches ? formData.target_niches.split(',').map(n => n.trim()).filter(n => n) : [],
        target_regions: formData.target_regions ? formData.target_regions.split(',').map(r => r.trim()).filter(r => r) : [],
        required_platforms: formData.required_platforms ? formData.required_platforms.split(',').map(p => p.trim()).filter(p => p) : [],
        status_notes: formData.status_notes,
        campaign_notes: formData.campaign_notes,
        created_by: user.id,
      };

      const { error: insertError } = await supabase
        .from('campaigns')
        .insert([campaignData]);

      if (insertError) {
        throw insertError;
      }

      setSuccess("Execution created successfully!");
      setTimeout(() => {
        router.push("/dashboard/campaigns");
        router.refresh();
      }, 1500);
      
    } catch (err) {
      setError(err.message || "Failed to create Execution");
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      setCsvData(csvText);
      parseCSV(csvText);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const preview = [];
    
    // Show first 5 rows as preview
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : '';
        });
        preview.push(row);
      }
    }
    
    setCsvPreview(preview);
  };

  const handleBulkSubmit = async () => {
    if (!csvData) {
      setError("Please upload a CSV file first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Please login first");
      }

      // Get user profile for permission check
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("User profile not found. Contact admin to setup your account.");
      }

      if (!['admin', 'manager'].includes(profile.role)) {
        throw new Error(`Only admin and manager can bulk create Execution. Your role: ${profile.role}`);
      }

      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const campaigns = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const campaign = {
          created_by: session.user.id,
          status: "planning",
        };

        headers.forEach((header, index) => {
          const value = values[index] ? values[index].trim() : '';
          
          // Map CSV headers to database fields
          switch(header) {
            case 'brand_name':
            case 'brand':
              campaign.brand_name = value;
              break;
            case 'description':
              campaign.description = value;
              break;
            case 'budget_min':
              campaign.budget_min = value ? parseInt(value) : null;
              break;
            case 'budget_max':
              campaign.budget_max = value ? parseInt(value) : null;
              break;
            case 'status':
              campaign.status = value;
              break;
            case 'start_date':
              campaign.start_date = value;
              break;
            case 'end_date':
              campaign.end_date = value;
              break;
            case 'assigned_team_member':
            case 'assigned_to':
              // Find user by email or name
              const user = users.find(u => 
                u.email === value || u.name === value
              );
              campaign.assigned_team_member = user?.id || null;
              break;
            case 'assigned_creator':
            case 'creator':
              // Find creator by name
              const creator = creators.find(c => c.name === value);
              campaign.assigned_creator = creator?.id || null;
              break;
            case 'target_niches':
            case 'niches':
              campaign.target_niches = value ? value.split(',').map(n => n.trim()).filter(n => n) : [];
              break;
            case 'target_regions':
            case 'regions':
              campaign.target_regions = value ? value.split(',').map(r => r.trim()).filter(r => r) : [];
              break;
            case 'required_platforms':
            case 'platforms':
              campaign.required_platforms = value ? value.split(',').map(p => p.trim()).filter(p => p) : [];
              break;
            case 'status_notes':
              campaign.status_notes = value;
              break;
            case 'campaign_notes':
              campaign.campaign_notes = value;
              break;
          }
        });

        campaigns.push(campaign);
      }

      // Insert all campaigns
      const { error: insertError } = await supabase
        .from('campaigns')
        .insert(campaigns);

      if (insertError) {
        throw new Error(`Bulk insert error: ${insertError.message}`);
      }

      setSuccess(`Successfully created ${campaigns.length} Execution!`);
      setTimeout(() => {
        router.push("/dashboard/campaigns");
        router.refresh();
      }, 2000);

    } catch (err) {
      setError(err.message);
      console.error("Bulk create error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Brand Name',
      'Description',
      'Budget Min',
      'Budget Max',
      'Status',
      'Start Date',
      'End Date',
      'Assigned Team Member',
      'Assigned Creator',
      'Target Niches',
      'Target Regions',
      'Required Platforms',
      'Status Notes',
      'Campaign Notes'
    ];
    
    const template = headers.join(',') + '\n' +
      'Nike,Campaign for new sneaker launch,50000,200000,planning,2024-02-01,2024-03-01,john@example.com,John Creator,Sports,Fitness,India,US,Instagram,YouTube,Initial planning phase,Focus on Gen Z audience\n' +
      'Apple,Product launch campaign,100000,500000,planning,2024-02-15,2024-04-15,jane@example.com,,Technology,Gaming,Global,YouTube,TikTok,Planning stage,High budget campaign';
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Execution form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="border-border text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create Execution</h1>
              <p className="text-sm text-muted-foreground">
                Create Execution individually or in bulk via CSV
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
          </div>
        </div>

        {/* Upload Mode Toggle */}
        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Creation Method</h3>
                <p className="text-sm text-muted-foreground">
                  Choose how you want to create Executions
                </p>
              </div>
              
              <div className="flex border border-border rounded-lg overflow-hidden bg-background">
                <button
                  onClick={() => setUploadMode("single")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${uploadMode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                >
                  <Plus className="h-4 w-4" />
                  Single Execution
                </button>
                <div className="w-px bg-border"></div>
                <button
                  onClick={() => setUploadMode("bulk")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${uploadMode === "bulk" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                >
                  <Upload className="h-4 w-4" />
                  Bulk CSV Upload
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {uploadMode === "single" ? (
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Create Single Execution</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Create and set up a single Execution manually
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSingleSubmit} className="space-y-6">
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
                      disabled={loading}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-foreground">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleSelectChange('status', value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="planning" className="text-foreground">Planning</SelectItem>
                        <SelectItem value="active" className="text-foreground">Active</SelectItem>
                        <SelectItem value="paused" className="text-foreground">Paused</SelectItem>
                        <SelectItem value="completed" className="text-foreground">Completed</SelectItem>
                        <SelectItem value="cancelled" className="text-foreground">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget_min" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Min Budget (₹)
                      </span>
                    </Label>
                    <Input
                      id="budget_min"
                      name="budget_min"
                      type="number"
                      value={formData.budget_min}
                      onChange={handleChange}
                      placeholder="e.g., 50000"
                      disabled={loading}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget_max" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Max Budget (₹)
                      </span>
                    </Label>
                    <Input
                      id="budget_max"
                      name="budget_max"
                      type="number"
                      value={formData.budget_max}
                      onChange={handleChange}
                      placeholder="e.g., 200000"
                      disabled={loading}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-foreground">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className="pl-10 bg-background border-border text-foreground focus:border-primary"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-foreground">End Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={handleChange}
                        className="pl-10 bg-background border-border text-foreground focus:border-primary"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_team_member" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Assign to Team Member
                      </span>
                    </Label>
                    <Select 
                      value={formData.assigned_team_member} 
                      onValueChange={(value) => handleSelectChange('assigned_team_member', value)}
                      disabled={loading || users.length === 0}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none" className="text-foreground">None</SelectItem>
                        {users.map((teamMember) => (
                          <SelectItem key={teamMember.id} value={teamMember.id} className="text-foreground">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <div>
                                <span>{teamMember.name || teamMember.email}</span>
                                <span className="text-xs text-muted-foreground ml-2">({teamMember.role})</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_creator" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Assign to Creator (Optional)
                      </span>
                    </Label>
                    <Select 
                      value={formData.assigned_creator} 
                      onValueChange={(value) => handleSelectChange('assigned_creator', value)}
                      disabled={loading || creators.length === 0}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select creator" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none" className="text-foreground">None</SelectItem>
                        {creators.map((creator) => (
                          <SelectItem key={creator.id} value={creator.id} className="text-foreground">
                            {creator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_niches" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Target Niches
                      </span>
                    </Label>
                    <Input
                      id="target_niches"
                      name="target_niches"
                      value={formData.target_niches}
                      onChange={handleChange}
                      placeholder="Fashion, Beauty, Lifestyle (comma separated)"
                      disabled={loading}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_regions" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Target Regions
                      </span>
                    </Label>
                    <Input
                      id="target_regions"
                      name="target_regions"
                      value={formData.target_regions}
                      onChange={handleChange}
                      placeholder="India, US, UK (comma separated)"
                      disabled={loading}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="required_platforms" className="text-foreground">Required Platforms</Label>
                    <Input
                      id="required_platforms"
                      name="required_platforms"
                      value={formData.required_platforms}
                      onChange={handleChange}
                      placeholder="Instagram, YouTube, TikTok (comma separated)"
                      disabled={loading}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the campaign goals, objectives, and requirements..."
                    rows={4}
                    disabled={loading}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status_notes" className="text-foreground">Status Notes</Label>
                  <Textarea
                    id="status_notes"
                    name="status_notes"
                    value={formData.status_notes}
                    onChange={handleChange}
                    placeholder="Current status, progress updates, blockers..."
                    rows={3}
                    disabled={loading}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_notes" className="text-foreground">Execution Notes</Label>
                  <Textarea
                    id="campaign_notes"
                    name="campaign_notes"
                    value={formData.campaign_notes}
                    onChange={handleChange}
                    placeholder="Additional notes, requirements, special instructions..."
                    rows={3}
                    disabled={loading}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/campaigns")}
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
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Execution
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Bulk CSV Upload</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload multiple Execution via CSV file
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center gap-2 text-sm border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-md flex items-center gap-2 text-sm border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              {/* CSV Upload Section */}
              <div className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-accent/30 transition-colors">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <input
                    type="file"
                    id="csv-upload"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      onClick={() => document.getElementById('csv-upload').click()}
                      variant="outline"
                      className="border-border text-foreground hover:bg-accent"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={downloadTemplate}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>

                {/* CSV Preview */}
                {csvPreview.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-foreground">CSV Preview</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCsvData("");
                          setCsvPreview([]);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                    <div className="bg-background border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead className="bg-accent">
                            <tr>
                              {Object.keys(csvPreview[0]).map((header, index) => (
                                <th key={index} className="text-left p-3 text-sm font-semibold text-foreground border-r border-border">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-t border-border hover:bg-accent/50">
                                {Object.values(row).map((value, cellIndex) => (
                                  <td key={cellIndex} className="p-3 text-sm text-foreground border-r border-border">
                                    {value || <span className="text-muted-foreground">—</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-3 bg-accent border-t border-border text-sm text-muted-foreground">
                        Showing {csvPreview.length} row{csvPreview.length > 1 ? 's' : ''} (first 5 rows)
                      </div>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <Card className="bg-accent border-border">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-foreground mb-2">CSV Format Instructions:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• First row should contain column headers</li>
                      <li>• Required columns: <strong>Brand Name</strong></li>
                      <li>• Optional columns: All other fields from single entry form</li>
                      <li>• Multiple values: Separate with commas (for niches, regions, platforms)</li>
                      <li>• Status values: planning, active, paused, completed, cancelled</li>
                      <li>• Date format: YYYY-MM-DD</li>
                      <li>• Budget values: Numbers only (no currency symbols)</li>
                      <li>• Save file as UTF-8 encoded CSV</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Data Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-foreground">Available Team</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {users.length} member{users.length !== 1 ? 's' : ''} available
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-foreground">Available Creators</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {creators.length} creator{creators.length !== 1 ? 's' : ''} available
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-foreground">Sample CSV Rows</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {csvPreview.length} row{csvPreview.length !== 1 ? 's' : ''} loaded
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCsvData("");
                      setCsvPreview([]);
                      setUploadMode("single");
                    }}
                    disabled={loading}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Switch to Single Entry
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={fetchData}
                      disabled={loading}
                      variant="outline"
                      className="border-border text-foreground hover:bg-accent"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBulkSubmit}
                      disabled={loading || !csvData}
                      className="bg-primary text-primary-foreground hover:opacity-90"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload & Create {csvPreview.length > 0 ? `${csvPreview.length}+ Campaigns` : 'Campaigns'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}