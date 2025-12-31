export const getClassSection = (student, formType) => {
    let studentClassSection = student.classSection;

    if (student.year != "FY") {
        if (formType === "practical" || formType === "tutorial") {
            studentClassSection = student.roll_no <= 36
                ? `${studentClassSection}1` : `${studentClassSection}2`;
        }
    } else {
        if (formType === "practical" || formType === "tutorial") {
            if (student.roll_no <= 22) {
                studentClassSection = `${studentClassSection}1`;
            } else if (student.roll_no <= 36) {
                studentClassSection = `${studentClassSection}2`;
            } else {
                studentClassSection = `${studentClassSection}3`;
            }
        }
    }
    return studentClassSection;
}

export const getStudentAcademicYear = (year) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let studentYear = currentYear;
    if (year === "FY") {
        studentYear = currentYear + 4;
    } else if (year === "SY") {
        studentYear = currentYear + 3;
    } else if (year === "TY") {
        studentYear = currentYear + 2;
    } else if (year === "BY") {
        studentYear = currentYear + 1;
    } else {
        studentYear = null;
    }

    if (currentMonth <= 5) {
        studentYear--;
    }

    return studentYear;
}

export const getStudentYear = (studentAcademicYear) => {
    const today = new Date();
    let currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (currentMonth >= 6) {
        currentYear++;
    }
    
    let studentYear = "";
    const diff = studentAcademicYear - currentYear;

    switch (diff) {
        case 0:
            studentYear = "BY";
            break;
        case 1:
            studentYear = "TY";
            break;
        case 2:
            studentYear = "SY";
            break;
        case 3:
            studentYear = "FY";
            break;
        default:
            studentYear = null
            break;
    }

    return studentYear;
}