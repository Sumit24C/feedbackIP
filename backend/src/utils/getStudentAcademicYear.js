export const getStudentAcademicYear = (year) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    let studentYear = currentYear;
    if (year === "FY") {
        studentYear = currentYear - 1;
    } else if (year === "SY") {
        studentYear = currentYear - 2;
    } else if (year === "TY") {
        studentYear = currentYear - 3;
    } else if (year === "BY") {
        studentYear = currentYear - 4;
    } else {
        studentYear = null;
    }

    return studentYear;
}