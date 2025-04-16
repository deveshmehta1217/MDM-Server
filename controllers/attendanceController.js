import Attendance from '../models/Attendace.js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import moment from 'moment';

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

        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename*=UTF-8''${encodeURIComponent('દૈનિકહાજરીરિપોર્ટ.pdf')}`
        );

        doc.pipe(res);

        // Load logo
        const logoPath = path.resolve('./assets/logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 20, { width: 80 });
        }

        // Header
        doc.font('Helvetica-Bold').fontSize(16).text(
            `ડૉ. હોમીભાભા પ્રાથમિક શાળા (બપોર)\nન. પ્રા. બાબાજીપુરા શાળા નં. 20`,
            130,
            30,
            { align: 'center' }
        );

        doc.moveDown(0.5);
        doc.fontSize(14).text(`મધ્યાહ્ન ભોજન યોજના : દૈનિક હાજરી પત્રક`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`તારીખ : ${moment(queryDate).format('DD/MM/YYYY')}`, {
            align: 'right',
        });

        doc.moveDown(1);

        const headers = [
            'ધોરણ',
            'રજિસ્ટર સંખ્યા (કુમાર/કન્યા)',
            'હાજર સંખ્યા (કુમાર/કન્યા)',
            'ભોજન લાભ (કુમાર/કન્યા)',
            'સહી',
        ];

        const categoriesCode = ['sc', 'st', 'obc', 'general'];
        const totalStd1to4 = Array(30).fill(0);
        const totalStd5to8 = Array(30).fill(0);
        const grandTotal = Array(30).fill(0);

        const cellWidth = 60;
        const lineHeight = 20;

        const drawRow = (doc, y, rowData, isHeader = false, isBold = false) => {
            let x = 40;
            rowData.forEach((text, i) => {
                doc
                    .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
                    .fontSize(10)
                    .text(String(text), x, y, {
                        width: cellWidth,
                        align: 'center',
                    });
                x += cellWidth;
            });
            doc.moveTo(40, y + lineHeight).lineTo(x, y + lineHeight).stroke();
        };

        let y = doc.y + 10;

        // Header row
        drawRow(doc, y, [
            'ધોરણ',
            'SC',
            'ST',
            'OBC',
            'GEN',
            'કુલ',
            'SC',
            'ST',
            'OBC',
            'GEN',
            'કુલ',
            'SC',
            'ST',
            'OBC',
            'GEN',
            'કુલ',
            'સહી',
        ], true, true);

        y += lineHeight;

        data.forEach((record, idx) => {
            const row = [];
            const stdLabel = `${record.standard}-${record.division}`;
            row.push(stdLabel);

            const section = [record.registeredStudents, record.presentStudents, record.mealTakenStudents];
            section.forEach((group) => {
                let maleTotal = 0;
                let femaleTotal = 0;
                categoriesCode.forEach(cat => {
                    maleTotal += group[cat].male;
                    femaleTotal += group[cat].female;
                    row.push(`${group[cat].male}/${group[cat].female}`);
                });
                row.push(`${maleTotal}/${femaleTotal}`);
            });

            row.push('');

            drawRow(doc, y, row);
            y += lineHeight;

            // Optionally calculate totals here, as done in Excel
        });

        y += 10;
        doc.font('Helvetica-Oblique').fontSize(12).text('પ્રયોજક શિક્ષકની સહી: __________________________', 40, y, {
            align: 'right',
        });

        y += 30;
        doc.fontSize(10).text(`Digitally generated on ${moment().format('DD/MM/YYYY, h:mm A')}`, 40, y, {
            align: 'center',
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'PDF Report generation failed.' });
    }
};