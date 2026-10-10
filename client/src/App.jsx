import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth, roleHome } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import AdminHome from "./pages/admin/AdminHome";
import TeacherHome from "./pages/teacher/TeacherHome";
import ParentHome from "./pages/parent/ParentHome";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? roleHome(user.role) : "/login"} replace />;
}

const portal = (role, home) => (
  <Route
    path={`/${role}`}
    element={
      <ProtectedRoute roles={[role]}>
        <DashboardLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={home} />
  </Route>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      {portal("admin", <AdminHome />)}
      {portal("teacher", <TeacherHome />)}
      {portal("parent", <ParentHome />)}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}