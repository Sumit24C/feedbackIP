import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/api/api";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Lock, User } from "lucide-react";
import { useDispatch } from "react-redux";
import { login } from "@/store/authSlice";

function RegisterInstitute() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const submit = async (data) => {
    setLoading(true);
    setErrMsg("");

    try {
      const res = await api.post("/user/register", data);
      dispatch(
        login(res.data.data.user, {
          accessToken: res.data.data.accessToken,
        })
      );
      navigate("/admin/create-department", { replace: true });
    } catch (error) {
      setErrMsg(extractErrorMsg(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 px-3">
      <Card className="w-full max-w-lg shadow-2xl rounded-3xl border-none bg-white/70 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold text-blue-800">
            Register Institute
          </CardTitle>
          <p className="text-sm text-gray-600">
            Set up your institute on ClassSetu
          </p>
        </CardHeader>

        <CardContent>
          {errMsg && (
            <p className="text-red-600 text-center bg-red-50 py-2 rounded-lg mb-4">
              {errMsg}
            </p>
          )}

          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Institute Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <Input
                  className="pl-10"
                  placeholder="ABC Institute of Technology"
                  {...register("instituteName", { required: "Institute name is required" })}
                />
              </div>
              {errors.instituteName && (
                <p className="text-xs text-red-600">{errors.instituteName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Institute Code</Label>
              <Input
                placeholder="ABCIT"
                {...register("instituteCode", {
                  required: "Institute code is required",
                })}
              />
            </div>

            <div className="space-y-1">
              <Label>Email Domain</Label>
              <Input
                placeholder="abcit.edu"
                {...register("emailDomain", {
                  required: "Email domain is required",
                })}
              />
              <p className="text-xs text-gray-500">
                Used to restrict registrations (example: abcit.edu)
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-1">
                <Label>Admin Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-500" size={18} />
                  <Input
                    className="pl-10"
                    placeholder="admin"
                    {...register("fullname", { required: true })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-500" size={18} />
                  <Input
                    type="email"
                    className="pl-10"
                    placeholder="admin@college.edu"
                    {...register("email", { required: true })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-500" size={18} />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="Create a strong password"
                    {...register("password", { required: true, minLength: 6 })}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-lg rounded-2xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin" />
              ) : (
                "Create Institute"
              )}
            </Button>

            <p className="text-sm text-center text-gray-600">
              Already registered?{" "}
              <Link to="/" className="text-blue-700 font-semibold hover:underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterInstitute;
