import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function UnAuthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full text-center space-y-4"
      >
        {/* Status Code */}
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-blue-500">
          403
        </h1>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Access Restricted
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          You don’t have permission to view this page.
          If you believe this is a mistake, please contact your administrator.
        </p>

        {/* Action */}
        <div className="pt-2">
          <Button
            onClick={() => navigate("/")}
            className="px-6 rounded-md"
          >
            Go to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
