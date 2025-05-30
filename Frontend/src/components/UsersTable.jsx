import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getRoleText } from "@/utils/roles"; // Import the utility function
import { Loader2 } from "lucide-react";
import { UpdateModal } from "./UpdateModal";

export function UsersTable({ users, onUpdate, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email Id</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Update</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user._id}>
            <TableCell>{user.firstname} {user.lastname}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.username}</TableCell>
            <TableCell>{getRoleText(user.role)}</TableCell>
            <TableCell>
              <UpdateModal
                userData={user}
                btnHeading="Update"
                heading="Update User"
                onSuccess={() => onUpdate(user)}
                variant="default"
                className="dark:hover:bg-[#E8E8E8] dark:bg-white dark:text-black w-full"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 