"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Signed in");
      router.push("/codebook");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Invalid credentials";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center bg-[#f7f7f8] px-4">
      <div className="w-full max-w-4xl flex items-center gap-12">
        {/* Left: Illustration */}
        <div className="hidden lg:block flex-1">
          <img
            src="/illustrations/login.jpg"
            alt="Login"
            className="w-full h-auto rounded-3xl shadow-2xl"
          />
        </div>

        {/* Right: Form */}
        <div className="flex-1 w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#111118]">Sign in to QUBIT</h1>
            <p className="text-sm text-[#71717a] mt-1">Continue your quantum journey</p>
          </div>

          <div className="bg-white rounded-lg border border-[#e4e4e7] p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111118] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-8 px-3 rounded border border-[#d4d4d8] text-sm text-[#111118] placeholder:text-[#a1a1aa] focus:outline focus:outline-2 focus:outline-[#4f46e5] focus:outline-offset-[-1px] bg-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111118] mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-8 px-3 rounded border border-[#d4d4d8] text-sm text-[#111118] placeholder:text-[#a1a1aa] focus:outline focus:outline-2 focus:outline-[#4f46e5] focus:outline-offset-[-1px] bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full justify-center"
                loading={isLoading}
              >
                Sign in
              </Button>
            </form>
          </div>

          <p className="text-xs text-[#71717a] mt-4 text-center">
            No account?{" "}
            <Link href="/auth/register" className="text-[#4f46e5] font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
