import Attendance from "../../models/Attendace.js";

export const getSemiMonthlyReportData = async (req, res) => {
    try {
        const { month, year, half } = req.params;
        const startDay = half === '1' ? 1 : 16;
        const endDay = half === '1' ? 15 : new Date(year, month, 0).getDate();

        // Calculate academic year based on month (June-May)
        const monthNum = parseInt(month);
        const academicYear = monthNum >= 5 
            ? { start: year, end: parseInt(year) + 1 }
            : { start: parseInt(year) - 1, end: year };

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
                filter: { standard: '0', division: 'A' }
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

        const reportData = [];

        // Process each standard range
        for (const standardRange of standardRanges) {
            // Get registered students from last entry of the period for this standard range
            const lastAttendance = await Attendance.findOne({
                date: {
                    $gte: new Date(`${year}-${month.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`),
                    $lte: new Date(`${year}-${month.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`)
                },
                schoolId: req.schoolId,
                ...standardRange.filter
            }).sort({ date: -1 });

            // Calculate registered totals from the last entry
            const registeredTotals = {
                sc: { male: 0, female: 0 },
                st: { male: 0, female: 0 },
                obc: { male: 0, female: 0 },
                general: { male: 0, female: 0 }
            };

            if (lastAttendance) {
                ['sc', 'st', 'obc', 'general'].forEach(category => {
                    registeredTotals[category].male = lastAttendance.registeredStudents[category].male;
                    registeredTotals[category].female = lastAttendance.registeredStudents[category].female;
                });
            }

            // Get attendance data for the half month for this standard range
            const allRecords = await Attendance.find({
                date: {
                    $gte: new Date(`${year}-${month.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`),
                    $lte: new Date(`${year}-${month.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`)
                },
                schoolId: req.schoolId,
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

            reportData.push({
                standardRange,
                registeredTotals,
                groupedByDate,
                totals,
                dateList
            });
        }

        // Get Gujarati month names
        const gujaratiMonths = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];

        const responseData = {
            reportData,
            metadata: {
                month: monthNum,
                year: parseInt(year),
                half: parseInt(half),
                gujaratiMonth: gujaratiMonths[monthNum - 1],
                academicYear,
                dateList,
                currentDate: new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
            }
        };

        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
