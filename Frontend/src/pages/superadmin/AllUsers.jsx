import { useState, useEffect } from "react";
import { UsersTable } from "@/components/UsersTable";
import { UpdateModal } from "@/components/UpdateModal";
import { apiRequest, API_URLS } from "@/config/api";
import { useToast } from "@/components/ui/use-toast";

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const response = await apiRequest(API_URLS.getAllUsers);
      if (response.ok) {
        setUsers(response.users);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAdded = () => {
    fetchUsers();
  };

  const handleUpdate = (user) => {
    // Handle user update
    fetchUsers();
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">All Users</h2>
      <div className="mb-4">
        <UpdateModal
          heading="Add User"
          btnHeading="Add User"
          onSuccess={handleUserAdded}
        />
      </div>
      <div className="grid gap-4 w-max">
        <UsersTable users={users} onUpdate={handleUpdate} loading={loading} />
      </div>
    </div>
  );
}
