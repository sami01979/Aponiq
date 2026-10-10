import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth, roleHome } from "../../context/AuthContext";

const input = "w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500";

export default function Register() {
  const { user } = useAuth();
  const [form, setForm] = useState({ centerName: "", name: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (user) return <Navigate to={roleHome(user.role)} replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/register-center", {
        centerName: form.centerName.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-bold">Registration received</h1>
          <p className="text-gray-500 text-sm">
            Thank you! Your center will be activated after review. We'll contact you on{" "}
            <span className="font-medium">{form.phone}</span>.
          </p>
          <Link to="/login" className="inline-block text-indigo-600 hover:underline text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Aponiq</h1>
        <p className="text-center text-gray-500 text-sm">Register your coaching center</p>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded p-2">{error}</div>}

        <input
          className={input}
          placeholder="Coaching center name"
          value={form.centerName}
          onChange={set("centerName")}
          required
        />
        <input className={input} placeholder="Your full name" value={form.name} onChange={set("name")} required />
        <input
          type="tel"
          className={input}
          placeholder="Phone number (your login id)"
          value={form.phone}
          onChange={set("phone")}
          required
        />
        <input
          type="password"
          className={input}
          placeholder="Password (min 6)"
          value={form.password}
          onChange={set("password")}
          minLength={6}
          required
        />
        <input
          type="password"
          className={input}
          placeholder="Confirm password"
          value={form.confirm}
          onChange={set("confirm")}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Register"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}