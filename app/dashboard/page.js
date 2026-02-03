"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/theme-context";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  CheckSquare, 
  Target, 
  AlertTriangle, 
  RefreshCw,
  ChevronRight,
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle,
  XCircle,
  Flag,
  Users,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  const [assignedRequirements, setAssignedRequirements] = useState([]);
  const [assignedCampaigns, setAssignedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();
      
      if (profile?.name) {
        setUserName(profile.name.split(' ')[0]); // Get first name only
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      // Fetch assigned requirements (tasks)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true })
        .limit(10);

      if (!tasksError && tasksData) {
        setAssignedRequirements(tasksData);
      }

      // Fetch assigned campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('assigned_team_member', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!campaignsError && campaignsData) {
        setAssignedCampaigns(campaignsData);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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
      case 'review': return <AlertTriangle className="h-3 w-3" />;
      case 'blocked': return <XCircle className="h-3 w-3" />;
      case 'done': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getCampaignStatusColor = (status) => {
    switch(status) {
      case 'planning': 
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      case 'active': 
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'paused': 
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'completed': 
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'cancelled': 
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      default: 
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getCampaignStatusIcon = (status) => {
    switch(status) {
      case 'planning': return <Clock className="h-3 w-3" />;
      case 'active': return <PlayCircle className="h-3 w-3" />;
      case 'paused': return <AlertTriangle className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
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

  const getStats = () => {
    const overdueTasks = assignedRequirements.filter(isTaskOverdue).length;
    const tasksDueToday = assignedRequirements.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString();
    }).length;
    const activeCampaigns = assignedCampaigns.filter(c => c.status === 'active').length;

    return {
      totalTasks: assignedRequirements.length,
      overdueTasks,
      tasksDueToday,
      activeCampaigns,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {userName || 'User'}!
              </h1>
              <p className="text-sm text-muted-foreground">
                Here's what's assigned to you today
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              className="border-border text-foreground hover:bg-accent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Tasks</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalTasks}</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <CheckSquare className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-red-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-foreground">{stats.overdueTasks}</p>
                </div>
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-yellow-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Due Today</p>
                  <p className="text-2xl font-bold text-foreground">{stats.tasksDueToday}</p>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-green-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeCampaigns}</p>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Spreadsheet Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Requirements */}
          <Card className="bg-card border border-border overflow-hidden">
            <CardHeader className="bg-accent border-b border-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Assigned Requirements</CardTitle>
                    <p className="text-sm text-muted-foreground">Tasks assigned to you</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard/tasks")}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-accent/50">
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-semibold text-foreground border-r border-border min-w-[200px]">
                      Task
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground border-r border-border min-w-[80px]">
                      Status
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground border-r border-border min-w-[80px]">
                      Priority
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground min-w-[100px]">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignedRequirements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-6">
                        <div className="flex flex-col items-center">
                          <CheckSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                          <p className="text-foreground font-medium">No tasks assigned</p>
                          <p className="text-muted-foreground text-sm mt-1">
                            You don't have any tasks assigned to you
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    assignedRequirements.map((task) => {
                      const isOverdue = isTaskOverdue(task);
                      const daysRemaining = getDaysRemaining(task);
                      
                      return (
                        <tr 
                          key={task.id} 
                          className={`border-b border-border hover:bg-accent/50 transition-colors cursor-pointer ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                          onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                        >
                          <td className="p-3 border-r border-border min-w-[200px]">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground truncate">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 border-r border-border min-w-[80px]">
                            <Badge className={`${getStatusColor(task.status)} flex items-center gap-1.5 w-fit text-xs`}>
                              {getStatusIcon(task.status)}
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 border-r border-border min-w-[80px]">
                            <Badge className={`${getPriorityColor(task.priority || 'medium')} flex items-center gap-1.5 w-fit text-xs`}>
                              {getPriorityIcon(task.priority || 'medium')}
                              {task.priority || 'Medium'}
                            </Badge>
                          </td>
                          <td className="p-3 min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 
                                daysRemaining && daysRemaining <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 
                                'text-foreground'}`}>
                                {task.due_date 
                                  ? new Date(task.due_date).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short'
                                    })
                                  : '—'}
                              </span>
                              {isOverdue && (
                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Assigned Campaigns */}
          <Card className="bg-card border border-border overflow-hidden">
            <CardHeader className="bg-accent border-b border-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">Assigned Campaigns</CardTitle>
                    <p className="text-sm text-muted-foreground">Campaigns assigned to you</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard/campaigns")}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-accent/50">
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-semibold text-foreground border-r border-border min-w-[200px]">
                      Campaign
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground border-r border-border min-w-[100px]">
                      Status
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground border-r border-border min-w-[100px]">
                      Budget
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-foreground min-w-[100px]">
                      Timeline
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignedCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-6">
                        <div className="flex flex-col items-center">
                          <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
                          <p className="text-foreground font-medium">No campaigns assigned</p>
                          <p className="text-muted-foreground text-sm mt-1">
                            You don't have any campaigns assigned to you
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    assignedCampaigns.map((campaign) => {
                      const startDate = campaign.start_date ? new Date(campaign.start_date) : null;
                      const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
                      
                      const formatBudget = () => {
                        if (campaign.budget_min && campaign.budget_max) {
                          return `₹${campaign.budget_min.toLocaleString()} - ₹${campaign.budget_max.toLocaleString()}`;
                        } else if (campaign.budget_min) {
                          return `From ₹${campaign.budget_min.toLocaleString()}`;
                        } else if (campaign.budget_max) {
                          return `Up to ₹${campaign.budget_max.toLocaleString()}`;
                        }
                        return 'Not set';
                      };

                      return (
                        <tr 
                          key={campaign.id} 
                          className="border-b border-border hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                        >
                          <td className="p-3 border-r border-border min-w-[200px]">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground truncate">{campaign.brand_name}</p>
                              {campaign.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {campaign.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 border-r border-border min-w-[100px]">
                            <Badge className={`${getCampaignStatusColor(campaign.status)} flex items-center gap-1.5 w-fit text-xs`}>
                              {getCampaignStatusIcon(campaign.status)}
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-3 border-r border-border min-w-[100px]">
                            <span className="text-sm font-medium text-foreground">
                              {formatBudget()}
                            </span>
                          </td>
                          <td className="p-3 min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-foreground">
                                {startDate 
                                  ? startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                  : '—'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Summary */}
        <div className="mt-6">
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Quick Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.overdueTasks > 0 ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        You have {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} that need attention.
                      </span>
                    ) : stats.tasksDueToday > 0 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        You have {stats.tasksDueToday} task{stats.tasksDueToday > 1 ? 's' : ''} due today.
                      </span>
                    ) : (
                      "You're all caught up with your assigned work."
                    )}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/tasks")}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    View All Tasks
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/campaigns")}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    View All Campaigns
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}