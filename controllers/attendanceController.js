import Attendance from '../models/Attendace.js';
import ExcelJS from 'exceljs';
import path, { dirname } from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';

const encodeImageToBase64 = (filePath) => {
    const ext = path.extname(filePath).substring(1); // e.g. 'png'
    const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
    return `data:image/${ext};base64,${base64}`;
};


export const getAttendance = async (req, res) => {
    try {
        const { date } = req.params;
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.find({ date: formattedDate });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAttendanceByClass = async (req, res) => {
    try {
        const { standard, division, date } = req.params;
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.findOne({
            standard: parseInt(standard),
            division,
            date: formattedDate
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createAttendance = async (req, res) => {
    try {
        const { standard, division, registeredStudents, presentStudents, mealTakenStudents, date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.create({
            standard: parseInt(standard),
            division,
            date: formattedDate,
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
        const { standard, division, registeredStudents, presentStudents, mealTakenStudents, date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.findByIdAndUpdate(id, {
            standard: parseInt(standard),
            division,
            date: formattedDate,
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
        const { standard, division, registeredStudents, presentStudents, mealTakenStudents, date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.findOneAndUpdate(
            {
                standard: parseInt(standard),
                division,
                date: formattedDate
            },
            {
                standard: parseInt(standard),
                division,
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
        const endDay = half === '1' ? 16 : new Date(year, month, 1).getDate();

        const startDate = new Date(year, month - 1, startDay);
        const endDate = new Date(year, month, endDay);

        const data = await Attendance.find({
            date: {
                $gte: startDate,
                $lt: endDate
            }
        }).sort({ date: 1 });

        const result = {};
        const overallTotals = {
            presentStudents: {
                sc: { male: 0, female: 0 },
                st: { male: 0, female: 0 },
                obc: { male: 0, female: 0 },
                general: { male: 0, female: 0 },
                totalMale: 0,
                totalFemale: 0,
                grandTotal: 0
            },
            mealTakenStudents: {
                sc: { male: 0, female: 0 },
                st: { male: 0, female: 0 },
                obc: { male: 0, female: 0 },
                general: { male: 0, female: 0 },
                totalMale: 0,
                totalFemale: 0,
                grandTotal: 0
            }
        };

        data.forEach(record => {
            const dateKey = new Date(record.date).toISOString().split('T')[0];

            if (!result[dateKey]) {
                result[dateKey] = {
                    presentStudents: {
                        sc: { male: 0, female: 0 },
                        st: { male: 0, female: 0 },
                        obc: { male: 0, female: 0 },
                        general: { male: 0, female: 0 },
                        totalMale: 0,
                        totalFemale: 0,
                        grandTotal: 0
                    },
                    mealTakenStudents: {
                        sc: { male: 0, female: 0 },
                        st: { male: 0, female: 0 },
                        obc: { male: 0, female: 0 },
                        general: { male: 0, female: 0 },
                        totalMale: 0,
                        totalFemale: 0,
                        grandTotal: 0
                    }
                };
            }

            const categories = ['sc', 'st', 'obc', 'general'];
            categories.forEach(category => {
                // Update presentStudents totals
                result[dateKey].presentStudents[category].male += record.presentStudents[category].male;
                result[dateKey].presentStudents[category].female += record.presentStudents[category].female;

                overallTotals.presentStudents[category].male += record.presentStudents[category].male;
                overallTotals.presentStudents[category].female += record.presentStudents[category].female;

                // Update mealTakenStudents totals
                result[dateKey].mealTakenStudents[category].male += record.mealTakenStudents[category].male;
                result[dateKey].mealTakenStudents[category].female += record.mealTakenStudents[category].female;

                overallTotals.mealTakenStudents[category].male += record.mealTakenStudents[category].male;
                overallTotals.mealTakenStudents[category].female += record.mealTakenStudents[category].female;
            });

            // Calculate daily totals for presentStudents
            const presentTotals = result[dateKey].presentStudents;
            presentTotals.totalMale += record.presentStudents.sc.male + record.presentStudents.st.male +
                record.presentStudents.obc.male + record.presentStudents.general.male;
            presentTotals.totalFemale += record.presentStudents.sc.female + record.presentStudents.st.female +
                record.presentStudents.obc.female + record.presentStudents.general.female;
            presentTotals.grandTotal += presentTotals.totalMale + presentTotals.totalFemale;

            overallTotals.presentStudents.totalMale += presentTotals.totalMale;
            overallTotals.presentStudents.totalFemale += presentTotals.totalFemale;
            overallTotals.presentStudents.grandTotal += presentTotals.grandTotal;

            // Calculate daily totals for mealTakenStudents
            const mealTotals = result[dateKey].mealTakenStudents;
            mealTotals.totalMale += record.mealTakenStudents.sc.male + record.mealTakenStudents.st.male +
                record.mealTakenStudents.obc.male + record.mealTakenStudents.general.male;
            mealTotals.totalFemale += record.mealTakenStudents.sc.female + record.mealTakenStudents.st.female +
                record.mealTakenStudents.obc.female + record.mealTakenStudents.general.female;
            mealTotals.grandTotal += mealTotals.totalMale + mealTotals.totalFemale;

            overallTotals.mealTakenStudents.totalMale += mealTotals.totalMale;
            overallTotals.mealTakenStudents.totalFemale += mealTotals.totalFemale;
            overallTotals.mealTakenStudents.grandTotal += mealTotals.grandTotal;
        });

        res.status(200).json({ result, overallTotals });
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
        res.status500().json({ message: 'Server error', error: error.message });
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

// export const downloadSemiMonthlyReportExcel = async (req, res) => {
//     try {
//         const { month, year, half } = req.params;
        
//         // Calculate academic year based on month (June-May)
//         const monthNum = parseInt(month);
//         const academicYear = monthNum >= 6 
//             ? { start: year, end: parseInt(year) + 1 }
//             : { start: parseInt(year) - 1, end: year };

//         // Get dates for half month
//         const startDay = half === '1' ? 1 : 16;
//         const endDay = half === '1' 
//             ? 15 
//             : new Date(year, monthNum, 0).getDate();

//         // Create date list for the half month period
//         const dateList = [];
//         for (let d = startDay; d <= endDay; d++) {
//             const date = new Date(Date.UTC(year, monthNum - 1, d));
//             dateList.push(date.toISOString().split('T')[0]);
//         }

//         // Get registered students from last entry of the period
//         const lastAttendance = await Attendance.findOne({
//             date: {
//                 $gte: new Date(`${year}-${month.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`),
//                 $lte: new Date(`${year}-${month.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`)
//             }
//         }).sort({ date: -1 }); // Sort by date descending to get latest entry

//         // Calculate registered totals from the last entry
//         const registeredTotals = {
//             sc_male: 0,
//             sc_female: 0,
//             st_male: 0,
//             st_female: 0,
//             obc_male: 0,
//             obc_female: 0,
//             general_male: 0,
//             general_female: 0
//         };

//         if (lastAttendance) {
//             ['sc', 'st', 'obc', 'general'].forEach(category => {
//                 registeredTotals[`${category}_male`] = lastAttendance.registeredStudents[category].male;
//                 registeredTotals[`${category}_female`] = lastAttendance.registeredStudents[category].female;
//             });
//         }

//         // Get attendance data for the half month
//         const allRecords = await Attendance.find({
//             date: {
//                 $gte: new Date(`${year}-${month.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`),
//                 $lte: new Date(`${year}-${month.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`)
//             }
//         }).sort({ date: 1 });

//         // Group records by date and calculate totals
//         const groupedByDate = {};
//         const initCategory = () => ({
//             sc: { male: 0, female: 0 },
//             st: { male: 0, female: 0 },
//             obc: { male: 0, female: 0 },
//             general: { male: 0, female: 0 },
//             totalMale: 0,
//             totalFemale: 0,
//             grandTotal: 0
//         });

//         const totals = {
//             presentStudents: initCategory(),
//             mealTakenStudents: initCategory()
//         };

//         // Initialize all dates
//         dateList.forEach(date => {
//             groupedByDate[date] = {
//                 presentStudents: initCategory(),
//                 mealTakenStudents: initCategory()
//             };
//         });

//         // Calculate daily totals
//         allRecords.forEach(record => {
//             const dateKey = new Date(record.date).toISOString().split('T')[0];
//             const categories = ['sc', 'st', 'obc', 'general'];

//             ['presentStudents', 'mealTakenStudents'].forEach(type => {
//                 const target = groupedByDate[dateKey][type];
//                 const sumTarget = totals[type];

//                 categories.forEach(cat => {
//                     const male = record[type][cat]?.male || 0;
//                     const female = record[type][cat]?.female || 0;

//                     target[cat].male += male;
//                     target[cat].female += female;
//                     sumTarget[cat].male += male;
//                     sumTarget[cat].female += female;

//                     target.totalMale += male;
//                     target.totalFemale += female;
//                     target.grandTotal += male + female;
//                 });
//             });
//         });

//         // Load appropriate Excel template based on half
//         const workbook = new ExcelJS.Workbook();
//         const templateName = half === '1' ? 'Semi Monthly First.xlsx' : 'Semi Monthly Second.xlsx';
//         const filePath = path.resolve(`./assets/${templateName}`);
//         await workbook.xlsx.readFile(filePath);
//         const worksheet = workbook.getWorksheet(1);

//         // Add current date in cell L4
//         const currentDate = new Date().toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric'
//         });
//         worksheet.getCell('L4').value = currentDate;
//         worksheet.getCell('L4').alignment = { vertical: 'middle', horizontal: 'center' };

//         // Add month name in Gujarati in cell N6
//         const gujaratiMonths = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];
//         worksheet.getCell('N6').value = gujaratiMonths[monthNum - 1];
//         worksheet.getCell('N6').alignment = { vertical: 'middle', horizontal: 'center' };
//         worksheet.getCell('N6').font = { name: 'Shruti', size: 11 };
        
//         // Add registered students data to row 8
//         const row8 = worksheet.getRow(8);
//         row8.getCell(2).value = registeredTotals.sc_male;
//         row8.getCell(3).value = registeredTotals.sc_female;
//         row8.getCell(4).value = registeredTotals.st_male;
//         row8.getCell(5).value = registeredTotals.st_female;
//         row8.getCell(6).value = registeredTotals.obc_male;
//         row8.getCell(7).value = registeredTotals.obc_female;
//         row8.getCell(8).value = registeredTotals.general_male;
//         row8.getCell(9).value = registeredTotals.general_female;

//         const totalMale = registeredTotals.sc_male + registeredTotals.st_male + 
//             registeredTotals.obc_male + registeredTotals.general_male;
//         const totalFemale = registeredTotals.sc_female + registeredTotals.st_female + 
//             registeredTotals.obc_female + registeredTotals.general_female;

//         row8.getCell(10).value = totalMale;
//         row8.getCell(11).value = totalFemale;
//         row8.getCell(12).value = totalMale + totalFemale;

//         // Format row 8
//         row8.eachCell((cell) => {
//             cell.numFmt = '#,##0';
//             cell.alignment = { vertical: 'middle', horizontal: 'center' };
//         });

//         // Fill present students data (row 13 onwards)
//         let currentRow = 13;
//         Object.entries(groupedByDate).forEach(([dateStr, data]) => {
//             const row = worksheet.getRow(currentRow);
//             row.getCell(1).value = new Date(dateStr).toLocaleDateString('en-IN', {
//                 day: '2-digit',
//                 month: '2-digit',
//                 year: 'numeric'
//             });

//             // Present students data
//             row.getCell(2).value = data.presentStudents.sc.male;
//             row.getCell(3).value = data.presentStudents.sc.female;
//             row.getCell(4).value = data.presentStudents.st.male;
//             row.getCell(5).value = data.presentStudents.st.female;
//             row.getCell(6).value = data.presentStudents.obc.male;
//             row.getCell(7).value = data.presentStudents.obc.female;
//             row.getCell(8).value = data.presentStudents.general.male;
//             row.getCell(9).value = data.presentStudents.general.female;
//             row.getCell(10).value = data.presentStudents.totalMale;
//             row.getCell(11).value = data.presentStudents.totalFemale;
//             row.getCell(12).value = data.presentStudents.grandTotal;

//             row.eachCell((cell) => {
//                 if (typeof cell.value === 'number') {
//                     cell.numFmt = '#,##0';
//                 }
//                 cell.alignment = { vertical: 'middle', horizontal: 'center' };
//             });

//             currentRow++;
//         });

//         // Present students total row
//         const presentTotalsRow = worksheet.getRow(currentRow);
//         presentTotalsRow.getCell(1).value = 'Total';
//         presentTotalsRow.getCell(2).value = totals.presentStudents.sc.male;
//         presentTotalsRow.getCell(3).value = totals.presentStudents.sc.female;
//         presentTotalsRow.getCell(4).value = totals.presentStudents.st.male;
//         presentTotalsRow.getCell(5).value = totals.presentStudents.st.female;
//         presentTotalsRow.getCell(6).value = totals.presentStudents.obc.male;
//         presentTotalsRow.getCell(7).value = totals.presentStudents.obc.female;
//         presentTotalsRow.getCell(8).value = totals.presentStudents.general.male;
//         presentTotalsRow.getCell(9).value = totals.presentStudents.general.female;
//         presentTotalsRow.getCell(10).value = totals.presentStudents.totalMale;
//         presentTotalsRow.getCell(11).value = totals.presentStudents.totalFemale;
//         presentTotalsRow.getCell(12).value = totals.presentStudents.grandTotal;

//         presentTotalsRow.eachCell((cell) => {
//             if (typeof cell.value === 'number') {
//                 cell.numFmt = '#,##0';
//             }
//             cell.alignment = { vertical: 'middle', horizontal: 'center' };
//             cell.font = { bold: true };
//         });

//         currentRow = half === '1' ? 33 : 34;
//         Object.entries(groupedByDate).forEach(([dateStr, data]) => {
//             const row = worksheet.getRow(currentRow);
//             row.getCell(1).value = new Date(dateStr).toLocaleDateString('en-IN', {
//                 day: '2-digit',
//                 month: '2-digit',
//                 year: 'numeric'
//             });

//             row.getCell(2).value = data.mealTakenStudents.sc.male;
//             row.getCell(3).value = data.mealTakenStudents.sc.female;
//             row.getCell(4).value = data.mealTakenStudents.st.male;
//             row.getCell(5).value = data.mealTakenStudents.st.female;
//             row.getCell(6).value = data.mealTakenStudents.obc.male;
//             row.getCell(7).value = data.mealTakenStudents.obc.female;
//             row.getCell(8).value = data.mealTakenStudents.general.male;
//             row.getCell(9).value = data.mealTakenStudents.general.female;
//             row.getCell(10).value = data.mealTakenStudents.totalMale;
//             row.getCell(11).value = data.mealTakenStudents.totalFemale;
//             row.getCell(12).value = data.mealTakenStudents.grandTotal;

//             row.eachCell((cell) => {
//                 if (typeof cell.value === 'number') {
//                     cell.numFmt = '#,##0';
//                 }
//                 cell.alignment = { vertical: 'middle', horizontal: 'center' };
//             });

//             currentRow++;
//         });

//         // Meal taken students total row
//         const mealTakenTotalsRow = worksheet.getRow(currentRow);
//         mealTakenTotalsRow.getCell(1).value = 'Total';
//         mealTakenTotalsRow.getCell(2).value = totals.mealTakenStudents.sc.male;
//         mealTakenTotalsRow.getCell(3).value = totals.mealTakenStudents.sc.female;
//         mealTakenTotalsRow.getCell(4).value = totals.mealTakenStudents.st.male;
//         mealTakenTotalsRow.getCell(5).value = totals.mealTakenStudents.st.female;
//         mealTakenTotalsRow.getCell(6).value = totals.mealTakenStudents.obc.male;
//         mealTakenTotalsRow.getCell(7).value = totals.mealTakenStudents.obc.female;
//         mealTakenTotalsRow.getCell(8).value = totals.mealTakenStudents.general.male;
//         mealTakenTotalsRow.getCell(9).value = totals.mealTakenStudents.general.female;
//         mealTakenTotalsRow.getCell(10).value = totals.mealTakenStudents.totalMale;
//         mealTakenTotalsRow.getCell(11).value = totals.mealTakenStudents.totalFemale;
//         mealTakenTotalsRow.getCell(12).value = totals.mealTakenStudents.grandTotal;

//         mealTakenTotalsRow.eachCell((cell) => {
//             if (typeof cell.value === 'number') {
//                 cell.numFmt = '#,##0';
//             }
//             cell.alignment = { vertical: 'middle', horizontal: 'center' };
//             cell.font = { bold: true };
//         });

//         // Set response headers and send file
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', `attachment; filename=Patrak_Report_${month}_${half}.xlsx`);
//         await workbook.xlsx.write(res);
//         res.end();

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Report generation failed.' });
//     }
// };

export const downloadSemiMonthlyReportExcel = async (req, res) => {
    try {
        const { month, year, half } = req.params;
        
        // Calculate academic year based on month (June-May)
        const monthNum = parseInt(month);
        const academicYear = monthNum >= 6 
            ? { start: year, end: parseInt(year) + 1 }
            : { start: parseInt(year) - 1, end: year };

        // Get dates for half month
        const startDay = half === '1' ? 1 : 16;
        const endDay = half === '1' 
            ? 15 
            : new Date(year, monthNum, 0).getDate();

        // Create date list for the half month period
        const dateList = [];
        for (let d = startDay; d <= endDay; d++) {
            const date = new Date(Date.UTC(year, monthNum - 1, d));
            dateList.push(date.toISOString().split('T')[0]);
        }

        // Define standard ranges with their corresponding backend filters
        const standardRanges = [
            { 
                name: 'બાલવાટિકા',
                worksheetName: 'બાલવાટિકા',
                stdName: 'બાલવાટિકા',
                filter: { standard: '0', division: 'A' } // Balvatika is std 0, div A in backend
            },
            { 
                name: 'ધોરણ ૧ થી ૫', 
                worksheetName: 'ધોરણ ૧ થી ૫',
                stdName: '૧-૫',
                filter: { 
                    standard: { $in: ['1', '2', '3', '4', '5'] }
                }
            },
            { 
                name: 'ધોરણ ૬ થી ૮', 
                worksheetName: 'ધોરણ ૬ થી ૮',
                stdName: '૬-૮',
                filter: { 
                    standard: { $in: ['6', '7', '8'] }
                }
            }
        ];

        // Load appropriate Excel template based on half
        const workbook = new ExcelJS.Workbook();
        const templateName = half === '1' ? 'Semi Monthly First.xlsx' : 'Semi Monthly Second.xlsx';
        const filePath = path.resolve(`./assets/${templateName}`);
        await workbook.xlsx.readFile(filePath);
        
        // For each standard range, create a worksheet
        for (let i = 0; i < standardRanges.length; i++) {
            const standardRange = standardRanges[i];
            
            // For the first range, use the existing worksheet, otherwise clone it
            let worksheet;
            if (i === 0) {
                worksheet = workbook.getWorksheet(1);
                worksheet.name = standardRange.worksheetName;
            } else {
                // Clone the first worksheet for consistent formatting
                const sourceWorksheet = workbook.getWorksheet(1);
                worksheet = workbook.addWorksheet(standardRange.worksheetName);
                
                // Copy worksheet properties and structure
                worksheet.properties = Object.assign({}, sourceWorksheet.properties);
                worksheet.properties.defaultRowHeight = sourceWorksheet.properties.defaultRowHeight;
                worksheet.properties.defaultColWidth = sourceWorksheet.properties.defaultColWidth;
                
                // Copy column widths and row heights
                sourceWorksheet.columns.forEach((col, index) => {
                    if (col && col.width) {
                        worksheet.getColumn(index + 1).width = col.width;
                    }
                });
                
                // Copy merged cells - using proper ExcelJS API method
                const mergedCells = sourceWorksheet.model?.merges || [];
                mergedCells.forEach(merge => {
                    if (merge && merge.split) {
                        const [start, end] = merge.split(':');
                        worksheet.mergeCells(start + ':' + end);
                    }
                });
                
                // Copy all cells with styles, values, and formulas
                sourceWorksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                    const newRow = worksheet.getRow(rowNumber);
                    
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        const newCell = newRow.getCell(colNumber);
                        
                        // Copy cell value
                        newCell.value = cell.value;
                        
                        // Copy styling
                        if (cell.style) {
                            newCell.style = JSON.parse(JSON.stringify(cell.style));
                        }
                        
                        // Copy data validations, if any
                        if (cell.dataValidation) {
                            newCell.dataValidation = JSON.parse(JSON.stringify(cell.dataValidation));
                        }
                    });
                    
                    // Set row height
                    if (row.height) {
                        newRow.height = row.height;
                    }
                });
            }
            
            // Get registered students from last entry of the period for this standard range
            const lastAttendance = await Attendance.findOne({
                date: {
                    $gte: new Date(`${year}-${month.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`),
                    $lte: new Date(`${year}-${month.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`)
                },
                ...standardRange.filter
            }).sort({ date: -1 }); // Sort by date descending to get latest entry

            // Calculate registered totals from the last entry
            const registeredTotals = {
                sc_male: 0,
                sc_female: 0,
                st_male: 0,
                st_female: 0,
                obc_male: 0,
                obc_female: 0,
                general_male: 0,
                general_female: 0
            };

            if (lastAttendance) {
                ['sc', 'st', 'obc', 'general'].forEach(category => {
                    registeredTotals[`${category}_male`] = lastAttendance.registeredStudents[category].male;
                    registeredTotals[`${category}_female`] = lastAttendance.registeredStudents[category].female;
                });
            }

            // Get attendance data for the half month for this standard range
            const allRecords = await Attendance.find({
                date: {
                    $gte: new Date(`${year}-${month.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`),
                    $lte: new Date(`${year}-${month.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`)
                },
                ...standardRange.filter
            }).sort({ date: 1 });

            // Group records by date and calculate totals
            const groupedByDate = {};
            const initCategory = () => ({
                sc: { male: 0, female: 0 },
                st: { male: 0, female: 0 },
                obc: { male: 0, female: 0 },
                general: { male: 0, female: 0 },
                totalMale: 0,
                totalFemale: 0,
                grandTotal: 0
            });

            const totals = {
                presentStudents: initCategory(),
                mealTakenStudents: initCategory()
            };

            // Initialize all dates
            dateList.forEach(date => {
                groupedByDate[date] = {
                    presentStudents: initCategory(),
                    mealTakenStudents: initCategory()
                };
            });

            // Calculate daily totals
            allRecords.forEach(record => {
                const dateKey = new Date(record.date).toISOString().split('T')[0];
                const categories = ['sc', 'st', 'obc', 'general'];

                ['presentStudents', 'mealTakenStudents'].forEach(type => {
                    const target = groupedByDate[dateKey][type];
                    const sumTarget = totals[type];

                    categories.forEach(cat => {
                        const male = record[type][cat]?.male || 0;
                        const female = record[type][cat]?.female || 0;

                        target[cat].male += male;
                        target[cat].female += female;
                        sumTarget[cat].male += male;
                        sumTarget[cat].female += female;

                        target.totalMale += male;
                        target.totalFemale += female;
                        target.grandTotal += male + female;
                    });
                });
            });

            // Add standard range in cell J4
            worksheet.getCell('J4').value = standardRange.stdName;
            worksheet.getCell('J4').alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('J4').font = { name: 'Shruti', size: 11 };
            
            // Add current date in cell L4
            const currentDate = new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            worksheet.getCell('L4').value = currentDate;
            worksheet.getCell('L4').alignment = { vertical: 'middle', horizontal: 'center' };

            // Add month name in Gujarati in cell N6
            const gujaratiMonths = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];
            worksheet.getCell('N6').value = gujaratiMonths[monthNum - 1];
            worksheet.getCell('N6').alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('N6').font = { name: 'Shruti', size: 11 };

            // Add registered students data to row 8
            const row8 = worksheet.getRow(8);
            row8.getCell(2).value = registeredTotals.sc_male;
            row8.getCell(3).value = registeredTotals.sc_female;
            row8.getCell(4).value = registeredTotals.st_male;
            row8.getCell(5).value = registeredTotals.st_female;
            row8.getCell(6).value = registeredTotals.obc_male;
            row8.getCell(7).value = registeredTotals.obc_female;
            row8.getCell(8).value = registeredTotals.general_male;
            row8.getCell(9).value = registeredTotals.general_female;

            const totalMale = registeredTotals.sc_male + registeredTotals.st_male + 
                registeredTotals.obc_male + registeredTotals.general_male;
            const totalFemale = registeredTotals.sc_female + registeredTotals.st_female + 
                registeredTotals.obc_female + registeredTotals.general_female;

            row8.getCell(10).value = totalMale;
            row8.getCell(11).value = totalFemale;
            row8.getCell(12).value = totalMale + totalFemale;

            // Format row 8
            row8.eachCell((cell) => {
                cell.numFmt = '#,##0';
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Fill present students data (row 13 onwards)
            let currentRow = 13;
            Object.entries(groupedByDate).forEach(([dateStr, data]) => {
                const row = worksheet.getRow(currentRow);
                row.getCell(1).value = new Date(dateStr).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                // Present students data
                row.getCell(2).value = data.presentStudents.sc.male;
                row.getCell(3).value = data.presentStudents.sc.female;
                row.getCell(4).value = data.presentStudents.st.male;
                row.getCell(5).value = data.presentStudents.st.female;
                row.getCell(6).value = data.presentStudents.obc.male;
                row.getCell(7).value = data.presentStudents.obc.female;
                row.getCell(8).value = data.presentStudents.general.male;
                row.getCell(9).value = data.presentStudents.general.female;
                row.getCell(10).value = data.presentStudents.totalMale;
                row.getCell(11).value = data.presentStudents.totalFemale;
                row.getCell(12).value = data.presentStudents.grandTotal;

                row.eachCell((cell) => {
                    if (typeof cell.value === 'number') {
                        cell.numFmt = '#,##0';
                    }
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });

                currentRow++;
            });

            // Present students total row
            const presentTotalsRow = worksheet.getRow(currentRow);
            presentTotalsRow.getCell(1).value = 'Total';
            presentTotalsRow.getCell(2).value = totals.presentStudents.sc.male;
            presentTotalsRow.getCell(3).value = totals.presentStudents.sc.female;
            presentTotalsRow.getCell(4).value = totals.presentStudents.st.male;
            presentTotalsRow.getCell(5).value = totals.presentStudents.st.female;
            presentTotalsRow.getCell(6).value = totals.presentStudents.obc.male;
            presentTotalsRow.getCell(7).value = totals.presentStudents.obc.female;
            presentTotalsRow.getCell(8).value = totals.presentStudents.general.male;
            presentTotalsRow.getCell(9).value = totals.presentStudents.general.female;
            presentTotalsRow.getCell(10).value = totals.presentStudents.totalMale;
            presentTotalsRow.getCell(11).value = totals.presentStudents.totalFemale;
            presentTotalsRow.getCell(12).value = totals.presentStudents.grandTotal;

            presentTotalsRow.eachCell((cell) => {
                if (typeof cell.value === 'number') {
                    cell.numFmt = '#,##0';
                }
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { bold: true };
            });

            // Starting row for meal taken students, based on half
            currentRow = half === '1' ? 33 : 34;
            Object.entries(groupedByDate).forEach(([dateStr, data]) => {
                const row = worksheet.getRow(currentRow);
                row.getCell(1).value = new Date(dateStr).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                row.getCell(2).value = data.mealTakenStudents.sc.male;
                row.getCell(3).value = data.mealTakenStudents.sc.female;
                row.getCell(4).value = data.mealTakenStudents.st.male;
                row.getCell(5).value = data.mealTakenStudents.st.female;
                row.getCell(6).value = data.mealTakenStudents.obc.male;
                row.getCell(7).value = data.mealTakenStudents.obc.female;
                row.getCell(8).value = data.mealTakenStudents.general.male;
                row.getCell(9).value = data.mealTakenStudents.general.female;
                row.getCell(10).value = data.mealTakenStudents.totalMale;
                row.getCell(11).value = data.mealTakenStudents.totalFemale;
                row.getCell(12).value = data.mealTakenStudents.grandTotal;

                row.eachCell((cell) => {
                    if (typeof cell.value === 'number') {
                        cell.numFmt = '#,##0';
                    }
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });

                currentRow++;
            });

            // Meal taken students total row
            const mealTakenTotalsRow = worksheet.getRow(currentRow);
            mealTakenTotalsRow.getCell(1).value = 'Total';
            mealTakenTotalsRow.getCell(2).value = totals.mealTakenStudents.sc.male;
            mealTakenTotalsRow.getCell(3).value = totals.mealTakenStudents.sc.female;
            mealTakenTotalsRow.getCell(4).value = totals.mealTakenStudents.st.male;
            mealTakenTotalsRow.getCell(5).value = totals.mealTakenStudents.st.female;
            mealTakenTotalsRow.getCell(6).value = totals.mealTakenStudents.obc.male;
            mealTakenTotalsRow.getCell(7).value = totals.mealTakenStudents.obc.female;
            mealTakenTotalsRow.getCell(8).value = totals.mealTakenStudents.general.male;
            mealTakenTotalsRow.getCell(9).value = totals.mealTakenStudents.general.female;
            mealTakenTotalsRow.getCell(10).value = totals.mealTakenStudents.totalMale;
            mealTakenTotalsRow.getCell(11).value = totals.mealTakenStudents.totalFemale;
            mealTakenTotalsRow.getCell(12).value = totals.mealTakenStudents.grandTotal;

            mealTakenTotalsRow.eachCell((cell) => {
                if (typeof cell.value === 'number') {
                    cell.numFmt = '#,##0';
                }
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { bold: true };
            });

            // Add wrap text to all cells
            worksheet.eachRow({ includeEmpty: true }, (row) => {
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

        }



        // Set response headers and send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Patrak_Report_${month}_${half}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Report generation failed.' });
    }
};
