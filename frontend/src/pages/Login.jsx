import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/authSlice";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { api } from "../api/api.js";
import { isCancel } from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const dispatch = useDispatch();

  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const submit = async (data) => {
    setLoading(true);
    setErrMsg("");

    try {
      const res = await api.post("/user/login", data);
      dispatch(login(res.data.data.user, { accessToken: res.data.data.accessToken }));
      navigate(from, { replace: true });
    } catch (error) {
      if (!isCancel(error)) {
        setErrMsg(extractErrorMsg(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <Card className="w-full max-w-sm shadow-2xl border-none backdrop-blur-md bg-white/60 rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold text-blue-800">FeedBack System</CardTitle>
          <p className="text-sm text-gray-600">Login to continue</p>
        </CardHeader>

        <CardContent>
          {errMsg && (
            <p className="text-red-600 text-center font-medium bg-red-50 py-2 rounded-lg mb-3">
              {errMsg}
            </p>
          )}

          <form onSubmit={handleSubmit(submit)} className="space-y-5">

            {/* Email */}
            <div className="space-y-1">
              <Label className="text-gray-800 font-semibold">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <Input
                  type="text"
                  className="pl-10 py-2 rounded-xl border-gray-300 focus:border-blue-600"
                  placeholder="Enter your email"
                  {...register("email", { required: "Email is required" })}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label className="text-gray-800 font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <Input
                  type="password"
                  className="pl-10 py-2 rounded-xl border-gray-300 focus:border-blue-600"
                  placeholder="Enter your password"
                  {...register("password", { required: "Password is required" })}
                />
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* Login Button */}
            <Button
              className="w-full mt-2 bg-blue-700 hover:bg-blue-800 text-lg py-2 rounded-2xl shadow-md"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex flex-col justify-center items-center gap-4 mt-32">
                  <div className="w-14 h-14 border-4 border-transparent border-t-indigo-500 border-l-indigo-400 rounded-full animate-spin" />
                </div>
              ) : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
