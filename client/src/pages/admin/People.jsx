import { useEffect, useState } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const empty = { name: "", phone: "", password: "" };
const input = "w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500";

export default function People() {
  const [role, setRole] = useState("teacher");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get("/users", { params: { role, search } }).then((r) => setUsers(r.data.users));

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [role, search]);

  const openModal = () => {
    setForm(empty);
    setError("");
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/users", { ...form, role });
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    await api.patch(`/users/${u._id}`, { isActive: !u.isActive });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">People</h1>
        <button onClick={openModal} className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm">
          + Add {role}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex rounded-lg overflow-hidden border">
          {["teacher", "parent"].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-4 py-2 text-sm capitalize ${
                role === r ? "bg-indigo-600 text-white" : "bg-white text-gray-600"
              }`}
            >
              {r}s
            </button>
          ))}
        </div>
        <input
          placeholder="Search name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-64"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3">
                  <span className={u.isActive ? "text-green-600" : "text-red-500"}>
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => toggleActive(u)} className="text-indigo-600 hover:underline">
                    {u.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-400">
                  No {role}s yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={`Add ${role}`} onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded p-2">{error}</div>}
            <input
              className={input}
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className={input}
              placeholder="Phone (login id)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <input
              className={input}
              type="password"
              placeholder="Password (min 6)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
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
    </div>
  );
}