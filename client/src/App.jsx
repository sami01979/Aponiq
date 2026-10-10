import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth, roleHome } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import AdminHome from "./pages/admin/AdminHome";
import Students from "./pages/admin/Students";
import People from "./pages/admin/People";
import Batches from "./pages/admin/Batches";
import Attendance from "./pages/shared/Attendance";
import TeacherHome from "./pages/teacher/TeacherHome";
import ParentHome from "./pages/parent/ParentHome";
import Fees from "./pages/admin/Fees";
import Centers from "./pages/superadmin/Centers";
import Register from "./pages/auth/Register";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? roleHome(user.role) : "/login"} replace />;
}

const portal = (role, children) => (
  <Route
    path={`/${role}`}
    element={
      <ProtectedRoute roles={[role]}>
        <DashboardLayout />
      </ProtectedRoute>
    }
  >
    {children}
  </Route>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {portal(
        "admin",
        <>
          <Route index element={<AdminHome />} />
          <Route path="students" element={<Students />} />
          <Route path="people" element={<People />} />
          <Route path="batches" element={<Batches />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="fees" element={<Fees />} />
        </>
      )}
      {portal(
        "teacher",
        <>
          <Route index element={<TeacherHome />} />
          <Route path="attendance" element={<Attendance />} />
        </>
      )}
      {portal("parent", <Route index element={<ParentHome />} />)}
      {portal("superadmin", <Route index element={<Centers />} />)}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}