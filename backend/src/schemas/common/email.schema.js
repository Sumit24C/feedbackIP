import { z } from "zod";
import { normalizeEmail } from "../../utils/normalizeEmail.js";

export const createEmailSchema = (domain) =>
    z.string()
        .transform(normalizeEmail)
        .refine(
            (email) => new RegExp(`^[0-9]+@${domain.replace(".", "\\.")}$`).test(email),
            `Email must belong to ${domain}`
        );
