import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center space-y-5">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page <span className="font-mono text-primary">{location.pathname}</span> doesn't exist.
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 