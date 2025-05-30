"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { API_URLS, apiRequest } from "@/config/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForgotPassDialog } from "@/components/ForgotPassDialog";
import { useAuth } from "@/contexts/AuthContext";

export function LoginForm({ className, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassOpen, setForgotPassOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await apiRequest(API_URLS.login, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (!data.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(
        {
          username: data.username,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          role: data.role,
          _id: data._id,
        },
        data.token
      );

      switch (parseInt(data.role)) {
        case 0:
          window.location.href = "/superadmin";
          break;
        case 1:
        case 2:
          window.location.href = "/sectionhead";
          break;
        case 3:
          window.location.href = "/receptionist";
          break;
        case 4:
        case 5:
          window.location.href = "/tester";
          break;
        default:
          setError("Invalid user role");
      }
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto dark:bg-white dark:text-black dark:border-gray-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          Login to Your Account
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 rounded-md bg-red-50">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              className = "dark:border-gray-200"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                className = "dark:border-gray-200"
                placeholder="Enter your password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full  dark:bg-black dark:text-white dark:hover:bg-black/90" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="link"
            className="px-0 text-sm dark:text-black underline"
            onClick={() => setForgotPassOpen(true)}
          >
            Forgot password?
          </Button>
        </div>
      </CardContent>

      <ForgotPassDialog
        open={forgotPassOpen}
        onOpenChange={setForgotPassOpen}
      />
    </Card>
  );
}
