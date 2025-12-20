export const getStudentYear = (student) => {
    const today = new Date();
    let currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (currentMonth >= 6) {
        currentYear++;
    }
    
    let studentYear = "";
    const diff = student.academic_year - currentYear;

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