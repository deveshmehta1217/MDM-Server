import Attendance from '../../models/Attendace.js';

export const getDailyReportData = async (req, res) => {
    try {
        const { date } = req.params;
        const queryDate = new Date(date);
        const data = await Attendance.find({ 
            date: queryDate,
            schoolId: req.schoolId 
        });

        // Sort data - Balvatika first, then by standard
        data.sort((a, b) => {
            if (a.standard === 0) return -1;  // Balvatika comes first
            if (b.standard === 0) return 1;
            return a.standard - b.standard;
        });

        const categoriesCode = ['sc', 'st', 'obc', 'general'];
        const totalStd1to4 = Array(40).fill(0);
        const totalStd5to8 = Array(40).fill(0);
        const grandTotal = Array(40).fill(0);

        // Process each record and calculate totals
        const processedData = data.map((record, idx) => {
            const rowData = [];
            rowData.push(record.standard === 0 ? 'બાલવાટિકા' : `${record.standard} - ${record.division}`);
            
            let sum = { male: 0, female: 0 };

            // Registered students
            categoriesCode.forEach((category) => {
                rowData.push(record.registeredStudents[category].male);
                rowData.push(record.registeredStudents[category].female);
                sum.male += record.registeredStudents[category].male;
                sum.female += record.registeredStudents[category].female;
            });
            rowData.push(sum.male, sum.female);
            sum.male = 0;
            sum.female = 0;

            // Present students
            categoriesCode.forEach((category) => {
                rowData.push(record.presentStudents[category].male);
                rowData.push(record.presentStudents[category].female);
                sum.male += record.presentStudents[category].male;
                sum.female += record.presentStudents[category].female;
            });
            rowData.push(sum.male, sum.female);
            sum.male = 0;
            sum.female = 0;

            // Meal taken students (MDM)
            categoriesCode.forEach((category) => {
                rowData.push(record.mealTakenStudents[category].male);
                rowData.push(record.mealTakenStudents[category].female);
                sum.male += record.mealTakenStudents[category].male;
                sum.female += record.mealTakenStudents[category].female;
            });
            rowData.push(sum.male, sum.female);
            sum.male = 0;
            sum.female = 0;

            // Alpahar taken students
            categoriesCode.forEach((category) => {
                const alpaharMale = record.alpaharTakenStudents?.[category]?.male || 0;
                const alpaharFemale = record.alpaharTakenStudents?.[category]?.female || 0;
                rowData.push(alpaharMale);
                rowData.push(alpaharFemale);
                sum.male += alpaharMale;
                sum.female += alpaharFemale;
            });
            rowData.push(sum.male, sum.female);

            // Update totals
            const currentStandard = record.standard;
            rowData.slice(1).forEach((val, i) => {
                if (typeof val === 'number') {
                    if (currentStandard >= 1 && currentStandard <= 4) totalStd1to4[i] += val;
                    if (currentStandard >= 5 && currentStandard <= 8) totalStd5to8[i] += val;
                    grandTotal[i] += val;
                }
            });

            // Check if this is the last class of group 1-4 or 5-8
            const isLastOfStd1to4 = currentStandard === 4 &&
                (idx === data.length - 1 || data[idx + 1].standard > 4);
            const isLastOfStd5to8 = currentStandard === 8 &&
                (idx === data.length - 1 || data[idx + 1].standard > 8);

            return {
                record,
                rowData,
                isLastOfStd1to4,
                isLastOfStd5to8
            };
        });

        const responseData = {
            date: queryDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            processedData,
            totals: {
                std1to4: totalStd1to4,
                std5to8: totalStd5to8,
                grandTotal
            },
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
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
