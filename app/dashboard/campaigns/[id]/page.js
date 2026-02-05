"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Users,
  DollarSign,
  Building,
  FileText,
  AlertCircle,
  BarChart,
  Video,
  Package,
  CreditCard,
  TrendingUp,
  Percent,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileSpreadsheet,
  Smartphone,
  Tag,
  MapPin,
  PauseCircle,
} from "lucide-react";

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [execution, setExecution] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchExecutionDetails();
      checkPermissions();
    }
  }, [params.id]);

  const checkPermissions = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCanEdit(['admin', 'manager'].includes(profile.role));
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  const fetchExecutionDetails = async () => {
    const supabase = createClient();
    
    try {
      const { data: executionData, error: executionError } = await supabase
        .from('campaigns')
        .select(`
          *,
          assigned_creator:creators!assigned_creator (id, name, email),
          assigned_team_member:profiles!assigned_team_member (id, name, email, role),
          created_by_user:profiles!created_by (id, name, email)
        `)
        .eq('id', params.id)
        .single();

      if (executionError) throw executionError;

      if (executionData) {
        setExecution(executionData);
        
        // Fetch linked tasks
        const { data: executionTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('campaign_id', params.id)
          .order('created_at', { ascending: false });

        setTasks(executionTasks || []);
      }
    } catch (error) {
      console.error("Error fetching execution:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'planning': return 'Planning';
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getVideoStatusColor = (status) => {
    switch(status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'live': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getVideoStatusIcon = (status) => {
    switch(status) {
      case 'draft': return <FileText className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'live': return <Video className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const getVideoStatusLabel = (status) => {
    switch(status) {
      case 'draft': return 'Draft';
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'live': return 'Live';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProfitMargin = (commercials, creatorPrice) => {
    if (!commercials || !creatorPrice) return "0%";
    const margin = ((commercials - creatorPrice) / commercials) * 100;
    return `${margin.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading execution details...</p>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Execution not found</h3>
        <p className="text-muted-foreground mt-2">The execution you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/campaigns")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Executions
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard/campaigns")}
              className="border-border text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Executions
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Execution Details</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={`${getStatusColor(execution.status)} capitalize`}>
                  {getStatusLabel(execution.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {new Date(execution.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                const csv = [
                  ["Field", "Value"],
                  ["Creator Name", execution.creator_name || ""],
                  ["Brand Name", execution.brand_name || ""],
                  ["Deliverables", execution.deliverables || ""],
                  ["Commercials Locked", formatCurrency(execution.commercials_locked)],
                  ["Creator's Price", formatCurrency(execution.creators_price)],
                  ["Profit", formatCurrency(execution.profit)],
                  ["Commission", execution.commission || ""],
                  ["Person", execution.person || ""],
                  ["Video Status", execution.video_status || ""],
                  ["Status", execution.status || ""],
                  ["Description", execution.description || ""],
                  ["Start Date", execution.start_date || ""],
                  ["End Date", execution.end_date || ""],
                  ["Required Platforms", execution.required_platforms?.join(", ") || ""],
                  ["Status Notes", execution.status_notes || ""],
                  ["Execution Notes", execution.campaign_notes || ""],
                ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

                const uri = encodeURI("data:text/csv;charset=utf-8," + csv);
                const a = document.createElement("a");
                a.href = uri;
                a.download = `execution_${execution.brand_name || "details"}_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="border-border text-foreground hover:bg-accent"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            {canEdit && (
              <Button 
                onClick={() => router.push(`/dashboard/campaigns/edit/${execution.id}`)}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Execution
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="h-4 w-4 mr-2" />
              Financials
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart className="h-4 w-4 mr-2" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Target className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info Card */}
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Execution Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Creator & Brand */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                        <User className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Creator Name</p>
                          <p className="font-medium text-foreground">
                            {execution.creator_name || "—"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                        <Building className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Brand Name</p>
                          <p className="font-medium text-foreground">
                            {execution.brand_name || "—"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Person</p>
                          <p className="font-medium text-foreground">
                            {execution.person || "Unassigned"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dates & Status */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Execution Dates</p>
                          <p className="font-medium text-foreground">
                            {execution.start_date ? (
                              <>
                                {new Date(execution.start_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short'
                                })} →{' '}
                                {execution.end_date ? 
                                  new Date(execution.end_date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short'
                                  }) : 'Ongoing'}
                              </>
                            ) : (
                              'No dates set'
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                        <div className={`p-2 rounded-full ${getStatusColor(execution.status)}`}>
                          {execution.status === 'paused' ? (
                            <PauseCircle className="h-4 w-4" />
                          ) : execution.status === 'active' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-medium text-foreground">
                            {getStatusLabel(execution.status)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Video className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Video Status</p>
                          <Badge className={`${getVideoStatusColor(execution.video_status)} mt-1`}>
                            <div className="flex items-center gap-1">
                              {getVideoStatusIcon(execution.video_status)}
                              {getVideoStatusLabel(execution.video_status)}
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Deliverables
                    </h3>
                    {execution.deliverables ? (
                      <p className="text-foreground whitespace-pre-line p-3 bg-accent rounded-lg">
                        {execution.deliverables}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic p-3 bg-accent rounded-lg">
                        No deliverables specified
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {execution.description && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Description
                      </h3>
                      <p className="text-foreground whitespace-pre-line p-3 bg-accent rounded-lg">
                        {execution.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Linked Tasks</p>
                      <p className="font-medium text-2xl text-foreground mt-1">{tasks.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {tasks.filter(t => t.status === 'done').length} completed
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-sm text-muted-foreground">Profit Margin</p>
                    <p className="font-medium text-xl text-green-600 mt-1">
                      {calculateProfitMargin(execution.commercials_locked, execution.creators_price)}
                    </p>
                    <p className="text-xs text-muted-foreground">From commercials</p>
                  </div>
                  
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium text-foreground mt-1">
                      {new Date(execution.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium text-foreground mt-1">
                      {new Date(execution.updated_at || execution.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FINANCIAL TAB */}
          <TabsContent value="financial">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Commercials Locked */}
                  <Card className="bg-accent border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <CreditCard className="h-8 w-8 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">Commercials</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Commercials Locked</p>
                      <p className="font-bold text-2xl text-foreground mt-2">
                        {formatCurrency(execution.commercials_locked)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Total contract value</p>
                    </CardContent>
                  </Card>

                  {/* Creator's Price */}
                  <Card className="bg-accent border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <DollarSign className="h-8 w-8 text-orange-600" />
                        <Badge className="bg-orange-100 text-orange-800">Payment</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Creator's Price</p>
                      <p className="font-bold text-2xl text-foreground mt-2">
                        {formatCurrency(execution.creators_price)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Paid to creator</p>
                    </CardContent>
                  </Card>

                  {/* Profit */}
                  <Card className="bg-accent border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                        <Badge className="bg-blue-100 text-blue-800">Profit</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Profit</p>
                      <p className="font-bold text-2xl text-foreground mt-2">
                        {formatCurrency(execution.profit)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {calculateProfitMargin(execution.commercials_locked, execution.creators_price)} margin
                      </p>
                    </CardContent>
                  </Card>

                  {/* Commission */}
                  <Card className="bg-accent border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Percent className="h-8 w-8 text-purple-600" />
                        <Badge className="bg-purple-100 text-purple-800">Commission</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="font-bold text-2xl text-foreground mt-2">
                        {execution.commission || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Agent/Manager commission</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Summary */}
                <div className="mt-6 p-6 bg-accent rounded-lg border border-border">
                  <h3 className="font-medium text-foreground mb-4">Financial Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Commercials Locked</p>
                      <p className="font-medium text-foreground">{formatCurrency(execution.commercials_locked)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">− Creator's Price</p>
                      <p className="font-medium text-foreground">{formatCurrency(execution.creators_price)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">= Profit</p>
                      <p className="font-medium text-green-600">{formatCurrency(execution.profit)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TASKS TAB */}
          <TabsContent value="tasks">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  Linked Tasks
                </CardTitle>
                {canEdit && (
                  <Button 
                    size="sm" 
                    onClick={() => router.push(`/dashboard/tasks/new?campaign_id=${execution.id}`)}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    + Add Task
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No tasks linked</h3>
                    <p className="text-muted-foreground mt-2">No tasks are linked to this execution</p>
                    {canEdit && (
                      <Button 
                        onClick={() => router.push(`/dashboard/tasks/new?campaign_id=${execution.id}`)}
                        className="mt-4"
                      >
                        + Add First Task
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant={
                                task.status === 'done' ? 'default' :
                                task.status === 'in_progress' ? 'secondary' :
                                'outline'
                              }>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              {task.due_date && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-foreground">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTES TAB */}
          <TabsContent value="notes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Status Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {execution.status_notes ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line text-foreground p-3 bg-accent rounded-lg">
                        {execution.status_notes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic p-3 bg-accent rounded-lg">
                      No status notes available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    Execution Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {execution.campaign_notes ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line text-foreground p-3 bg-accent rounded-lg">
                        {execution.campaign_notes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic p-3 bg-accent rounded-lg">
                      No execution notes available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* DETAILS TAB */}
          <TabsContent value="details">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Execution Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Required Platforms */}
                  <Card className="bg-accent border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                        <Smartphone className="h-4 w-4 text-blue-500" />
                        Required Platforms
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {execution.required_platforms?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {execution.required_platforms.map((platform, index) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No platforms specified</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Assigned Creator */}
                  <Card className="bg-accent border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                        <User className="h-4 w-4 text-green-500" />
                        Assigned Creator
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {execution.assigned_creator ? (
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">{execution.assigned_creator.name}</p>
                          <p className="text-sm text-muted-foreground">{execution.assigned_creator.email}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No creator assigned</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Assigned Team Member */}
                  <Card className="bg-accent border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                        <Users className="h-4 w-4 text-orange-500" />
                        Assigned Team Member
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {execution.assigned_team_member ? (
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">
                            {execution.assigned_team_member.name || execution.assigned_team_member.email}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">{execution.assigned_team_member.role}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No team member assigned</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Created By */}
                  <Card className="bg-accent border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                        <User className="h-4 w-4 text-purple-500" />
                        Created By
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {execution.created_by_user ? (
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">
                            {execution.created_by_user.name || execution.created_by_user.email}
                          </p>
                          <p className="text-sm text-muted-foreground">{execution.created_by_user.email}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Unknown</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Execution ID */}
                  <Card className="bg-accent border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                        <Tag className="h-4 w-4 text-gray-500" />
                        Execution ID
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs text-muted-foreground bg-background p-2 rounded block break-all">
                        {execution.id}
                      </code>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}