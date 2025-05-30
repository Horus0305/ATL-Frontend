import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, API_URLS } from "@/config/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function UpdateEquipments({
  heading,
  btnHeading,
  equipmentData,
  onSuccess,
  className,
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    equipment: equipmentData?.equipment || "",
    range: equipmentData?.range || "",
    cno: equipmentData?.cno || "",
    cdate: equipmentData?.cdate || "",
    ddate: equipmentData?.ddate || "",
    cname: equipmentData?.cname || "",
  });

  // Reset form data when modal opens/closes or when equipmentData changes
  useEffect(() => {
    if (!open) {
      setFormData({
        equipment: equipmentData?.equipment || "",
        range: equipmentData?.range || "",
        cno: equipmentData?.cno || "",
        cdate: equipmentData?.cdate || "",
        ddate: equipmentData?.ddate || "",
        cname: equipmentData?.cname || "",
      });
    }
  }, [open, equipmentData]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const validateForm = (data) => {
    if (!data.equipment.trim()) throw new Error("Equipment name is required.");
    if (!data.range.trim()) throw new Error("Range is required.");
    if (!data.cno.trim()) throw new Error("Certification number is required.");

    const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    if (!data.cdate.trim()) throw new Error("Calibration date is required.");
    if (!data.ddate.trim()) throw new Error("Due date is required.");
    if (data.cdate > today)
      throw new Error("Calibration date cannot be in the future.");
    if (data.ddate <= data.cdate)
      throw new Error("Due date must be after the calibration date.");

    if (!data.cname.trim()) throw new Error("Calibrated by field is required.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      validateForm(formData);

      const url = equipmentData
        ? `${API_URLS.updateEquipment}/${equipmentData._id}`
        : API_URLS.createEquipment;
      const method = equipmentData ? "PUT" : "POST";

      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Equipment ${
            equipmentData ? "updated" : "added"
          } successfully`,
        });
        setOpen(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          className={`${className} bg-black hover:bg-black/90 text-white`}
        >
          {btnHeading}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{heading}</SheetTitle>
          <SheetDescription>
            Update or add new equipment details.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {[
              { id: "equipment", label: "Equipment", type: "text" },
              { id: "range", label: "Range", type: "text" },
              { id: "cno", label: "Certification No.", type: "text" },
              { id: "cdate", label: "Calibration Date", type: "date" },
              { id: "ddate", label: "Due Date", type: "date" },
              { id: "cname", label: "Calibrated By", type: "text" },
            ].map((field) => (
              <div
                key={field.id}
                className="grid items-center grid-cols-4 gap-4"
              >
                <Label htmlFor={field.id} className="text-right">
                  {field.label}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  value={formData[field.id]}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
            ))}
          </div>
          <SheetFooter>
            <Button
              type="submit"
              className="text-white bg-black hover:bg-black/90"
            >
              {equipmentData ? "Save changes" : btnHeading}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
