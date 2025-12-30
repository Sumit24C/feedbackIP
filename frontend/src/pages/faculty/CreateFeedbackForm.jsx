import { useState } from "react";
import FacultySubjectSelector from "@/components/form/FacultySubjectSelector";
import FormContainer from "@/components/form/FormContainer";

function CreateFeedbackForm() {
  const [formType, setFormType] = useState("theory");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [targetType, setTargetType] = useState("CLASS");

  return (
    <div>
      <div className="mx-auto max-w-screen grid md:grid-cols-[1fr_3fr] justify-around gap-6 px-20">
        <FacultySubjectSelector
          formType={formType}
          selectedClasses={selectedClasses}
          setSelectedClasses={setSelectedClasses}
          targetType={targetType}
          setTargetType={setTargetType}
        />
        <FormContainer
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
