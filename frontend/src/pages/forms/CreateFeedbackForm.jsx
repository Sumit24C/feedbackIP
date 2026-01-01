import { useState } from "react";
import FacultySubjectSelector from "@/components/forms/FacultySubjectSelector";
import FormContainer from "@/components/forms/FormContainer";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

function CreateFeedbackForm() {
  const [formType, setFormType] = useState("theory");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const { userData } = useSelector((state) => state.auth);
  const { form_id } = useParams();

  const [targetType, setTargetType] = useState(userData?.role === "admin" ? "INSTITUTE" : "CLASS");

  return (
    <div>
      <div className="mx-auto max-w-screen grid md:grid-cols-[1fr_3fr] justify-around gap-6 px-20">
        <FacultySubjectSelector
          form_id={form_id}
          formType={formType}
          selectedClasses={selectedClasses}
          setSelectedClasses={setSelectedClasses}
          targetType={targetType}
          setTargetType={setTargetType}
        />
        <FormContainer
          form_id={form_id}
          formType={formType}
          setFormType={setFormType}
          selectedClasses={selectedClasses}
          setSelectedClasses={setSelectedClasses}
          targetType={targetType}
          setTargetType={setTargetType}
        />
      </div>
    </div>
  );
}

export default CreateFeedbackForm;
