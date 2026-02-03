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
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  UserPlus,
  Download,
  Star,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertCircle,
  Globe,
  Youtube,
  Instagram,
  Twitter,
  LinkIcon,
  Mail,
  Phone,
  Plus,
  Users,
  TrendingUp,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Settings,
} from "lucide-react";

export default function CreatorsPage() {
  const { user } = useAuth();
  const { theme, colors, isDark } = useTheme();
  const router = useRouter();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [canCreate, setCanCreate] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    checkPermissions();
    fetchCreators();
  }, []);

  const checkPermissions = async () => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "associate";
    setCanCreate(role === "admin" || role === "manager");
  };

  const fetchCreators = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCreators(data);
    }
    setLoading(false);
  };

  const filteredCreators = creators.filter((creator) => {
    const matchesSearch =
      creator.name?.toLowerCase().includes(search.toLowerCase()) ||
      creator.email?.toLowerCase().includes(search.toLowerCase()) ||
      creator.primary_category?.toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "verified") return matchesSearch && creator.is_verified;
    if (filter === "pending") return matchesSearch && creator.status === "pending";
    if (filter === "active") return matchesSearch && creator.status === "active";
    if (filter === "inactive") return matchesSearch && creator.status === "inactive";
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCreators.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCreators = filteredCreators.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Email,Category,Status,Brand Score,Platforms,Location\n" +
      creators.map((c) => 
        `${c.name},${c.email},${c.primary_category || "N/A"},${c.status},${c.brand_friendly_score || 0},${c.platforms?.join(";") || "N/A"},${c.country || "N/A"}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `creators_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
            {status}
          </Badge>
        );
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case "youtube":
        return <Youtube className="h-3 w-3 text-red-500" />;
      case "instagram":
        return <Instagram className="h-3 w-3 text-pink-500" />;
      case "twitter":
        return <Twitter className="h-3 w-3 text-blue-400" />;
      case "tiktok":
        return <div className="h-3 w-3 bg-black dark:bg-white rounded-sm" />;
      default:
        return <LinkIcon className="h-3 w-3 text-gray-500" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4) return "text-green-600 dark:text-green-400";
    if (score >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading creators database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Top Bar - Spreadsheet Header Style */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Creator Directory</h1>
              <p className="text-sm text-muted-foreground">
                Database: {creators.length} records • Last updated: Today
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCreators}
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
                onClick={() => router.push("/dashboard/creators/new")}
                size="sm"
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Creator
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid - Spreadsheet Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Creators",
              value: creators.length,
              icon: Users,
              color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              change: "+12%",
            },
            {
              label: "Active",
              value: creators.filter(c => c.status === "active").length,
              icon: CheckCircle,
              color: "bg-green-500/10 text-green-600 dark:text-green-400",
              change: "+8%",
            },
            {
              label: "Avg. Score",
              value: creators.length > 0
                ? (creators.reduce((acc, c) => acc + (c.brand_friendly_score || 0), 0) / creators.length).toFixed(1)
                : "0.0",
              icon: Star,
              color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
              change: "+0.3",
            },
            {
              label: "Pending Review",
              value: creators.filter(c => c.status === "pending").length,
              icon: Clock,
              color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
              change: "3 new",
            },
          ].map((stat, index) => (
            <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-600 dark:text-green-400">{stat.change}</span> from last month
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Control Bar - Excel-like */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search: name, email, category, platform..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background border-border focus:border-primary"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-primary text-primary-foreground" : "border-border"}
              >
                All ({creators.length})
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
                className={filter === "active" ? "bg-green-600 text-white" : "border-border"}
              >
                Active ({creators.filter(c => c.status === "active").length})
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
                className={filter === "pending" ? "bg-yellow-600 text-white" : "border-border"}
              >
                Pending ({creators.filter(c => c.status === "pending").length})
              </Button>
              
              {/* View Toggle */}
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 text-sm ${viewMode === "grid" ? "bg-accent text-foreground" : "bg-background text-muted-foreground"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-accent text-foreground" : "bg-background text-muted-foreground"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Advanced Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-border">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border w-48">
                  <DropdownMenuItem onClick={() => setFilter("verified")}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verified Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("inactive")}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Custom Filter...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Data Table - Spreadsheet Style */}
        <Card className="bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader className="bg-accent">
                <TableRow className="border-b border-border hover:bg-accent">
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 sticky left-0 bg-accent z-10 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Creator
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Info
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[120px]">
                    Category
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[120px]">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Location
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[120px]">
                    Platforms
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[100px]">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-foreground border-r border-border p-3 min-w-[140px]">
                    <Star className="h-4 w-4 inline mr-2" />
                    Brand Score
                  </TableHead>
                  <TableHead className="font-semibold text-foreground p-3 min-w-[80px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCreators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-lg font-medium text-foreground">No creators found</p>
                        <p className="text-muted-foreground mt-1">
                          {search ? "Try a different search term" : "Add your first creator to get started"}
                        </p>
                        {canCreate && (
                          <Button
                            onClick={() => router.push("/dashboard/creators/new")}
                            className="mt-4"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Creator
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCreators.map((creator) => (
                    <TableRow 
                      key={creator.id} 
                      className="border-b border-border hover:bg-accent/50 transition-colors group"
                    >
                      <TableCell className="border-r border-border p-3 sticky left-0 bg-card min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-primary">
                              {creator.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{creator.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              ID: {creator.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border p-3 min-w-[180px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-foreground truncate">{creator.email}</span>
                          </div>
                          {creator.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-foreground">{creator.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border p-3 min-w-[120px]">
                        <Badge 
                          variant="outline" 
                          className="bg-accent text-foreground border-border truncate max-w-full"
                        >
                          {creator.primary_category || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r border-border p-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground truncate">{creator.country || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border p-3 min-w-[120px]">
                        <div className="flex gap-1 flex-wrap">
                          {creator.platforms?.slice(0, 3).map((platform, index) => (
                            <div 
                              key={index} 
                              className="p-1.5 bg-accent rounded border border-border hover:bg-accent/80 transition-colors"
                              title={platform}
                            >
                              {getPlatformIcon(platform)}
                            </div>
                          ))}
                          {creator.platforms?.length > 3 && (
                            <div 
                              className="p-1.5 bg-accent rounded border border-border text-xs text-muted-foreground"
                              title={creator.platforms.slice(3).join(", ")}
                            >
                              +{creator.platforms.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border p-3 min-w-[100px]">
                        {getStatusBadge(creator.status)}
                      </TableCell>
                      <TableCell className="border-r border-border p-3 min-w-[140px]">
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-accent rounded-full h-2 overflow-hidden flex-1">
                            <div 
                              className={`h-full ${creator.brand_friendly_score >= 4 ? 'bg-green-500' : creator.brand_friendly_score >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${(creator.brand_friendly_score || 0) * 20}%` }}
                            />
                          </div>
                          <span className={`font-bold ${getScoreColor(creator.brand_friendly_score)} min-w-[40px]`}>
                            {creator.brand_friendly_score ? creator.brand_friendly_score.toFixed(1) : "0.0"}
                            <span className="text-muted-foreground text-sm">/5</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 min-w-[80px]">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/creators/${creator.id}`)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canCreate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/creators/edit/${creator.id}`)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Spreadsheet Footer */}
          {paginatedCreators.length > 0 && (
            <div className="border-t border-border px-4 py-3 bg-accent">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCreators.length)}</span> of{" "}
                    <span className="font-medium text-foreground">{filteredCreators.length}</span> records
                  </p>
                  <select 
                    className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
                    value={itemsPerPage}
                    onChange={(e) => setCurrentPage(1)}
                  >
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Stats Footer */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Avg. Engagement</p>
            <p className="text-lg font-bold text-foreground">4.2%</p>
          </div>
          <div className="text-center p-3 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Total Reach</p>
            <p className="text-lg font-bold text-foreground">12.5M</p>
          </div>
          <div className="text-center p-3 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Avg. Rate</p>
            <p className="text-lg font-bold text-foreground">$2,450</p>
          </div>
          <div className="text-center p-3 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Response Time</p>
            <p className="text-lg font-bold text-foreground">2.1 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}