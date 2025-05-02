import Attendance from "../../models/Attendace.js";

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
            // presentTotals.grandTotal = presentTotals.totalMale + presentTotals.totalFemale;

            
            // Calculate daily totals for mealTakenStudents
            const mealTotals = result[dateKey].mealTakenStudents;
            mealTotals.totalMale += record.mealTakenStudents.sc.male + record.mealTakenStudents.st.male +
            record.mealTakenStudents.obc.male + record.mealTakenStudents.general.male;
            mealTotals.totalFemale += record.mealTakenStudents.sc.female + record.mealTakenStudents.st.female +
            record.mealTakenStudents.obc.female + record.mealTakenStudents.general.female;
            // mealTotals.grandTotal = mealTotals.totalMale + mealTotals.totalFemale;
            
        });
        
        Object.keys(result).forEach(dateKey => {
            const presentTotals = result[dateKey].presentStudents;
            const mealTotals = result[dateKey].mealTakenStudents;
            
            presentTotals.grandTotal = presentTotals.totalMale + presentTotals.totalFemale;
            mealTotals.grandTotal = mealTotals.totalMale + mealTotals.totalFemale;
            
            overallTotals.presentStudents.totalMale += presentTotals.totalMale;
            overallTotals.presentStudents.totalFemale += presentTotals.totalFemale;
            overallTotals.presentStudents.grandTotal += presentTotals.grandTotal;
            overallTotals.mealTakenStudents.totalMale += mealTotals.totalMale;
            overallTotals.mealTakenStudents.totalFemale += mealTotals.totalFemale;
            overallTotals.mealTakenStudents.grandTotal += mealTotals.grandTotal;
        });

        res.status(200).json({ result, overallTotals });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};