import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, API_URLS } from "@/config/api";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RORForm({ testData, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sameAsDelivery, setSameAsDelivery] = useState(false);

  const [formData, setFormData] = useState({
    customerName: testData.clientName || "",
    emailId: testData.emailId || "",
    contactNo: testData.contactNo || "",
    address: testData.address || "",
    projectName: "",
    siteAddress: "",
    billingAddress: "",
    testRemarks:
      testData.tests?.map((test) => ({
        ...test,
        tests:
          test.tests?.map((t) => ({
            test: t.test,
            standard: t.standard,
          })) || [],
        remarks: "",
      })) || [],
    daysRequired: "",
  });
  const handleRemarkChange = (materialId, value) => {
    setFormData((prev) => ({
      ...prev,
      testRemarks: prev.testRemarks.map((test) =>
        test.materialId === materialId ? { ...test, remarks: value } : test
      ),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(sameAsDelivery && name === "siteAddress"
        ? { billingAddress: value }
        : {}),
    }));
  };

  const handleCheckboxChange = (checked) => {
    setSameAsDelivery(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        billingAddress: prev.siteAddress,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Calculate completion date based on days required
      const completionDate = new Date();
      completionDate.setDate(
        completionDate.getDate() + parseInt(formData.daysRequired)
      );
      const formattedCompletionDate = completionDate
        .toISOString()
        .split("T")[0];

      const response = await apiRequest(
        `${API_URLS.generateROR}/${testData._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            completionDate: formattedCompletionDate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to generate ROR");
      }

      onSuccess();
    } catch (error) {
      console.error("Error generating ROR:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            name="customerName"
            value={formData.customerName}
            readOnly
            className="bg-gray-100 dark:text-white dark:bg-black"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emailId">Email ID</Label>
          <Input
            id="emailId"
            name="emailId"
            type="email"
            value={formData.emailId}
            readOnly
            className="bg-gray-100 dark:text-white dark:bg-black"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactNo">Contact Number</Label>
          <Input
            id="contactNo"
            name="contactNo"
            value={formData.contactNo}
            readOnly
            className="bg-gray-100 dark:text-white dark:bg-black"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            readOnly
            className="bg-gray-100 dark:text-white dark:bg-black"
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            required
            placeholder="Enter project name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="siteAddress">Site Address</Label>
          <Input
            id="siteAddress"
            name="siteAddress"
            value={formData.siteAddress}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="billingAddress">Billing Address</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sameAsDelivery"
                checked={sameAsDelivery}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="sameAsDelivery" className="text-sm text-gray-600">
                Same as site address
              </Label>
            </div>
          </div>
          <Input
            id="billingAddress"
            name="billingAddress"
            value={formData.billingAddress}
            onChange={handleChange}
            required
            readOnly={sameAsDelivery}
            className={
              sameAsDelivery ? "bg-gray-100 dark:text-white dark:bg-black" : ""
            }
          />
        </div>
      </div>

      <div>
        <Label>Test Details</Label>
        <div className="mt-2 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ATL ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Material ID</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Standards</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.testRemarks.map((test) => (
                <TableRow key={test.materialId}>
                  <TableCell>{test.atlId}</TableCell>
                  <TableCell>{test.date}</TableCell>
                  <TableCell>{test.material}</TableCell>
                  <TableCell>{test.materialId}</TableCell>
                  <TableCell>{test.quantity}</TableCell>
                  <TableCell>
                    {test.tests?.map((t) => t.test).join(", ") || ""}
                  </TableCell>
                  <TableCell>
                    {test.tests?.map((t) => t.standard).join(", ") || ""}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={test.remarks}
                      onChange={(e) =>
                        handleRemarkChange(test.materialId, e.target.value)
                      }
                      placeholder="Add remarks"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="daysRequired">
          No. of days required to perform the test
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            id="daysRequired"
            name="daysRequired"
            type="number"
            min="1"
            value={formData.daysRequired}
            onChange={handleChange}
            required
            className="max-w-[200px]"
            placeholder="Enter number of days"
          />
          <span className="text-sm text-gray-600">days</span>
        </div>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Generating ROR...
          </>
        ) : (
          "Generate ROR"
        )}
      </Button>
    </form>
  );
}
