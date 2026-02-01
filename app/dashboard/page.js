"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  PlusCircle, 
  UserPlus,
  BarChart,
  TrendingUp,
  Calendar,
  ArrowRight,
  FileText,
  Briefcase,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCreators: 0,
    openTasks: 0,
    tasksDueToday: 0,
    overdueTasks: 0,
    activeCampaigns: 0,
    myTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentCreators, setRecentCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('associate');

  useEffect(() => {
    fetchDashboardData();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserRole(profile.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      // Get user role to determine data access
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'associate';

      if (role === 'admin' || role === 'manager') {
        // Admin/Manager sees all data
        const { count: creatorsCount } = await supabase
          .from('creators')
          .select('*', { count: 'exact', head: true });

        const { data: allTasks } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        const { count: activeCampaigns } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const { data: recentCreatorsData } = await supabase
          .from('creators')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        const today = new Date().toISOString().split('T')[0];
        
        const openTasks = allTasks?.filter(task => 
          task.status === 'todo' || task.status === 'in_progress'
        ).length || 0;

        const tasksDueToday = allTasks?.filter(task => 
          task.due_date === today
        ).length || 0;

        const overdueTasks = allTasks?.filter(task => {
          if (!task.due_date) return false;
          return task.due_date < today && 
            (task.status === 'todo' || task.status === 'in_progress');
        }).length || 0;

        const { count: myTasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id);

        setStats({
          totalCreators: creatorsCount || 0,
          openTasks,
          tasksDueToday,
          overdueTasks,
          activeCampaigns: activeCampaigns || 0,
          myTasks: myTasksCount || 0,
        });

        setRecentTasks(allTasks || []);
        setRecentCreators(recentCreatorsData || []);
      } else {
        // Associate sees only their data
        const { count: myTasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id);

        const { data: myTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        const today = new Date().toISOString().split('T')[0];
        
        const myOpenTasks = myTasks?.filter(task => 
          task.status === 'todo' || task.status === 'in_progress'
        ).length || 0;

        const myTasksDueToday = myTasks?.filter(task => 
          task.due_date === today
        ).length || 0;

        const myOverdueTasks = myTasks?.filter(task => {
          if (!task.due_date) return false;
          return task.due_date < today && 
            (task.status === 'todo' || task.status === 'in_progress');
        }).length || 0;

        // Associates can see creator count
        const { count: creatorsCount } = await supabase
          .from('creators')
          .select('*', { count: 'exact', head: true });

        const { count: activeCampaigns } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        setStats({
          totalCreators: creatorsCount || 0,
          openTasks: myOpenTasks,
          tasksDueToday: myTasksDueToday,
          overdueTasks: myOverdueTasks,
          activeCampaigns: activeCampaigns || 0,
          myTasks: myTasksCount || 0,
        });

        setRecentTasks(myTasks || []);
        setRecentCreators([]); // Associates don't see recent creators
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statCards = [
    {
      title: "Total Creators",
      value: stats.totalCreators,
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      link: "/dashboard/creators"
    },
    {
      title: "Open Tasks",
      value: stats.openTasks,
      icon: CheckSquare,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      link: "/dashboard/tasks?status=todo,in_progress"
    },
    {
      title: "Due Today",
      value: stats.tasksDueToday,
      icon: Clock,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      link: "/dashboard/tasks?due=today"
    },
    {
      title: "Overdue",
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      link: "/dashboard/tasks?due=overdue"
    },
  ];

  if (userRole === 'admin' || userRole === 'manager') {
    statCards.push(
      {
        title: "Active Campaigns",
        value: stats.activeCampaigns,
        icon: BarChart,
        color: "bg-purple-500",
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        link: "/dashboard/campaigns?status=active"
      },
      {
        title: "My Tasks",
        value: stats.myTasks,
        icon: Briefcase,
        color: "bg-indigo-500",
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-700",
        link: "/dashboard/tasks?assigned=me"
      }
    );
  }

  const quickActions = [
    {
      title: "Add Creator",
      description: "Add a new creator to database",
      icon: UserPlus,
      color: "bg-blue-100 text-blue-600",
      link: "/dashboard/creators/new",
      roles: ['admin', 'manager']
    },
    {
      title: "Create Task",
      description: "Assign a new task to team",
      icon: PlusCircle,
      color: "bg-green-100 text-green-600",
      link: "/dashboard/tasks/new",
      roles: ['admin', 'manager']
    },
    {
      title: "View Creators",
      description: "Browse all creators",
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      link: "/dashboard/creators",
      roles: ['admin', 'manager', 'associate']
    },
    {
      title: "View Tasks",
      description: "See all assigned tasks",
      icon: CheckSquare,
      color: "bg-amber-100 text-amber-600",
      link: "/dashboard/tasks",
      roles: ['admin', 'manager', 'associate']
    },
    {
      title: "Create Campaign",
      description: "Start a new campaign",
      icon: TrendingUp,
      color: "bg-red-100 text-red-600",
      link: "/dashboard/campaigns/new",
      roles: ['admin', 'manager']
    },
    {
      title: "View Campaigns",
      description: "Monitor all campaigns",
      icon: BarChart,
      color: "bg-indigo-100 text-indigo-600",
      link: "/dashboard/campaigns",
      roles: ['admin', 'manager', 'associate']
    },
  ];

  const filteredQuickActions = quickActions.filter(action => 
    action.roles.includes(userRole)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's what's happening with your creators and tasks.
            <span className="ml-2 text-sm font-medium px-2 py-1 bg-gray-100 rounded">
              Role: <span className="capitalize">{userRole}</span>
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchDashboardData()}
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {(userRole === 'admin' || userRole === 'manager') && (
            <Button 
              size="sm"
              onClick={() => router.push("/dashboard/tasks/new")}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Quick Task
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(stat.link)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-4">
                <span>View details</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common actions to manage your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start justify-start hover:bg-gray-50"
                    onClick={() => router.push(action.link)}
                  >
                    <div className={`p-2 rounded-lg ${action.color} mb-3`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{action.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>
                  Your most recent assigned tasks
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/dashboard/tasks")}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No tasks found</p>
                  {(userRole === 'admin' || userRole === 'manager') && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push("/dashboard/tasks/new")}
                    >
                      Create Your First Task
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={`${getStatusColor(task.status)} capitalize text-xs`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <p className="font-medium mt-2">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Creators & Summary */}
        <div className="space-y-6">
          {/* Recent Creators (Only for Admin/Manager) */}
          {(userRole === 'admin' || userRole === 'manager') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Creators</CardTitle>
                  <CardDescription>
                    Newly added creators
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push("/dashboard/creators")}
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentCreators.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No creators found</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push("/dashboard/creators/new")}
                    >
                      Add Your First Creator
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentCreators.map((creator) => (
                      <div 
                        key={creator.id} 
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/creators/${creator.id}`)}
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{creator.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {creator.primary_category && (
                              <span className="text-xs text-gray-500">
                                {creator.primary_category}
                              </span>
                            )}
                            {creator.country && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-500">
                                  {creator.country}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Current workspace overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">User Role</span>
                <Badge className="capitalize">{userRole}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Creators</span>
                <span className="font-medium">{stats.totalCreators}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Your Tasks</span>
                <span className="font-medium">{stats.myTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Campaigns</span>
                <span className="font-medium">{stats.activeCampaigns}</span>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Last Updated</p>
                <p className="text-sm font-medium">
                  {new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help/Support Card */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Need Help?</h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Check our documentation or contact support for assistance with the platform.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
                      Documentation
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}