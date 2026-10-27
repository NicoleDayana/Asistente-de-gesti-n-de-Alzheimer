import { useState } from "react";
import RoleSelect, { type Role } from "./components/RoleSelect";
import PatientView from "./components/patient/PatientView";
import CaregiverView from "./components/CaregiverView";

export default function App() {
  const [role, setRole] = useState<Role | null>(null);

  if (role === "patient") return <PatientView onExit={() => setRole(null)} />;
  if (role === "caregiver") return <CaregiverView onExit={() => setRole(null)} />;
  return <RoleSelect onSelect={setRole} />;
}
