import { useState } from "react";
import { apiClient } from "../../lib/api";
import AuthForm from "../../components/AuthForm";
import { isEmail } from "../../lib/validators";
import { useAuthStore } from "../../stores/authStore";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const onSubmit = async (data: any) => {
    setError("");
    if (!isEmail(data.email) || !data.password) {
      setError("Invalid credentials");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", {
        email: data.email,
        password: data.password,
        code: data.code,
      });
      const user = (res as any).data?.user;
      const token = (res as any).data?.accessToken;
      if (user && token) {
        setAuth({ user, token, persist: true });
        navigate("/dashboard");
      } else {
        setError("Login failed");
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Login failed";
      if (/2FA/i.test(msg)) setError("2FA required");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-sm  mx-auto p-6 bg-surface rounded-md shadow">
        <h1 className="text-xl mb-4">Login</h1>
        {error && (
          <div className="text-danger mb-2 text-sm" role="alert">
            {error}
          </div>
        )}
        <AuthForm mode="login" onSubmit={onSubmit} loading={loading} />
        <div className="mt-3 text-sm">
          No account?{" "}
          <Link to="/auth/register" className="underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
