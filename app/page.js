"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, 
  CheckSquare, 
  Clock, 
  AlertCircle,
  FileText,
  TrendingUp,
  UserPlus,
  PlusCircle 
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCreators: 0,
    openTasks: 0,
    tasksDueToday: 0,
    overdueTasks: 0,
    myTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    const supabase = createClient();
    
    try {
      // Get user's role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const userRole = profile?.role || 'associate';

      if (userRole === 'admin' || userRole === 'manager') {
        // Admin/Manager sees all data
        const { count: creatorsCount } = await supabase
          .from('creators')
          .select('*', { count: 'exact', head: true });

        const { data: allTasks } = await supabase
          .from('tasks')
          .select('status, due_date');

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
          myTasks: myTasksCount || 0,
        });
      } else {
        // Associate sees only their tasks
        const { count: myTasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id);

        const { data: myTasks } = await supabase
          .from('tasks')
          .select('status, due_date')
          .eq('assigned_to', user.id);

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

        setStats({
          totalCreators: creatorsCount || 0,
          openTasks: myOpenTasks,
          tasksDueToday: myTasksDueToday,
          overdueTasks: myOverdueTasks,
          myTasks: myTasksCount || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getQuickActions = () => {
    const { data: profile } = useAuth();
    const role = profile?.role || 'associate';

    const baseActions = [
      {
        label: "View Creators",
        href: "/dashboard/creators",
        icon: Users,
        color: "text-blue-600 bg-blue-50",
      },
      {
        label: "My Tasks",
        href: "/dashboard/tasks",
        icon: CheckSquare,
        color: "text-green-600 bg-green-50",
      },
    ];

    if (role === 'admin' || role === 'manager') {
      baseActions.push(
        {
          label: "Add Creator",
          href: "/dashboard/creators/new",
          icon: UserPlus,
          color: "text-purple-600 bg-purple-50",
        },
        {
          label: "Create Task",
          href: "/dashboard/tasks/new",
          icon: PlusCircle,
          color: "text-orange-600 bg-orange-50",
        }
      );
    }

    if (role === 'admin') {
      baseActions.push({
        label: "Team Management",
        href: "/dashboard/settings",
        icon: TrendingUp,
        color: "text-red-600 bg-red-50",
      });
    }

    return baseActions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const quickActions = getQuickActions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <div className="p-2 rounded-full bg-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreators}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            <div className="p-2 rounded-full bg-green-100">
              <CheckSquare className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <div className="p-2 rounded-full bg-yellow-100">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasksDueToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <div className="p-2 rounded-full bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button 
                    variant="outline" 
                    className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-gray-50"
                  >
                    <div className={`p-3 rounded-full ${action.color}`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-gray-600">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Activity will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}