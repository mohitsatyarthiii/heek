"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/theme-context";
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
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertCircle,
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Users,
  X,
  CheckCircle,
  Download,
  Grid,
  List,
  Plus,
} from "lucide-react";

export default function NewCreatorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadMode, setUploadMode] = useState("single"); // "single" or "bulk"
  const [csvData, setCsvData] = useState("");
  const [csvPreview, setCsvPreview] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    primary_market: "",
    primary_category: "",
    secondary_categories: "",
    sub_niches: "",
    typical_deliverables: "",
    past_rate_notes: "",
    brand_friendly_score: "",
    management_type: "",
    content_language: "",
    audience_geo_split: "",
  });

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
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Please login first");
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("User profile not found. Contact admin to setup your account.");
      }

      // Check permission
      const userRole = profile.role;
      if (!['admin', 'manager'].includes(userRole)) {
        throw new Error(`Only admin and manager can create creators. Your role: ${userRole}`);
      }

      // Prepare data
      const creatorData = {
        name: formData.name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        country: formData.country || null,
        primary_market: formData.primary_market || null,
        primary_category: formData.primary_category || null,
        secondary_categories: formData.secondary_categories
          ? formData.secondary_categories.split(',').map(c => c.trim()).filter(c => c)
          : [],
        sub_niches: formData.sub_niches
          ? formData.sub_niches.split(',').map(n => n.trim()).filter(n => n)
          : [],
        typical_deliverables: formData.typical_deliverables
          ? formData.typical_deliverables.split(',').map(d => d.trim()).filter(d => d)
          : [],
        past_rate_notes: formData.past_rate_notes || null,
        brand_friendly_score: formData.brand_friendly_score 
          ? parseInt(formData.brand_friendly_score) 
          : null,
        management_type: formData.management_type || null,
        content_language: formData.content_language || null,
        audience_geo_split: formData.audience_geo_split || null,
        created_by: session.user.id,
        status: "pending",
        is_verified: false,
      };

      // Insert creator
      const { error: insertError } = await supabase
        .from('creators')
        .insert([creatorData]);

      if (insertError) {
        if (insertError.code === '42501') {
          throw new Error("Permission denied. Check your RLS policies in Supabase.");
        } else if (insertError.code === '23505') {
          throw new Error("Creator with this email already exists.");
        } else {
          throw new Error(`Database error: ${insertError.message}`);
        }
      }

      // Success
      setSuccess("Creator created successfully!");
      setTimeout(() => {
        router.push("/dashboard/creators");
        router.refresh();
      }, 1500);
      
    } catch (err) {
      setError(err.message);
      console.error("Create creator error:", err);
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
    const headers = lines[0].split(',').map(h => h.trim());
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
        throw new Error(`Only admin and manager can bulk create creators. Your role: ${profile.role}`);
      }

      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const creators = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const creator = {
          created_by: session.user.id,
          status: "pending",
          is_verified: false,
        };

        headers.forEach((header, index) => {
          const value = values[index] ? values[index].trim() : '';
          
          // Map CSV headers to database fields
          switch(header.toLowerCase()) {
            case 'name':
              creator.name = value;
              break;
            case 'email':
              creator.email = value;
              break;
            case 'phone':
              creator.phone = value;
              break;
            case 'country':
              creator.country = value;
              break;
            case 'primary_market':
              creator.primary_market = value;
              break;
            case 'primary_category':
              creator.primary_category = value;
              break;
            case 'secondary_categories':
              creator.secondary_categories = value ? value.split(',').map(c => c.trim()).filter(c => c) : [];
              break;
            case 'sub_niches':
              creator.sub_niches = value ? value.split(',').map(n => n.trim()).filter(n => n) : [];
              break;
            case 'typical_deliverables':
              creator.typical_deliverables = value ? value.split(',').map(d => d.trim()).filter(d => d) : [];
              break;
            case 'past_rate_notes':
              creator.past_rate_notes = value;
              break;
            case 'brand_friendly_score':
              creator.brand_friendly_score = value ? parseInt(value) : null;
              break;
            case 'management_type':
              creator.management_type = value;
              break;
            case 'content_language':
              creator.content_language = value;
              break;
            case 'audience_geo_split':
              creator.audience_geo_split = value;
              break;
          }
        });

        creators.push(creator);
      }

      // Insert all creators
      const { error: insertError } = await supabase
        .from('creators')
        .insert(creators);

      if (insertError) {
        throw new Error(`Bulk insert error: ${insertError.message}`);
      }

      setSuccess(`Successfully created ${creators.length} creators!`);
      setTimeout(() => {
        router.push("/dashboard/creators");
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
      'Name',
      'Email',
      'Phone',
      'Country',
      'Primary Market',
      'Primary Category',
      'Secondary Categories',
      'Sub Niches',
      'Typical Deliverables',
      'Past Rate Notes',
      'Brand Friendly Score (1-5)',
      'Management Type',
      'Content Language',
      'Audience Geo Split'
    ];
    
    const template = headers.join(',') + '\n' +
      'John Doe,john@example.com,+91 9876543210,India,India,Fashion,Fashion,Beauty,Sustainable Fashion,Instagram Posts,YouTube Videos,Paid ₹50k for IG post,4,Self-Managed,English,Hindi,India 70%,US 20%,Others 10%';
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creator_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Options for dropdowns
  const categories = [
    "Fashion", "Beauty", "Lifestyle", "Travel", "Food",
    "Fitness", "Technology", "Gaming", "Entertainment", "Education",
    "Business", "Finance", "Parenting", "Health", "Sports"
  ];

  const countries = [
    "India", "USA", "UK", "Canada", "Australia",
    "Germany", "France", "Japan", "South Korea", "Singapore",
    "UAE", "Brazil", "Mexico", "Spain", "Italy"
  ];

  const managementTypes = [
    "Self-Managed", "Agency", "Management Company", "Hybrid"
  ];

  const brandFriendlyScores = [
    { value: "1", label: "1 - Not brand friendly" },
    { value: "2", label: "2" },
    { value: "3", label: "3 - Neutral" },
    { value: "4", label: "4" },
    { value: "5", label: "5 - Very brand friendly" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add Creators</h1>
              <p className="text-sm text-muted-foreground">
                Add creators individually or in bulk via CSV
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
                <h3 className="text-lg font-bold text-foreground">Upload Method</h3>
                <p className="text-sm text-muted-foreground">
                  Choose how you want to add creators
                </p>
              </div>
              
              <div className="flex border border-border rounded-lg overflow-hidden bg-background">
                <button
                  onClick={() => setUploadMode("single")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${uploadMode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                >
                  <Plus className="h-4 w-4" />
                  Single Entry
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
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Create Single Creator</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add a single creator manually
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
                  {/* Basic Information */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Creator name"
                      required
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="creator@example.com"
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-foreground">Country</Label>
                    <Select 
                      value={formData.country} 
                      onValueChange={(value) => handleSelectChange('country', value)}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Select country</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country} className="text-foreground">
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primary_market" className="text-foreground">Primary Market</Label>
                    <Input
                      id="primary_market"
                      name="primary_market"
                      value={formData.primary_market}
                      onChange={handleChange}
                      placeholder="e.g., India, US, Global"
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primary_category" className="text-foreground">Primary Category *</Label>
                    <Select 
                      value={formData.primary_category} 
                      onValueChange={(value) => handleSelectChange('primary_category', value)}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select primary category" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Select category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="text-foreground">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_categories" className="text-foreground">Secondary Categories</Label>
                    <Input
                      id="secondary_categories"
                      name="secondary_categories"
                      value={formData.secondary_categories}
                      onChange={handleChange}
                      placeholder="Fashion, Beauty, Lifestyle (comma separated)"
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sub_niches" className="text-foreground">Sub Niches</Label>
                    <Input
                      id="sub_niches"
                      name="sub_niches"
                      value={formData.sub_niches}
                      onChange={handleChange}
                      placeholder="Sustainable Fashion, Skincare, Travel Vlogging"
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="typical_deliverables" className="text-foreground">Typical Deliverables</Label>
                    <Input
                      id="typical_deliverables"
                      name="typical_deliverables"
                      value={formData.typical_deliverables}
                      onChange={handleChange}
                      placeholder="Instagram Posts, YouTube Videos, Stories"
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand_friendly_score" className="text-foreground">Brand Friendly Score (1-5)</Label>
                    <Select 
                      value={formData.brand_friendly_score} 
                      onValueChange={(value) => handleSelectChange('brand_friendly_score', value)}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select score" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Select score</SelectItem>
                        {brandFriendlyScores.map((score) => (
                          <SelectItem key={score.value} value={score.value} className="text-foreground">
                            {score.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="management_type" className="text-foreground">Management Type</Label>
                    <Select 
                      value={formData.management_type} 
                      onValueChange={(value) => handleSelectChange('management_type', value)}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select management type" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Select type</SelectItem>
                        {managementTypes.map((type) => (
                          <SelectItem key={type} value={type} className="text-foreground">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content_language" className="text-foreground">Content Language</Label>
                    <Input
                      id="content_language"
                      name="content_language"
                      value={formData.content_language}
                      onChange={handleChange}
                      placeholder="Hindi, English, Tamil"
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audience_geo_split" className="text-foreground">Audience Geo Split</Label>
                    <Input
                      id="audience_geo_split"
                      name="audience_geo_split"
                      value={formData.audience_geo_split}
                      onChange={handleChange}
                      placeholder="India 70%, US 20%, Others 10%"
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="past_rate_notes" className="text-foreground">Past Rate Notes</Label>
                  <Textarea
                    id="past_rate_notes"
                    name="past_rate_notes"
                    value={formData.past_rate_notes}
                    onChange={handleChange}
                    placeholder="Notes about past rates, collaborations, pricing..."
                    rows={4}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/creators")}
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
                        Create Creator
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
                  <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Bulk CSV Upload</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload multiple creators via CSV file
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
                  <Button
                    onClick={() => document.getElementById('csv-upload').click()}
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Browse Files
                  </Button>
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
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
                    <h3 className="text-lg font-medium text-foreground">CSV Preview</h3>
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
                                    {value}
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
                      <li>• Required columns: <strong>Name</strong>, <strong>Primary Category</strong></li>
                      <li>• Optional columns: All other fields from single entry form</li>
                      <li>• Separate multiple values with commas (for categories, niches, deliverables)</li>
                      <li>• Save file as UTF-8 encoded CSV</li>
                      <li>• Maximum file size: 10MB</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
                        Upload & Create {csvPreview.length > 0 ? `${csvPreview.length}+ Creators` : 'Creators'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}