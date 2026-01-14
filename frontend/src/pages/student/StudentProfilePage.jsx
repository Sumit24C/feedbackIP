import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function StudentProfilePage() {
  const axiosPrivate = useAxiosPrivate();

  const [profileInfo, setProfileInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    (async function () {
      setLoading(true);
      try {
        const res = await axiosPrivate.get("/user/user-profile");
        setProfileInfo(res.data.data);
      } catch (error) {
        setErrMsg(extractErrorMsg(error));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrMsg("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setErrMsg("New Password & Confirm Password do not match");
    }

    try {
      await axiosPrivate.post("/user/update-password", {
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      alert("Password Updated Successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (error) {
      setErrMsg(extractErrorMsg(error));
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-10 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-2">
        Student Profile
      </h1>

      {loading && <p className="text-blue-600 text-center">Loading...</p>}
      {errMsg && <p className="text-red-500 text-sm text-center">{errMsg}</p>}

      <Card className="shadow-md border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileField label="Roll Number" value={profileInfo.roll_no} />
          <ProfileField label="Class Section" value={`${profileInfo?.class_id?.year}-${profileInfo?.class_id?.name}`} />
          <ProfileField label="Academic Year" value={profileInfo.academic_year} />
          <ProfileField label="Department" value={profileInfo.dept?.name} />
        </CardContent>

        <div className="p-4">
          <Button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full"
          >
            {showPasswordForm ? "Cancel" : "Update Password"}
          </Button>
        </div>
      </Card>

      {showPasswordForm && (
        <Card className="shadow border-green-200">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <InputField
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
              />
              <InputField
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
              />
              <InputField
                label="Confirm Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />

              <Button type="submit" className="w-full">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const ProfileField = ({ label, value }) => (
  <div>
    <p className="text-gray-500 text-sm">{label}</p>
    <p className="font-semibold">{value || "-"}</p>
  </div>
);

const InputField = ({ label, type, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <Label className="text-sm">{label}</Label>
    <Input type={type} value={value} onChange={onChange} required />
  </div>
);

export default StudentProfilePage;
