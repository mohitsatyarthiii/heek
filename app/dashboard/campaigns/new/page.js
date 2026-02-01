"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Save, Calendar, User, Users, DollarSign, Building } from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]);
  
  const [formData, setFormData] = useState({
    brand_name: "",
    description: "",
    budget_min: "",
    budget_max: "",
    status: "planning",
    start_date: "",
    end_date: "",
    assigned_creator: "none",
    assigned_team_member: "",
    target_niches: "",
    target_regions: "",
    required_platforms: "",
    status_notes: "",
    campaign_notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      await Promise.all([fetchUsers(), fetchCreators()]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setFetching(false);
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

      // Admin/manager can see all users
      if (['admin', 'manager'].includes(profile?.role)) {
        query = query.order('name');
      } else {
        // Associate can only see themselves
        query = query.eq('id', user.id);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      
      // Check if user has permission
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!['admin', 'manager'].includes(profile?.role)) {
        throw new Error("You don't have permission to create campaigns");
      }

      // Prepare campaign data
      const campaignData = {
        brand_name: formData.brand_name,
        description: formData.description,
        budget_min: formData.budget_min ? parseInt(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        assigned_creator: formData.assigned_creator === "none" ? null : formData.assigned_creator,
        assigned_team_member: formData.assigned_team_member || null,
        target_niches: formData.target_niches ? formData.target_niches.split(',').map(n => n.trim()).filter(n => n) : [],
        target_regions: formData.target_regions ? formData.target_regions.split(',').map(r => r.trim()).filter(r => r) : [],
        required_platforms: formData.required_platforms ? formData.required_platforms.split(',').map(p => p.trim()).filter(p => p) : [],
        status_notes: formData.status_notes,
        campaign_notes: formData.campaign_notes,
        created_by: user.id,
      };

      console.log("Creating campaign with data:", campaignData);

      const { error: insertError } = await supabase
        .from('campaigns')
        .insert([campaignData]);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      router.push("/dashboard/campaigns");
      router.refresh();
      
    } catch (err) {
      setError(err.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading campaign form...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Campaign</h1>
          <p className="text-gray-600">Set up a new brand campaign</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brand_name">
                  <span className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Brand Name *
                  </span>
                </Label>
                <Input
                  id="brand_name"
                  name="brand_name"
                  value={formData.brand_name}
                  onChange={handleChange}
                  placeholder="Enter brand name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_min">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Min Budget (₹)
                  </span>
                </Label>
                <Input
                  id="budget_min"
                  name="budget_min"
                  type="number"
                  value={formData.budget_min}
                  onChange={handleChange}
                  placeholder="e.g., 50000"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_max">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Max Budget (₹)
                  </span>
                </Label>
                <Input
                  id="budget_max"
                  name="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={handleChange}
                  placeholder="e.g., 200000"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <div className="flex items-center relative">
                  <Calendar className="absolute left-3 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <div className="flex items-center relative">
                  <Calendar className="absolute left-3 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_team_member">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assign to Team Member
                  </span>
                </Label>
                <Select 
                  value={formData.assigned_team_member} 
                  onValueChange={(value) => handleSelectChange('assigned_team_member', value)}
                  disabled={loading || users.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((teamMember) => (
                      <SelectItem key={teamMember.id} value={teamMember.id}>
                        {teamMember.name || teamMember.email} ({teamMember.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_creator">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assign to Creator (Optional)
                  </span>
                </Label>
                <Select 
                  value={formData.assigned_creator} 
                  onValueChange={(value) => handleSelectChange('assigned_creator', value)}
                  disabled={loading || creators.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select creator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {creators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_niches">Target Niches</Label>
                <Input
                  id="target_niches"
                  name="target_niches"
                  value={formData.target_niches}
                  onChange={handleChange}
                  placeholder="Fashion, Beauty, Lifestyle (comma separated)"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">Separate with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_regions">Target Regions</Label>
                <Input
                  id="target_regions"
                  name="target_regions"
                  value={formData.target_regions}
                  onChange={handleChange}
                  placeholder="India, US, UK (comma separated)"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">Separate with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="required_platforms">Required Platforms</Label>
                <Input
                  id="required_platforms"
                  name="required_platforms"
                  value={formData.required_platforms}
                  onChange={handleChange}
                  placeholder="Instagram, YouTube, TikTok (comma separated)"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">Separate with commas</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the campaign goals, objectives, and requirements..."
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_notes">Status Notes</Label>
              <Textarea
                id="status_notes"
                name="status_notes"
                value={formData.status_notes}
                onChange={handleChange}
                placeholder="Current status, progress updates, blockers..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_notes">Campaign Notes</Label>
              <Textarea
                id="campaign_notes"
                name="campaign_notes"
                value={formData.campaign_notes}
                onChange={handleChange}
                placeholder="Additional notes, requirements, special instructions..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/campaigns")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}