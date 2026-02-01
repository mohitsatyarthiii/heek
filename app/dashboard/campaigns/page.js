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
  DollarSign,
  Building,
  AlertCircle,
  BarChart
} from "lucide-react";

export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);

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

      if (error) {
        console.error("Error fetching campaigns:", error);
        throw error;
      }

      if (data) {
        setCampaigns(data);
        console.log("Campaigns fetched:", data);
      }
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

      // If user is associate, only show their own profile
      if (profile?.role === 'associate') {
        query = query.eq('id', user.id);
      } else {
        // Admin/manager can see all users
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
      campaign.status_notes?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Loading campaigns...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-600">Manage brand campaigns and collaborations</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="text-sm">
              Total: {campaigns.length}
            </Badge>
            <Badge variant="outline" className="text-sm bg-green-50">
              Active: {campaigns.filter(c => c.status === 'active').length}
            </Badge>
            <Badge variant="outline" className="text-sm bg-blue-50">
              Completed: {campaigns.filter(c => c.status === 'completed').length}
            </Badge>
          </div>
        </div>
        
        {canCreate && (
          <Button onClick={() => router.push("/dashboard/campaigns/new")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns by brand name or description..."
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
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                <TableHead>Brand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <BarChart className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                      <p className="text-gray-500 mb-4">
                        {search || statusFilter !== 'all' 
                          ? "Try changing your filters" 
                          : canCreate 
                            ? "Create your first campaign to get started"
                            : "No campaigns have been created yet"}
                      </p>
                      {canCreate && !search && statusFilter === 'all' && (
                        <Button onClick={() => router.push("/dashboard/campaigns/new")}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create First Campaign
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const startDate = campaign.start_date ? new Date(campaign.start_date) : null;
                  const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
                  
                  return (
                    <TableRow 
                      key={campaign.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <p className="font-semibold">{campaign.brand_name}</p>
                          </div>
                          {campaign.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {campaign.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(campaign.status)} capitalize`}>
                          {getStatusLabel(campaign.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">
                            {formatBudget(campaign)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="text-sm">
                            {startDate ? (
                              <div>
                                <div>{startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                <div className="text-gray-500">to {endDate ? endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ongoing'}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No dates set</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {campaign.assigned_team_member ? (
                            <>
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <User className="h-3 w-3 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {campaign.assigned_team_member.name || campaign.assigned_team_member.email}
                                </p>
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">Unassigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/campaigns/${campaign.id}`);
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