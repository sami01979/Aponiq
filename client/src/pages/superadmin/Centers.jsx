import { useEffect, useState } from "react";
import api from "../../api/axios";

const BADGE = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "-");

export default function Centers() {
  const [centers, setCenters] = useState([]);
  const [filter, setFilter] = useState("");

  const load = () =>
    api.get("/superadmin/centers", { params: { status: filter || undefined } }).then((r) => setCenters(r.data.centers));

  useEffect(() => {
    load();
  }, [filter]);

  const patch = async (id, body) => {
    await api.patch(`/superadmin/centers/${id}`, body);
    load();
  };

  const addDays = (c, days) => {
    const base =
      c.subscriptionEndsAt && new Date(c.subscriptionEndsAt) > new Date()
        ? new Date(c.subscriptionEndsAt)
        : new Date();
    base.setDate(base.getDate() + days);
    return base.toISOString();
  };

  const activate = (c) => {
    const body = { status: "active" };
    if (!c.subscriptionEndsAt || new Date(c.subscriptionEndsAt) < new Date()) {
      body.subscriptionEndsAt = addDays(c, 30);
    }
    patch(c._id, body);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Coaching Centers</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Center</th>
              <th className="p-3">Admin</th>
              <th className="p-3">Status</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Students</th>
              <th className="p-3">Paid until</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {centers.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="p-3">
                  {c.name}
                  <div className="text-xs text-gray-400">{fmt(c.createdAt)}</div>
                </td>
                <td className="p-3">
                  {c.admin?.name}
                  <div className="text-xs text-gray-400">{c.admin?.phone}</div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${BADGE[c.status]}`}>{c.status}</span>
                </td>
                <td className="p-3">
                  <select
                    value={c.plan}
                    onChange={(e) => patch(c._id, { plan: e.target.value })}
                    className="border rounded px-2 py-1 text-sm capitalize"
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="pro">Pro</option>
                  </select>
                </td>
                <td className="p-3">
                  {c.studentCount} / {c.studentLimit ?? "∞"}
                </td>
                <td className="p-3">{fmt(c.subscriptionEndsAt)}</td>
                <td className="p-3 text-right space-x-3 whitespace-nowrap">
                  {c.status !== "active" && (
                    <button onClick={() => activate(c)} className="text-green-600 hover:underline">
                      {c.status === "pending" ? "Approve" : "Reactivate"}
                    </button>
                  )}
                  {c.status === "active" && (
                    <>
                      <button
                        onClick={() => patch(c._id, { subscriptionEndsAt: addDays(c, 30) })}
                        className="text-indigo-600 hover:underline"
                      >
                        +30 days
                      </button>
                      <button onClick={() => patch(c._id, { status: "suspended" })} className="text-red-600 hover:underline">
                        Suspend
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {centers.length === 0 && (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-400">
                  No centers
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}