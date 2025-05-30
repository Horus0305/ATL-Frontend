import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { TestDetailsView } from '@/components/TestDetailsView';
import { useEffect, useState } from 'react';
import { apiRequest, API_URLS } from '@/config/api';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function TestDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [test, setTest] = useState(location.state?.test);
  const [loading, setLoading] = useState(!location.state?.test);
  const [error, setError] = useState(null);

  const getBackPath = () => {
    switch (user.role) {
      case 0: return '/superadmin/tests';
      case 1:
      case 2: return '/sectionhead/tests';
      case 3: return '/receptionist/materialTests';
      case 4:
      case 5: return '/tester';
      default: return '/tests';
    }
  };


  useEffect(() => {
    if (!test && id) {
      fetchTestDetails();
    }
  }, [id]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`${API_URLS.getTestDetails}/${id}`);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch test details');
      }
      setTest(response.test);
    } catch (err) {
      console.error('Error fetching test:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(getBackPath());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading test details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 bg-background">
        <p>Error: {error}</p>
        <Button onClick={fetchTestDetails} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center p-4 bg-background text-foreground">
        <p>No test details found</p>
        <Button onClick={handleBack} className="mt-4">
          Back to Tests
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <TestDetailsView test={test} onBack={handleBack} />
    </div>
  );
} 