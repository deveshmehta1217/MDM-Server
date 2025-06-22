import Attendance from "../../models/Attendace.js";

export const getDailyReportRangeV2 = async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        const breakAt = parseInt(req.query.breakAt || '5', 10);
        
        // Validate date inputs
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
        }
        
        if (start > end) {
            return res.status(400).json({ message: 'Start date must be before or equal to end date' });
        }
        
        // Generate date list for the range
        const dateList = [];
        const currentDate = new Date(start);
        while (currentDate <= end) {
            dateList.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const dailyReports = [];

        // Process each date individually
        for (const dateStr of dateList) {
            const queryDate = new Date(dateStr);
            
            const categoriesCode = ['sc', 'st', 'obc', 'general'];
            const totalGroupA = Array(40).fill(0);
            const totalGroupB = Array(40).fill(0);
            const grandTotal = Array(40).fill(0);

            const calculateCategoryTotals = (source) => {
                const row = [];
                let sumMale = 0, sumFemale = 0;
                for (const cat of categoriesCode) {
                    const male = source?.[cat]?.male || 0;
                    const female = source?.[cat]?.female || 0;
                    row.push(male, female);
                    sumMale += male;
                    sumFemale += female;
                }
                row.push(sumMale, sumFemale);
                return row;
            };

            const updateTotals = (sourceArray, targetArray) => {
                for (let i = 0; i < sourceArray.length; i++) {
                    if (typeof sourceArray[i] === 'number') {
                        targetArray[i] += sourceArray[i];
                    }
                }
            };

            // Optimized query - only fetch required fields
            const data = await Attendance.find(
                {
                    date: queryDate,
                    schoolId: req.schoolId
                },
                {
                    standard: 1,
                    division: 1,
                    registeredStudents: 1,
                    presentStudents: 1,
                    mealTakenStudents: 1,
                    alpaharTakenStudents: 1
                }
            ).sort({ standard: 1, division: 1 }).lean();

            const sheet = [];

            data.forEach((record, idx) => {
                const rowData = [];
                const label = record.standard === 0 ? 'બાલવાટિકા' : `${record.standard} - ${record.division}`;
                rowData.push(label);

                rowData.push(...calculateCategoryTotals(record.registeredStudents));
                rowData.push(...calculateCategoryTotals(record.presentStudents));
                rowData.push(...calculateCategoryTotals(record.mealTakenStudents));
                rowData.push(...calculateCategoryTotals(record.alpaharTakenStudents));

                const currentStd = record.standard;
                const valuesOnly = rowData.slice(1); // Exclude label for totals

                if (currentStd > 0 && currentStd < breakAt) updateTotals(valuesOnly, totalGroupA);
                if (currentStd >= breakAt) updateTotals(valuesOnly, totalGroupB);
                updateTotals(valuesOnly, grandTotal);

                sheet.push(rowData);

                const nextStd = data[idx + 1]?.standard ?? null;

                // Insert subtotal for group A
                if (currentStd === breakAt - 1 && (nextStd === null || nextStd >= breakAt)) {
                    sheet.push([`1-${breakAt - 1} કુલ`, ...totalGroupA]);
                }

                // Insert subtotal for group B
                if (currentStd === 8 && (nextStd === null || nextStd > 8)) {
                    sheet.push([`${breakAt}-8 કુલ`, ...totalGroupB]);
                }
            });

            // Append grand total at end
            sheet.push(['કુલ', ...grandTotal]);

            // Add this day's report to the collection
            dailyReports.push({
                date: queryDate.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }),
                dateISO: dateStr,
                groupBreakAt: breakAt,
                records: data,
                sheet,
                hasData: data.length > 0
            });
        }

        const responseData = {
            dailyReports,
            metadata: {
                startDate: start.toLocaleDateString('en-IN', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                }),
                endDate: end.toLocaleDateString('en-IN', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                }),
                dateList,
                totalDays: dateList.length,
                breakAt,
                daysWithData: dailyReports.filter(report => report.hasData).length,
                timestamp: new Date().toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                })
            }
        };

        res.status(200).json(responseData);
    } catch (err) {
        console.error('Error in getDailyReportRangeV2:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
