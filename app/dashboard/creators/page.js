"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  UserPlus,
  Download,
  Star
} from "lucide-react";

export default function CreatorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    checkPermissions();
    fetchCreators();
  }, []);

  const checkPermissions = async () => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'associate';
    setCanCreate(role === 'admin' || role === 'manager');
  };

  const fetchCreators = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCreators(data);
    }
    setLoading(false);
  };

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = 
      creator.name?.toLowerCase().includes(search.toLowerCase()) ||
      creator.email?.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    // Add more filters as needed
    
    return matchesSearch;
  });

  const handleExport = () => {
    // Export to CSV logic
    const csvContent = "data:text/csv;charset=utf-8," 
      + creators.map(c => `${c.name},${c.email},${c.categories}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "creators.csv");
    document.body.appendChild(link);
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Creators</h1>
          <p className="text-gray-600">Manage all creator profiles</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {canCreate && (
            <Button onClick={() => router.push("/dashboard/creators/new")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Creator
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search creators by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
  <TableRow>
    <TableHead>Name</TableHead>
    <TableHead>Email</TableHead>
    <TableHead>Primary Category</TableHead>
    <TableHead>Country</TableHead>
    <TableHead>Brand Score</TableHead>
    <TableHead className="text-right">Actions</TableHead>
  </TableRow>
</TableHeader>
            <TableBody>
              {filteredCreators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No creators found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCreators.map((creator) => (
                  <TableRow key={creator.id}>
                   <TableCell className="font-medium">{creator.name}</TableCell>
  <TableCell>{creator.email}</TableCell>
  <TableCell>
    <Badge variant="outline">{creator.primary_category || "Not set"}</Badge>
  </TableCell>
  <TableCell>{creator.country || "Not set"}</TableCell>
  <TableCell>
    {creator.brand_friendly_score ? (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 text-yellow-500 fill-current" />
        <span>{creator.brand_friendly_score}/5</span>
      </div>
    ) : (
      <span className="text-gray-400">Not rated</span>
    )}
  </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {creator.platforms?.join(", ") || "None"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(creator.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/creators/${creator.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {canCreate && (
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/creators/edit/${creator.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}