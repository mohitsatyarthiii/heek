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
  Upload, 
  FileText,
  Plus,
  CheckCircle,
  Download,
  X,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NewTaskPage() {
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
    title: "",
    description: "",
    status: "todo",
    due_date: "",
    assigned_to: "",
    creator_id: "none",
    priority: "medium",
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
      
      // Fetch ALL profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .order('name');

      if (error) throw error;
      
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
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
    } catch (err) {
      console.error("Error fetching creators:", err);
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

      if (!profile) {
        throw new Error("User profile not found");
      }

      if (!['admin', 'manager'].includes(profile?.role)) {
        throw new Error("You don't have permission to create tasks");
      }

      // Prepare task data
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        creator_id: formData.creator_id === "none" ? null : formData.creator_id,
        created_by: user.id,
      };

      const { error: insertError } = await supabase
        .from('tasks')
        .insert([taskData]);

      if (insertError) {
        throw insertError;
      }

      setSuccess("Requirement created successfully!");
      setTimeout(() => {
        router.push("/dashboard/tasks");
        router.refresh();
      }, 1500);
      
    } catch (err) {
      setError(err.message || "Failed to create Requirement");
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
        throw new Error(`Only admin and manager can bulk create Requirements. Your role: ${profile.role}`);
      }

      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const tasks = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const task = {
          created_by: session.user.id,
          status: "todo",
        };

        headers.forEach((header, index) => {
          const value = values[index] ? values[index].trim() : '';
          
          // Map CSV headers to database fields
          switch(header) {
            case 'title':
              task.title = value;
              break;
            case 'description':
              task.description = value;
              break;
            case 'status':
              task.status = value;
              break;
            case 'priority':
              task.priority = value;
              break;
            case 'due_date':
              task.due_date = value;
              break;
            case 'assigned_to':
              // Find user by email or name
              const user = users.find(u => 
                u.email === value || u.name === value
              );
              task.assigned_to = user?.id || null;
              break;
            case 'creator_id':
            case 'creator':
              // Find creator by name
              const creator = creators.find(c => c.name === value);
              task.creator_id = creator?.id || null;
              break;
          }
        });

        tasks.push(task);
      }

      // Insert all tasks
      const { error: insertError } = await supabase
        .from('tasks')
        .insert(tasks);

      if (insertError) {
        throw new Error(`Bulk insert error: ${insertError.message}`);
      }

      setSuccess(`Successfully created ${tasks.length} Requirement!`);
      setTimeout(() => {
        router.push("/dashboard/tasks");
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
      'Title',
      'Description',
      'Status',
      'Priority',
      'Due Date',
      'Assigned To',
      'Creator'
    ];
    
    const template = headers.join(',') + '\n' +
      'Update marketing campaign,Update campaign assets,todo,medium,2024-01-15,john@example.com,John Creator\n' +
      'Review content schedule,Review Q2 content schedule,in_progress,high,2024-01-20,jane@example.com,';
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'manager': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default: return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Requirement form...</p>
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
              <h1 className="text-2xl font-bold text-foreground">Create Requirements</h1>
              <p className="text-sm text-muted-foreground">
                Create requirement individually or in bulk via CSV
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
                  Choose how you want to create Requirements
                </p>
              </div>
              
              <div className="flex border border-border rounded-lg overflow-hidden bg-background">
                <button
                  onClick={() => setUploadMode("single")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${uploadMode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                >
                  <Plus className="h-4 w-4" />
                  Single Requirement
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
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Create Single Requirement</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Create and assign a single Requirement manually
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

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground">Requirement Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter task title"
                    required
                    disabled={loading}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the task in detail..."
                    rows={4}
                    disabled={loading}
                    className="bg-background border-border text-foreground focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <SelectItem value="todo" className="text-foreground">To Do</SelectItem>
                        <SelectItem value="in_progress" className="text-foreground">In Progress</SelectItem>
                        <SelectItem value="review" className="text-foreground">Review</SelectItem>
                        <SelectItem value="blocked" className="text-foreground">Blocked</SelectItem>
                        <SelectItem value="done" className="text-foreground">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-foreground">Priority</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => handleSelectChange('priority', value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="high" className="text-foreground">High</SelectItem>
                        <SelectItem value="medium" className="text-foreground">Medium</SelectItem>
                        <SelectItem value="low" className="text-foreground">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Due Date
                      </span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="due_date"
                        name="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={handleChange}
                        className="pl-10 bg-background border-border text-foreground focus:border-primary"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_to" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Assign To *
                      </span>
                    </Label>
                    <Select 
                      value={formData.assigned_to} 
                      onValueChange={(value) => handleSelectChange('assigned_to', value)}
                      disabled={loading || users.length === 0}
                      required
                    >
                      <SelectTrigger className={`bg-background border-border text-foreground ${users.length === 0 ? "border-red-300" : ""}`}>
                        <SelectValue placeholder={
                          users.length === 0 
                            ? "No team members found" 
                            : "Select team member"
                        } />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-[300px]">
                        {users.length === 0 ? (
                          <SelectItem value="" disabled className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              No team members available
                            </div>
                          </SelectItem>
                        ) : (
                          users.map((teamMember) => (
                            <SelectItem key={teamMember.id} value={teamMember.id} className="text-foreground">
                              <div className="flex items-center gap-2 py-1">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getRoleColor(teamMember.role)}`}>
                                  <span className="text-sm font-medium">
                                    {teamMember.name?.charAt(0) || teamMember.email?.charAt(0) || "U"}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium truncate">
                                      {teamMember.name || teamMember.email}
                                      {teamMember.id === user.id && (
                                        <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                                      )}
                                    </span>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {teamMember.role}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {teamMember.email}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    {users.length === 0 && (
                      <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded mt-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">No team members found</p>
                            <p className="text-xs">Add users first from the settings page</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creator_id" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Link to Creator (Optional)
                      </span>
                    </Label>
                    <Select 
                      value={formData.creator_id} 
                      onValueChange={(value) => handleSelectChange('creator_id', value)}
                      disabled={loading || creators.length === 0}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder={
                          creators.length === 0 
                            ? "No creators found" 
                            : "Select creator"
                        } />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border max-h-[300px]">
                        <SelectItem value="none" className="text-foreground">None</SelectItem>
                        {creators.map((creator) => (
                          <SelectItem key={creator.id} value={creator.id} className="text-foreground">
                            {creator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/tasks")}
                    disabled={loading}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || users.length === 0}
                    className={`${users.length === 0 ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {users.length === 0 ? "Add Users First" : "Create Requirement"}
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
                    Upload multiple tasks via CSV file
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
                      <li>• Required columns: <strong>Title</strong>, <strong>Assigned To</strong> (email or name)</li>
                      <li>• Optional columns: Description, Status, Priority, Due Date, Creator</li>
                      <li>• Status values: todo, in_progress, review, blocked, done</li>
                      <li>• Priority values: high, medium, low</li>
                      <li>• Date format: YYYY-MM-DD</li>
                      <li>• Save file as UTF-8 encoded CSV</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-foreground">Available Team Members</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Found {users.length} team member{users.length !== 1 ? 's' : ''}
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
                        Found {creators.length} creator{creators.length !== 1 ? 's' : ''}
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
                          Upload & Create {csvPreview.length > 0 ? `${csvPreview.length}+ Tasks` : 'Tasks'}
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