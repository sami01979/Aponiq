import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminHome() {
  const [students, setStudents] = useState(null);
  const [fees, setFees] = useState(null);
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    api.get("/students").then((r) => setStudents(r.data.count)).catch(() => setStudents(0));
    api.get(`/fees?month=${month}`).then((r) => setFees(r.data.totals)).catch(() => setFees(null));
  }, [month]);

  const Card = ({ label, value }) => (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value ?? "..."}</div>
    </div>
  );

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Students" value={students} />
        <Card label={`Billed (${month})`} value={fees && `৳${fees.billed}`} />
        <Card label="Collected" value={fees && `৳${fees.collected}`} />
        <Card label="Outstanding" value={fees && `৳${fees.outstanding}`} />
      </div>
    </div>
  );
}