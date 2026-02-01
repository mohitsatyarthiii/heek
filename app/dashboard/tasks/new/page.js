"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
import { AlertCircle, ArrowLeft, Save, Calendar, User, Users, Badge } from "lucide-react";

export default function NewTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    due_date: "",
    assigned_to: "",
    creator_id: "none",
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
      console.log("🔍 Fetching ALL team members from profiles table...");
      
      // Debug: Check what's in auth.users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      console.log("Auth users:", authUsers?.users?.map(u => ({ id: u.id, email: u.email })));
      
      // Fetch ALL profiles (including all roles)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .order('name');

      if (error) {
        console.error("❌ Error fetching users:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Check if RLS is blocking
        if (error.code === '42501') {
          console.error("⚠️ RLS Policy Error: You don't have permission to view profiles");
        }
        
        throw error;
      }

      console.log("✅ Team members fetched:", data);
      console.log("📊 Total users found:", data?.length);
      
      if (data && data.length > 0) {
        // Filter out current user if you want
        const otherUsers = data.filter(u => u.id !== user.id);
        console.log("👥 Other users (excluding current):", otherUsers);
        setUsers(data); // Show all users including current
      } else {
        console.warn("⚠️ No team members found in profiles table");
        console.log("Possible issues:");
        console.log("1. Profiles table is empty");
        console.log("2. RLS policies are blocking");
        console.log("3. Users haven't been added to profiles table");
        setUsers([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
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

      if (error) {
        console.error("Error fetching creators:", error);
        throw error;
      }
      
      if (data) {
        setCreators(data);
      }
    } catch (err) {
      console.error("Error fetching creators:", err);
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
    setLoading(true);
    setError("");

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
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        creator_id: formData.creator_id === "none" ? null : formData.creator_id,
        created_by: user.id,
      };

      console.log("Creating task with data:", taskData);

      const { error: insertError } = await supabase
        .from('tasks')
        .insert([taskData]);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      router.push("/dashboard/tasks");
      router.refresh();
      
    } catch (err) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading task form...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Task</h1>
          <p className="text-gray-600">Assign a new task to team member</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Debug Info */}
            {users.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-md text-sm">
                <p className="font-medium text-blue-700">
                  Found {users.length} team member{users.length !== 1 ? 's' : ''}:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {users.map(u => (
                    <span key={u.id} className="px-2 py-1 bg-white rounded text-xs">
                      {u.name || u.email} ({u.role})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the task in detail..."
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                  disabled={loading}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <div className="flex items-center relative">
                  <Calendar className="absolute left-3 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assign To *
                    <span className="text-xs font-normal text-gray-500">
                      ({users.length} available)
                    </span>
                  </span>
                </Label>
                <Select 
                  value={formData.assigned_to} 
                  onValueChange={(value) => handleSelectChange('assigned_to', value)}
                  disabled={loading || users.length === 0}
                  required
                >
                  <SelectTrigger className={users.length === 0 ? "border-red-300" : ""}>
                    <SelectValue placeholder={
                      users.length === 0 
                        ? "No team members found" 
                        : "Select team member"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem value="" disabled>
                        <div className="flex items-center gap-2 text-gray-500">
                          <AlertCircle className="h-4 w-4" />
                          No team members available
                        </div>
                      </SelectItem>
                    ) : (
                      users.map((teamMember) => (
                        <SelectItem key={teamMember.id} value={teamMember.id}>
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                              teamMember.role === 'admin' ? 'bg-red-100' :
                              teamMember.role === 'manager' ? 'bg-blue-100' :
                              'bg-green-100'
                            }`}>
                              <span className={`text-xs font-medium ${
                                teamMember.role === 'admin' ? 'text-red-600' :
                                teamMember.role === 'manager' ? 'text-blue-600' :
                                'text-green-600'
                              }`}>
                                {teamMember.name?.charAt(0) || teamMember.email?.charAt(0) || "U"}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium truncate">
                                  {teamMember.name || "Unnamed User"}
                                  {teamMember.id === user.id && (
                                    <span className="ml-2 text-xs text-gray-500">(You)</span>
                                  )}
                                </span>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {teamMember.role}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 truncate">
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
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded mt-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">No team members found</p>
                        <ul className="text-xs space-y-1">
                          <li>• Check if users exist in Supabase Authentication</li>
                          <li>• Check if profiles table has records for all users</li>
                          <li>• Check RLS policies on profiles table</li>
                        </ul>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => router.push("/dashboard/settings")}
                        >
                          Go to Settings to add users
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="creator_id">
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
                  <SelectTrigger>
                    <SelectValue placeholder={
                      creators.length === 0 
                        ? "No creators found" 
                        : "Select creator"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {creators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/tasks")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || users.length === 0}
                className={users.length === 0 ? "bg-gray-400 cursor-not-allowed" : ""}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {users.length === 0 ? "Add Users First" : "Create Task"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}