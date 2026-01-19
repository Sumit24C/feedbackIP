import React, { useEffect, useState } from "react";
import { api } from "@/api/api";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputField } from "@/components/profile/InputField";
import { ProfileField } from "@/components/profile/ProfileField";
import { toast } from "sonner";

function StudentProfilePage() {

  const [profileInfo, setProfileInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

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
        const res = await api.get("/user/user-profile");
        setProfileInfo(res.data.data);
      } catch (error) {
        toast.error(extractErrorMsg(error))
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New Password & Confirm Password do not match");
    }

    setPasswordLoading(true);
    try {
      const res = await api.post("/user/update-password", {
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success(res.data.message || "Password Updated Successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(extractErrorMsg(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-10 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-2">
        Student Profile
      </h1>
      <Card className="shadow-md border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileField label="Roll Number" value={profileInfo.roll_no} loading={loading} />
          <ProfileField label="Class Section" value={`${profileInfo?.class_id?.year}-${profileInfo?.class_id?.name}`} loading={loading} />
          <ProfileField label="Academic Year" value={profileInfo.academic_year} loading={loading} />
          <ProfileField label="Department" value={profileInfo.dept?.name} loading={loading} />
        </CardContent>

        <div className="p-4">
          <Button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full"
            disabled={loading}
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

              <Button
                type="submit"
                className="w-full"
                disabled={passwordLoading}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StudentProfilePage;
