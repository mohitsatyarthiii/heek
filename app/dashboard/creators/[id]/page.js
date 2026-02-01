"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Globe,
  User,
  Calendar,
  AlertCircle,
  Star,
  Tag,
  Briefcase,
  ExternalLink,
  BarChart,
  DollarSign,
  MessageSquare
} from "lucide-react";

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [creator, setCreator] = useState(null);
  const [platformProfiles, setPlatformProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCreatorDetails();
    }
  }, [params.id]);

  const fetchCreatorDetails = async () => {
    const supabase = createClient();
    
    try {
      // Fetch creator
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('id', params.id)
        .single();

      if (creatorError) throw creatorError;

      // Fetch platform profiles
      const { data: platforms } = await supabase
        .from('creator_platform_profiles')
        .select('*')
        .eq('creator_id', params.id)
        .order('platform', { ascending: true });

      // Fetch linked tasks
      const { data: creatorTasks } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles:assigned_to (
            full_name,
            email
          )
        `)
        .eq('linked_creator', params.id)
        .order('due_date', { ascending: true });

      // Fetch linked campaigns (if campaigns table exists)
      const { data: creatorCampaigns } = await supabase
        .from('campaigns')
        .select('*')
        .contains('creator_ids', [params.id])
        .order('created_at', { ascending: false });

      setCreator(creatorData);
      setPlatformProfiles(platforms || []);
      setTasks(creatorTasks || []);
      setCampaigns(creatorCampaigns || []);
    } catch (error) {
      console.error("Error fetching creator:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlatform = () => {
    // Open modal or navigate to platform add page
    console.log("Add platform clicked");
  };

  const handleEditCreator = () => {
    router.push(`/dashboard/creators/edit/${creator.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Creator not found</h3>
        <p className="text-gray-500 mt-2">The creator you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/creators")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Creators
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/creators")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{creator.name}</h1>
            <p className="text-gray-600">Creator profile details</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditCreator}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Creator
          </Button>
          <Button onClick={handleAddPlatform}>
            + Add Platform
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms ({platformProfiles.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{creator.email || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{creator.phone || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Country</p>
                        <p className="font-medium">{creator.country || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Primary Category</p>
                        <p className="font-medium">{creator.primary_category || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Brand Friendly Score</p>
                        <div className="flex items-center gap-1">
                          {creator.brand_friendly_score ? (
                            <>
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < creator.brand_friendly_score ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="ml-2 font-medium">{creator.brand_friendly_score}/5</span>
                            </>
                          ) : (
                            <span className="font-medium text-gray-400">Not rated</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Management Type</p>
                        <p className="font-medium">{creator.management_type || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Primary Market</p>
                        <p className="font-medium">{creator.primary_market || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Content Language</p>
                        <p className="font-medium">{creator.content_language || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Audience Geo Split</p>
                    <p className="font-medium">{creator.audience_geo_split || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Primary Market</p>
                    <p className="font-medium">{creator.primary_market || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories & Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Categories & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Secondary Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {creator.secondary_categories?.length > 0 ? (
                      creator.secondary_categories.map((cat, i) => (
                        <Badge key={i} variant="outline">{cat}</Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Sub Niches</p>
                  <div className="flex flex-wrap gap-2">
                    {creator.sub_niches?.length > 0 ? (
                      creator.sub_niches.map((niche, i) => (
                        <Badge key={i} variant="secondary">{niche}</Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Typical Deliverables</p>
                  <div className="flex flex-wrap gap-2">
                    {creator.typical_deliverables?.length > 0 ? (
                      creator.typical_deliverables.map((deliverable, i) => (
                        <Badge key={i} className="bg-green-100 text-green-800">
                          {deliverable}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Created</p>
                  <p className="font-medium">
                    {new Date(creator.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Platform Profiles</CardTitle>
              <Button size="sm" onClick={handleAddPlatform}>
                + Add Platform
              </Button>
            </CardHeader>
            <CardContent>
              {platformProfiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No platform profiles</h3>
                  <p className="text-gray-500 mt-2">Add platforms to see them here</p>
                  <Button onClick={handleAddPlatform} className="mt-4">
                    + Add First Platform
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {platformProfiles.map((platform) => (
                    <Card key={platform.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Badge className="capitalize">{platform.platform}</Badge>
                              {platform.is_primary && (
                                <Badge variant="default" className="bg-blue-100 text-blue-800">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            
                            <div>
                              <p className="font-medium text-lg">{platform.handle}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {platform.country}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {platform.niche}
                                </span>
                              </div>
                            </div>
                            
                            {platform.profile_url && (
                              <a 
                                href={platform.profile_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Visit Profile
                              </a>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              Remove
                            </Button>
                          </div>
                        </div>
                        
                        {/* Platform Stats (if available) */}
                        {(platform.followers || platform.engagement_rate) && (
                          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                            {platform.followers && (
                              <div>
                                <p className="text-sm text-gray-500">Followers</p>
                                <p className="font-medium text-lg">
                                  {platform.followers.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {platform.engagement_rate && (
                              <div>
                                <p className="text-sm text-gray-500">Engagement Rate</p>
                                <p className="font-medium text-lg">
                                  {platform.engagement_rate}%
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Linked Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No tasks linked</h3>
                  <p className="text-gray-500 mt-2">No tasks are linked to this creator</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow 
                          key={task.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                        >
                          <TableCell className="font-medium">
                            <div>
                              <p>{task.title}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {task.description?.substring(0, 60)}...
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              task.status === 'done' ? 'default' :
                              task.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {task.due_date ? (
                                <span className={new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-600' : ''}>
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              ) : (
                                'No date'
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.profiles?.full_name || task.profiles?.email || 'Unassigned'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/tasks/${task.id}`);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Linked Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No campaigns linked</h3>
                  <p className="text-gray-500 mt-2">This creator is not part of any campaigns</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="capitalize">
                                {campaign.status || 'active'}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                            <p className="text-gray-600">{campaign.description}</p>
                            
                            {campaign.budget && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">Budget: ₹{campaign.budget.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes & Past Rate Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-3">Past Rate Notes</h3>
                  {creator.past_rate_notes ? (
                    <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-line">
                      {creator.past_rate_notes}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No past rate notes available</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-lg mb-3">Additional Notes</h3>
                  <p className="text-gray-500 italic">
                    No additional notes. Add notes in the edit section.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}