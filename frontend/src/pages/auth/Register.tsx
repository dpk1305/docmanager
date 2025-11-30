import { useState } from "react";
import { apiClient } from "../../lib/api";
import AuthForm from "../../components/AuthForm";
import { isEmail, isStrongPassword, matchPassword } from "../../lib/validators";
import { useAuthStore } from "../../stores/authStore";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const onSubmit = async (data: any) => {
    setError("");
    if (!data.name || data.name.length > 100) {
      setError("Invalid name");
      return;
    }
    if (!isEmail(data.email)) {
      setError("Invalid email");
      return;
    }
    if (!isStrongPassword(data.password)) {
      setError("Weak password");
      return;
    }
    if (!matchPassword(data.password, data.confirm)) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      const user = (res as any).data?.user;
      const token = (res as any).data?.accessToken;
      if (user && token) {
        setAuth({ user, token, persist: true });
        navigate("/dashboard");
      } else {
        navigate("/auth/login");
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md mx-auto p-6 bg-surface rounded-md shadow">
        <h1 className="text-xl mb-4">Register</h1>
        {error && (
          <div className="text-danger mb-2 text-sm" role="alert">
            {error}
          </div>
        )}
        <AuthForm mode="register" onSubmit={onSubmit} loading={loading} />
        <div className="mt-3 text-sm">
          Already have account?{" "}
          <Link to="/auth/login" className="underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
