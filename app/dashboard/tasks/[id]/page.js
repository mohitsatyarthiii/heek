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
  ChevronRight
} from "lucide-react";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]);
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
    creator_id: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchTaskDetails();
      fetchUsers();
      fetchCreators();
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
          creator:creators!creator_id (id, name),
          created_by_user:profiles!created_by (id, email, name),
          campaign:campaigns!campaign_id (id, brand_name)
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
          creator_id: taskData.creator_id || "none",
        });
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      setError("Failed to load task details");
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

  const fetchCreators = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('creators')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setCreators(data);
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
        throw new Error("You don't have permission to edit this task");
      }

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        creator_id: formData.creator_id === "none" ? null : formData.creator_id,
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

  const getNextStatusLabel = (currentStatus) => {
    switch(currentStatus) {
      case 'todo': return 'Start Task';
      case 'in_progress': return 'Mark as Done';
      case 'blocked': return 'Unblock Task';
      case 'done': return 'Reopen Task';
      default: return 'Update Status';
    }
  };

  const canEditTask = () => {
    if (!user || !task) return false;
    
    // Admin and manager can edit any task
    const supabase = createClient();
    // We need to fetch user role - in real app, get this from context
    return user.id === task.assigned_to || user.id === task.created_by;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Task not found</h3>
        <p className="text-gray-500 mt-2">The task you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/tasks")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/tasks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editing ? (
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-3xl font-bold border-0 px-0"
                  placeholder="Task title"
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
              <span className="text-sm text-gray-500">
                Created {new Date(task.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!editing && canEditTask() && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Task
            </Button>
          )}
          
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
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
              `}
            >
              {getNextStatusLabel(task.status)}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md flex items-center gap-2 mb-6">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Task Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description..."
                  rows={6}
                  className="min-h-[150px]"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {task.description ? (
                    <p className="whitespace-pre-line">{task.description}</p>
                  ) : (
                    <p className="text-gray-400 italic">No description provided</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Linked Creator Card */}
            {task.creator && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Linked Creator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{task.creator.name}</p>
                      <p className="text-sm text-gray-500">Creator</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/creators/${task.creator_id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Linked Campaign Card */}
            {task.campaign && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Linked Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{task.campaign.brand_name}</p>
                      <p className="text-sm text-gray-500">Campaign</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column - Task Info & Actions */}
        <div className="space-y-6">
          {/* Task Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Due Date */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </Label>
                {editing ? (
                  <Input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="font-medium">
                    {task.due_date ? (
                      <span className={new Date(task.due_date) < new Date() && task.status !== 'done' 
                        ? "text-red-600" 
                        : ""}>
                        {new Date(task.due_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-400">No due date</span>
                    )}
                  </div>
                )}
              </div>

              {/* Assigned To */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned To
                </Label>
                {editing ? (
                  <Select 
                    value={formData.assigned_to} 
                    onValueChange={(value) => handleSelectChange('assigned_to', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {task.assigned_user?.name || task.assigned_user?.email || 'Unassigned'}
                      </p>
                      {task.assigned_user?.role && (
                        <p className="text-xs text-gray-500 capitalize">{task.assigned_user.role}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Status</Label>
                {editing ? (
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
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
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-sm text-gray-500">Created By</Label>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {task.created_by_user?.name || task.created_by_user?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(task.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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

          {/* Task Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Task Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/tasks?status=${task.status}`)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  View All {task.status.replace('_', ' ')} Tasks
                </Button>
                
                {task.creator_id && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push(`/dashboard/creators/${task.creator_id}`)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Creator Profile
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/tasks/new`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Similar Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Timeline (Placeholder) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Task created</p>
                <p className="text-sm text-gray-500">
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
            
            <div className="text-center py-4 text-gray-400">
              No recent activity
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}