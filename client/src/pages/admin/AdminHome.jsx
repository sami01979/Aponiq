import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminHome() {
  const [usage, setUsage] = useState(null);
  const [fees, setFees] = useState(null);
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    api.get("/students/usage").then((r) => setUsage(r.data)).catch(() => setUsage(null));
    api.get(`/fees?month=${month}`).then((r) => setFees(r.data.totals)).catch(() => setFees(null));
  }, [month]);

  const Card = ({ label, value, sub }) => (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value ?? "..."}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );

  const nearLimit = usage && usage.limit !== null && usage.count >= usage.limit * 0.9;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>

      {nearLimit && (
        <div className="bg-amber-50 text-amber-700 text-sm rounded-lg p-3 mb-4">
          You are close to your plan's student limit. Contact support to upgrade.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          label="Students"
          value={usage && `${usage.count} / ${usage.limit ?? "∞"}`}
          sub={usage && `${usage.plan} plan`}
        />
        <Card label={`Billed (${month})`} value={fees && `৳${fees.billed}`} />
        <Card label="Collected" value={fees && `৳${fees.collected}`} />
        <Card label="Outstanding" value={fees && `৳${fees.outstanding}`} />
      </div>
    </div>
  );
}