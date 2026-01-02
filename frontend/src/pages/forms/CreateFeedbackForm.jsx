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
  const [submitAction, setSubmitAction] = useState(form_id ? "update" : "create");

  const [targetType, setTargetType] = useState(userData?.role === "admin" ? "INSTITUTE" : "CLASS");

  return (
    <div className="flex justify-center items-center m-10">
      <div className="mx-auto max-w-screen grid grid-rows-[1fr] sm:grid-cols-[1fr_3fr] justify-around gap-6">
        <FacultySubjectSelector
          form_id={form_id}
          submitAction={submitAction}
          formType={formType}
          selectedClasses={selectedClasses}
          setSelectedClasses={setSelectedClasses}
          targetType={targetType}
          setTargetType={setTargetType}
        />
        <FormContainer
          form_id={form_id}
          submitAction={submitAction}
          setSubmitAction={setSubmitAction}
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
