import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  ClipboardList,
  Users,
  BarChart3,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";

function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-16">

        <section className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            ClassSetu
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            A unified platform for managing <span className="font-semibold">attendance</span>,
            <span className="font-semibold"> feedback</span>, and
            <span className="font-semibold"> academic insights</span> —
            built for modern institutions.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-xl">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl">
              View Dashboard
            </Button>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<CalendarCheck className="text-blue-600" />}
            title="Smart Attendance"
            description="Take, edit, and analyze attendance in real time with batch and class-level precision."
          />
          <FeatureCard
            icon={<ClipboardList className="text-green-600" />}
            title="Feedback Management"
            description="Create structured feedback forms with deadlines, ratings, and analytics."
          />
          <FeatureCard
            icon={<BarChart3 className="text-purple-600" />}
            title="Analytics & Insights"
            description="Track attendance percentage, feedback trends, and performance metrics."
          />
          <FeatureCard
            icon={<Users className="text-orange-600" />}
            title="Faculty & Student Mapping"
            description="Seamlessly manage faculty-subject-class relationships."
          />
          <FeatureCard
            icon={<ShieldCheck className="text-red-600" />}
            title="Secure & Role-Based"
            description="Granular access for admins, faculty, and students with full data integrity."
          />
          <FeatureCard
            icon={<CheckCircle className="text-teal-600" />}
            title="Institution Ready"
            description="Designed for departments, classes, and institute-wide operations."
          />
        </section>

        <section className="text-center bg-white rounded-2xl border shadow-sm p-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Built for Real Academic Workflows
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            ClassSetu bridges the gap between faculty effort and administrative insight,
            helping institutions run smoother, smarter, and more transparently.
          </p>
        </section>

        <footer className="text-center text-sm text-gray-500 pt-6">
          © {new Date().getFullYear()} ClassSetu · Attendance & Feedback Management System
        </footer>

      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow-md transition">
      <CardContent className="p-6 space-y-3">
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default Home;
