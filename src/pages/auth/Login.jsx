import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import InputField from "../../components/InputField";
import { login } from "../../auth/auth";
// Keep your existing asset paths
import Google from "../../assets/images/Google.png";
import HomePage from "../../assets/images/HomePage.png";
import wipLogo from "../../assets/images/Logo.png";

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email Address is required")
    .trim()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
 password: yup
  .string()
  .required("Password is required")
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,15}$/,
    "Password must contain lowercase, uppercase, number, and special character"
  ),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [keepSigned, setKeepSigned] = useState(false);

  // Where to send the user after a successful login — the page they
  // were trying to reach before the guard bounced them here, else dashboard.
  const from = location.state?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login();
      navigate(from, { replace: true });
      console.log(data);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f6f9] p-4 sm:p-8 font-sans">
      {/* Main Container */}
      <div className="relative w-full max-w-[1050px] min-h-[650px] border-22 border-[#E9E9FF] rounded-[3.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex ">
        {/* Left Side - Image (Using object-cover for better fit) */}
        <div className="absolute left-0 top-0 w-full h-full z-0 hidden md:block">
          <img
            src={HomePage}
            alt="Abstract 3D Art"
            className="w-[85%] h-full object-contain object-left opacity-70"
          />
        </div>

        {/* Structural Spacer */}
        <div className="hidden md:block w-[45%] h-full z-0"></div>

        {/* Right Side - Form Panel */}
        <div className="w-full md:w-[55%] min-h-full z-10 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-10 bg-[#E9E9FF]/40   backdrop-blur-xl border-l border-white/80 shadow-[-20px_0_40px_rgba(0,0,0,0.06)] rounded-r-[2.2rem]">
          {" "}
          <div className="w-full max-w-[380px] mx-auto">
            {/* WIP editorial mark */}
            <div className="mb-7 flex items-center gap-3">
              <img
                src={wipLogo}
                alt="WIP"
                className="h-9 w-auto object-contain"
                style={{
                  filter:
                    "contrast(1.2) saturate(1.1) drop-shadow(0 1px 1px rgba(139, 105, 20, 0.15))",
                }}
              />
              <div className="flex flex-col leading-none border-l border-paleorange/40 pl-3">
                <p className="text-[9px] uppercase tracking-[0.4em] text-dark-yellow font-bold leading-none">
                  Architecture
                </p>
                <p className="text-[9px] uppercase tracking-[0.4em] text-text-subtle font-semibold mt-1.5 leading-none">
                  Interiors · Chennai
                </p>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8 text-left">
              <h1 className="text-[32px] font-bold text-textcolor tracking-tight mb-2">
                Welcome back
              </h1>
              <p className="text-[14.5px] text-text-muted">
                Enter your credentials to access your studio dashboard.
              </p>
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1 bg-white border border-x-3 border-y-0 rounded-full py-3 text-[14px] font-semibold text-textcolor hover:bg-gray-50 transition-all mb-7 shadow-sm"
            >
              <img
                src={Google}
                alt="Google"
                className="w-7 h-7 object-contain"
              />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-7 w-full">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-[11px] font-bold text-text-subtle uppercase tracking-widest leading-none">
                Or Login With Email
              </span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="name@atelier.com"
                  register={register("email")}
                  error={errors.email?.message}
                  variant="auth"
                  leftIcon={Mail}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <InputField
                  label="Password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  register={register("password")}
                  error={errors.password?.message}
                  variant="auth"
                  leftIcon={Lock}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="text-text-subtle hover:text-purple transition-colors"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-[12.5px] font-semibold text-grey hover:text-purple"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Keep signed in */}
              <div className="pt-1 pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer w-fit group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      name="keepSigned"
                      checked={keepSigned}
                      onChange={(e) => setKeepSigned(e.target.checked)}
                      className="peer appearance-none w-4 h-4 border border-placeholder rounded-[4px] checked:bg-purple checked:border-purple transition-all bg-white"
                    />
                    <Check
                      className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                      strokeWidth={4}
                    />
                  </div>
                  <span className="text-[13.5px] font-semibold text-text-muted">
                    Keep me signed in
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full h-[50px] rounded-full text-[14.5px] font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-purple/80 cursor-not-allowed"
                    : "bg-purple hover:bg-dark-blue active:scale-[0.99]"
                }`}
              >
                {loading && <Loader2 className="animate-spin h-5 w-5" />}
                <span>{loading ? "Signing in..." : "Sign In"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
