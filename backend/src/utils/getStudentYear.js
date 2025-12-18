export const getStudentYear = (student) => {
    const today = new Date();
    const currentYear = today.getFullYear();

    let studentYear = "";
    if (currentYear === student.academic_year) {
        studentYear = "FY";
    } else if (student.academic_year - currentYear === 1) {
        studentYear = "SY";
    } else if (student.academic_year - currentYear === 2) {
        studentYear = "TY";
    } else {
        studentYear = "BY";
    }

    return studentYear;
}