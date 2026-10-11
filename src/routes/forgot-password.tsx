import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Lock, Eye, EyeOff, ShieldCheck, Activity, Users } from "lucide-react";
import loginBg from "@/image/Login bg image.png";
import nIcon from "@/image/N-icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!otpSent) {
      setOtpSent(true);
      // Connect the OTP request API here when the backend endpoint is available.
      toast.info("Enter the 6-digit OTP to continue.");
      return;
    }

    if (!emailVerified) {
      if (!/^\d{6}$/.test(otp)) {
        toast.error("Please enter a valid 6-digit OTP.");
        return;
      }

      // Connect OTP verification API here when the backend endpoint is available.
      setEmailVerified(true);
      toast.success("OTP accepted for this demo. Choose a new password.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    toast.success("Demo password reset complete. Your account password was not changed.");
    navigate({ to: "/login" });
  };

  const features = [
    {
      icon: ShieldCheck,
      title: "Secure & Reliable",
      description: "Your data is always protected",
    },
    {
      icon: Activity,
      title: "Faster Operations",
      description: "Save time with smart workflows",
    },
    {
      icon: Users,
      title: "Better Patient Care",
      description: "Deliver quality healthcare",
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#edf7fd]">
      <div className="min-h-screen w-full flex flex-col lg:flex-row">
        <section
          className="relative hidden min-h-screen w-full overflow-hidden lg:flex lg:w-[56%]"
          style={{
            backgroundImage: `url(${loginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "left center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-white/5" />
          <div className="relative z-10 flex min-h-screen w-full flex-col px-10 py-8 xl:px-12 xl:py-9">
            <div className="flex items-center gap-3">
              <img src={nIcon} alt="Ncuresoft" className="h-12 w-12 rounded-xl object-contain" />
              <div>
                <div className="text-[30px] font-black text-[#12396a]">Ncuresoft</div>
                <div className="text-[11px] text-[#526b86]">
                  <b>Smart Hospital Management System</b>
                </div>
              </div>
            </div>

            <div className="mt-16 xl:mt-20">
              <h1 className="text-[40px] font-black leading-tight text-[#102f59] xl:text-[42px]">
                Account Recovery
              </h1>
              <h2 className="mt-1 text-[34px] font-black leading-tight text-[#1684df] xl:text-[36px]">
                Reset Your Password
              </h2>
              <p className="mt-3 max-w-102.5 text-[15px] leading-6 text-[#526a84]">
                Get back into your hospital dashboard with a new password.
              </p>
            </div>

            <div className="mt-7 space-y-4">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e3f3fc] text-[#1680dc] shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[#183a63]">{title}</div>
                    <div className="text-[11px] text-[#647991]">{description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pb-6 pl-1 text-[22px] font-semibold italic leading-tight text-[#1677cf]">
              Healthcare
              <span className="block">Simplified</span>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen w-full items-center justify-center bg-[#f4fbff] px-5 py-8 sm:px-8 lg:w-[44%] lg:px-8 xl:px-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-108.75"
          >
            <div className="rounded-[20px] border border-[#e3edf5] bg-white px-7 py-7 shadow-[0_15px_45px_rgba(26,77,126,0.13)] sm:px-9 sm:py-8">
              <div className="mb-6 flex items-center justify-center gap-3">
                <img src={nIcon} alt="Ncuresoft" className="h-12 w-12 rounded-xl object-contain" />
                <div>
                  <div className="text-[27px] font-black text-[#12396a]">Ncuresoft</div>
                  <div className="text-[9px] text-[#647991]">Hospital Management System</div>
                </div>
              </div>

              <Link
                to="/login"
                className="mb-4 inline-flex items-center gap-1 text-xs text-[#2676cf] hover:underline"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </Link>

              <div className="mt-3">
                <h2 className="text-[27px] font-black text-[#12365f]">
                    {emailVerified
                      ? "Choose a new password"
                      : otpSent
                        ? "Verify your email"
                        : "Reset your password"}
                </h2>
                <p className="mt-2 text-[12px] text-[#718299]">
                    {emailVerified
                      ? "Enter and confirm your new password."
                      : otpSent
                        ? `Enter the 6-digit demo code for ${email}.`
                        : "Enter your email address to continue."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[12px] font-bold text-[#253a56]"
                    >
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687c94]" />
                      <Input
                        id="email"
                        required
                        type="email"
                        placeholder="Enter your email address"
                        className="h-10 rounded-[9px] border-[#d7e1ea] bg-white pl-10 text-[12px] shadow-none placeholder:text-[#a0adba] focus-visible:ring-1 focus-visible:ring-[#2788e5]"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={otpSent}
                      />
                    </div>
                </div>

                {otpSent && !emailVerified && (
                  <div>
                    <label
                      htmlFor="otp"
                      className="mb-2 block text-[12px] font-bold text-[#253a56]"
                    >
                      Email OTP *
                    </label>
                    <Input
                      id="otp"
                      required
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder="Enter 6-digit OTP"
                      className="h-10 rounded-[9px] border-[#d7e1ea] bg-white text-center text-[14px] tracking-[0.35em] shadow-none placeholder:text-[12px] placeholder:tracking-normal placeholder:text-[#a0adba] focus-visible:ring-1 focus-visible:ring-[#2788e5]"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                    />
                    <p className="mt-2 text-[11px] text-[#718299]">
                      Temporary demo: any 6-digit code is accepted. Email verification is not active yet.
                    </p>
                  </div>
                )}

                {emailVerified && (
                    <>
                      <div>
                        <label
                          htmlFor="password"
                          className="mb-2 block text-[12px] font-bold text-[#253a56]"
                        >
                          New Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687c94]" />
                          <Input
                            id="password"
                            required
                            type={showPassword ? "text" : "password"}
                            minLength={6}
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            className="h-10 rounded-[9px] border-[#d7e1ea] bg-white pl-10 pr-10 text-[12px] shadow-none placeholder:text-[#a0adba] focus-visible:ring-1 focus-visible:ring-[#2788e5]"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                          />
                          <button
                            type="button"
                            aria-label={showPassword ? "Hide new password" : "Show new password"}
                            title={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((visible) => !visible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687c94] hover:text-[#2676cf]"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="confirm-password"
                          className="mb-2 block text-[12px] font-bold text-[#253a56]"
                        >
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687c94]" />
                          <Input
                            id="confirm-password"
                            required
                            type={showConfirmPassword ? "text" : "password"}
                            minLength={6}
                            autoComplete="new-password"
                            placeholder="Re-enter your password"
                            className="h-10 rounded-[9px] border-[#d7e1ea] bg-white pl-10 pr-10 text-[12px] shadow-none placeholder:text-[#a0adba] focus-visible:ring-1 focus-visible:ring-[#2788e5]"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                          />
                          <button
                            type="button"
                            aria-label={
                              showConfirmPassword
                                ? "Hide confirm password"
                                : "Show confirm password"
                            }
                            title={showConfirmPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowConfirmPassword((visible) => !visible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687c94] hover:text-[#2676cf]"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                )}

                <Button
                    type="submit"
                    className="h-10 w-full rounded-xl bg-linear-to-r from-[#1976e8] to-[#2989eb] text-[12px] font-semibold text-white shadow-none hover:opacity-90"
                >
                    {emailVerified ? "Reset Password" : otpSent ? "Verify OTP" : "Continue"}
                </Button>
              </form>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}