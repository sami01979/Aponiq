import { useEffect, useState } from "react";
import api from "../../api/axios";

// Local date as YYYY-MM-DD (avoids UTC off-by-one in Bangladesh mornings)
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const OPTIONS = [
  { value: "present", label: "Present", active: "bg-green-600 text-white" },
  { value: "absent", label: "Absent", active: "bg-red-600 text-white" },
  { value: "late", label: "Late", active: "bg-amber-500 text-white" },
];

export default function Attendance() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(today());
  const [roster, setRoster] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/batches").then((r) => {
      setBatches(r.data.batches);
      if (r.data.batches[0]) setBatchId(r.data.batches[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!batchId || !date) return;
    setError("");
    setSaved(false);
    api
      .get("/attendance", { params: { batchId, date } })
      .then((r) => {
        setRoster(r.data.roster);
        const map = {};
        r.data.roster.forEach((s) => (map[s._id] = "present"));
        r.data.attendance?.records.forEach((rec) => (map[rec.student] = rec.status));
        setStatuses(map);
        setSaved(!!r.data.attendance);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load"));
  }, [batchId, date]);

  const setStatus = (id, status) => {
    setStatuses((s) => ({ ...s, [id]: status }));
    setSaved(false);
  };

  const markAll = (status) => {
    const map = {};
    roster.forEach((s) => (map[s._id] = status));
    setStatuses(map);
    setSaved(false);
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      await api.post("/attendance", {
        batchId,
        date,
        records: roster.map((s) => ({ studentId: s._id, status: statuses[s._id] })),
      });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const counts = Object.values(statuses).reduce((c, s) => ({ ...c, [s]: (c[s] || 0) + 1 }), {});

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Attendance</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {batches.length === 0 && <div className="text-gray-400">No batches available.</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-2 mb-3">{error}</div>}

      {roster.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-sm">
            <div className="text-gray-500">
              Present {counts.present || 0} · Absent {counts.absent || 0} · Late {counts.late || 0}
            </div>
            <div className="flex gap-3">
              <button onClick={() => markAll("present")} className="text-indigo-600 hover:underline">
                All present
              </button>
              <button onClick={() => markAll("absent")} className="text-indigo-600 hover:underline">
                All absent
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow divide-y">
            {roster.map((s) => (
              <div key={s._id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  {s.name} <span className="text-xs text-gray-400">{s.studentId}</span>
                </div>
                <div className="flex gap-1">
                  {OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setStatus(s._id, o.value)}
                      className={`px-3 py-1 rounded-lg text-sm border ${
                        statuses[s._id] === o.value ? o.active : "bg-white text-gray-600"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={save}
              disabled={saving}
              className="bg-indigo-600 text-white rounded-lg px-5 py-2 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save attendance"}
            </button>
            {saved && <span className="text-green-600 text-sm">Saved</span>}
          </div>
        </>
      )}

      {batchId && roster.length === 0 && !error && (
        <div className="text-gray-400">No students enrolled in this batch yet.</div>
      )}
    </div>
  );
}