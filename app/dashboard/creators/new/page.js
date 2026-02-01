"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";

export default function NewCreatorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    primary_market: "",
    primary_category: "",
    secondary_categories: "",
    sub_niches: "",
    typical_deliverables: "",
    past_rate_notes: "",
    brand_friendly_score: "",
    management_type: "",
    content_language: "",
    audience_geo_split: "",
  });

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
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error("Please login first");
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found. Contact admin to setup your account.");
    }

    // Check permission
    const userRole = profile.role;
    if (!['admin', 'manager'].includes(userRole)) {
      throw new Error(`Only admin and manager can create creators. Your role: ${userRole}`);
    }

    // Prepare data
    const creatorData = {
      name: formData.name || null,
      email: formData.email || null,
      phone: formData.phone || null,
      country: formData.country || null,
      primary_market: formData.primary_market || null,
      primary_category: formData.primary_category || null,
      secondary_categories: formData.secondary_categories
        ? formData.secondary_categories.split(',').map(c => c.trim()).filter(c => c)
        : [],
      sub_niches: formData.sub_niches
        ? formData.sub_niches.split(',').map(n => n.trim()).filter(n => n)
        : [],
      typical_deliverables: formData.typical_deliverables
        ? formData.typical_deliverables.split(',').map(d => d.trim()).filter(d => d)
        : [],
      past_rate_notes: formData.past_rate_notes || null,
      brand_friendly_score: formData.brand_friendly_score 
        ? parseInt(formData.brand_friendly_score) 
        : null,
      management_type: formData.management_type || null,
      content_language: formData.content_language || null,
      audience_geo_split: formData.audience_geo_split || null,
    };

    // Insert creator
    const { error: insertError } = await supabase
      .from('creators')
      .insert([creatorData]);

    if (insertError) {
      // More specific error messages
      if (insertError.code === '42501') {
        throw new Error("Permission denied. Check your RLS policies in Supabase.");
      } else if (insertError.code === '23505') {
        throw new Error("Creator with this email already exists.");
      } else {
        throw new Error(`Database error: ${insertError.message}`);
      }
    }

    // Success
    router.push("/dashboard/creators");
    router.refresh();
    
  } catch (err) {
    setError(err.message);
    console.error("Create creator error:", err);
  } finally {
    setLoading(false);
  }
};

  // Options for dropdowns
  const categories = [
    "Fashion", "Beauty", "Lifestyle", "Travel", "Food",
    "Fitness", "Technology", "Gaming", "Entertainment", "Education",
    "Business", "Finance", "Parenting", "Health", "Sports"
  ];

  const countries = [
    "India", "USA", "UK", "Canada", "Australia",
    "Germany", "France", "Japan", "South Korea", "Singapore",
    "UAE", "Brazil", "Mexico", "Spain", "Italy"
  ];

  const managementTypes = [
    "Self-Managed", "Agency", "Management Company", "Hybrid"
  ];

  const brandFriendlyScores = [
    { value: "1", label: "1 - Not brand friendly" },
    { value: "2", label: "2" },
    { value: "3", label: "3 - Neutral" },
    { value: "4", label: "4" },
    { value: "5", label: "5 - Very brand friendly" },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Creator</h1>
          <p className="text-gray-600">Create a new creator profile</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creator Information</CardTitle>
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
              {/* Basic Information */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Creator name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="creator@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => handleSelectChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select country</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_market">Primary Market</Label>
                <Input
                  id="primary_market"
                  name="primary_market"
                  value={formData.primary_market}
                  onChange={handleChange}
                  placeholder="e.g., India, US, Global"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_category">Primary Category *</Label>
                <Select 
                  value={formData.primary_category} 
                  onValueChange={(value) => handleSelectChange('primary_category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_categories">Secondary Categories</Label>
                <Input
                  id="secondary_categories"
                  name="secondary_categories"
                  value={formData.secondary_categories}
                  onChange={handleChange}
                  placeholder="Fashion, Beauty, Lifestyle (comma separated)"
                />
                <p className="text-xs text-gray-500">Separate with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub_niches">Sub Niches</Label>
                <Input
                  id="sub_niches"
                  name="sub_niches"
                  value={formData.sub_niches}
                  onChange={handleChange}
                  placeholder="Sustainable Fashion, Skincare, Travel Vlogging"
                />
                <p className="text-xs text-gray-500">Separate with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typical_deliverables">Typical Deliverables</Label>
                <Input
                  id="typical_deliverables"
                  name="typical_deliverables"
                  value={formData.typical_deliverables}
                  onChange={handleChange}
                  placeholder="Instagram Posts, YouTube Videos, Stories"
                />
                <p className="text-xs text-gray-500">Separate with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_friendly_score">Brand Friendly Score (1-5)</Label>
                <Select 
                  value={formData.brand_friendly_score} 
                  onValueChange={(value) => handleSelectChange('brand_friendly_score', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select score</SelectItem>
                    {brandFriendlyScores.map((score) => (
                      <SelectItem key={score.value} value={score.value}>
                        {score.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="management_type">Management Type</Label>
                <Select 
                  value={formData.management_type} 
                  onValueChange={(value) => handleSelectChange('management_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select management type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type</SelectItem>
                    {managementTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_language">Content Language</Label>
                <Input
                  id="content_language"
                  name="content_language"
                  value={formData.content_language}
                  onChange={handleChange}
                  placeholder="Hindi, English, Tamil"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience_geo_split">Audience Geo Split</Label>
                <Input
                  id="audience_geo_split"
                  name="audience_geo_split"
                  value={formData.audience_geo_split}
                  onChange={handleChange}
                  placeholder="India 70%, US 20%, Others 10%"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="past_rate_notes">Past Rate Notes</Label>
              <Textarea
                id="past_rate_notes"
                name="past_rate_notes"
                value={formData.past_rate_notes}
                onChange={handleChange}
                placeholder="Notes about past rates, collaborations, pricing..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/creators")}
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
                    Create Creator
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