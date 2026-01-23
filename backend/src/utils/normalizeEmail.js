export const normalizeEmail = (email) =>
    String(email ?? "")
        .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
        .trim()
        .toLowerCase();
