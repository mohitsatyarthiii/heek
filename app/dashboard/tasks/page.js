"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  PlusCircle,
  Calendar,
  User,
  AlertCircle
} from "lucide-react";

export default function TasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTasks(), fetchUsers(), checkPermissions()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCanCreate(['admin', 'manager'].includes(profile.role));
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const supabase = createClient();
      
      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // First, fetch tasks without joins
      let query = supabase
        .from('tasks')
        .select('*');

      if (profile?.role === 'associate') {
        // Associates only see their tasks
        query = query.eq('assigned_to', user.id);
      }

      const { data: tasksData, error: tasksError } = await query.order('created_at', { ascending: false });

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        throw tasksError;
      }

      if (tasksData) {
        // Now fetch user details for each task
        const tasksWithUsers = await Promise.all(
          tasksData.map(async (task) => {
            // Fetch assigned user
            const { data: assignedUser } = await supabase
              .from('profiles')
              .select('id, email, name')
              .eq('id', task.assigned_to)
              .single();

            // Fetch creator
            const { data: creator } = await supabase
              .from('creators')
              .select('id, name')
              .eq('id', task.creator_id)
              .single();

            // Fetch created by user
            const { data: createdByUser } = await supabase
              .from('profiles')
              .select('id, email, name')
              .eq('id', task.created_by)
              .single();

            return {
              ...task,
              assigned_user: assignedUser || null,
              creator: creator || null,
              created_by_user: createdByUser || null,
            };
          })
        );

        setTasks(tasksWithUsers);
        console.log("Tasks with user data:", tasksWithUsers);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .order('name');

      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }

      if (data) {
        setUsers(data);
        console.log("All users fetched:", data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'all' || task.assigned_to === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (task) => {
    // First check if we have assigned_user data
    if (task.assigned_user) {
      return task.assigned_user.name || task.assigned_user.email || 'Unknown';
    }
    
    // If not, check in the users array
    const userObj = users.find(u => u.id === task.assigned_to);
    if (userObj) {
      return userObj.name || userObj.email || 'Unknown';
    }
    
    // Last resort
    return task.assigned_to ? 'Loading...' : 'Unassigned';
  };

  const getUserEmail = (task) => {
    if (task.assigned_user) {
      return task.assigned_user.email;
    }
    
    const userObj = users.find(u => u.id === task.assigned_to);
    return userObj?.email || '';
  };

  const getCreatorName = (task) => {
    if (task.creator) {
      return task.creator.name;
    }
    return task.creator_id ? 'Loading...' : '—';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-600">Manage and track all tasks</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="text-sm">
              Total: {tasks.length}
            </Badge>
            <Badge variant="outline" className="text-sm bg-blue-50">
              Todo: {tasks.filter(t => t.status === 'todo').length}
            </Badge>
            <Badge variant="outline" className="text-sm bg-green-50">
              Done: {tasks.filter(t => t.status === 'done').length}
            </Badge>
          </div>
        </div>
        
        {canCreate && (
          <Button onClick={() => router.push("/dashboard/tasks/new")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Linked Creator</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                      <p className="text-gray-500 mb-4">
                        {search || statusFilter !== 'all' || assigneeFilter !== 'all' 
                          ? "Try changing your filters" 
                          : "Create your first task to get started"}
                      </p>
                      {canCreate && !search && statusFilter === 'all' && assigneeFilter === 'all' && (
                        <Button onClick={() => router.push("/dashboard/tasks/new")}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create First Task
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const assignedUserName = getUserName(task);
                  const assignedUserEmail = getUserEmail(task);
                  const creatorName = getCreatorName(task);
                  
                  return (
                    <TableRow 
                      key={task.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <p className="font-semibold">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(task.status)} capitalize`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className={task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' 
                            ? "text-red-600 font-medium" 
                            : ""}>
                            {task.due_date 
                              ? new Date(task.due_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'No date'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {assignedUserName}
                            </p>
                            {assignedUserEmail && (
                              <p className="text-xs text-gray-500 truncate">
                                {assignedUserEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.creator_id ? (
                          <Badge variant="outline" className="truncate max-w-[150px]">
                            {creatorName}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/tasks/${task.id}`);
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}