import Attendance from '../../models/Attendace.js';
import RegisteredStudent from '../../models/RegisteredStudents.js';

export const getAttendanceStatus = async (req, res) => {
    try {
        const { year, month, half } = req.params;

        if (!year || !month || !['1', '2'].includes(half)) {
            return res.status(400).json({ message: 'Invalid query parameters' });
        }

        const y = parseInt(year);
        const m = parseInt(month) - 1; // JavaScript months are 0-indexed
        const startDay = half === '1' ? 1 : 16;
        const endDay = half === '1' ? 15 : new Date(y, m + 1, 0).getDate();

        const academicYear = m < 5 ? `${y - 1}-${y}` : `${y}-${y + 1}`;
        const registeredStudents = await RegisteredStudent.find({
            academicYear,
            schoolId: req.schoolId
        });

        const startDate = new Date(Date.UTC(y, m, startDay));
        const endDate = new Date(Date.UTC(y, m, endDay));

        const attendanceDocs = await Attendance.find({
            date: { $gte: startDate, $lte: endDate },
            schoolId: req.schoolId
        }).select('standard division date mealTakenStudents alpaharTakenStudents');

        // Build lookup maps for different attendance types
        const attendanceMap = new Set();
        const mdmMap = new Set();
        const alpaharMap = new Set();

        for (const doc of attendanceDocs) {
            const dateStr = doc.date.toISOString().split('T')[0];
            const key = `${dateStr}|${doc.standard}|${doc.division}`;
            attendanceMap.add(key);

            // Check if MDM data exists and has any non-zero values
            const hasMdmData = doc.mealTakenStudents && Object.values(doc.mealTakenStudents).some(category =>
                (category.male > 0 || category.female > 0)
            );
            if (hasMdmData) {
                mdmMap.add(key);
            }

            // Check if Alpahar data exists and has any non-zero values
            const hasAlpaharData = doc.alpaharTakenStudents && Object.values(doc.alpaharTakenStudents).some(category =>
                (category.male > 0 || category.female > 0)
            );
            if (hasAlpaharData) {
                alpaharMap.add(key);
            }
        }

        // Prepare status array
        const status = [];
        for (let day = startDay; day <= endDay; day++) {
            const dateObj = new Date(Date.UTC(y, m, day));
            const dateStr = dateObj.toISOString().split('T')[0];

            const attendanceRecords = registeredStudents.map(({ standard, division }) => {
                const attendanceKey = `${dateStr}|${standard}|${division}`;
                return {
                    standard,
                    division,
                    attendanceTaken: attendanceMap.has(attendanceKey),
                    mdmTaken: mdmMap.has(attendanceKey),
                    alpaharTaken: alpaharMap.has(attendanceKey)
                };
            });

            status.push({ date: dateStr, attendance: attendanceRecords });
        }

        // Format registered classes
        const registeredClasses = registeredStudents.map(({ standard, division }) => ({
            standard,
            division
        }));

        res.json({ registeredClasses, status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
