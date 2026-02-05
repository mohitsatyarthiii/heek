"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  ExternalLink,
  File,
  PlayCircle,
  Globe,
  Eye,
  Copy,
  AlertTriangle,
} from "lucide-react";

/* =========================
   LINK DISPLAY COMPONENT
========================= */
const LinkDisplay = ({ link }) => {
  if (!link) return <span className="text-muted-foreground">—</span>;

  // Check link type
  const isFileLink = link.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|jpg|jpeg|png|gif|svg|webp)$/i);
  const isVideoLink = link.match(/\.(mp4|mov|avi|mkv|webm)$/i);
  const isDriveLink = link.includes('drive.google.com');
  const isDropboxLink = link.includes('dropbox.com');

  const getIcon = () => {
    if (isFileLink) return <File className="h-4 w-4" />;
    if (isVideoLink) return <PlayCircle className="h-4 w-4" />;
    if (isDriveLink || isDropboxLink) return <Globe className="h-4 w-4" />;
    return <LinkIcon className="h-4 w-4" />;
  };

  const getDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      if (link.length > 40) {
        return `${link.substring(0, 40)}...`;
      }
      return link;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    // You can add a toast notification here
    alert('Link copied to clipboard!');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          {getIcon()}
          <span className="font-medium">{getDomain(link)}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={copyToClipboard}
          className="h-6 text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(link, '_blank')}
          className="h-6 text-xs"
        >
          <Eye className="h-3 w-3 mr-1" />
          Open
        </Button>
      </div>
      <p className="text-xs text-muted-foreground break-all">{link}</p>
    </div>
  );
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    due_date: "",
    assigned_to: "",
    attachment_link: "",
    priority: "medium",
  });

  useEffect(() => {
    if (params.id) {
      fetchTaskDetails();
      fetchUsers();
    }
  }, [params.id]);

  const fetchTaskDetails = async () => {
    const supabase = createClient();
    
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!assigned_to (id, email, name, role),
          created_by_user:profiles!created_by (id, email, name),
          campaign:campaigns!campaign_id (id, brand_name, creator_name, person)
        `)
        .eq('id', params.id)
        .single();

      if (taskError) throw taskError;

      if (taskData) {
        setTask(taskData);
        setFormData({
          title: taskData.title || "",
          description: taskData.description || "",
          status: taskData.status || "todo",
          due_date: taskData.due_date ? taskData.due_date.split('T')[0] : "",
          assigned_to: taskData.assigned_to || "",
          attachment_link: taskData.attachment_link || "",
          priority: taskData.priority || "medium",
        });
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      setError("Failed to load requirement details");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .order('name');

    if (!error && data) {
      setUsers(data);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
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

      const userRole = profile?.role;
      
      // Check if user can edit
      if (userRole !== 'admin' && userRole !== 'manager' && user.id !== task.assigned_to) {
        throw new Error("You don't have permission to edit this requirement");
      }

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        attachment_link: formData.attachment_link || null,
        priority: formData.priority,
      };

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', params.id);

      if (updateError) throw updateError;

      // Refresh data
      await fetchTaskDetails();
      setEditing(false);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', params.id);

      if (error) throw error;

      // Update local state
      setTask(prev => ({ ...prev, status: newStatus }));
      setFormData(prev => ({ ...prev, status: newStatus }));
      
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'todo':
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          nextStatus: 'in_progress'
        };
      case 'in_progress':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: Clock,
          nextStatus: 'done'
        };
      case 'blocked':
        return {
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle,
          nextStatus: 'todo'
        };
      case 'done':
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          nextStatus: 'todo'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          nextStatus: 'todo'
        };
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatusLabel = (currentStatus) => {
    switch(currentStatus) {
      case 'todo': return 'Start Requirement';
      case 'in_progress': return 'Mark as Done';
      case 'blocked': return 'Unblock Requirement';
      case 'done': return 'Reopen Requirement';
      default: return 'Update Status';
    }
  };

  const canEditTask = () => {
    if (!user || !task) return false;
    
    // Check user permissions
    const supabase = createClient();
    return user.id === task.assigned_to || user.id === task.created_by;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading requirement details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Requirement not found</h3>
        <p className="text-muted-foreground mt-2">The requirement you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/tasks")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requirements
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard/tasks")}
              className="border-border text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requirements
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {editing ? (
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-2xl font-bold border-0 px-0 bg-transparent text-foreground"
                    placeholder="Requirement title"
                  />
                ) : (
                  task.title
                )}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={`${statusConfig.color} capitalize`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {task.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!editing && canEditTask() && (
              <Button 
                variant="outline" 
                onClick={() => setEditing(true)}
                className="border-border text-foreground hover:bg-accent"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Requirement
              </Button>
            )}
            
            {editing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setEditing(false)} 
                  disabled={saving}
                  className="border-border text-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => handleStatusChange(statusConfig.nextStatus)}
                className={`
                  ${task.status === 'todo' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  ${task.status === 'in_progress' ? 'bg-green-600 hover:bg-green-700' : ''}
                  ${task.status === 'blocked' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                  ${task.status === 'done' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                  text-white
                `}
              >
                {getNextStatusLabel(task.status)}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center gap-2 mb-6 text-sm border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Requirement Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {editing ? (
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Requirement description..."
                    rows={6}
                    className="min-h-[150px] bg-background border-border text-foreground focus:border-primary"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {task.description ? (
                      <p className="whitespace-pre-line text-foreground p-3 bg-accent rounded-lg">
                        {task.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic p-3 bg-accent rounded-lg">
                        No description provided
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachment Link Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <LinkIcon className="h-5 w-5" />
                  Attachment Link
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {editing ? (
                  <div className="space-y-3">
                    <Input
                      name="attachment_link"
                      value={formData.attachment_link}
                      onChange={handleChange}
                      placeholder="https://drive.google.com/... or https://example.com/file.pdf"
                      className="bg-background border-border text-foreground focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste any link: Google Drive, Dropbox, website URL, document link, etc.
                    </p>
                  </div>
                ) : (
                  <LinkDisplay link={task.attachment_link} />
                )}
              </CardContent>
            </Card>

            {/* Linked Information */}
            {task.campaign && (
              <Card className="bg-card border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="h-5 w-5" />
                    Linked Execution
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{task.campaign.brand_name}</p>
                        <p className="text-sm text-muted-foreground">Brand</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/dashboard/campaigns/${task.campaign_id}`)}
                      >
                        View Execution
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Creator</p>
                        <p className="font-medium text-foreground">
                          {task.campaign.creator_name || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Person</p>
                        <p className="font-medium text-foreground">
                          {task.campaign.person || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Requirement Info & Actions */}
          <div className="space-y-6">
            {/* Requirement Info Card */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground">Requirement Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </Label>
                  {editing ? (
                    <Input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      className="bg-background border-border text-foreground"
                    />
                  ) : (
                    <div className="font-medium">
                      {task.due_date ? (
                        <div className={`flex items-center gap-2 ${isOverdue ? "text-red-600" : "text-foreground"}`}>
                          <Calendar className="h-4 w-4" />
                          {new Date(task.due_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                          {isOverdue && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No due date</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Priority</Label>
                  {editing ? (
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => handleSelectChange('priority', value)}
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
                  ) : (
                    <Badge className={`${getPriorityColor(task.priority)} capitalize`}>
                      {task.priority || "medium"}
                    </Badge>
                  )}
                </div>

                {/* Assigned To */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned To
                  </Label>
                  {editing ? (
                    <Select 
                      value={formData.assigned_to} 
                      onValueChange={(value) => handleSelectChange('assigned_to', value)}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="text-foreground">
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {task.assigned_user?.name || task.assigned_user?.email || 'Unassigned'}
                        </p>
                        {task.assigned_user?.role && (
                          <p className="text-xs text-muted-foreground capitalize">{task.assigned_user.role}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  {editing ? (
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="todo" className="text-foreground">To Do</SelectItem>
                        <SelectItem value="in_progress" className="text-foreground">In Progress</SelectItem>
                        <SelectItem value="blocked" className="text-foreground">Blocked</SelectItem>
                        <SelectItem value="done" className="text-foreground">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusConfig.color} capitalize`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.status === 'blocked' && (
                        <span className="text-sm text-red-600">Needs attention</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Created By */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <Label className="text-sm text-muted-foreground">Created By</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {task.created_by_user?.name || task.created_by_user?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Status Actions */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={task.status === 'todo' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('todo')}
                    className="justify-start"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    To Do
                  </Button>
                  <Button 
                    variant={task.status === 'in_progress' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('in_progress')}
                    className="justify-start"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Progress
                  </Button>
                  <Button 
                    variant={task.status === 'blocked' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('blocked')}
                    className="justify-start"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Blocked
                  </Button>
                  <Button 
                    variant={task.status === 'done' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('done')}
                    className="justify-start"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-border text-foreground hover:bg-accent"
                    onClick={() => router.push(`/dashboard/tasks?status=${task.status}`)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    View All {task.status.replace('_', ' ')} Requirements
                  </Button>
                  
                  {task.campaign_id && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-border text-foreground hover:bg-accent"
                      onClick={() => router.push(`/dashboard/campaigns/${task.campaign_id}`)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Linked Execution
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-border text-foreground hover:bg-accent"
                    onClick={() => router.push(`/dashboard/tasks/new`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Similar Requirement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Timeline */}
        <Card className="mt-6 bg-card border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground">Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Requirement created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="text-center py-4 text-muted-foreground">
                No recent activity
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}