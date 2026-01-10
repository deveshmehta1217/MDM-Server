import Attendance from "../../models/Attendace.js";

export const getSemiMonthlyReportV2 = async (req, res) => {
    try {
        const { month, year, half } = req.params;
        const monthNum = parseInt(month);
        const startDay = half === '1' ? 1 : 16;
        const endDay = half === '1' ? 15 : new Date(year, month, 0).getDate();

        const startDate = new Date(`${year}-${monthNum.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`);
        const endDate = new Date(`${year}-${monthNum.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`);

        const dateList = [];
        for (let d = startDay; d <= endDay; d++) {
            const date = new Date(Date.UTC(year, monthNum - 1, d));
            dateList.push(date.toISOString().split('T')[0]);
        }

        const standardRanges = [
            {
                name: 'બાલવાટિકા',
                worksheetName: 'બાલવાટિકા',
                stdName: 'બાલવાટિકા',
                filter: { standard: 0 }
            },
            {
                name: 'ધોરણ ૧ થી ૫',
                worksheetName: 'ધોરણ ૧ થી ૫',
                stdName: '૧-૫',
                filter: { standard: { $in: [1, 2, 3, 4, 5] } }
            },
            {
                name: 'ધોરણ ૬ થી ૮',
                worksheetName: 'ધોરણ ૬ થી ૮',
                stdName: '૬-૮',
                filter: { standard: { $in: [6, 7, 8] } }
            }
        ];

        const academicYear = monthNum >= 6 
            ? { start: year, end: parseInt(year) + 1 } 
            : { start: parseInt(year) - 1, end: year };

        const gujaratiMonths = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];

        const reportData = [];

        for (const range of standardRanges) {
            const matchQuery = {
                schoolId: req.schoolId,
                date: { $gte: startDate, $lte: endDate },
                ...range.filter
            };

            const records = await Attendance.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: "$date",
                        present: { $push: "$presentStudents" },
                        meal: { $push: "$mealTakenStudents" },
                        alpahar: { $push: "$alpaharTakenStudents" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const daysData = {};

            for (const rec of records) {
                const dateKey = new Date(rec._id).toISOString().split('T')[0];
                const categories = ['sc', 'st', 'obc', 'general'];
                const initCategory = () => ({ sc: { male: 0, female: 0 }, st: {}, obc: {}, general: {}, totalMale: 0, totalFemale: 0, grandTotal: 0 });

                const sumCategory = (arr, key) => {
                    const result = initCategory();
                    for (const item of arr) {
                        for (const cat of categories) {
                            result[cat].male = (result[cat].male || 0) + (item?.[cat]?.male || 0);
                            result[cat].female = (result[cat].female || 0) + (item?.[cat]?.female || 0);
                        }
                    }
                    result.totalMale = categories.reduce((t, c) => t + result[c].male, 0);
                    result.totalFemale = categories.reduce((t, c) => t + result[c].female, 0);
                    result.grandTotal = result.totalMale + result.totalFemale;
                    return result;
                };

                daysData[dateKey] = {
                    present: sumCategory(rec.present),
                    meal: sumCategory(rec.meal),
                    alpahar: sumCategory(rec.alpahar)
                };
            }

            const buildGridRow = (date, catData = {}) => {
                const get = (c, s) => catData?.[c]?.[s] || 0;
                const row = [
                    new Date(date).toLocaleDateString('en-IN', { day: '2-digit' }),
                    get('sc', 'male'), get('sc', 'female'),
                    get('st', 'male'), get('st', 'female'),
                    get('obc', 'male'), get('obc', 'female'),
                    get('general', 'male'), get('general', 'female')
                ];
                const totalM = row[1] + row[3] + row[5] + row[7];
                const totalF = row[2] + row[4] + row[6] + row[8];
                const total = totalM + totalF;
                return [...row, totalM, totalF, total];
            };

            const sumGrid = (grid) => {
                const totals = Array(12).fill(0);
                grid.forEach(row => {
                    for (let i = 1; i < 12; i++) {
                        totals[i] += row[i];
                    }
                });
                return ['કુલ', ...totals.slice(1)];
            };

            const presentGrid = [], mealGrid = [], alpaharGrid = [];

            for (const date of dateList) {
                presentGrid.push(buildGridRow(date, daysData[date]?.present));
                mealGrid.push(buildGridRow(date, daysData[date]?.meal));
                alpaharGrid.push(buildGridRow(date, daysData[date]?.alpahar));
            }

            presentGrid.push(sumGrid(presentGrid));
            mealGrid.push(sumGrid(mealGrid));
            alpaharGrid.push(sumGrid(alpaharGrid));

            // Get registered totals from the last available date in the semi-month range
            // First find the last available date for this range
            const lastAvailableRecord = await Attendance.findOne(matchQuery).sort({ date: -1 });
            const regTotals = { sc: { male: 0, female: 0 }, st: { male: 0, female: 0 }, obc: { male: 0, female: 0 }, general: { male: 0, female: 0 } };

            if (lastAvailableRecord) {
                const lastAvailableDate = lastAvailableRecord.date;
                
                // Get all std-div combinations for that last available date within the range
                const registeredQuery = {
                    schoolId: req.schoolId,
                    date: lastAvailableDate,
                    ...range.filter
                };

                const registeredRecords = await Attendance.find(registeredQuery);

                // Sum up registered students from all std-div combinations in the range for the last available date
                for (const record of registeredRecords) {
                    const registeredStudents = record.registeredStudents;
                    for (const category of ['sc', 'st', 'obc', 'general']) {
                        regTotals[category].male += registeredStudents[category].male || 0;
                        regTotals[category].female += registeredStudents[category].female || 0;
                    }
                }
            }

            reportData.push({
                standardRange: range,
                registeredTotals: regTotals,
                grids: {
                    present: presentGrid,
                    meal: mealGrid,
                    alpahar: alpaharGrid
                }
            });
        }

        res.status(200).json({
            reportData,
            metadata: {
                month: monthNum,
                year: parseInt(year),
                half: parseInt(half),
                gujaratiMonth: gujaratiMonths[monthNum - 1],
                academicYear,
                dateList,
                currentDate: new Date().toLocaleDateString('en-IN', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                })
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
