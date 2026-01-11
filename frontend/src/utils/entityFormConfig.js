export const ENTITY_CONFIG = {
  student: {
    title: "Add Student",
    uploadTitle: "Upload Students",
    uploadAccept: ".xlsx,.xls",
    fields: [
      {
        name: "roll_no",
        label: "Roll No",
        type: "number",
        rules: { required: true, min: 1, max: 100 },
      },
      {
        name: "fullname",
        label: "Full Name",
        type: "text",
        rules: { required: true },
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        rules: {
          required: true,
          pattern: /^\S+@\S+$/i,
        },
      },
      {
        name: "classSection",
        label: "Section",
        type: "text",
        rules: { required: true },
      },
      {
        name: "academic_year",
        label: "Academic Year",
        type: "text",
        rules: { required: true },
      },
    ],
  },

  faculty: {
    title: "Add Faculty",
    uploadTitle: "Upload Faculties",
    uploadAccept: ".xlsx,.xls",
    fields: [
      {
        name: "fullname",
        label: "Full Name",
        type: "text",
        rules: { required: true },
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        rules: {
          required: true,
          pattern: /^\S+@\S+$/i,
        },
      },
      {
        name: "designation",
        label: "Designation",
        type: "select",
        options: [
          "Assistant Professor",
          "Associate Professor",
          "Professor",
          "HOD",
          "Lecturer",
          "Visiting Faculty"
        ],
        rules: {
          required: true,
        },
      },
    ],
  },

  subject: {
    title: "Add Subject",
    uploadTitle: "Upload Subjects",
    uploadAccept: ".xlsx,.xls",
    fields: [
      {
        name: "name",
        label: "Subject Name",
        type: "text",
        rules: { required: true },
      },
      {
        name: "subject_code",
        label: "Subject Code",
        type: "text",
        rules: { required: true },
      },
      {
        name: "year",
        label: "Year",
        type: "select",
        options: ["FY", "SY", "TY", "BY"],
        rules: { required: true },
      },
      {
        name: "type",
        label: "Type",
        type: "select",
        options: ["dept", "elective"],
        rules: { required: true },
      },
      {
        name: "semester",
        label: "Semester",
        type: "select",
        options: ["odd", "even"],
        rules: { required: true },
      },
    ],
  },
};
