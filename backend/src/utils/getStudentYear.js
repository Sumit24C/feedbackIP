export const getStudentYear = (student) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    console.log(student.academic_year);
    console.log(currentYear);
    let studentYear = "";
    if (currentYear === student.academic_year) {
        studentYear = "FY";
    } else if (currentYear - student.academic_year === 1) {
        studentYear = "SY";
    } else if (currentYear - student.academic_year === 2) {
        studentYear = "TY";
    } else {
        studentYear = "BY";
    }

    return studentYear;
}