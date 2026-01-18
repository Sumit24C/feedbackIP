import fs from "fs/promises";
import ExcelJS from "exceljs";
import { ApiError } from "./apiError.js";

export const excelToJson = async (excelFile) => {
    try {
        const fileBuffer = await fs.readFile(excelFile.path);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);

        let data = [];

        workbook.worksheets.forEach((worksheet) => {
            const headers = [];

            worksheet.getRow(1).eachCell((cell, colNumber) => {
                headers[colNumber] = cell.value;
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;

                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber];
                    if (header) {
                        rowData[header] = cell.value;
                    }
                });

                if (Object.keys(rowData).length > 0) {
                    data.push(rowData);
                }
            });
        });

        await fs.unlink(excelFile.path);

        return data;
    } catch (error) {
        console.error("Excel conversion failed:", error);
        throw new ApiError(500, "Failed to convert excel data to json");
    }
};
