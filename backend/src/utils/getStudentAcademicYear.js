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
