export function getSemesterNumber(year, term) {
    const map = {
        FY: { odd: 1, even: 2 },
        SY: { odd: 3, even: 4 },
        TY: { odd: 5, even: 6 },
        BY: { odd: 7, even: 8 }
    };
    return map[year][term];
}

export function getCurrentSemester() {
    const today = new Date();
    const currentMonth = today.getMonth();

    if (currentMonth >= 0 && currentMonth < 6) {
        return "even";
    }

    return "odd";
}
