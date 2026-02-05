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
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Link as LinkIcon,
  Target,
  Clock,
  CheckCheck,
  BadgeAlert,
  ExternalLink,
} from "lucide-react";

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    due_date: "",
    assigned_to: "",
    attachment_link: "",
    priority: "medium",
    campaign_id: "none",
  });

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTask(),
        fetchUsers(),
        fetchCampaigns(),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load requirement data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTask = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!assigned_to (id, name, email),
          campaign:campaigns!campaign_id (id, brand_name, status)
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (data) {
        setTask(data);
        // Format data for form
        setFormData({
          title: data.title || "",
          description: data.description || "",
          status: data.status || "todo",
          due_date: data.due_date ? data.due_date.split('T')[0] : "",
          assigned_to: data.assigned_to || "",
          attachment_link: data.attachment_link || "",
          priority: data.priority || "medium",
          campaign_id: data.campaign_id || "none",
        });
      }
    } catch (error) {
      console.error("Error fetching requirement:", error);
      setError("Failed to load requirement");
    }
  };

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .order('name');

      if (!error && data) {
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, brand_name, creator_name, person, status')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCampaigns(data);
      }
    } catch (error) {
      console.error("Error fetching executions:", error);
      setCampaigns([]);
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
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error("User profile not found");
      }

      // Check if user can edit
      const canEdit = ['admin', 'manager'].includes(profile.role) || 
                      user.id === task.assigned_to || 
                      user.id === task.created_by;

      if (!canEdit) {
        throw new Error("You don't have permission to edit this requirement");
      }

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        attachment_link: formData.attachment_link || null,
        campaign_id: formData.campaign_id === "none" ? null : formData.campaign_id,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', params.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess("Requirement updated successfully!");
      setTimeout(() => {
        router.push(`/dashboard/tasks/${params.id}`);
        router.refresh();
      }, 1500);
      
    } catch (err) {
      setError(err.message || "Failed to update requirement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this requirement? This action cannot be undone.")) {
      return;
    }

    setSaving(true);
    setError("");
    
    try {
      const supabase = createClient();
      
      // Check permissions
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!['admin', 'manager'].includes(profile?.role)) {
        throw new Error("You don't have permission to delete requirements");
      }

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', params.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess("Requirement deleted successfully!");
      setTimeout(() => {
        router.push("/dashboard/tasks");
        router.refresh();
      }, 1500);
      
    } catch (err) {
      setError(err.message || "Failed to delete requirement");
      setSaving(false);
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'manager': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default: return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading requirement data...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Requirement not found</h3>
          <p className="text-muted-foreground mt-2">The requirement you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/tasks")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requirements
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
              onClick={() => router.push(`/dashboard/tasks/${params.id}`)}
              className="border-border text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Requirement</h1>
              <p className="text-sm text-muted-foreground">
                Update requirement details
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
              Delete Requirement
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-foreground">Edit Requirement Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update the requirement information below
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

              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Requirement Title *
                  </span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter requirement title"
                  required
                  disabled={saving}
                  className="bg-background border-border text-foreground focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the requirement in detail..."
                  rows={4}
                  disabled={saving}
                  className="bg-background border-border text-foreground focus:border-primary"
                />
              </div>

              {/* Attachment Link */}
              <div className="space-y-2">
                <Label htmlFor="attachment_link" className="text-foreground">
                  <span className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Attachment Link (Optional)
                  </span>
                </Label>
                <Input
                  id="attachment_link"
                  name="attachment_link"
                  value={formData.attachment_link}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/... or https://example.com/file.pdf"
                  disabled={saving}
                  className="bg-background border-border text-foreground focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Add any link: Google Drive, Dropbox, website URL, document link, etc.
                </p>
                {formData.attachment_link && (
                  <div className="mt-2">
                    <a
                      href={formData.attachment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Test this link
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <SelectItem value="todo" className="text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        To Do
                      </SelectItem>
                      <SelectItem value="in_progress" className="text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        In Progress
                      </SelectItem>
                      <SelectItem value="blocked" className="text-foreground flex items-center gap-2">
                        <BadgeAlert className="h-4 w-4" />
                        Blocked
                      </SelectItem>
                      <SelectItem value="done" className="text-foreground flex items-center gap-2">
                        <CheckCheck className="h-4 w-4" />
                        Done
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-foreground">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => handleSelectChange('priority', value)}
                    disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_id" className="text-foreground">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Link to Execution (Optional)
                    </span>
                  </Label>
                  <Select 
                    value={formData.campaign_id} 
                    onValueChange={(value) => handleSelectChange('campaign_id', value)}
                    disabled={saving || campaigns.length === 0}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder={
                        campaigns.length === 0 
                          ? "No executions found" 
                          : "Select execution"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-[300px]">
                      <SelectItem value="none" className="text-foreground">None</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id} className="text-foreground">
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{campaign.brand_name}</span>
                            <Badge className={`ml-2 text-xs ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    disabled={saving || users.length === 0}
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
              </div>

              {/* Current Information Summary */}
              <Card className="bg-accent border-border">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-3">Current Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium text-foreground">
                        {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created By</p>
                      <p className="font-medium text-foreground">
                        {task.assigned_user?.name || task.assigned_user?.email || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Status</p>
                      <Badge className="capitalize mt-1">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Priority</p>
                      <Badge className={`mt-1 ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority || 'medium'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/tasks/${params.id}`)}
                  disabled={saving}
                  className="border-border text-foreground hover:bg-accent"
                >
                  <XCircle className="h-4 w-4 mr-2" />
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
                      Update Requirement
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="mt-6 bg-card border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/tasks/new`)}
                className="justify-start border-border text-foreground hover:bg-accent"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Similar Requirement
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/tasks`)}
                className="justify-start border-border text-foreground hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                View All Requirements
              </Button>
              
              {task.campaign_id && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/campaigns/${task.campaign_id}`)}
                  className="justify-start border-border text-foreground hover:bg-accent"
                >
                  <Target className="h-4 w-4 mr-2" />
                  View Linked Execution
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="justify-start border-border text-foreground hover:bg-accent"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Copy Requirement Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}