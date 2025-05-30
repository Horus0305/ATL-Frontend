import { useState, useEffect } from "react";
import { apiRequest, API_URLS } from "@/config/api";
import { Loader2, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function EquipmentSelectionTable({ onEquipmentSelect }) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState([]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await apiRequest(API_URLS.getAllEquipment);
      if (response.ok) {
        setEquipment(response.equipment);
      } else {
        setError(response.error || "Failed to fetch equipment");
      }
    } catch (err) {
      
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleEquipmentSelect = (equipmentId) => {
    setSelectedEquipment((prev) => {
      const newSelection = prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId];

      // Call the parent callback with the updated selection
      onEquipmentSelect(
        newSelection.map((id) => equipment.find((item) => item._id === id))
      );

      return newSelection;
    });
  };

  const handleRemoveEquipment = (equipmentId) => {
    handleEquipmentSelect(equipmentId);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading equipment...
      </div>
    );

  if (error)
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          <Button className="ml-4" onClick={fetchEquipment}>
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Select Equipment</h3>
        <span className="text-sm text-muted-foreground">
          {selectedEquipment.length} equipment selected
        </span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="justify-between w-full"
          >
            {selectedEquipment.length > 0
              ? `${selectedEquipment.length} equipment selected`
              : "Select equipment"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
            {equipment.map((item) => (
              <div
                key={item._id}
                className="flex items-center p-2 space-x-2 rounded cursor-pointer hover:bg-accent"
                onClick={() => handleEquipmentSelect(item._id)}
              >
                <Checkbox
                  checked={selectedEquipment.includes(item._id)}
                  onCheckedChange={() => handleEquipmentSelect(item._id)}
                />
                <div className="flex-grow">
                  <div className="text-sm font-medium">{item.equipment}</div>
                  <div className="text-xs text-muted-foreground">
                    Certificate No: {item.cno} | Range: {item.range}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected equipment badges */}
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedEquipment.map((id) => {
          const item = equipment.find((e) => e._id === id);
          if (!item) return null;
          return (
            <Badge
              key={id}
              variant="secondary"
              className="flex items-center gap-1 py-1 px-2"
            >
              {item.equipment}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveEquipment(id);
                }}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
