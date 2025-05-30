import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiRequest, API_URLS } from "@/config/api";
import { Input } from "@/components/ui/input";
import { Search, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ClientTable = forwardRef((props, ref) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  useImperativeHandle(ref, () => ({
    refreshTable: () => {
      setRefreshTrigger(prev => prev + 1);
    }
  }));

  useEffect(() => {
    fetchClients();
  }, [refreshTrigger]);

  const fetchClients = async () => {
    try {
      
      const response = await apiRequest(API_URLS.getAllClients);
      
      
      if (response.ok) {
        setClients(response.clients);
        
      } else {
        setError(response.error || 'Failed to fetch clients');
      }
    } catch (err) {
      
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    try {
      const response = await apiRequest(`${API_URLS.deleteClient}/${clientId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Client deleted successfully",
          variant: "destructive",
        });
        fetchClients();
      } else {
        throw new Error(response.error || 'Failed to delete client');
      }
    } catch (err) {
      
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (client) => {
    // Implement view details functionality
    
  };

  const filteredClients = clients.filter((client) => {
    const searchString = searchTerm.toLowerCase();
    return (
      client.clientname?.toLowerCase().includes(searchString) ||
      client.emailid?.toLowerCase().includes(searchString) ||
      client.contactno?.includes(searchString)
    );
  });

  if (loading) {
    return <div className="text-center p-4">Loading clients...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">Error: {error}</div>;
  }

  if (!clients.length) {
    return <div className="text-center p-4">No clients found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name, email, or contact number..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Client Name</TableHead>
            <TableHead className="w-[200px]">Contact Number</TableHead>
            <TableHead className="w-[250px]">Email</TableHead>
            <TableHead className="w-[300px]">Address</TableHead>
            <TableHead className="w-[150px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.map((client) => (
            <TableRow key={client._id}>
              <TableCell className="font-medium">{client.clientname}</TableCell>
              <TableCell>{client.contactno}</TableCell>
              <TableCell>{client.emailid}</TableCell>
              <TableCell>{client.address}</TableCell>
              <TableCell className="text-center space-x-2 flex">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-black hover:bg-black/90 text-white"
                  onClick={() => handleViewDetails(client)}
                >
                  View
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Client</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {client.clientname}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteClient(client._id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {filteredClients.length === 0 && !loading && !error && (
        <div className="text-center p-4 text-muted-foreground">
          No clients found matching your search criteria
        </div>
      )}
    </div>
  );
});

ClientTable.displayName = 'ClientTable'; 