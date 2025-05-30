import { EquipmentsTable } from "@/components/EquipmentsTable";
import { UpdateEquipments } from "@/components/UpdateEquipments";
import { useRef } from "react";

export default function Equipments() {
  const tableRef = useRef(null);

  const handleEquipmentAdded = () => {
    if (tableRef.current) {
      tableRef.current.refreshTable();
    }
  };

  return (
    <>
      <div>
        <h2 className="mb-4 text-2xl font-bold">
          Laboratory Equipments
        </h2>
        <div className="grid gap-4">
          <div className="border rounded-lg shadow-sm bg-card text-card-foreground">
            <div className="p-6">
              <p className="text-lg font-medium">Equipment List</p>
              <p className="text-sm text-muted-foreground">
                Manage and view all laboratory equipment
              </p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-4">
          <UpdateEquipments
            heading={"Add Equipment"}
            btnHeading={"Add Equipment"}
            onSuccess={handleEquipmentAdded}
          />
        </div>
        <div className="grid gap-4 w-max">
          <EquipmentsTable ref={tableRef} />
        </div>
      </div>
    </>
  );
}
