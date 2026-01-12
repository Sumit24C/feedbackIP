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
        name: "class_name",
        label: "Section",
        type: "select",
        options: ["A", "B", "C", "D"],
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

  classes: {
    title: "Add Class",
    uploadTitle: "Upload Classes",
    uploadAccept: ".xlsx,.xls",

    fields: [
      {
        name: "name",
        label: "Class Name",
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
        name: "strength",
        label: "Strength",
        type: "number",
        rules: { required: true, min: 1 },
      },
    ],
    batches: {
      label: "Batches",
      min: 1,
      fields: [
        {
          name: "code",
          label: "Batch Code",
          type: "text",
          rules: { required: true },
        },
        {
          name: "type",
          label: "Batch Type",
          type: "select",
          options: ["practical", "tutorial"],
          rules: { required: true },
        },
        {
          name: "from",
          label: "Roll From",
          type: "number",
          rules: { required: true },
        },
        {
          name: "to",
          label: "Roll To",
          type: "number",
          rules: { required: true },
        },
      ],
    },
  },

  facultySubjects: {
    title: "Add FacultySubject",
    uploadTitle: "Upload FacultySubjects",
    uploadAccept: ".xlsx,.xls",
    fields: [
      {
        name: "faculty_email",
        label: "Faculty email",
        type: "email",
        rules: { required: true },
      },
      {
        name: "subject_code",
        label: "Subject Code",
        type: "text",
        rules: { required: true },
      },
      {
        name: "class_year",
        label: "Year",
        type: "select",
        options: ["FY", "SY", "TY", "BY"],
        rules: { required: true },
      },
      {
        name: "class_name",
        label: "Class name",
        type: "select",
        options: ["A", "B", "C", "D"],
        rules: { required: true },
      },
      {
        name: "batch_code",
        label: "Batch code",
        type: "text",
        rules: { required: true },
      },
      {
        name: "formType",
        label: "Type",
        type: "select",
        options: ["theory", "practical", "tutorial"],
        rules: { required: true },
      },
    ],
  },
};
