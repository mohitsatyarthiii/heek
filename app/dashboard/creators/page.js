"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Edit,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Linkedin,
  Globe,
  Filter,
  BadgeCheck,
  MapPin,
  Mail,
  Tags,
  Sparkles,
  Globe2,
  PenTool,
  Video,
  Image,
  Music,
  Mic2,
  BookOpen,
  Gamepad2,
  Coffee,
  TrendingUp,
  Target,
  Zap,
  ChevronDown,
  Check,
  Square,
  User,
  Trash2,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

/* ===========================
   CONSTANTS
=========================== */

const PLATFORMS = [
  "Instagram",
  "YouTube",
  "TikTok",
  "Facebook",
  "Twitter / X",
  "Snapchat",
  "LinkedIn",
  "Pinterest",
  "Twitch",
  "Blog / Website",
];

const PLATFORM_MAP = {
  Instagram: { icon: Instagram, color: "text-pink-500" },
  YouTube: { icon: Youtube, color: "text-red-500" },
  TikTok: { icon: Music, color: "text-black dark:text-white" },
  Facebook: { icon: Facebook, color: "text-blue-600" },
  "Twitter / X": { icon: Twitter, color: "text-sky-500" },
  Snapchat: { icon: Zap, color: "text-yellow-500" },
  LinkedIn: { icon: Linkedin, color: "text-blue-700" },
  Pinterest: { icon: Image, color: "text-red-600" },
  Twitch: { icon: Gamepad2, color: "text-purple-600" },
  "Blog / Website": { icon: Globe, color: "text-gray-600" },
};

const CATEGORY_ICONS = {
  "Fashion": Sparkles,
  "Beauty": Sparkles,
  "Travel": Globe2,
  "Food": Coffee,
  "Fitness": TrendingUp,
  "Tech": Target,
  "Gaming": Gamepad2,
  "Lifestyle": Coffee,
  "Education": BookOpen,
  "Music": Music,
};

// Helper for icons
const renderIcon = (iconMap, key, className = "h-3 w-3") => {
  const Icon = iconMap[key];
  return Icon ? <Icon className={className} /> : null;
};

/* ===========================
   MULTI-SELECT DROPDOWN COMPONENT
=========================== */

const MultiSelectDropdown = ({ 
  label, 
  icon: Icon, 
  options, 
  selected, 
  onChange, 
  renderOption 
}) => {
  const [open, setOpen] = useState(false);

  const toggleAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <Icon className="h-3.5 w-3.5" />
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 ml-0.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs flex items-center justify-between">
          <span>{label}</span>
          {selected.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-1.5 text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
            >
              Clear
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Select All Option */}
        <DropdownMenuItem 
          onClick={toggleAll}
          className="text-xs gap-2"
        >
          <div className="flex h-4 w-4 items-center justify-center">
            {selected.length === options.length ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
          </div>
          <span className="font-medium">Select All</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Options List */}
        <ScrollArea className="h-[200px]">
          <div className="p-1">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <DropdownMenuItem
                  key={option}
                  onClick={() => {
                    onChange(
                      isSelected
                        ? selected.filter((item) => item !== option)
                        : [...selected, option]
                    );
                  }}
                  className="text-xs gap-2"
                >
                  <div className="flex h-4 w-4 items-center justify-center">
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                  </div>
                  {renderOption ? renderOption(option) : option}
                </DropdownMenuItem>
              );
            })}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/* ===========================
   CREATOR SEARCH DROPDOWN
=========================== */

const CreatorSearchDropdown = ({ creators, selectedCreator, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCreators = creators.filter(creator => 
    creator.name?.toLowerCase().includes(search.toLowerCase()) ||
    creator.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <User className="h-3.5 w-3.5" />
          {selectedCreator ? "1 Selected" : "Creator"}
          {selectedCreator && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              1
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 ml-0.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search creators..." 
            value={search}
            onValueChange={setSearch}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty className="py-2 text-xs text-center">
              No creator found.
            </CommandEmpty>
            <CommandGroup>
              {/* Clear Option */}
              {selectedCreator && (
                <>
                  <CommandItem
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                    className="text-xs gap-2 text-primary"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear selection
                  </CommandItem>
                  <CommandSeparator />
                </>
              )}
              
              {/* Creators List */}
              {filteredCreators.map((creator) => (
                <CommandItem
                  key={creator.id}
                  onSelect={() => {
                    onChange(creator.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="text-xs gap-2"
                >
                  <div className="flex h-4 w-4 items-center justify-center">
                    {selectedCreator === creator.id && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] bg-primary/10">
                      {creator.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs">{creator.name}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {creator.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/* ===========================
   MAIN PAGE
=========================== */

export default function CreatorsPage() {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    creatorId: null,
    platforms: [],
    categories: [],
  });
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Fetch data
  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      toast.error("Failed to fetch creators");
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      const { error } = await supabase
        .from("creators")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setCreators(creators.filter(c => c.id !== id));
      toast.success(`${name} deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete creator");
    }
  };

  // Unique values for filters
  const uniqueValues = useMemo(() => ({
    platforms: [...new Set(creators.flatMap(c => c.platforms || []))].sort(),
    categories: [...new Set(creators.map(c => c.primary_category).filter(Boolean))].sort(),
  }), [creators]);

  // Filter logic
  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      // Global search
      if (search) {
        const q = search.toLowerCase();
        const match = 
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.country?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Specific creator filter
      if (filters.creatorId) {
        if (c.id !== filters.creatorId) return false;
      }

      // Platforms multi-select filter
      if (filters.platforms.length > 0) {
        if (!c.platforms?.some(p => filters.platforms.includes(p))) return false;
      }

      // Categories multi-select filter
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(c.primary_category)) return false;
      }

      return true;
    });
  }, [creators, search, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredCreators.length / perPage);
  const paginatedCreators = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredCreators.slice(start, start + perPage);
  }, [filteredCreators, page]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-[1400px] mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-[1400px] mx-auto space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold">Creators</h1>
                <p className="text-xs text-muted-foreground">
                  {filteredCreators.length} total
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                size="sm" 
                onClick={() => router.push("/dashboard/creators/new")}
                className="h-8 gap-1 text-xs"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Creator
              </Button>
            </div>
          </div>

          {/* Search & Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Global Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {/* Creator Filter Dropdown */}
            <CreatorSearchDropdown
              creators={creators}
              selectedCreator={filters.creatorId}
              onChange={(creatorId) => setFilters({ ...filters, creatorId })}
            />

            {/* Platforms Multi-Select Dropdown */}
            <MultiSelectDropdown
              label="Platforms"
              icon={Globe}
              options={uniqueValues.platforms}
              selected={filters.platforms}
              onChange={(platforms) => setFilters({ ...filters, platforms })}
              renderOption={(platform) => {
                const platformConfig = PLATFORM_MAP[platform];
                const Icon = platformConfig?.icon || Globe;
                return (
                  <span className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${platformConfig?.color || ""}`} />
                    {platform}
                  </span>
                );
              }}
            />

            {/* Categories Multi-Select Dropdown */}
            <MultiSelectDropdown
              label="Categories"
              icon={Tags}
              options={uniqueValues.categories}
              selected={filters.categories}
              onChange={(categories) => setFilters({ ...filters, categories })}
              renderOption={(category) => (
                <span className="flex items-center gap-1.5">
                  {renderIcon(CATEGORY_ICONS, category, "h-3.5 w-3.5")}
                  {category}
                </span>
              )}
            />

            {/* Reset Button */}
            {(search || filters.creatorId || filters.platforms.length > 0 || filters.categories.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilters({ creatorId: null, platforms: [], categories: [] });
                }}
                className="h-8 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(search || filters.creatorId || filters.platforms.length > 0 || filters.categories.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Active:</span>
              
              {/* Search Filter */}
              {search && (
                <Badge variant="secondary" className="gap-1 px-1.5 py-0.5 text-[10px]">
                  <Search className="h-2.5 w-2.5" />
                  {search}
                  <X
                    className="h-2.5 w-2.5 ml-0.5 cursor-pointer"
                    onClick={() => setSearch("")}
                  />
                </Badge>
              )}

              {/* Creator Filter */}
              {filters.creatorId && (
                <Badge variant="secondary" className="gap-1 px-1.5 py-0.5 text-[10px]">
                  <User className="h-2.5 w-2.5" />
                  {creators.find(c => c.id === filters.creatorId)?.name}
                  <X
                    className="h-2.5 w-2.5 ml-0.5 cursor-pointer"
                    onClick={() => setFilters({ ...filters, creatorId: null })}
                  />
                </Badge>
              )}

              {/* Platforms Filters */}
              {filters.platforms.map(p => (
                <Badge key={p} variant="secondary" className="gap-1 px-1.5 py-0.5 text-[10px]">
                  {(() => {
                    const Icon = PLATFORM_MAP[p]?.icon || Globe;
                    return <Icon className="h-2.5 w-2.5" />;
                  })()}
                  {p}
                  <X
                    className="h-2.5 w-2.5 ml-0.5 cursor-pointer"
                    onClick={() => setFilters({
                      ...filters,
                      platforms: filters.platforms.filter(x => x !== p)
                    })}
                  />
                </Badge>
              ))}

              {/* Categories Filters */}
              {filters.categories.map(c => (
                <Badge key={c} variant="secondary" className="gap-1 px-1.5 py-0.5 text-[10px]">
                  {renderIcon(CATEGORY_ICONS, c, "h-2.5 w-2.5")}
                  {c}
                  <X
                    className="h-2.5 w-2.5 ml-0.5 cursor-pointer"
                    onClick={() => setFilters({
                      ...filters,
                      categories: filters.categories.filter(x => x !== c)
                    })}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Table - Fixed Layout */}
          <div className="border rounded-lg bg-card overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="w-[180px] p-2 text-left font-medium">Creator</th>
                  <th className="w-[120px] p-2 text-left font-medium">Email</th>
                  <th className="w-[100px] p-2 text-left font-medium">Platforms</th>
                  <th className="w-[100px] p-2 text-left font-medium">Category</th>
                  <th className="w-[150px] p-2 text-left font-medium">Niches</th>
                  <th className="w-[80px] p-2 text-left font-medium">Country</th>
                  <th className="w-[80px] p-2 text-left font-medium">Verified</th>
                  <th className="w-[100px] p-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCreators.map((creator) => (
                  <tr key={creator.id} className="border-t text-xs hover:bg-muted/30">
                    {/* Creator */}
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10">
                            {creator.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-xs">{creator.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            ID: {creator.id.slice(0, 6)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs truncate">{creator.email}</span>
                      </div>
                    </td>

                    {/* Platforms - Only Icons */}
                    <td className="p-2">
                      <div className="flex items-center gap-0.5">
                        {creator.platforms?.slice(0, 3).map((p) => {
                          const platform = PLATFORM_MAP[p];
                          const Icon = platform?.icon || Globe;
                          return (
                            <Tooltip key={p}>
                              <TooltipTrigger>
                                <Icon className={`h-3.5 w-3.5 ${platform?.color || ""}`} />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-[10px]">
                                {p}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                        {creator.platforms?.length > 3 && (
                          <span className="text-[10px] text-muted-foreground ml-0.5">
                            +{creator.platforms.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        {renderIcon(CATEGORY_ICONS, creator.primary_category, "h-3 w-3")}
                        <span className="text-xs truncate">
                          {creator.primary_category || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Niches */}
                    <td className="p-2">
                      <div className="flex flex-wrap gap-0.5">
                        {creator.sub_niches?.slice(0, 2).map((niche) => (
                          <Badge key={niche} variant="secondary" className="px-1 py-0.5 text-[9px]">
                            {niche}
                          </Badge>
                        ))}
                        {creator.sub_niches?.length > 2 && (
                          <Badge variant="secondary" className="px-1 py-0.5 text-[9px]">
                            +{creator.sub_niches.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Country */}
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs truncate">{creator.country || "—"}</span>
                      </div>
                    </td>

                    {/* Verified */}
                    <td className="p-2">
                      {creator.is_verified ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <BadgeCheck className="h-4 w-4 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            Verified
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">—</span>
                      )}
                    </td>

                    {/* Actions - Only 3 Icons */}
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => router.push(`/dashboard/creators/${creator.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            View
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => router.push(`/dashboard/creators/edit/${creator.id}`)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            Edit
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:text-red-600"
                              onClick={() => handleDelete(creator.id, creator.name)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            Delete
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedCreators.length === 0 && (
                  <tr>
                    <td colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm font-medium">No creators found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try adjusting your filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-2">
              <p className="text-[10px] text-muted-foreground">
                {filteredCreators.length > 0 ? (
                  <>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredCreators.length)} of {filteredCreators.length}</>
                ) : (
                  <>0 results</>
                )}
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                
                <span className="text-xs px-2">
                  Page {page} of {totalPages || 1}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(p => p + 1)}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );
}