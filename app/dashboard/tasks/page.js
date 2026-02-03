"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/theme-context";
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
import { ThemeToggle } from "@/components/theme-toggle";
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
  AlertCircle,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  Target,
  FileText,
  Flag,
  CheckCheck,
  AlertTriangle,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

export default function TasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, colors, isDark } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('tasks')
        .select('*');

      if (profile?.role === 'associate') {
        query = query.eq('assigned_to', user.id);
      }

      const { data: tasksData, error: tasksError } = await query.order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      if (tasksData) {
        const tasksWithUsers = await Promise.all(
          tasksData.map(async (task) => {
            const [{ data: assignedUser }, { data: creator }, { data: createdByUser }] = await Promise.all([
              supabase.from('profiles').select('id, email, name').eq('id', task.assigned_to).single(),
              supabase.from('creators').select('id, name').eq('id', task.creator_id).single(),
              supabase.from('profiles').select('id, email, name').eq('id', task.created_by).single()
            ]);

            return {
              ...task,
              assigned_user: assignedUser || null,
              creator: creator || null,
              created_by_user: createdByUser || null,
            };
          })
        );

        setTasks(tasksWithUsers);
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

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase()) ||
      task.assigned_user?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'all' || task.assigned_to === assigneeFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesAssignee && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status) => {
    switch(status) {
      case 'todo': 
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      case 'in_progress': 
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'review': 
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'blocked': 
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'done': 
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      default: 
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'todo': return <Clock className="h-3 w-3" />;
      case 'in_progress': return <PlayCircle className="h-3 w-3" />;
      case 'review': return <AlertCircle className="h-3 w-3" />;
      case 'blocked': return <XCircle className="h-3 w-3" />;
      case 'done': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': 
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium': 
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low': 
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      default: 
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high': return <Flag className="h-3 w-3 fill-red-500" />;
      case 'medium': return <Flag className="h-3 w-3 fill-yellow-500" />;
      case 'low': return <Flag className="h-3 w-3 fill-green-500" />;
      default: return <Flag className="h-3 w-3 text-gray-500" />;
    }
  };

  const isTaskOverdue = (task) => {
    if (!task.due_date || task.status === 'done') return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getDaysRemaining = (task) => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Title,Status,Priority,Due Date,Assigned To,Creator,Description\n" +
      tasks.map(t => 
        `"${t.title || ''}","${t.status}","${t.priority || 'medium'}","${t.due_date || ''}","${t.assigned_user?.name || ''}","${t.creator?.name || ''}","${t.description?.replace(/"/g, '""') || ''}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading tasks database...</p>
        </div>
      </div>
    );
  }

  const statusCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const priorityCounts = {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium' || !t.priority).length,
    low: tasks.filter(t => t.priority === 'low').length,
  };

  const overdueTasks = tasks.filter(isTaskOverdue).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Top Bar - Spreadsheet Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Task Manager</h1>
              <p className="text-sm text-muted-foreground">
                Overdue: {overdueTasks} • Due Today: {tasks.filter(t => {
                  const due = new Date(t.due_date);
                  const today = new Date();
                  return due.toDateString() === today.toDateString() && t.status !== 'done';
                }).length}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="border-border text-foreground hover:bg-accent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-border text-foreground hover:bg-accent"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {canCreate && (
              <Button
                onClick={() => router.push("/dashboard/tasks/new")}
                size="sm"
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Task
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Tasks</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.all}</p>
                </div>
                <Target className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-gray-400/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">To Do</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.todo}</p>
                </div>
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-blue-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.in_progress}</p>
                </div>
                <PlayCircle className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-green-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Done</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.done}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-red-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Blocked</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.blocked}</p>
                </div>
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-yellow-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-lg font-bold text-foreground">{overdueTasks}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Bar */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks: title, description, assignee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background border-border focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px] border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                  <SelectItem value="todo">To Do ({statusCounts.todo})</SelectItem>
                  <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
                  <SelectItem value="review">Review ({statusCounts.review})</SelectItem>
                  <SelectItem value="blocked">Blocked ({statusCounts.blocked})</SelectItem>
                  <SelectItem value="done">Done ({statusCounts.done})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(value) => {
                setPriorityFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px] border-border">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High ({priorityCounts.high})</SelectItem>
                  <SelectItem value="medium">Medium ({priorityCounts.medium})</SelectItem>
                  <SelectItem value="low">Low ({priorityCounts.low})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={(value) => {
                setAssigneeFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px] border-border">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-[300px]">
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-accent"
              >
                <Filter className="h-4 w-4 mr-2" />
                More Filters
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Data Table - Spreadsheet Style */}
        <Card className="bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader className="bg-accent">
                <TableRow className="border-b border-border hover:bg-accent">
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 sticky left-0 bg-accent z-10 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Task Details
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[100px]">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[100px]">
                    Priority
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[120px]">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Due Date
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[150px]">
                    <Users className="h-4 w-4 inline mr-2" />
                    Assignee
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[120px]">
                    Creator
                  </TableHead>
                  <TableHead className="font-semibold text-foreground p-3 min-w-[100px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <CheckCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-lg font-medium text-foreground">No tasks found</p>
                        <p className="text-muted-foreground mt-1 mb-4">
                          {search || statusFilter !== 'all' || assigneeFilter !== 'all' || priorityFilter !== 'all' 
                            ? "Try changing your search or filter criteria" 
                            : "Start by creating your first task"}
                        </p>
                        {canCreate && !search && statusFilter === 'all' && assigneeFilter === 'all' && priorityFilter === 'all' && (
                          <Button
                            onClick={() => router.push("/dashboard/tasks/new")}
                            className="bg-primary text-primary-foreground hover:opacity-90"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create First Task
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTasks.map((task) => {
                    const daysRemaining = getDaysRemaining(task);
                    const isOverdue = isTaskOverdue(task);
                    
                    return (
                      <TableRow 
                        key={task.id} 
                        className={`border-b border-border hover:bg-accent/50 transition-colors group ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                      >
                        <TableCell className="border-r border-border p-3 sticky left-0 bg-card min-w-[200px]">
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              <div className={`h-8 w-8 rounded flex items-center justify-center flex-shrink-0 ${
                                task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                                task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                'bg-green-100 dark:bg-green-900/30'
                              }`}>
                                <Flag className={`h-4 w-4 ${
                                  task.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                                  task.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-green-600 dark:text-green-400'
                                }`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-foreground truncate">{task.title}</p>
                                  {task.creator_id && (
                                    <Badge variant="outline" size="sm" className="text-xs">
                                      Creator
                                    </Badge>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-xs">
                                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Created: {new Date(task.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[100px]">
                          <Badge className={`${getStatusColor(task.status)} flex items-center gap-1.5 w-fit`}>
                            {getStatusIcon(task.status)}
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[100px]">
                          <Badge className={`${getPriorityColor(task.priority || 'medium')} flex items-center gap-1.5 w-fit`}>
                            {getPriorityIcon(task.priority || 'medium')}
                            {task.priority || 'Medium'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[120px]">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 
                                daysRemaining && daysRemaining <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 
                                'text-foreground'}`}>
                                {task.due_date 
                                  ? new Date(task.due_date).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short'
                                    })
                                  : '—'}
                              </span>
                            </div>
                            
                            {task.due_date && task.status !== 'done' && (
                              <div className="text-xs">
                                {isOverdue ? (
                                  <span className="text-red-600 dark:text-red-400 font-medium">OVERDUE</span>
                                ) : daysRemaining > 0 ? (
                                  <span className="text-muted-foreground">{daysRemaining} days left</span>
                                ) : daysRemaining === 0 ? (
                                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">Due Today</span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {task.assigned_user?.name || task.assigned_user?.email || 'Unassigned'}
                              </p>
                              {task.assigned_user?.email && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {task.assigned_user.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[120px]">
                          {task.creator ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="font-medium text-foreground truncate">
                                {task.creator.name}
                              </span>
                            </div>
                          ) : task.creator_id ? (
                            <span className="text-muted-foreground text-sm">Loading...</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="p-3 min-w-[100px]">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/tasks/${task.id}`);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canCreate && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/dashboard/tasks/edit/${task.id}`);
                                  }}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {['todo', 'in_progress'].includes(task.status) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Add delete logic here
                                    }}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Spreadsheet Footer */}
          {paginatedTasks.length > 0 && (
            <div className="border-t border-border px-4 py-3 bg-accent">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTasks.length)}</span> of{" "}
                    <span className="font-medium text-foreground">{filteredTasks.length}</span> tasks
                  </p>
                  <select 
                    className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
                    value={itemsPerPage}
                    onChange={(e) => setCurrentPage(1)}
                  >
                    <option value="15">15 per page</option>
                    <option value="30">30 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-border text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-accent'}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="text-muted-foreground mx-1">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="h-8 w-8 p-0 border-border text-foreground hover:bg-accent"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="border-border text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-xl font-bold text-foreground">
                    {tasks.length > 0 ? 
                      `${Math.round((statusCounts.done / tasks.length) * 100)}%` : 
                      '0%'}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Completion Time</p>
                  <p className="text-xl font-bold text-foreground">5.2 days</p>
                </div>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority Tasks</p>
                  <p className="text-xl font-bold text-foreground">{priorityCounts.high}</p>
                </div>
                <Flag className="h-5 w-5 text-red-500 fill-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Per User</p>
                  <p className="text-xl font-bold text-foreground">
                    {users.length > 0 ? Math.round(tasks.length / users.length) : 0}
                  </p>
                </div>
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}