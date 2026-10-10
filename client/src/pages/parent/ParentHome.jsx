import { useEffect, useState } from "react";
import api from "../../api/axios";

const monthNow = () => new Date().toISOString().slice(0, 7);

const FEE_BADGE = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  due: "bg-red-100 text-red-700",
};

const ATT_COLOR = {
  present: "text-green-600",
  absent: "text-red-600",
  late: "text-amber-600",
};

function ChildCard({ child }) {
  const [att, setAtt] = useState(null);
  const [fees, setFees] = useState(null);
  const month = monthNow();

  useEffect(() => {
    api
      .get(`/attendance/student/${child._id}`, { params: { from: `${month}-01`, to: `${month}-31` } })
      .then((r) => setAtt(r.data))
      .catch(() => setAtt({ summary: { present: 0, absent: 0, late: 0, total: 0 }, entries: [] }));
    api
      .get(`/fees/student/${child._id}`)
      .then((r) => setFees(r.data))
      .catch(() => setFees({ totalDue: 0, fees: [] }));
  }, [child._id, month]);

  const s = att?.summary;
  const rate = s && s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : null;

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-5">
      <div>
        <div className="text-lg font-semibold">{child.name}</div>
        <div className="text-sm text-gray-400">{child.studentId}</div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-600 mb-2">Attendance this month</div>
        {!att ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : s.total === 0 ? (
          <div className="text-gray-400 text-sm">No classes recorded yet</div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-lg font-bold">{rate}%</div>
                <div className="text-xs text-gray-500">Rate</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-lg font-bold text-green-600">{s.present}</div>
                <div className="text-xs text-gray-500">Present</div>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <div className="text-lg font-bold text-red-600">{s.absent}</div>
                <div className="text-xs text-gray-500">Absent</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-2">
                <div className="text-lg font-bold text-amber-600">{s.late}</div>
                <div className="text-xs text-gray-500">Late</div>
              </div>
            </div>

            <div className="mt-3 divide-y text-sm">
              {att.entries.slice(0, 5).map((e, i) => (
                <div key={i} className="flex justify-between py-1.5">
                  <span className="text-gray-600">
                    {e.date} <span className="text-gray-400">{e.batch?.name}</span>
                  </span>
                  <span className={`capitalize ${ATT_COLOR[e.status]}`}>{e.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-600">Fees</div>
          {fees && (
            <div className={`text-sm font-semibold ${fees.totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
              {fees.totalDue > 0 ? `Due: ৳${fees.totalDue}` : "All paid"}
            </div>
          )}
        </div>
        {!fees ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : fees.fees.length === 0 ? (
          <div className="text-gray-400 text-sm">No fees generated yet</div>
        ) : (
          <div className="divide-y text-sm">
            {fees.fees.slice(0, 6).map((f) => (
              <div key={f._id} className="flex items-center justify-between py-1.5">
                <span className="text-gray-600">
                  {f.month} <span className="text-gray-400">{f.batch?.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-gray-500">
                    ৳{f.paid} / ৳{f.amount}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${FEE_BADGE[f.status]}`}>
                    {f.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ParentHome() {
  const [children, setChildren] = useState(null);

  useEffect(() => {
    api
      .get("/students/my")
      .then((r) => setChildren(r.data.students))
      .catch(() => setChildren([]));
  }, []);

  if (!children) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">My Children</h1>
      {children.length === 0 ? (
        <div className="text-gray-400">
          No children are linked to your account yet. Please contact the coaching center.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {children.map((c) => (
            <ChildCard key={c._id} child={c} />
          ))}
        </div>
      )}
    </div>
  );
}