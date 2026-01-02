import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center px-4 gap-4">
      <motion.h1
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-7xl sm:text-9xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent"
      >
        404
      </motion.h1>

      <h2 className="text-xl sm:text-2xl font-semibold text-white/90">
        Oops! Page not found
      </h2>

      <p className="text-sm sm:text-base text-blue-200 max-w-md">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>

      <Button
        onClick={() => navigate("/")}
        className="mt-3 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-200"
      >
        Go Home
      </Button>
    </div>
  );
}
