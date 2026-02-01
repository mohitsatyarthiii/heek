"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckSquare, Clock, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCreators: 0,
    openTasks: 0,
    tasksDueToday: 0,
    overdueTasks: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const supabase = createClient();
    
    // Get total creators count
    const { count: creatorsCount } = await supabase
      .from('creators')
      .select('*', { count: 'exact', head: true });

    // Get tasks count by status
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, due_date');

    const today = new Date().toISOString().split('T')[0];
    
    const openTasks = tasks?.filter(task => 
      task.status === 'todo' || task.status === 'in_progress'
    ).length || 0;

    const tasksDueToday = tasks?.filter(task => 
      task.due_date === today
    ).length || 0;

    const overdueTasks = tasks?.filter(task => {
      if (!task.due_date) return false;
      return task.due_date < today && 
        (task.status === 'todo' || task.status === 'in_progress');
    }).length || 0;

    setStats({
      totalCreators: creatorsCount || 0,
      openTasks,
      tasksDueToday,
      overdueTasks,
    });
  };

  const statCards = [
    {
      title: "Total Creators",
      value: stats.totalCreators,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Open Tasks",
      value: stats.openTasks,
      icon: CheckSquare,
      color: "bg-green-500",
    },
    {
      title: "Due Today",
      value: stats.tasksDueToday,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "Overdue",
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: "bg-red-500",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              ➕ Add New Creator
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              📋 Create New Task
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
              👥 View All Creators
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-2 border rounded">
                <p className="text-sm">No recent activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}