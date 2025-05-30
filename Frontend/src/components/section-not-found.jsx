import { useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SectionNotFound() {
  const location = useLocation();
  const basePath = '/' + location.pathname.split('/')[1]; // Gets the base path like /admin or /superadmin

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
      <div className="text-center space-y-5 p-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page <span className="font-mono text-primary">{location.pathname}</span> doesn't exist.
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <Link
            to={basePath}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 