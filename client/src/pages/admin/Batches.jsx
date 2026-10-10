import { useEffect, useState } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const DAYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
const empty = { name: "", subject: "", teacher: "", days: [], startTime: "", endTime: "", monthlyFee: "" };
const input = "w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500";

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // enroll modal
  const [manage, setManage] = useState(null); 
  const [enrolled, setEnrolled] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [pick, setPick] = useState("");
  const [enrollError, setEnrollError] = useState("");

  const load = () => api.get("/batches").then((r) => setBatches(r.data.batches));

  useEffect(() => {
    load();
    api.get("/users", { params: { role: "teacher" } }).then((r) => setTeachers(r.data.users));
  }, []);

  const toggleDay = (d) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, monthlyFee: Number(form.monthlyFee) || 0 };
      if (!payload.teacher) delete payload.teacher;
      await api.post("/batches", payload);
      setOpen(false);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const loadEnrolled = (id) =>
    api.get(`/batches/${id}/students`).then((r) => setEnrolled(r.data.enrollments));

  const openManage = (b) => {
    setManage(b);
    setPick("");
    setEnrollError("");
    loadEnrolled(b._id);
    api.get("/students").then((r) => setAllStudents(r.data.students));
  };

  const enroll = async () => {
    if (!pick) return;
    setEnrollError("");
    try {
      await api.post(`/batches/${manage._id}/enroll`, { studentId: pick });
      setPick("");
      loadEnrolled(manage._id);
    } catch (err) {
      setEnrollError(err.response?.data?.message || "Failed to enroll");
    }
  };

  const remove = async (enrollmentId) => {
    await api.patch(`/batches/enrollments/${enrollmentId}`, { status: "left" });
    loadEnrolled(manage._id);
  };

  const enrolledIds = new Set(enrolled.map((e) => e.student._id));
  const available = allStudents.filter((s) => !enrolledIds.has(s._id));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Batches</h1>
        <button
          onClick={() => {
            setForm(empty);
            setError("");
            setOpen(true);
          }}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm"
        >
          + Add batch
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Batch</th>
              <th className="p-3">Teacher</th>
              <th className="p-3">Schedule</th>
              <th className="p-3">Fee</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b._id} className="border-t">
                <td className="p-3">
                  {b.name}
                  {b.subject && <div className="text-xs text-gray-400">{b.subject}</div>}
                </td>
                <td className="p-3">{b.teacher?.name || "-"}</td>
                <td className="p-3 capitalize">
                  {b.days.join(", ") || "-"}
                  {b.startTime && <div className="text-xs text-gray-400">{b.startTime} - {b.endTime}</div>}
                </td>
                <td className="p-3">৳{b.monthlyFee}</td>
                <td className="p-3 text-right">
                  <button onClick={() => openManage(b)} className="text-indigo-600 hover:underline">
                    Students
                  </button>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-400">
                  No batches yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Add batch" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded p-2">{error}</div>}
            <input
              className={input}
              placeholder="Batch name (e.g. Class 9 Math)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className={input}
              placeholder="Subject (optional)"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <select
              className={input}
              value={form.teacher}
              onChange={(e) => setForm({ ...form, teacher: e.target.value })}
            >
              <option value="">Teacher (optional)</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>

            <div>
              <div className="text-sm text-gray-600 mb-1">Days</div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`px-3 py-1 rounded-full text-sm capitalize border ${
                      form.days.includes(d) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                className={input}
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
              <input
                type="time"
                className={input}
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
            <input
              type="number"
              min="0"
              className={input}
              placeholder="Monthly fee (৳)"
              value={form.monthlyFee}
              onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
            />
            <button
              disabled={saving}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </Modal>
      )}

      {manage && (
        <Modal title={`${manage.name}: students`} onClose={() => setManage(null)}>
          {enrollError && <div className="bg-red-50 text-red-600 text-sm rounded p-2 mb-3">{enrollError}</div>}

          <div className="flex gap-2 mb-4">
            <select className={input} value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Select student to enroll</option>
              {available.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.studentId} {s.name}
                </option>
              ))}
            </select>
            <button onClick={enroll} className="bg-indigo-600 text-white rounded-lg px-4 text-sm">
              Enroll
            </button>
          </div>

          <div className="border rounded-lg divide-y">
            {enrolled.map((e) => (
              <div key={e._id} className="flex items-center justify-between p-2 text-sm">
                <span>
                  {e.student.name} <span className="text-gray-400">{e.student.studentId}</span>
                </span>
                <button onClick={() => remove(e._id)} className="text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            ))}
            {enrolled.length === 0 && <div className="p-3 text-sm text-gray-400">No students enrolled</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}