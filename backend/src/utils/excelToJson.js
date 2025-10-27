import fs from "fs/promises";
import XLSX from "xlsx";
import { ApiError } from "./apiError.js";

export const excelToJson = async (studentFile) => {
    try {
        const fileBuffer = await fs.readFile(studentFile.path);

        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        let studentData = [];
        workbook.SheetNames.forEach((name) => {
            const worksheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(worksheet);
            studentData = studentData.concat(data);
        })
        await fs.unlink(studentFile.path);

        return studentData;
    } catch (error) {
        console.error("Excel conversion failed:", error);
        throw new ApiError(500, "Failed to convert excel data to json");
    }
}