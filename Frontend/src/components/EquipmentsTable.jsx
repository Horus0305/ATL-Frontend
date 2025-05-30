import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UpdateEquipments } from "./UpdateEquipments";
import { apiRequest, API_URLS } from "@/config/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const EquipmentsTable = forwardRef((props, ref) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const response = await apiRequest(API_URLS.getAllEquipment);
      if (response.ok) {
        setEquipment(response.equipment);
      } else {
        setError(response.error || 'Failed to fetch equipment');
      }
    } catch (err) {
      
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshTable: () => {
      setRefreshTrigger(prev => prev + 1);
    }
  }));

  useEffect(() => {
    fetchEquipment();
  }, [refreshTrigger]);

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
    </div>
  );

  if (error) return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2">
        {error}
        <Button 
          className="ml-4" 
          onClick={() => setRefreshTrigger(prev => prev + 1)}
        >
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Equipment</TableHead>
          <TableHead className="w-[200px]">Certificate No.</TableHead>
          <TableHead className="w-[160px]">Range</TableHead>
          <TableHead className="w-[150px]">Calibration Date</TableHead>
          <TableHead className="w-[150px]">Due Date</TableHead>
          <TableHead className="w-[200px]">Calibrated By</TableHead>
          <TableHead className="w-[150px]">Update</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {equipment.map((item) => (
          <TableRow key={item._id}>
            <TableCell className="font-medium">{item.equipment}</TableCell>
            <TableCell>{item.cno}</TableCell>
            <TableCell>{item.range}</TableCell>
            <TableCell>{new Date(item.cdate).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(item.ddate).toLocaleDateString()}</TableCell>
            <TableCell>{item.cname}</TableCell>
            <TableCell>
              <UpdateEquipments 
                heading={"Edit Equipment"}
                btnHeading={"Update"} 
                equipmentData={item} 
                onSuccess={() => setRefreshTrigger(prev => prev + 1)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});

EquipmentsTable.displayName = 'EquipmentsTable';
