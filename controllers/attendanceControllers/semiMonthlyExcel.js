import Attendance from '../../models/Attendace.js';
import ExcelJS from 'exceljs';
import path from 'path';

export const downloadSemiMonthlyReportExcel = async (req, res) => {
    try {
        const { month, year, half } = req.params;
        
        // Calculate academic year based on month (June-May)
        const monthNum = parseInt(month);
        const academicYear = monthNum >= 5 
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