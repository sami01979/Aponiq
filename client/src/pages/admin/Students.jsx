import { useEffect, useState } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const empty = { name: "", gender: "", phone: "", address: "", parents: [] };
const input = "w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get("/students", { params: { search } }).then((r) => setStudents(r.data.students));

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openModal = () => {
    setForm(empty);
    setError("");
    api.get("/users", { params: { role: "parent" } }).then((r) => setParents(r.data.users));
    setOpen(true);
  };

  const toggleParent = (id) =>
    setForm((f) => ({
      ...f,
      parents: f.parents.includes(id) ? f.parents.filter((p) => p !== id) : [...f.parents, id],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.gender) delete payload.gender;
      await api.post("/students", payload);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Students</h1>
        <button onClick={openModal} className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm">
          + Add student
        </button>
      </div>

      <input
        placeholder="Search name, ID or phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm w-full sm:w-72 mb-4"
      />

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Parents</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-3 text-gray-500">{s.studentId}</td>
                <td className="p-3">{s.name}</td>
                <td className="p-3">{s.phone || "-"}</td>
                <td className="p-3">{s.parents.map((p) => p.name).join(", ") || "-"}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-400">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Add student" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded p-2">{error}</div>}
            <input
              className={input}
              placeholder="Student name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <select
              className={input}
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Gender (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input
              className={input}
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className={input}
              placeholder="Address (optional)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <div>
              <div className="text-sm text-gray-600 mb-1">Link parents</div>
              <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                {parents.map((p) => (
                  <label key={p._id} className="flex items-center gap-2 p-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.parents.includes(p._id)}
                      onChange={() => toggleParent(p._id)}
                    />
                    {p.name} <span className="text-gray-400">{p.phone}</span>
                  </label>
                ))}
                {parents.length === 0 && (
                  <div className="p-3 text-sm text-gray-400">No parents yet. Add them in People first.</div>
                )}
              </div>
            </div>

            <button
              disabled={saving}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}