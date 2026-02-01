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
  MapPin,
  Tag,
  Smartphone,
  FileText,
  AlertCircle,
  BarChart
} from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCampaignDetails();
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

  const fetchCampaignDetails = async () => {
    const supabase = createClient();
    
    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          *,
          assigned_creator:creators!assigned_creator (id, name, email, primary_category),
          assigned_team_member:profiles!assigned_team_member (id, name, email, role),
          created_by_user:profiles!created_by (id, name, email)
        `)
        .eq('id', params.id)
        .single();

      if (campaignError) throw campaignError;

      if (campaignData) {
        setCampaign(campaignData);
        
        // Fetch linked tasks
        const { data: campaignTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('campaign_id', params.id)
          .order('created_at', { ascending: false });

        setTasks(campaignTasks || []);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Campaign not found</h3>
        <p className="text-gray-500 mt-2">The campaign you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/campaigns")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/campaigns")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.brand_name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={`${getStatusColor(campaign.status)} capitalize`}>
                {getStatusLabel(campaign.status)}
              </Badge>
              <span className="text-sm text-gray-500">
                Created {new Date(campaign.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        {canEdit && (
          <Button variant="outline" onClick={() => router.push(`/dashboard/campaigns/edit/${campaign.id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Campaign
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campaign Info Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-2">Description</h3>
                  {campaign.description ? (
                    <p className="text-gray-700 whitespace-pre-line">{campaign.description}</p>
                  ) : (
                    <p className="text-gray-400 italic">No description provided</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Budget Range</p>
                        <p className="font-medium">{formatBudget(campaign)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Campaign Dates</p>
                        <p className="font-medium">
                          {campaign.start_date ? (
                            <>
                              {new Date(campaign.start_date).toLocaleDateString()} - 
                              {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing'}
                            </>
                          ) : (
                            'No dates set'
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Created By</p>
                        <p className="font-medium">
                          {campaign.created_by_user?.name || campaign.created_by_user?.email || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Assigned Team Member</p>
                        <p className="font-medium">
                          {campaign.assigned_team_member 
                            ? (campaign.assigned_team_member.name || campaign.assigned_team_member.email)
                            : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Assigned Creator</p>
                        <p className="font-medium">
                          {campaign.assigned_creator 
                            ? campaign.assigned_creator.name 
                            : 'Not assigned'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Brand</p>
                        <p className="font-medium">{campaign.brand_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={`${getStatusColor(campaign.status)} mt-1`}>
                    {getStatusLabel(campaign.status)}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Linked Tasks</p>
                  <p className="font-medium text-2xl mt-1">{tasks.length}</p>
                  <div className="text-xs text-gray-500">
                    {tasks.filter(t => t.status === 'done').length} completed
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium mt-1">
                    {new Date(campaign.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium mt-1">
                    {new Date(campaign.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Target Niches */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4" />
                      Target Niches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaign.target_niches?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {campaign.target_niches.map((niche, index) => (
                          <Badge key={index} variant="outline">{niche}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No niches specified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Target Regions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      Target Regions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaign.target_regions?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {campaign.target_regions.map((region, index) => (
                          <Badge key={index} variant="secondary">{region}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No regions specified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Required Platforms */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Smartphone className="h-4 w-4" />
                      Required Platforms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaign.required_platforms?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {campaign.required_platforms.map((platform, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No platforms specified</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Linked Tasks</CardTitle>
              {canEdit && (
                <Button size="sm" onClick={() => router.push(`/dashboard/tasks/new?campaign_id=${campaign.id}`)}>
                  + Add Task
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No tasks linked</h3>
                  <p className="text-gray-500 mt-2">No tasks are linked to this campaign</p>
                  {canEdit && (
                    <Button 
                      onClick={() => router.push(`/dashboard/tasks/new?campaign_id=${campaign.id}`)}
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
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
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
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
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

        <TabsContent value="notes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Status Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.status_notes ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-line">{campaign.status_notes}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No status notes available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Campaign Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.campaign_notes ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-line">{campaign.campaign_notes}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No campaign notes available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}