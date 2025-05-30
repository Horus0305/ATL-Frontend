import { useState } from "react";
import { OTPVerificationDialog } from "./OTPVerificationDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

export function OTPResetFlow() {
  const [openOTPDialog, setOpenOTPDialog] = useState(true); // OTP dialog opens first
  const [openResetDialog, setOpenResetDialog] = useState(false); // Reset Password dialog closed initially

  return (
    <>
      {openOTPDialog && (
        <OTPVerificationDialog
          setOpenOTPDialog={setOpenOTPDialog}
          setOpenResetDialog={setOpenResetDialog}
        />
      )}

      <ResetPasswordDialog
        open={openResetDialog}
        setOpen={setOpenResetDialog}
      />
    </>
  );
}
