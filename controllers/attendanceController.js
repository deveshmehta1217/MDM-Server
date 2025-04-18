import Attendance from '../models/Attendace.js';
import ExcelJS from 'exceljs';
import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';

const encodeImageToBase64 = (filePath) => {
    const ext = path.extname(filePath).substring(1); // e.g. 'png'
    const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
    return `data:image/${ext};base64,${base64}`;
};


export const getAttendance = async (req, res) => {
    try {
        const { academicYear } = req.params;
        const data = await Attendance.find({ academicYear });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAttendanceByClass = async (req, res) => {
    try {
        const { standard, division, academicYear } = req.params;
        const data = await Attendance.findOne({
            standard: parseInt(standard),
            division,
            academicYear
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createAttendance = async (req, res) => {
    try {
        const { standard, division, academicYear, registeredStudents, presentStudents, mealTakenStudents } = req.body;
        if (!academicYear) {
            return res.status(400).json({ message: 'Academic year is required' });
        }
        const data = await Attendance.create({
            standard: parseInt(standard),
            division,
            academicYear,
            registeredStudents,
            presentStudents,
            mealTakenStudents
        });
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { standard, division, academicYear, registeredStudents, presentStudents, mealTakenStudents } = req.body;
        if (!academicYear) {
            return res.status(400).json({ message: 'Academic year is required' });
        }
        const data = await Attendance.findByIdAndUpdate(id, {
            standard: parseInt(standard),
            division,
            academicYear,
            registeredStudents,
            presentStudents,
            mealTakenStudents
        }, { new: true });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const saveAttendance = async (req, res) => {
    try {
        const { standard, division, academicYear, registeredStudents, presentStudents, mealTakenStudents, date } = req.body;
        if (!academicYear) {
            return res.status(400).json({ message: 'Academic year is required' });
        }
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const formattedDate = new Date(date).toISOString().split('T')[0];

        const data = await Attendance.findOneAndUpdate(
            {
                standard: parseInt(standard),
                division,
                academicYear,
                date: formattedDate
            },
            {
                standard: parseInt(standard),
                division,
                academicYear,
                date: formattedDate,
                registeredStudents,
                presentStudents,
                mealTakenStudents
            },
            {
                new: true,
                upsert: true
            }
        );
        res.status(200).json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getDailyReport = async (req, res) => {
    try {
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];

        const data = await Attendance.find({
            date: formattedDate
        }).sort({ standard: 1, division: 1 });

        res.status(200).json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const data = await Attendance.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ date: 1, standard: 1, division: 1 });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getSemiMonthlyReport = async (req, res) => {
    try {
        const { month, year, half } = req.params;
        const startDay = half === '1' ? 1 : 16;
        const endDay = half === '1' ? 15 : new Date(year, month, 0).getDate();

        const startDate = new Date(year, month - 1, startDay);
        const endDate = new Date(year, month - 1, endDay);

        const data = await Attendance.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ date: 1, standard: 1, division: 1 });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getCustomRangeReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.params;

        const data = await Attendance.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: 1, standard: 1, division: 1 });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


export const downloadDailyReportExcel = async (req, res) => {
    try {
        const { date } = req.params;
        const queryDate = new Date(date);
        const data = await Attendance.find({ date: queryDate });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(`દૈનિક હાજરી-${date}`);

        const imageId = workbook.addImage({
            filename: path.resolve('./assets/logo.png'), // Adjust path as needed
            extension: 'png',
        });

        sheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 100, height: 100 }
        });


        // Set column widths
        sheet.columns = Array(32).fill({ width: 6 });
        sheet.columns[0] = { width: 10 }; // Standard
        sheet.columns[sheet.columnCount - 1] = { width: 5 };
        sheet.getColumn(1).width = 15;   // Column A
        sheet.getColumn(32).width = 20;  // Column AF

        sheet.getRow(1).height = 100;
        sheet.getRow(2).height = 50;

        // Header rows
        sheet.mergeCells('A1:AF1');
        sheet.getCell('A1').value = `ડૉ. હોમીભાભા પ્રાથમિક શાળા (બપોર)\nન. પ્રા. બાબાજીપુરા શાળા નં. 20`;
        sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
        sheet.getCell('A1').font = { bold: true, size: 20 };

        sheet.mergeCells('A2:AF2');
        sheet.getCell('A2').value = `મધ્યાહ્ન ભોજન યોજના : દૈનિક હાજરી પત્રક`;
        sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
        sheet.getCell('A2').font = { bold: true, size: 20 };

        sheet.mergeCells('A3:AF3');
        sheet.getCell('A3').value = `તારીખ : ${queryDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })}`;
        sheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'right' };
        sheet.getCell('A3').font = { bold: true, size: 14 };

        sheet.mergeCells('A4:A6');
        sheet.getCell('A4').value = 'ધોરણ';
        sheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };

        sheet.mergeCells('B4:K4');
        sheet.getCell('B4').value = 'રજિસ્ટર સંખ્યા';
        sheet.getCell('B4').alignment = { vertical: 'middle', horizontal: 'center' };
        sheet.mergeCells('L4:U4');
        sheet.getCell('L4').value = 'હાજર સંખ્યા';
        sheet.getCell('L4').alignment = { vertical: 'middle', horizontal: 'center' };
        sheet.mergeCells('V4:AE4');
        sheet.getCell('V4').value = 'ભોજન લાભાર્થી સંખ્યા';
        sheet.getCell('V4').alignment = { vertical: 'middle', horizontal: 'center' };

        sheet.mergeCells('AF4:AF6');
        sheet.getCell('AF4').value = 'વર્ગ શિક્ષકની સહી';
        sheet.getCell('AF4').alignment = { vertical: 'middle', horizontal: 'center' };

        const categories = ['અનુ. જાતિ', 'અનુ. જનજાતિ', 'સામાજીક શૈ.પછાત', 'અન્ય', 'કુલ']

        categories.forEach((category, index) => {
            sheet.mergeCells(5, index * 2 + 2, 5, index * 2 + 3);
            sheet.getCell(5, index * 2 + 2).value = category;
            sheet.getCell(5, index * 2 + 2).alignment = { vertical: 'middle', horizontal: 'center' };
        });

        categories.forEach((category, index) => {
            sheet.mergeCells(5, index * 2 + 12, 5, index * 2 + 13);
            sheet.getCell(5, index * 2 + 12).value = category;
            sheet.getCell(5, index * 2 + 12).alignment = { vertical: 'middle', horizontal: 'center' };
        });

        categories.forEach((category, index) => {
            sheet.mergeCells(5, index * 2 + 22, 5, index * 2 + 23);
            sheet.getCell(5, index * 2 + 22).value = category;
            sheet.getCell(5, index * 2 + 22).alignment = { vertical: 'middle', horizontal: 'center' };
        });

        //add male-female header
        for (let i = 0; i < 15; i++) {
            sheet.getCell(6, i * 2 + 2).value = 'કુમાર';
            sheet.getCell(6, i * 2 + 3).value = 'કન્યા';
        }

        const categoriesCode = ['sc', 'st', 'obc', 'general'];
        const totalStd1to4 = Array(30).fill(0);
        const totalStd5to8 = Array(30).fill(0);
        const grandTotal = Array(30).fill(0);

        data.sort((a, b) => a.standard - b.standard); // Ensure correct order

        data.forEach((record, idx) => {
            const rowData = [];
            rowData.push(`${record.standard} - ${record.division}`);
            const sum = { male: 0, female: 0 };

            categoriesCode.forEach((category) => {
                rowData.push(record.registeredStudents[category].male);
                rowData.push(record.registeredStudents[category].female);
                sum.male += record.registeredStudents[category].male;
                sum.female += record.registeredStudents[category].female;
            });
            rowData.push(sum.male, sum.female);
            sum.male = 0;
            sum.female = 0;

            categoriesCode.forEach((category) => {
                rowData.push(record.presentStudents[category].male);
                rowData.push(record.presentStudents[category].female);
                sum.male += record.presentStudents[category].male;
                sum.female += record.presentStudents[category].female;
            });
            rowData.push(sum.male, sum.female);
            sum.male = 0;
            sum.female = 0;

            categoriesCode.forEach((category) => {
                rowData.push(record.mealTakenStudents[category].male);
                rowData.push(record.mealTakenStudents[category].female);
                sum.male += record.mealTakenStudents[category].male;
                sum.female += record.mealTakenStudents[category].female;
            });
            rowData.push(sum.male, sum.female);
            rowData.push(''); // Signature column

            // Update totals
            const currentStandard = record.standard;
            rowData.slice(1).forEach((val, i) => {
                if (typeof val === 'number') {
                    if (currentStandard >= 1 && currentStandard <= 4) totalStd1to4[i] += val;
                    if (currentStandard >= 5 && currentStandard <= 8) totalStd5to8[i] += val;
                    grandTotal[i] += val;
                }
            });

            const row = sheet.addRow(rowData);
            row.eachCell((cell, colNumber) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                if (colNumber > 1 && typeof cell.value === 'number') {
                    cell.numFmt = '#,##0';
                }
            });

            // Check if this is the last class of group 1-4 or 5-8
            const isLastOfStd1to4 = currentStandard === 4 &&
                (idx === data.length - 1 || data[idx + 1].standard > 4);
            const isLastOfStd5to8 = currentStandard === 8 &&
                (idx === data.length - 1 || data[idx + 1].standard > 8);

            const addTotalRow = (label, totalsArray) => {
                const totalRow = sheet.addRow([label, ...totalsArray, '']); // Last empty is for signature
                totalRow.font = { bold: true };
                totalRow.eachCell((cell, colNumber) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    if (colNumber > 1 && typeof cell.value === 'number') {
                        cell.numFmt = '#,##0';
                    }
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            };


            if (isLastOfStd1to4) addTotalRow('ધોરણ 1-4 કુલ', totalStd1to4);
            if (isLastOfStd5to8) addTotalRow('ધોરણ 5-8 કુલ', totalStd5to8);
        });

        // Add grand total at the end
        const grandTotalRow = sheet.addRow(['કુલ', ...grandTotal, '']);
        grandTotalRow.font = { bold: true };
        grandTotalRow.eachCell((cell, colNumber) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            if (colNumber > 1 && typeof cell.value === 'number') {
                cell.numFmt = '#,##0';
            }
            cell.border = {
                top: null,
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });

        // Add border to all cells from row 4 onward
        sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber >= 4) {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        const lastRowNumber = sheet.lastRow.number + 3; // Two rows below the table
        sheet.mergeCells(`A${lastRowNumber}:AF${lastRowNumber}`);
        const noteCell = sheet.getCell(`A${lastRowNumber}`);
        noteCell.value = 'પ્રયોજક શિક્ષકની સહી: __________________________';
        noteCell.font = { italic: true };
        noteCell.height = 30;


        noteCell.border = {
            top: undefined,
            left: undefined,
            bottom: undefined,
            right: undefined
        };

        const finalRowNumber = lastRowNumber + 3;
        sheet.mergeCells(`A${finalRowNumber}:AF${finalRowNumber}`);
        const finalCell = sheet.getCell(`A${finalRowNumber}`);

        const timestamp = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
        finalCell.value = `Digitally generated on ${timestamp}`;
        finalCell.font = { italic: true, size: 10, name: 'Arial' };
        finalCell.alignment = { vertical: 'middle', horizontal: 'center' };
        finalCell.border = {
            top: undefined,
            left: undefined,
            bottom: undefined,
            right: undefined
        };

        // Apply global font (Shruti) and small padding to all cells
        sheet.eachRow({ includeEmpty: true }, (row) => {
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.font = { ...cell.font, name: 'Shruti' };
                cell.alignment = {
                    ...cell.alignment,
                    wrapText: true,
                    vertical: 'middle',
                    horizontal: 'center',
                    indent: 0.2 // slight padding
                };
            });
        });

        noteCell.alignment = { vertical: 'middle', horizontal: 'right' };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename*=UTF-8''${encodeURIComponent('દૈનિકહાજરીરિપોર્ટ.xlsx')}`
        );
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Excel Report generation failed.' });
    }
};

export const downloadDailyReportPDF = async (req, res) => {
    try {
        const { date } = req.params;
        const queryDate = new Date(date);
        const data = await Attendance.find({ date: queryDate }).sort({ standard: 1 });

        const categoriesCode = ['sc', 'st', 'obc', 'general'];

        const totalStd1to4 = Array(30).fill(0);
        const totalStd5to8 = Array(30).fill(0);
        const grandTotal = Array(30).fill(0);

        const rows = [];

        data.forEach((record, idx) => {
            const rowData = [];
            rowData.push(`${record.standard}-${record.division}`);
            const sum = { male: 0, female: 0 };

            categoriesCode.forEach((category) => {
                rowData.push(record.registeredStudents[category].male);
                rowData.push(record.registeredStudents[category].female);
                sum.male += record.registeredStudents[category].male;
                sum.female += record.registeredStudents[category].female;
            });
            rowData.push(sum.male, sum.female);

            sum.male = 0;
            sum.female = 0;
            categoriesCode.forEach((category) => {
                rowData.push(record.presentStudents[category].male);
                rowData.push(record.presentStudents[category].female);
                sum.male += record.presentStudents[category].male;
                sum.female += record.presentStudents[category].female;
            });
            rowData.push(sum.male, sum.female);

            sum.male = 0;
            sum.female = 0;
            categoriesCode.forEach((category) => {
                rowData.push(record.mealTakenStudents[category].male);
                rowData.push(record.mealTakenStudents[category].female);
                sum.male += record.mealTakenStudents[category].male;
                sum.female += record.mealTakenStudents[category].female;
            });
            rowData.push(sum.male, sum.female);
            rowData.push(''); // Signature

            rowData.slice(1).forEach((val, i) => {
                if (typeof val === 'number') {
                    if (record.standard <= 4) totalStd1to4[i] += val;
                    if (record.standard >= 5) totalStd5to8[i] += val;
                    grandTotal[i] += val;
                }
            });

            rows.push(rowData);
        });

        const renderRow = (label, arr) => {
            const tds = [label, ...arr.map((v) => (v === 0 ? '' : v)), ''];
            return `<tr>${tds.map(v => `<td>${v}</td>`).join('')}</tr>`;
        };

        let tableRows = '';
        let lastStandard = 0;

        rows.forEach((row, idx) => {
            const standard = parseInt(row[0].split('-')[0]);
            tableRows += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;

            const nextRow = rows[idx + 1];
            const nextStandard = nextRow ? parseInt(nextRow[0].split('-')[0]) : null;

            const insertTotalRow = (label, arr) =>
                `<tr style="font-weight: bold;">${[label, ...arr.map(v => v || ''), ''].map(cell => `<td>${cell}</td>`).join('')}</tr>`;

            if (standard === 4 && (!nextStandard || nextStandard > 4)) {
                tableRows += insertTotalRow('ધોરણ 1-4 કુલ', totalStd1to4);
            }

            if (standard === 8 && (!nextStandard || nextStandard > 8)) {
                tableRows += insertTotalRow('ધોરણ 5-8 કુલ', totalStd5to8);
            }
        });

        // Add grand total after all
        tableRows += `<tr style="font-weight: bold;">${['કુલ', ...grandTotal.map(v => v || ''), ''].map(cell => `<td>${cell}</td>`).join('')}</tr>`;

        // Add the logo URL
        const logoBase64 = encodeImageToBase64(path.resolve('./assets/logo.png'));

        const finalHTML = `
<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="UTF-8" />
  <style>
    @font-face {
      font-family: 'Shruti';
      src: url('file://${path.resolve('./assets/fonts/Shruti.ttf')}') format('truetype');
    }

    body {
      font-family: 'Shruti', sans-serif;
      padding: 20px;
    }

    .header {
      font-weight: bold;
      font-size: 20px;
      text-align: center;
    }

    .subheader {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
    }

    .date {
      text-align: right;
      font-size: 14px;
      margin-bottom: 10px;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 12px;
    }

    th, td {
      border: 1px solid #000;
      text-align: center;
      padding: 3px;
    }

    .footer {
      margin-top: 40px;
      font-style: italic;
      font-size: 13px;
      text-align: right;
    }

    .timestamp {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div style="position: relative; text-align: center; margin-bottom: 20px;">
    <img src="${logoBase64}" alt="logo" style="position: absolute; left: 0; top: 0; width: 100px;" />
    <div>
        <div class="header">ડૉ. હોમીભાભા પ્રાથમિક શાળા (બપોર)<br>ન. પ્રા. બાબાજીપુરા શાળા નં. 20</div>
        <div class="subheader">મધ્યાહ્ન ભોજન યોજના : દૈનિક હાજરી પત્રક</div>
    </div>
    </div>


  <div class="date">તારીખ : ${queryDate.toLocaleDateString('en-IN')}</div>

  <table>
    <thead>
      <tr>
        <th rowspan="3">ધોરણ</th>
        <th colspan="10">રજિસ્ટર સંખ્યા</th>
        <th colspan="10">હાજર સંખ્યા</th>
        <th colspan="10">ભોજન લાભાર્થી સંખ્યા</th>
        <th rowspan="3" style="width: 150px;">વર્ગ શિક્ષકની સહી</th>
      </tr>
      <tr>
        ${['SC', 'ST', 'OBC', 'GEN', 'કુલ'].map(cat => `<th colspan="2">${cat}</th>`).join('').repeat(3)}
      </tr>
      <tr>
        ${Array(15).fill('<th>કુમાર</th><th>કન્યા</th>').join('')}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">પ્રયોજક શિક્ષકની સહી: __________________________</div>
  <div class="timestamp">Digitally generated on ${new Date().toLocaleString('en-IN')}</div>
</body>
</html>`;

        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(finalHTML, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename*=UTF-8''${encodeURIComponent('દૈનિકહાજરીરિપોર્ટ.pdf')}`
        );
        res.end(pdfBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'PDF generation failed.' });
    }
};

export const downloadSemiMonthlyReportExcel = async (req, res) => {
    try {
        const { month, year, half } = req.params;

        if (!month || !year || !half) {
            return res.status(400).json({ message: 'month, year, and half parameters are required' });
        }

        const fromDate = new Date(year, month - 1, half === 'first' ? 1 : 16);
        const toDate =
            half === 'first'
                ? new Date(year, month - 1, 15)
                : new Date(year, month, 0); // last day of month

        const data = await Attendance.find({
            date: { $gte: fromDate, $lte: toDate }
        }).sort({ date: 1 });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(`પત્રક (${fromDate.getDate()} - ${toDate.getDate()})`);

        sheet.columns = Array(15).fill({ width: 12 });

        // Header
        sheet.getCell('A1').value = 'અક્ષયપાત્ર ફાઉન્ડેશન';
        sheet.getCell('G1').value = 'મધ્યાહન ભોજન યોજના';
        sheet.getCell('N1').value = 'પ્રમાણપત્ર';

        try {
            sheet.mergeCells('A1:G1');
            sheet.mergeCells('G1:N1');
            sheet.mergeCells('N1:O1');
        } catch (err) {
            console.warn('Merge error skipped (already merged?):', err.message);
        }


        // School Info
        sheet.addRow([
            'શાળાનું નામ:-',
            '',
            'માં ગાયત્રી હિન્દી પ્રાથમિક શાળા',
            '',
            '',
            '',
            'કુલ વર્ગો:',
            '',
            'ધોરણ:',
            '',
            'તારીખ:',
            '',
            'કેન્દ્ર નંબર:',
            ''
        ]);

        sheet.addRow([]);

        // Registered Students Section
        sheet.addRow([
            'નોંધાયેલબાળકોની સંખ્યા',
            'અનુ. જાતિ',
            '',
            'અનુ. જનજાતિ',
            '',
            'સા.શૈ.પ.વ.',
            '',
            'અન્ય',
            '',
            'કુલ',
            '',
            'કુલ',
            'મહિનો :-',
            new Date(year, month - 1, 1)
        ]);

        sheet.addRow([
            null,
            'કુમાર',
            'કન્યા',
            'કુમાર',
            'કન્યા',
            'કુમાર',
            'કન્યા',
            'કુમાર',
            'કન્યા',
            'કુમાર',
            'કન્યા'
        ]);

        // Sum Registered
        const registered = { sc: { male: 0, female: 0 }, st: {}, obc: {}, general: {} };
        data.forEach(record => {
            ['sc', 'st', 'obc', 'general'].forEach(cat => {
                ['male', 'female'].forEach(gender => {
                    registered[cat][gender] = (registered[cat][gender] || 0) + (record.registeredStudents[cat][gender] || 0);
                });
            });
        });

        const registeredRow = [
            null,
            registered.sc.male || 0, registered.sc.female || 0,
            registered.st.male || 0, registered.st.female || 0,
            registered.obc.male || 0, registered.obc.female || 0,
            registered.general.male || 0, registered.general.female || 0
        ];

        const totalBoys = registeredRow[1] + registeredRow[3] + registeredRow[5] + registeredRow[7];
        const totalGirls = registeredRow[2] + registeredRow[4] + registeredRow[6] + registeredRow[8];
        registeredRow.push(totalBoys, totalGirls);
        registeredRow.push(totalBoys + totalGirls);
        sheet.addRow(registeredRow);

        // Spacer
        sheet.addRow([null, null, null, null, null, 'હાજર બાળકોની સંખ્યા']);

        // Attendance Table Headers
        sheet.addRow([
            'તારીખ',
            'અનુ. જાતિ',
            '',
            'અનુ. જનજાતિ',
            '',
            'સા.શૈ.પ.વ.',
            '',
            'અન્ય',
            '',
            'કુલ',
            '',
            'કુલ',
            '',
            'આચાર્યની સહી'
        ]);
        sheet.addRow([
            null,
            'કુમાર',
            'કન્યા',
            'કુમાર',
            'કન્યા',
            'કુમાર',
            'કન્યા',
            'કુમાર',
            'કન્યા',
            'કુમાર',
            'કન્યા',
            'કુલ',
            '',
            ''
        ]);

        // Attendance Rows
        for (let d = fromDate.getDate(); d <= toDate.getDate(); d++) {
            const thisDate = new Date(year, month - 1, d);
            const record = data.find(r => new Date(r.date).getDate() === d);

            const row = [d];
            if (record) {
                const getCounts = (cat) => [record.presentStudents[cat].male, record.presentStudents[cat].female];

                let maleSum = 0;
                let femaleSum = 0;
                ['sc', 'st', 'obc', 'general'].forEach(cat => {
                    const [m, f] = getCounts(cat);
                    row.push(m, f);
                    maleSum += m;
                    femaleSum += f;
                });

                row.push(maleSum, femaleSum);
                row.push(maleSum + femaleSum);
            } else {
                row.push(...Array(12).fill(''));
            }

            row.push('');
            sheet.addRow(row);
        }

        // Formatting
        sheet.eachRow({ includeEmpty: true }, (row) => {
            row.eachCell((cell) => {
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                };
                cell.font = { name: 'Shruti', size: 11 };
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename*=UTF-8''${encodeURIComponent(`પત્રક_${fromDate.getDate()}થી_${toDate.getDate()}.xlsx`)}`
        );
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Excel Report generation failed.' });
    }
};