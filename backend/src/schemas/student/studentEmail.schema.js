import { z } from "zod";
import { createEmailSchema } from "../common/email.schema.js";

export const createStudentExcelSchema = (domain) => z.object({
    email: createEmailSchema(domain),

    fullname: z.string().min(1, "Full name is required"),

    roll_no: z.preprocess(
        (v) => Number(v),
        z.number().int().positive("Invalid roll number")
    ),

    academic_year: z.preprocess(
        (v) => Number(v),
        z.number().int()
    ),

    class_name: z.string().min(1, "Class name is required"),
});
