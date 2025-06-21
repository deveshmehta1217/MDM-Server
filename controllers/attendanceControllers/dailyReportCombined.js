import Attendance from '../../models/Attendace.js';

export const getDailyReportDataV2 = async (req, res) => {
    try {
        const { date } = req.params;
        const breakAt = parseInt(req.query.breakAt || '5', 10);
        const queryDate = new Date(date);

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

        const responseData = {
            date: queryDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            groupBreakAt: breakAt,
            records: data,  // unmodified original records
            sheet,
            timestamp: new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            })
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error in getDailyReportData:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
