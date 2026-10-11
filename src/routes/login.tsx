import { createFileRoute,Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { motion } from "framer-motion";

import loginBg from "@/image/Login bg image.png";
import nIcon from "@/image/N-icon.png";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Activity,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";


/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute("/login")({
  component: LoginPage,
});


/* =========================================================
   FORM VALIDATION
========================================================= */

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormData = z.infer<typeof schema>;


/* =========================================================
   LOGIN PAGE
========================================================= */

function LoginPage() {

  const navigate = useNavigate();

  const login = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);


  /* =======================================================
     FORM
  ======================================================= */

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),

    defaultValues: {
      email: "",
      password: "",
    },
  });


  /* =======================================================
     LOGIN
  ======================================================= */

  const onSubmit = async (data: FormData) => {

    console.log("LOGIN DATA:", data);

    setSubmitting(true);

    try {

      await login(data.email, data.password);

      console.log("LOGIN SUCCESS");

      toast.success("Welcome back!");

      navigate({
        to: "/opd/registration",
      });

    } catch (error) {

      console.error("LOGIN ERROR:", error);

      toast.error("Login failed");

    } finally {

      setSubmitting(false);

    }
  };


  /* =======================================================
     SIGN UP
  ======================================================= */

  const handleSignUp = () => {

    console.log("--------------------------------");
    console.log("SIGN UP BUTTON CLICKED");
    console.log("Create an account clicked");
    console.log("--------------------------------");

  };


  /* =======================================================
     FEATURES
  ======================================================= */

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


  /* =======================================================
     PAGE
  ======================================================= */

  return (

    <div
      className="
        min-h-screen
        w-full
        overflow-x-hidden
        bg-[#edf7fd]
      "
    >

      {/* =====================================================
          MAIN CONTAINER
      ===================================================== */}

      <div
        className="
          min-h-screen
          w-full
          flex
          flex-col
          lg:flex-row
        "
      >


        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <section
          className="
            relative
            hidden
            min-h-screen
            w-full
            overflow-hidden
            lg:flex
            lg:w-[56%]
          "
          style={{
            backgroundImage: `url(${loginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "left center",
            backgroundRepeat: "no-repeat",
          }}
        >

          {/* Light overlay */}

          <div
            className="
              absolute
              inset-0
              bg-white/5
            "
          />


          {/* LEFT CONTENT */}

          <div
            className="
              relative
              z-10
              flex
              min-h-screen
              w-full
              flex-col
              px-10
              py-8
              xl:px-12
              xl:py-9
            "
          >


            {/* =================================================
                LOGO
            ================================================= */}

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              {/* YOUR N-ICON IMAGE */}

              <img
                src={nIcon}
                alt="Ncuresoft"
                className="
                  h-12
                  w-12
                  object-contain
                  rounded-xl
                "
              />


              {/* LOGO TEXT */}

              <div>

                <div
                  className="
                    text-[30px]
                    font-black
                    tracking-tight
                    text-[#12396a]
                  "
                >
                  Ncuresoft
                </div>

                <div
                  className="
                    text-[11px]
                    text-[#526b86]
                  "
                >
                 <b> Smart Hospital Management System</b>
                </div>

              </div>

            </div>


            {/* =================================================
                WELCOME TEXT
            ================================================= */}

            <div
              className="
                mt-16
                xl:mt-20
              "
            >

              <h1
                className="
                  text-[40px]
                  font-black
                  leading-tight
                  tracking-tight
                  text-[#102f59]
                  xl:text-[42px]
                "
              >
                Welcome Back!
              </h1>


              <h2
                className="
                  mt-1
                  text-[34px]
                  font-black
                  leading-tight
                  tracking-tight
                  text-[#1684df]
                  xl:text-[36px]
                "
              >
                Sign In to Your Account
              </h2>


              <p
                className="
                  mt-3
                  max-w-[410px]
                  text-[15px]
                  leading-6
                  text-[#526a84]
                "
              >
                Access your hospital dashboard and manage
                your operations with ease.
              </p>

            </div>


            {/* =================================================
                FEATURES
            ================================================= */}

            <div
              className="
                mt-7
                space-y-4
              "
            >

              {features.map(
                ({
                  icon: Icon,
                  title,
                  description,
                }) => (

                  <div
                    key={title}
                    className="
                      flex
                      items-center
                      gap-4
                    "
                  >

                    {/* FEATURE ICON */}

                    <div
                      className="
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#e3f3fc]
                        text-[#1680dc]
                        shadow-sm
                      "
                    >

                      <Icon
                        className="
                          h-6
                          w-6
                        "
                      />

                    </div>


                    {/* FEATURE TEXT */}

                    <div>

                      <div
                        className="
                          text-[14px]
                          font-bold
                          text-[#183a63]
                        "
                      >
                        {title}
                      </div>

                      <div
                        className="
                          text-[11px]
                          text-[#647991]
                        "
                      >
                        {description}
                      </div>

                    </div>

                  </div>

                )
              )}

            </div>


            {/* =================================================
                HEALTHCARE SIMPLIFIED
            ================================================= */}

            <div
              className="
                mt-auto
                pb-6
                pl-1
                text-[22px]
                font-semibold
                italic
                leading-tight
                text-[#1677cf]
              "
            >

              Healthcare

              <span className="block">
                Simplified
              </span>

            </div>

          </div>

        </section>


        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <section
          className="
            flex
            min-h-screen
            w-full
            items-center
            justify-center
            bg-[#f4fbff]
            px-5
            py-8
            sm:px-8
            lg:w-[44%]
            lg:px-8
            xl:px-12
          "
        >

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.35,
            }}
            className="
              w-full
              max-w-[435px]
            "
          >


            {/* =================================================
                LOGIN CARD
            ================================================= */}

            <div
              className="
                rounded-[20px]
                border
                border-[#e3edf5]
                bg-white
                px-7
                py-7
                shadow-[0_15px_45px_rgba(26,77,126,0.13)]
                sm:px-9
                sm:py-8
              "
            >


              {/* =================================================
                  RIGHT SIDE LOGO
              ================================================= */}

              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-3
                "
              >

                {/* YOUR N-ICON IMAGE */}

                <img
                  src={nIcon}
                  alt="Ncuresoft"
                  className="
                    h-12
                    w-12
                    object-contain
                    rounded-xl
                  "
                />


                {/* LOGO TEXT */}

                <div>

                  <div
                    className="
                      text-[27px]
                      font-black
                      tracking-tight
                      text-[#12396a]
                    "
                  >
                    Ncuresoft
                  </div>

                  <div
                    className="
                      text-[9px]
                      text-[#647991]
                    "
                  >
                    Hospital Management System
                  </div>

                </div>

              </div>


              {/* =================================================
                  SIGN IN
              ================================================= */}

              <div className="mt-7">

                <h2
                  className="
                    text-[27px]
                    font-black
                    tracking-tight
                    text-[#12365f]
                  "
                >
                  Sign In
                </h2>


                <p
                  className="
                    mt-2
                    text-[12px]
                    text-[#718299]
                  "
                >
                 <b> Enter your credentials to access your account</b>
                </p>

              </div>


              {/* =================================================
                  FORM
              ================================================= */}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="
                  mt-5
                  space-y-4
                "
              >


                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="email"
                    className="
                      mb-2
                      block
                      text-[12px]
                      font-bold
                      text-[#253a56]
                    "
                  >
                    Email Address *

                  </label>


                  <div
                    className="
                      relative
                    "
                  >

                    <Mail
                      className="
                        absolute
                        left-3
                        top-1/2
                        h-4
                        w-4
                        -translate-y-1/2
                        text-[#687c94]
                      "
                    />


                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="Enter your email address"
                      className="
                        h-10
                        rounded-[9px]
                        border-[#d7e1ea]
                        bg-white
                        pl-10
                        text-[12px]
                        shadow-none
                        placeholder:text-[#a0adba]
                        focus-visible:ring-1
                        focus-visible:ring-[#2788e5]
                      "
                    />

                  </div>


                  {errors.email && (

                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-red-500
                      "
                    >
                      {errors.email.message}
                    </p>

                  )}

                </div>


                {/* PASSWORD */}

                <div>

                  <label
                    htmlFor="password"
                    className="
                      mb-2
                      block
                      text-[12px]
                      font-bold
                      text-[#253a56]
                    "
                  >
                    Password *

                  </label>


                  <div
                    className="
                      relative
                    "
                  >

                    <Lock
                      className="
                        absolute
                        left-3
                        top-1/2
                        h-4
                        w-4
                        -translate-y-1/2
                        text-[#687c94]
                      "
                    />


                    <Input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      {...register("password")}
                      placeholder="Enter your password"
                      className="
                        h-10
                        rounded-[9px]
                        border-[#d7e1ea]
                        bg-white
                        pl-10
                        pr-10
                        text-[12px]
                        shadow-none
                        placeholder:text-[#a0adba]
                        focus-visible:ring-1
                        focus-visible:ring-[#2788e5]
                      "
                    />


                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                      className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-[#687c94]
                        hover:text-[#1976d2]
                      "
                    >

                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}

                    </button>

                  </div>


                  {errors.password && (

                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-red-500
                      "
                    >
                      {errors.password.message}
                    </p>

                  )}

                </div>


                {/* =================================================
                    REMEMBER + FORGOT
                ================================================= */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <Checkbox
                      id="remember"
                      defaultChecked
                      className="
                        h-4
                        w-4
                        data-[state=checked]:bg-[#267be0]
                      "
                    />

                    <label
                      htmlFor="remember"
                      className="
                        text-[11px]
                        text-[#52667e]
                      "
                    >
                      Remember me
                    </label>

                  </div>

                  <Link
  to="/forgot-password"
  className="text-[11px] font-medium text-[#2676cf] hover:underline"
>
  Forgot Password?
</Link>

                </div>


                {/* =================================================
                    SIGN IN BUTTON
                ================================================= */}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="
                    h-10
                    w-full
                    rounded-[8px]
                    bg-gradient-to-r
                    from-[#1976e8]
                    to-[#2989eb]
                    text-[12px]
                    font-semibold
                    text-white
                    shadow-none
                    hover:opacity-90
                  "
                >

                  {submitting ? (

                    "Signing in..."

                  ) : (

                    <span
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                      "
                    >
                      Sign In

                      <ArrowRight
                        className="
                          h-4
                          w-4
                        "
                      />

                    </span>

                  )}

                </Button>

              </form>


              {/* =================================================
                  OR
              ================================================= */}

              <div
                className="
                  my-3
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    h-[2px]
                    flex-1
                    bg-[#d9e8f3]
                  "
                />

                <span
                  className="
                    text-[10px]
                    text-[#7a899a]
                  "
                >
                  OR
                </span>

                <div
                  className="h-[2px]flex-1bg-[#d9e8f3]"
                />
              </div>

             <div className="mt-8 text-center text-[11px] font-semibold leading-6 text-[#75859a]">
              <b>Don't have an account?</b>{" "}
             <Link to="/register"className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline">
             Create an account</Link>
              </div>

            </div>

          </motion.div>

        </section>

      </div>


      {/* =====================================================
          MOBILE VIEW
      ===================================================== */}

      <div
        className="
          block
          bg-[#edf7fd]
          px-5
          py-8
          lg:hidden
        "
      >

        <div
          className="
            mx-auto
            max-w-[500px]
            rounded-2xl
            bg-white
            p-6
            shadow-sm
          "
        >

          <h1
            className="
              text-3xl
              font-black
              text-[#12396a]
            "
          >
            Welcome Back!
          </h1>

          <h2
            className="
              mt-1
              text-2xl
              font-black
              text-[#1684df]
            "
          >
            Sign In to Your Account
          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-[#526a84]
            "
          >
            Access your hospital dashboard and manage
            your operations with ease.
          </p>

        </div>

      </div>

    </div>
  );
}


export default LoginPage;


