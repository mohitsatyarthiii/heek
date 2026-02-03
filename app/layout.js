import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "@/contexts/theme-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Heek-E OS - Creator Management",
  description: "Internal tool for managing creators and tasks",
};

export default function RootLayout({ children }) {

   <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.classList.add(theme);
                
                // Apply CSS variables immediately
                const colors = {
                  light: {
                    background: '#ffffff',
                    foreground: '#020817',
                    card: '#ffffff',
                    cardForeground: '#020817',
                    primary: '#0f172a',
                    primaryForeground: '#f8fafc',
                    secondary: '#f1f5f9',
                    secondaryForeground: '#0f172a',
                    muted: '#f8fafc',
                    mutedForeground: '#64748b',
                    accent: '#f1f5f9',
                    accentForeground: '#0f172a',
                    destructive: '#ef4444',
                    destructiveForeground: '#f8fafc',
                    border: '#e2e8f0',
                    input: '#e2e8f0',
                    ring: '#020817'
                  },
                  dark: {
                    background: '#0f172a',
                    foreground: '#f8fafc',
                    card: '#1e293b',
                    cardForeground: '#f8fafc',
                    primary: '#f8fafc',
                    primaryForeground: '#0f172a',
                    secondary: '#334155',
                    secondaryForeground: '#f8fafc',
                    muted: '#1e293b',
                    mutedForeground: '#94a3b8',
                    accent: '#334155',
                    accentForeground: '#f8fafc',
                    destructive: '#7f1d1d',
                    destructiveForeground: '#f8fafc',
                    border: '#334155',
                    input: '#334155',
                    ring: '#cbd5e1'
                  }
                };
                
                const themeColors = colors[theme];
                Object.entries(themeColors).forEach(([key, value]) => {
                  document.documentElement.style.setProperty('--' + key, value);
                });
                
                // Update meta theme-color
                const meta = document.querySelector('meta[name="theme-color"]');
                if (meta) meta.setAttribute('content', themeColors.background);
              } catch (e) {}
            `,
          }}
        />
  return (
    <html lang="en">
      <body className={inter.className}>
        
        <AuthProvider>
          <ThemeProvider>
          {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}