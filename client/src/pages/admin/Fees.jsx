import { useEffect, useState } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const currentMonth = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 7);
};

const BADGE = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  due: "bg-red-100 text-red-700",
};

const METHODS = ["cash", "bkash", "nagad", "bank", "other"];
const input = "w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500";

export default function Fees() {
  const [month, setMonth] = useState(currentMonth());
  const [status, setStatus] = useState("");
  const [batchId, setBatchId] = useState("");
  const [batches, setBatches] = useState([]);
  const [fees, setFees] = useState([]);
  const [totals, setTotals] = useState({ billed: 0, collected: 0, outstanding: 0 });
  const [notice, setNotice] = useState("");
  const [generating, setGenerating] = useState(false);

  // payment modal
  const [payFee, setPayFee] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .get("/fees", { params: { month, status: status || undefined, batchId: batchId || undefined } })
      .then((r) => {
        setFees(r.data.fees);
        setTotals(r.data.totals);
      });

  useEffect(() => {
    api.get("/batches").then((r) => setBatches(r.data.batches));
  }, []);

  useEffect(() => {
    if (month) load();
  }, [month, status, batchId]);

  const generate = async () => {
    setNotice("");
    setGenerating(true);
    try {
      const r = await api.post("/fees/generate", { month });
      setNotice(`Created ${r.data.created} new due(s), skipped ${r.data.skipped} already existing.`);
      load();
    } catch (err) {
      setNotice(err.response?.data?.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const openPay = (fee) => {
    setPayFee(fee);
    setAmount(String(fee.amount - fee.paid));
    setMethod("cash");
    setNote("");
    setError("");
  };

  const submitPay = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/fees/${payFee._id}/pay`, {
        amount: Number(amount),
        method,
        note: note || undefined,
      });
      setPayFee(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const Card = ({ label, value, color = "" }) => (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>৳{value}</div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Fees</h1>
        <button
          onClick={generate}
          disabled={generating || !month}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60"
        >
          {generating ? "Generating..." : `Generate dues for ${month}`}
        </button>
      </div>

      {notice && <div className="bg-indigo-50 text-indigo-700 text-sm rounded-lg p-3 mb-4">{notice}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Card label="Billed" value={totals.billed} />
        <Card label="Collected" value={totals.collected} color="text-green-600" />
        <Card label="Outstanding" value={totals.outstanding} color="text-red-600" />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="due">Due</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All batches</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Batch</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f._id} className="border-t">
                <td className="p-3">
                  {f.student?.name}
                  <div className="text-xs text-gray-400">{f.student?.studentId}</div>
                </td>
                <td className="p-3">{f.batch?.name}</td>
                <td className="p-3">৳{f.amount}</td>
                <td className="p-3">৳{f.paid}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${BADGE[f.status]}`}>
                    {f.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => openPay(f)} className="text-indigo-600 hover:underline">
                    {f.status === "paid" ? "History" : "Pay"}
                  </button>
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-400">
                  No fees for this filter. Try "Generate dues" for the month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {payFee && (
        <Modal title={`${payFee.student?.name}: ${payFee.month}`} onClose={() => setPayFee(null)}>
          <div className="text-sm text-gray-600 mb-3">
            {payFee.batch?.name} · Total ৳{payFee.amount} · Paid ৳{payFee.paid} · Remaining ৳
            {payFee.amount - payFee.paid}
          </div>

          {payFee.status !== "paid" && (
            <form onSubmit={submitPay} className="space-y-3 mb-4">
              {error && <div className="bg-red-50 text-red-600 text-sm rounded p-2">{error}</div>}
              <input
                type="number"
                min="1"
                max={payFee.amount - payFee.paid}
                className={input}
                placeholder="Amount (৳)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <select className={input} value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map((m) => (
                  <option key={m} value={m} className="capitalize">
                    {m}
                  </option>
                ))}
              </select>
              <input
                className={input}
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                disabled={saving}
                className="w-full bg-indigo-600 text-white rounded-lg py-2 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Record payment"}
              </button>
            </form>
          )}

          <div className="text-sm font-medium text-gray-600 mb-1">Payment history</div>
          <div className="border rounded-lg divide-y text-sm">
            {payFee.payments.map((p, i) => (
              <div key={i} className="flex justify-between p-2">
                <span>
                  ৳{p.amount} <span className="text-gray-400 capitalize">via {p.method}</span>
                  {p.note && <span className="text-gray-400"> · {p.note}</span>}
                </span>
                <span className="text-gray-400">{new Date(p.paidAt).toLocaleDateString()}</span>
              </div>
            ))}
            {payFee.payments.length === 0 && <div className="p-3 text-gray-400">No payments yet</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}