import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface RequirePermissionProps {
  permission: string;
  children: ReactNode;
}

export default function RequirePermission({
  permission,
  children,
}: RequirePermissionProps) {
  const savedUser = sessionStorage.getItem("user");

  if (!savedUser) {
    return <Navigate to="/" replace />;
  }

  let user: any;

  try {
    user = JSON.parse(savedUser);
  } catch {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");

    return <Navigate to="/" replace />;
  }

  const permissions: string[] =
    user?.permissions || [];

  if (!permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}