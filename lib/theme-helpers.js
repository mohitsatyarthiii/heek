// Get theme-aware class names
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Theme-aware styles
export const themeStyles = {
  card: 'bg-card text-card-foreground rounded-lg border border-border p-6',
  button: {
    primary: 'bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90',
    secondary: 'bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80',
    outline: 'border border-border bg-transparent hover:bg-accent px-4 py-2 rounded'
  },
  input: 'border border-input bg-background text-foreground px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-ring'
};