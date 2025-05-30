export const getRoleText = (role) => {
  switch (parseInt(role)) {
    case 0:
      return "Super Admin";
    case 1:
      return "Chemical Section Head";
    case 2:
      return "Mechanical Section Head";
    case 3:
      return "Receptionist";
    case 4:
      return "Mechanical Tester";
    case 5:
      return "Chemical Tester";
    default:
      return "Unknown Role";
  }
};

export const ROLES = [
  { value: "0", label: "Super Admin" },
  { value: "1", label: "Chemical Section Head" },
  { value: "2", label: "Mechanical Section Head" },
  { value: "3", label: "Receptionist" },
  { value: "4", label: "Mechanical Tester" },
  { value: "5", label: "Chemical Tester" }
]; 