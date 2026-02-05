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
import { Checkbox } from "@/components/ui/checkbox";
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
  Layers,
  Video,
  Package,
  CreditCard,
  TrendingUp,
  Percent,
  FileBarChart,
  ClipboardCheck,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  Clock,
} from "lucide-react";

export default function NewExecutionPage() {
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
    required_platforms: [], // Changed to array for multi-select
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
    { value: "rejected", label: "Rejected", icon: <X className="h-4 w-4" /> },
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
    
    // Auto-calculate profit if not manually set
    if (formData.profit === "" || formData.profit === "0") {
      setFormData(prev => ({ ...prev, profit: profit.toString() }));
    }
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

      // Calculate profit if not set
      let profit = parseFloat(formData.profit) || 0;
      if (!formData.profit && formData.commercials_locked && formData.creators_price) {
        const commercials = parseFloat(formData.commercials_locked) || 0;
        const creatorPrice = parseFloat(formData.creators_price) || 0;
        profit = commercials - creatorPrice;
      }

      // Prepare execution data
      const executionData = {
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
        created_by: user.id,
      };

      const { error: insertError } = await supabase
        .from('campaigns')
        .insert([executionData]);

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
      const executions = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const execution = {
          created_by: session.user.id,
          status: "planning",
          video_status: "draft",
        };

        headers.forEach((header, index) => {
          const value = values[index] ? values[index].trim() : '';
          
          // Map CSV headers to database fields
          switch(header) {
            case 'creator_name':
              execution.creator_name = value;
              break;
            case 'brand_name':
            case 'brand':
              execution.brand_name = value;
              break;
            case 'deliverables':
              execution.deliverables = value;
              break;
            case 'commercials_locked':
              execution.commercials_locked = value ? parseFloat(value) : 0;
              break;
            case 'creators_price':
              execution.creators_price = value ? parseFloat(value) : 0;
              break;
            case 'profit':
              execution.profit = value ? parseFloat(value) : 0;
              break;
            case 'commission':
              execution.commission = value;
              break;
            case 'person':
              execution.person = value;
              break;
            case 'video_status':
              execution.video_status = value || "draft";
              break;
            case 'description':
              execution.description = value;
              break;
            case 'status':
              execution.status = value || "planning";
              break;
            case 'start_date':
              execution.start_date = value;
              break;
            case 'end_date':
              execution.end_date = value;
              break;
            case 'assigned_team_member':
            case 'assigned_to':
            case 'person':
              // Find user by email or name
              const user = users.find(u => 
                u.email === value || u.name === value
              );
              execution.assigned_team_member = user?.id || null;
              execution.person = execution.person || user?.name || value;
              break;
            case 'assigned_creator':
            case 'creator':
              // Find creator by name
              const creator = creators.find(c => c.name === value);
              execution.assigned_creator = creator?.id || null;
              execution.creator_name = execution.creator_name || value;
              break;
            case 'required_platforms':
            case 'platforms':
              execution.required_platforms = value ? value.split(',').map(p => p.trim()).filter(p => p) : [];
              break;
            case 'status_notes':
              execution.status_notes = value;
              break;
            case 'campaign_notes':
              execution.campaign_notes = value;
              break;
          }
        });

        // Auto-calculate profit if not provided
        if (!execution.profit && execution.commercials_locked && execution.creators_price) {
          execution.profit = execution.commercials_locked - execution.creators_price;
        }

        executions.push(execution);
      }

      // Insert all executions
      const { error: insertError } = await supabase
        .from('campaigns')
        .insert(executions);

      if (insertError) {
        throw new Error(`Bulk insert error: ${insertError.message}`);
      }

      setSuccess(`Successfully created ${executions.length} Execution(s)!`);
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
      'creator_name',
      'brand_name',
      'deliverables',
      'commercials_locked',
      'creators_price',
      'profit',
      'commission',
      'person',
      'video_status',
      'description',
      'status',
      'start_date',
      'end_date',
      'assigned_team_member',
      'assigned_creator',
      'required_platforms',
      'status_notes',
      'campaign_notes'
    ];
    
    const template = headers.join(',') + '\n' +
      'Brief Case,Outskill,Integration,2000,1500,500,$150 POC & 4500,Yugam,live,Integration campaign for Outskill,active,2024-01-01,2024-02-01,yugam@example.com,Brief Case,instagram,youtube,Initial planning phase,Focus on integration\n' +
      'Tech Guru,Nike,Video Production,5000,3500,1500,20%,John Doe,pending,Video campaign for Nike,planning,2024-02-01,2024-03-01,john@example.com,Tech Guru,instagram,tiktok,Planning stage,High budget campaign';
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'execution_template.csv';
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
              onClick={() => router.push("/dashboard/campaigns")}
              className="border-border text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Executions
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Execution</h1>
              <p className="text-sm text-muted-foreground">
                Add new execution individually or in bulk via CSV
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
                    Fill in all details for a single execution
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
                      onValueChange={(value) => {
                        handleSelectChange('creator_name', value);
                        // If creator is selected from dropdown, also assign to assigned_creator
                        if (creators.find(c => c.name === value)) {
                          const creator = creators.find(c => c.name === value);
                          if (creator) {
                            handleSelectChange('assigned_creator', creator.id);
                          }
                        }
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select or enter creator name" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-[300px]">
                        <SelectItem value="_custom_" className="text-muted-foreground">
  Or type new name...
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
                      placeholder="Enter creator name if not in list"
                      disabled={loading}
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
                      disabled={loading}
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
                      placeholder="Describe what needs to be delivered (e.g., Integration, Video Production, Content Creation)"
                      required
                      rows={2}
                      disabled={loading}
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
                      value={formData.commercials_locked}
                      onChange={(e) => {
                        handleChange(e);
                        // Auto-calculate profit when commercials change
                        setTimeout(calculateProfit, 100);
                      }}
                      placeholder="e.g., 2000"
                      required
                      disabled={loading}
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
                      value={formData.creators_price}
                      onChange={(e) => {
                        handleChange(e);
                        // Auto-calculate profit when price changes
                        setTimeout(calculateProfit, 100);
                      }}
                      placeholder="e.g., 1500"
                      required
                      disabled={loading}
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
                      value={formData.profit}
                      onChange={handleChange}
                      placeholder="Auto-calculated or enter manually"
                      disabled={loading}
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
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select commission type" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="no_commission" className="text-foreground">No commission</SelectItem>
                        {commissionOptions.map((option, index) => (
                          <SelectItem key={index} value={option} className="text-foreground">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="commission_custom"
                      name="commission"
                      value={!commissionOptions.includes(formData.commission) ? formData.commission : ""}
                      onChange={handleChange}
                      placeholder="Enter custom commission"
                      disabled={loading}
                      className="mt-2 bg-background border-border text-foreground focus:border-primary"
                    />
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
                      onValueChange={(value) => {
                        handleSelectChange('person', value);
                        // If person is selected from dropdown, also assign to assigned_team_member
                        if (users.find(u => u.name === value)) {
                          const user = users.find(u => u.name === value);
                          if (user) {
                            handleSelectChange('assigned_team_member', user.id);
                          }
                        }
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select or enter person name" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-[300px]">
                        <SelectItem value="_name" className="text-muted-foreground">Or type new name...</SelectItem>
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
                      placeholder="Enter person name if not in list"
                      required
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
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
                        value={formData.start_date}
                        onChange={handleChange}
                        className="pl-10 bg-background border-border text-foreground focus:border-primary"
                        disabled={loading}
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
                        value={formData.end_date}
                        onChange={handleChange}
                        className="pl-10 bg-background border-border text-foreground focus:border-primary"
                        disabled={loading}
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
                            disabled={loading}
                          />
                          <Label
                            htmlFor={`platform-${platform.id}`}
                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                          >
                            
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
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
                    Upload multiple executions via CSV file
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
                      <li>• First row should contain column headers (see template)</li>
                      <li>• Required columns: <strong>brand_name, creator_name, deliverables, commercials_locked, creators_price, person</strong></li>
                      <li>• Optional columns: All other fields from single entry form</li>
                      <li>• Multiple platforms: Separate with commas (instagram,youtube,tiktok)</li>
                      <li>• Status values: planning, active, completed, cancelled, on_hold</li>
                      <li>• Video status values: draft, pending, approved, live, rejected</li>
                      <li>• Date format: YYYY-MM-DD</li>
                      <li>• Currency values: Numbers only (no currency symbols)</li>
                      <li>• Profit: Will auto-calculate if not provided</li>
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
                          Upload & Create {csvPreview.length > 0 ? `${csvPreview.length}+ Executions` : 'Executions'}
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