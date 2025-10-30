import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { useSelector } from "react-redux";

function FacultyProfilePage() {
  const axiosPrivate = useAxiosPrivate();
  const [profileInfo, setProfileInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const { userData } = useSelector((state) => state.auth);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  console.log(profileInfo)
  // Fetch profile info
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
      const res = await axiosPrivate.post("/user/update-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      alert("Password Updated Successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (error) {
      setErrMsg(extractErrorMsg(error));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Faculty Profile</h1>

      {loading && <p className="text-blue-500">Loading...</p>}
      {errMsg && <p className="text-red-500 mb-3">{errMsg}</p>}

      {/* Profile Info */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6 border">
        <h2 className="font-semibold text-lg mb-2">Profile Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileField label="Name" value={userData.fullname} />
          <ProfileField label="Email" value={userData.email} />
          <ProfileField label="Department" value={profileInfo.dept?.name || profileInfo.dept} />
          <ProfileField label="Designation" value={profileInfo.isHOD ? "HOD" : "faculty"} />
        </div>

        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showPasswordForm ? "Cancel" : "Update Password"}
        </button>
      </div>

      {/* Update Password */}
      {showPasswordForm && (
        <form
          onSubmit={handlePasswordChange}
          className="bg-white border shadow-md p-4 rounded-lg"
        >
          <h2 className="font-semibold text-lg mb-3">Change Password</h2>

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
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
            }
          />

          <button
            type="submit"
            className="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Update Password
          </button>
        </form>
      )}
    </div>
  );
}

const ProfileField = ({ label, value }) => (
  <div>
    <p className="text-gray-600 text-sm">{label}</p>
    <p className="font-semibold">{value || "-"}</p>
  </div>
);

const InputField = ({ label, type, value, onChange }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full border px-3 py-2 rounded"
      required
    />
  </div>
);

export default FacultyProfilePage;
