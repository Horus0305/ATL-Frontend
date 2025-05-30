import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest, API_URLS } from "@/config/api";

export function ProformaForm({ testData, onSuccess }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    gstin: "",
    pan: "",
    hsn: "",
    description: "",
    quantity: "",
    rate: "",
    mode: "",
    sgst: 0,
    cgst: 0
  });
  const [tableData, setTableData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const addMaterial = () => {
    if (!formData.description || !formData.quantity || !formData.rate) {
      toast({
        title: "Error",
        description: "Please fill all material details",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(formData.quantity) * parseFloat(formData.rate);
    const newItem = {
      description: formData.description,
      quantity: formData.quantity,
      rate: formData.rate,
      amount
    };

    setTableData(prev => [...prev, newItem]);
    setTotalAmount(prev => prev + amount);
    
    // Reset material input fields
    setFormData(prev => ({
      ...prev,
      description: "",
      quantity: "",
      rate: ""
    }));
  };

  const handleDelete = (index) => {
    const deletedItem = tableData[index];
    setTableData(prev => prev.filter((_, i) => i !== index));
    setTotalAmount(prev => prev - deletedItem.amount);
  };

  const handleUpdate = (index) => {
    const itemToUpdate = tableData[index];
    setFormData(prev => ({
      ...prev,
      description: itemToUpdate.description,
      quantity: itemToUpdate.quantity,
      rate: itemToUpdate.rate
    }));
    handleDelete(index); // Remove the item from table to be re-added after update
  };

  // Update the calculation to handle NaN
  const calculateFinalAmount = () => {
    const sgstValue = isNaN(parseFloat(formData.sgst)) ? 0 : parseFloat(formData.sgst);
    const cgstValue = isNaN(parseFloat(formData.cgst)) ? 0 : parseFloat(formData.cgst);
    return totalAmount + totalAmount * (sgstValue + cgstValue) / 100;
  };

  const handleSubmit = async () => {
    try {
      const sgstValue = isNaN(parseFloat(formData.sgst)) ? 0 : parseFloat(formData.sgst);
      const cgstValue = isNaN(parseFloat(formData.cgst)) ? 0 : parseFloat(formData.cgst);
      const totalTax = totalAmount * (sgstValue + cgstValue) / 100;
      const finalAmount = totalAmount + totalTax;

      const payload = {
        testId: testData.testId,
        materialTestId: testData._id,
        gstin: formData.gstin,
        pan: formData.pan,
        hsn: formData.hsn,
        mode: formData.mode || 'CASH',
        materials: tableData.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })),
        sgst: sgstValue,
        cgst: cgstValue,
        totalAmount,
        totalTax,
        finalAmount,
        buyer: {
          name: testData.clientName,
          address: testData.address,
          gstin: formData.gstin,
          pan: formData.pan
        }
      };

      const response = await fetch(`${API_URLS.createProforma}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Show success message
      toast({
        title: "Success",
        description: "Proforma invoice generated and stored successfully",
      });

      // Call the onSuccess callback to update the parent component
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate proforma invoice",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>GSTIN/UIN</Label>
          <Input 
            name="gstin"
            value={formData.gstin}
            onChange={handleInputChange}
            placeholder="Enter GSTIN/UIN"
          />
        </div>
        <div>
          <Label>PAN/IT No</Label>
          <Input 
            name="pan"
            value={formData.pan}
            onChange={handleInputChange}
            placeholder="Enter PAN"
          />
        </div>
        <div>
          <Label>HSN/SAC</Label>
          <Input 
            name="hsn"
            value={formData.hsn}
            onChange={handleInputChange}
            placeholder="Enter HSN/SAC"
          />
        </div>
        <div>
          <Label>Mode/Terms of Payment</Label>
          <Input 
            name="mode"
            value={formData.mode}
            onChange={handleInputChange}
            placeholder="Enter payment mode"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <Input 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter Description"
            />
          </div>
          <Input 
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            type="number"
            placeholder="Quantity"
          />
          <Input 
            name="rate"
            value={formData.rate}
            onChange={handleInputChange}
            type="number"
            placeholder="Rate"
          />
        </div>
        <Button onClick={addMaterial}>Add Material</Button>
      </div>

      {tableData.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.rate}</TableCell>
                <TableCell>{item.amount}</TableCell>
                <TableCell className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleUpdate(index)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDelete(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>SGST (%)</Label>
          <Input 
            name="sgst"
            value={formData.sgst}
            onChange={handleInputChange}
            type="number"
          />
        </div>
        <div>
          <Label>CGST (%)</Label>
          <Input 
            name="cgst"
            value={formData.cgst}
            onChange={handleInputChange}
            type="number"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-lg font-semibold">
          Final Amount: ₹{calculateFinalAmount()}
        </div>
        <Button onClick={handleSubmit} className="w-full">Create Proforma</Button>
      </div>
    </div>
  );
} 