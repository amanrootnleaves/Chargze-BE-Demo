import ExcelJS from "exceljs";
const PDFDocument = require("pdfkit");

export const generateBase64Export = async (
  data,
  columns,
  format,
  fileNameTitle = "Export Data",
) => {
  try {
    if (format === "EXCEL") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data");

      worksheet.columns = columns;
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      if (data && data.length > 0) {
        worksheet.addRows(data);
      } else {
        worksheet.addRow(["No data found for the selected filters"]);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer.toString("base64");
      
    } else if (format === 'PDF') {
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 30, layout: 'landscape' });
          const chunks = [];

          // Memory mein chunks collect karenge (Disk write ki ab zaroorat nahi)
          doc.on('data', (chunk) => chunks.push(chunk));
          doc.on('end', () => {
            const resultBuffer = Buffer.concat(chunks);
            resolve(resultBuffer.toString('base64'));
          });
          doc.on('error', (err) => reject(err));

          // Title
          doc.fontSize(18).text(fileNameTitle, { underline: true });
          doc.moveDown(1);

          // Headers
          doc.fontSize(10).fillColor('black');
          const headerText = columns.map(c => c.header).join(" | ");
          doc.font('Helvetica-Bold').text(headerText);
          doc.moveDown(0.5);

          // Data Rows
          doc.font('Helvetica');
          if (data && data.length > 0) {
            data.forEach((row) => {
              const rowText = columns.map(c => (row[c.key] || "N/A").toString()).join(" | ");
              doc.text(rowText);
            });
          } else {
            doc.text("No data found for the selected filters");
          }

          doc.end();
        } catch (err) {
          console.error("PDF Generation Error:", err);
          reject(err);
        }
      });
      
    } else {
      throw new Error("Invalid Export Format. Please choose 'EXCEL' or 'PDF'.");
    }
  } catch (error) {
    console.error("[generateBase64Export] Error: ", error);
    throw new Error("Failed to generate export file.");
  }
};