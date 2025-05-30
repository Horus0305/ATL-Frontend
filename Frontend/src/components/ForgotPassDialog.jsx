"use client";

import { useState } from "react";
import { API_URLS, apiRequest } from "@/config/api";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

export function ForgotPassDialog({ open, onOpenChange }) {
  const { toast } = useToast();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      

      const response = await apiRequest(API_URLS.checkEmail, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      

      if (!response.ok) {
        throw new Error(response.error || "Email not registered in our system");
      }

      // If email exists, proceed to OTP step
      const otpResponse = await apiRequest(API_URLS.sendOTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      

      if (!otpResponse.ok) {
        throw new Error("Failed to send OTP. Please try again.");
      }

      setStep("otp");
    } catch (err) {
      
      setError(err.message || "Something went wrong. Please try again.");
      setStep("email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setIsLoading(true);

    try {
      if (otp.length !== 6) {
        throw new Error("Please enter a valid 6-digit OTP");
      }

      const response = await apiRequest(API_URLS.verifyOTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error(response.error || "Invalid OTP");
      }

      setStep("newPassword");
    } catch (err) {
      console.error("Error details:", err);
      setOtpError(err.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setIsLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      console.log("Submitting password update:", {
        email,
        otpProvided: !!otp,
        passwordProvided: !!newPassword
      });

      const response = await apiRequest(API_URLS.updatePassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword
        }),
      });

      console.log("Password update response:", response);

      if (!response.ok) {
        throw new Error(response.error || "Failed to update password");
      }

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Error details:", err);
      setPasswordError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "email":
        return (
          <form onSubmit={handleEmailSubmit}>
            <DialogHeader>
              <DialogTitle>Forgot Password</DialogTitle>
              <DialogDescription>
                Enter your email address to receive a verification code.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(""); // Clear error when user types
                }}
                placeholder="Enter your email"
                className="mt-2"
                required
              />
              {error && (
                <div className="mt-2 text-sm text-red-500">{error}</div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Checking..." : "Send Code"}
              </Button>
            </DialogFooter>
          </form>
        );

      case "otp":
        return (
          <form onSubmit={handleOTPSubmit}>
            <DialogHeader>
              <DialogTitle>Enter Verification Code</DialogTitle>
              <DialogDescription>
                We've sent a code to {email}. Please enter it below.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-4">
              <InputOTP 
                value={otp} 
                onChange={(value) => {
                  setOtp(value);
                  setOtpError(""); // Clear error when user types
                }} 
                maxLength={6}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {otpError && (
                <div className="mt-2 text-sm text-red-500">{otpError}</div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            </DialogFooter>
          </form>
        );

      case "newPassword":
        return (
          <form onSubmit={handlePasswordSubmit}>
            <DialogHeader>
              <DialogTitle>Set New Password</DialogTitle>
              <DialogDescription>
                Please enter your new password
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Enter new password"
                    className="mt-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-[60%] transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Confirm new password"
                    className="mt-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[60%] transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {passwordError && (
                <div className="text-sm text-red-500">{passwordError}</div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Reset state when dialog is closed
          setStep("email");
          setEmail("");
          setOtp("");
          setError("");
          setOtpError("");
          setNewPassword("");
          setConfirmPassword("");
          setPasswordError("");
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[400px]">{renderStep()}</DialogContent>
    </Dialog>
  );
}
