import Attendance from '../../models/Attendace.js';
import ExcelJS from 'exceljs';
import path from 'path';

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
        sheet.getCell('A1').value = `ડૉ. હોમીભાભા પ્રાથમિક શાળા (બપોર)\nન. પા. બાબાજીપુરા શાળા નં. 20`;
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

        data.sort((a, b) => {
            if (a.standard === 0) return -1;  // Balvatika comes first
            if (b.standard === 0) return 1;
            return a.standard - b.standard;
        });

        data.forEach((record, idx) => {
            const rowData = [];
            rowData.push(record.standard === 0 ? 'બાલવાટિકા' : `${record.standard} - ${record.division}`);
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