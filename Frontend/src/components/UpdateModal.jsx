import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectRole } from "./SelectRole";
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

export function UpdateModal({ 
  heading, 
  btnHeading, 
  userData, 
  onSuccess,
  className,
  isClient = false,
  variant = "default"
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(
    isClient ? {
      clientname: userData?.clientname || "",
      contactno: userData?.contactno || "",
      emailid: userData?.emailid || "",
      address: userData?.address || ""
    } : {
      firstname: userData?.firstname || "",
      lastname: userData?.lastname || "",
      username: userData?.username || "",
      email: userData?.email || "",
      role: userData?.role?.toString() || "1",
      password: "",
      confirmPassword: ""
    }
  );

  // Update formData when userData changes
  useEffect(() => {
    if (userData) {
      setFormData(
        isClient ? {
          clientname: userData.clientname || "",
          contactno: userData.contactno || "",
          emailid: userData.emailid || "",
          address: userData.address || ""
        } : {
          firstname: userData.firstname || "",
          lastname: userData.lastname || "",
          username: userData.username || "",
          email: userData.email || "",
          role: userData.role?.toString() || "1",
          password: "",
          confirmPassword: ""
        }
      );
    }
  }, [userData, isClient]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
  };

  const validateForm = (data) => {
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Phone number validation regex (adjust as needed)
    const phoneRegex = /^\d{10}$/;

    if (!data.clientname?.trim()) {
      throw new Error("Client name is required");
    }

    if (!data.emailid?.trim()) {
      throw new Error("Email address is required");
    }

    if (!emailRegex.test(data.emailid)) {
      throw new Error("Please enter a valid email address");
    }

    if (!data.contactno?.trim()) {
      throw new Error("Contact number is required");
    }

    if (!phoneRegex.test(data.contactno)) {
      throw new Error("Please enter a valid 10-digit contact number");
    }

    if (!data.address?.trim()) {
      throw new Error("Address is required");
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (isClient) {
        validateForm(data);
      }

      const url = isClient
        ? (userData 
          ? `${API_URLS.updateClient}/${userData._id}`
          : API_URLS.createClient)
        : (userData 
          ? `${API_URLS.updateUser}/${userData._id}`
          : API_URLS.createUser);
      
      const method = userData ? 'PUT' : 'POST';

      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: response.message || `${isClient ? 'Client' : 'User'} ${userData ? 'updated' : 'created'} successfully`,
        });
        setOpen(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      // Handle different types of errors
      if (error.status === 409) {
        toast({
          variant: "destructive",
          title: "Duplicate Entry",
          description: error.message,
        });
      } else if (error.status === 400) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.message,
        });
      } else if (error.status === 422) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  const formFields = isClient ? [
    { id: "clientname", label: "Name", type: "text", required: true },
    { id: "contactno", label: "Number", type: "text", required: true },
    { id: "emailid", label: "Email", type: "email", required: true },
    { id: "address", label: "Address", type: "text", required: true },
  ] : [
    { id: "firstname", label: "First Name", type: "text", required: true },
    { id: "lastname", label: "Last Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "username", label: "Username", type: "text", required: true },
    { id: "role", label: "Role", type: "select", required: true },
    { id: "password", label: "New Password", type: "password", required: false },
    { id: "confirmPassword", label: "Confirm Password", type: "password", required: false },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant={variant}
          className={`${className} ${
            variant === "default" ? "bg-black hover:bg-black/90 text-white" : ""
          }`}
        >
          {btnHeading || (userData ? "Update" : "Add")}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{heading || (userData ? "Update User" : "Add User")}</SheetTitle>
          <SheetDescription>
            {isClient ? "Add or edit client information" : "Make changes to user profile here."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(formData);
        }}>
          <div className="grid gap-4 py-4">
            {formFields.map((field) => (
              <div key={field.id} className="grid items-center grid-cols-4 gap-4">
                <Label htmlFor={field.id} className="text-right">
                  {field.label}
                </Label>
                {field.type === "select" ? (
                  <SelectRole
                    value={formData[field.id]}
                    onValueChange={(value) => handleChange({ target: { id: field.id, value } })}
                  />
                ) : (
                  <Input
                    id={field.id}
                    type={field.type}
                    value={formData[field.id]}
                    onChange={handleChange}
                    className="col-span-3"
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          <SheetFooter>
            <Button 
              type="submit" 
              className="bg-black hover:bg-black/90 text-white"
            >
              {userData ? "Save changes" : btnHeading}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
