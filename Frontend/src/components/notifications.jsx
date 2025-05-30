import { Inbox } from '@novu/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Default to chemical head if user is not loaded
  let subscriberId = 'b29cf231-04c1-4708-ad5a-8a61965a5ddc';
  if (user?.role === 2) {
    subscriberId = '653d04d1-9661-4924-82d3-72d5e0e58cbe'; // Mechanical Head
  } else if (user?.role === 1) {
    subscriberId = 'b29cf231-04c1-4708-ad5a-8a61965a5ddc'; // Chemical Head
  }

  return (
    <Inbox
      applicationIdentifier="C3Ru6vDXns7m"
      subscriberId={subscriberId}
      routerPush={(path) => navigate(path)}
      appearance={{
        variables: {
          colorPrimary: "#000000",
          colorForeground: "#0E121B"
        }
      }}
    />
  );
}

