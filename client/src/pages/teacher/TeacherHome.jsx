import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function TeacherHome() {
  const [batches, setBatches] = useState(null);
  const todayKey = DAY_KEYS[new Date().getDay()];

  useEffect(() => {
    api
      .get("/batches")
      .then(async (r) => {
        const list = await Promise.all(
          r.data.batches.map((b) =>
            api
              .get(`/batches/${b._id}/students`)
              .then((s) => ({ ...b, studentCount: s.data.count }))
              .catch(() => ({ ...b, studentCount: 0 }))
          )
        );
        setBatches(list);
      })
      .catch(() => setBatches([]));
  }, []);

  if (!batches) return <div className="text-gray-400">Loading...</div>;

  const todays = batches.filter((b) => b.days.includes(todayKey));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">My Batches</h1>
        <Link to="/teacher/attendance" className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm">
          Take attendance
        </Link>
      </div>

      <div className="bg-indigo-50 text-indigo-700 rounded-xl p-4 mb-4 text-sm">
        {todays.length > 0
          ? `Today you have ${todays.length} class${todays.length > 1 ? "es" : ""}: ${todays
              .map((b) => b.name)
              .join(", ")}`
          : "No classes scheduled for today."}
      </div>

      {batches.length === 0 ? (
        <div className="text-gray-400">No batches are assigned to you yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => (
            <div key={b._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{b.name}</div>
                  {b.subject && <div className="text-xs text-gray-400">{b.subject}</div>}
                </div>
                {b.days.includes(todayKey) && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Today</span>
                )}
              </div>
              <div className="mt-3 text-sm text-gray-600 capitalize">{b.days.join(", ") || "-"}</div>
              {b.startTime && (
                <div className="text-sm text-gray-400">
                  {b.startTime} - {b.endTime}
                </div>
              )}
              <div className="mt-3 text-sm">
                <span className="font-semibold">{b.studentCount}</span>{" "}
                <span className="text-gray-500">students</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}