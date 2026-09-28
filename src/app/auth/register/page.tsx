"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: "", username: "", password: "", full_name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      toast.success("Account created");
      router.push("/codebook");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Registration failed";
      toast.error(msg);
    }
  };

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputClass =
    "w-full h-8 px-3 rounded border border-[#d4d4d8] text-sm text-[#111118] placeholder:text-[#a1a1aa] " +
    "focus:outline focus:outline-2 focus:outline-[#4f46e5] focus:outline-offset-[-1px] bg-white";

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center bg-[#f7f7f8] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#111118]">Create your account</h1>
          <p className="text-sm text-[#71717a] mt-1">Start your quantum learning journey</p>
        </div>

        <div className="bg-white rounded-lg border border-[#e4e4e7] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#111118] mb-1.5">Full name</label>
              <input type="text" value={form.full_name} onChange={set("full_name")}
                placeholder="Ada Lovelace" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111118] mb-1.5">
                Username <span className="text-[#dc2626]">*</span>
              </label>
              <input type="text" value={form.username} onChange={set("username")}
                placeholder="quantumlearner" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111118] mb-1.5">
                Email <span className="text-[#dc2626]">*</span>
              </label>
              <input type="email" value={form.email} onChange={set("email")}
                placeholder="you@example.com" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111118] mb-1.5">
                Password <span className="text-[#dc2626]">*</span>
              </label>
              <input type="password" value={form.password} onChange={set("password")}
                placeholder="8+ characters" required minLength={8} className={inputClass} />
            </div>
            <Button type="submit" className="w-full justify-center" loading={isLoading}>
              Create account
            </Button>
          </form>
        </div>

        <p className="text-xs text-[#71717a] mt-4 text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#4f46e5] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
