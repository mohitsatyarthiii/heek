"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useTheme } from "@/contexts/theme-context";
import Sidebar from "@/components/Sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  RefreshCw, 
  AlertCircle,
  LogOut
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const { theme, colors } = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    setError("");
    
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error("Session error: " + sessionError.message);
      }
      
      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      } else {
        setUserProfile(profile);
      }

      setLoading(false);
    } catch (err) {
      console.error("Auth check error:", err);
      setError(err.message || "Authentication failed");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading Dashboard</p>
            <p className="text-sm text-muted-foreground">Setting up your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md p-6">
          <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto w-fit">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Authentication Error</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={checkAuth}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Try Again
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="px-6 py-3">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary">
                    {userProfile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h1 className="font-bold text-foreground">
                    {userProfile?.name || "User Dashboard"}
                  </h1>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {user?.email}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                    <span className="px-2 py-0.5 bg-accent text-foreground rounded-full text-xs font-medium capitalize">
                      {userProfile?.role || "user"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Online</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-3 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                © {new Date().getFullYear()} Heek-E OS
              </span>
              <span className="hidden md:inline text-muted-foreground">•</span>
              <span className="text-muted-foreground hidden md:inline">
                Creator Management System
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${theme === 'dark' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                Theme: {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
              <span className="text-muted-foreground hidden md:inline">•</span>
              <span className="text-muted-foreground">
                v1.0.0
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}