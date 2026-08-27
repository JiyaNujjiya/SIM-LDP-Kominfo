import { Navigate } from "react-router-dom";

type Props = {
  permission: string;
  children: React.ReactNode;
};

export default function RequirePermission({
  permission,
  children,
}: Props) {
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const permissions: string[] = user?.permissions || [];

  if (!permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}