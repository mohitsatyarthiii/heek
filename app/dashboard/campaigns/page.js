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
  DollarSign,
  Building,
  AlertCircle,
  BarChart,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
} from "lucide-react";

export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, colors, isDark } = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("list");
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCampaigns(), fetchUsers(), fetchCreators(), checkPermissions()]);
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

  const fetchCampaigns = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          assigned_creator:creators!assigned_creator (id, name),
          assigned_team_member:profiles!assigned_team_member (id, name, email),
          created_by_user:profiles!created_by (id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      setCampaigns([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let query = supabase.from('profiles').select('id, email, name, role');

      if (profile?.role === 'associate') {
        query = query.eq('id', user.id);
      } else {
        query = query.order('name');
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
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

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error("Failed to fetch creators:", error);
      setCreators([]);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(search.toLowerCase()) ||
      campaign.status_notes?.toLowerCase().includes(search.toLowerCase()) ||
      campaign.assigned_team_member?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status) => {
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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'planning': return <Clock className="h-3 w-3" />;
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'paused': return <PauseCircle className="h-3 w-3" />;
      case 'completed': return <TrendingUp className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
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

  const formatBudget = (campaign) => {
    if (campaign.budget_min && campaign.budget_max) {
      return `₹${campaign.budget_min.toLocaleString()} - ₹${campaign.budget_max.toLocaleString()}`;
    } else if (campaign.budget_min) {
      return `From ₹${campaign.budget_min.toLocaleString()}`;
    } else if (campaign.budget_max) {
      return `Up to ₹${campaign.budget_max.toLocaleString()}`;
    }
    return 'Not set';
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Brand,Status,Budget,Dates,Assigned To,Description\n" +
      campaigns.map(c => 
        `"${c.brand_name || ''}","${c.status}","${formatBudget(c)}","${c.start_date ? new Date(c.start_date).toLocaleDateString() : ''} - ${c.end_date ? new Date(c.end_date).toLocaleDateString() : ''}","${c.assigned_team_member?.name || ''}","${c.description?.replace(/"/g, '""') || ''}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campaigns_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getProgressColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'planning': return 'bg-gray-400';
      case 'paused': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading campaigns database...</p>
        </div>
      </div>
    );
  }

  const statusCounts = {
    all: campaigns.length,
    planning: campaigns.filter(c => c.status === 'planning').length,
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    cancelled: campaigns.filter(c => c.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Top Bar - Spreadsheet Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Campaigns Manager</h1>
              <p className="text-sm text-muted-foreground">
                Active Campaigns: {statusCounts.active} • Total Budget: ₹{campaigns.reduce((sum, c) => sum + (c.budget_min || 0), 0).toLocaleString()}
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
                onClick={() => router.push("/dashboard/campaigns/new")}
                size="sm"
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Campaign
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
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.all}</p>
                </div>
                <BarChart className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-green-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.active}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-blue-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.completed}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-yellow-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Planning</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.planning}</p>
                </div>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-orange-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Paused</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.paused}</p>
                </div>
                <PauseCircle className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-red-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                  <p className="text-lg font-bold text-foreground">{statusCounts.cancelled}</p>
                </div>
                <XCircle className="h-5 w-5 text-red-500" />
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
                placeholder="Search campaigns: brand, description, assigned person..."
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
                <SelectTrigger className="w-[180px] border-border">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                  <SelectItem value="planning">Planning ({statusCounts.planning})</SelectItem>
                  <SelectItem value="active">Active ({statusCounts.active})</SelectItem>
                  <SelectItem value="paused">Paused ({statusCounts.paused})</SelectItem>
                  <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                  <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
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
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 sticky left-0 bg-accent z-10 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Campaign Details
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[120px]">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[150px]">
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Budget
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[150px]">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Timeline
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[180px]">
                    <Users className="h-4 w-4 inline mr-2" />
                    Team Assignment
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[100px]">
                    <Target className="h-4 w-4 inline mr-2" />
                    Progress
                  </TableHead>
                  <TableHead className="font-semibold text-foreground p-3 min-w-[100px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-lg font-medium text-foreground">No campaigns found</p>
                        <p className="text-muted-foreground mt-1 mb-4">
                          {search || statusFilter !== 'all' 
                            ? "Try changing your search or filter criteria" 
                            : "Start by creating your first campaign"}
                        </p>
                        {canCreate && !search && statusFilter === 'all' && (
                          <Button
                            onClick={() => router.push("/dashboard/campaigns/new")}
                            className="bg-primary text-primary-foreground hover:opacity-90"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create First Campaign
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCampaigns.map((campaign) => {
                    const startDate = campaign.start_date ? new Date(campaign.start_date) : null;
                    const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
                    
                    // Calculate progress based on dates
                    let progress = 0;
                    if (campaign.status === 'completed') {
                      progress = 100;
                    } else if (campaign.status === 'cancelled') {
                      progress = 0;
                    } else if (startDate && endDate) {
                      const now = new Date();
                      const total = endDate.getTime() - startDate.getTime();
                      const elapsed = now.getTime() - startDate.getTime();
                      progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
                    }

                    return (
                      <TableRow 
                        key={campaign.id} 
                        className="border-b border-border hover:bg-accent/50 transition-colors group"
                      >
                        <TableCell className="border-r border-border p-3 sticky left-0 bg-card min-w-[220px]">
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-foreground truncate">{campaign.brand_name}</p>
                                {campaign.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {campaign.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">ID: {campaign.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[120px]">
                          <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1.5 w-fit`}>
                            {getStatusIcon(campaign.status)}
                            {getStatusLabel(campaign.status)}
                          </Badge>
                          {campaign.status_notes && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1" title={campaign.status_notes}>
                              {campaign.status_notes}
                            </p>
                          )}
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[150px]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-bold text-foreground">
                                {formatBudget(campaign)}
                              </span>
                            </div>
                            {campaign.actual_spend && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Spent: </span>
                                <span className="font-medium text-foreground">
                                  ₹{campaign.actual_spend.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[150px]">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="text-sm">
                                {startDate ? (
                                  <div>
                                    <div className="font-medium text-foreground">
                                      {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                      to {endDate ? endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ongoing'}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No dates set</span>
                                )}
                              </div>
                            </div>
                            {startDate && endDate && (
                              <div className="text-xs text-muted-foreground">
                                {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[180px]">
                          <div className="space-y-2">
                            {campaign.assigned_team_member ? (
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {campaign.assigned_team_member.name || campaign.assigned_team_member.email}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {campaign.assigned_team_member.email}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span className="text-sm">Unassigned</span>
                              </div>
                            )}
                            
                            {campaign.assigned_creator && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                  <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-xs font-medium text-foreground truncate">
                                  {campaign.assigned_creator.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="border-r border-border p-3 min-w-[100px]">
                          <div className="space-y-2">
                            <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full ${getProgressColor(campaign.status)}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-foreground">
                                {progress.toFixed(0)}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {campaign.status}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="p-3 min-w-[100px]">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/campaigns/${campaign.id}`);
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
                                    router.push(`/dashboard/campaigns/edit/${campaign.id}`);
                                  }}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {['planning', 'paused'].includes(campaign.status) && (
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
          {paginatedCampaigns.length > 0 && (
            <div className="border-t border-border px-4 py-3 bg-accent">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCampaigns.length)}</span> of{" "}
                    <span className="font-medium text-foreground">{filteredCampaigns.length}</span> records
                  </p>
                  <select 
                    className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setCurrentPage(1);
                    }}
                  >
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
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
                  <p className="text-sm text-muted-foreground">Avg. Campaign Duration</p>
                  <p className="text-xl font-bold text-foreground">45 days</p>
                </div>
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget Allocated</p>
                  <p className="text-xl font-bold text-foreground">
                    ₹{campaigns.reduce((sum, c) => sum + (c.budget_min || 0), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Active Creators</p>
                  <p className="text-xl font-bold text-foreground">
                    {[...new Set(campaigns.filter(c => c.assigned_creator).map(c => c.assigned_creator?.id))].length}
                  </p>
                </div>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-bold text-foreground">
                    {campaigns.length > 0 ? 
                      `${Math.round((campaigns.filter(c => c.status === 'completed').length / campaigns.length) * 100)}%` : 
                      '0%'}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}