import Attendance from '../../models/Attendace.js';
import RegisteredStudent from '../../models/RegisteredStudents.js';

export const getDailyAttendanceStatus = async (req, res) => {
    try {
        const { date } = req.params;

        if (!date || isNaN(Date.parse(date))) {
            return res.status(400).json({ message: 'Invalid or missing date parameter' });
        }

        const dateObj = new Date(date);
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth();
        const startOfDay = new Date(y, m, dateObj.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(y, m, dateObj.getDate(), 23, 59, 59, 999);
        const dateStr = startOfDay.toISOString().split('T')[0];

        const academicYear = m < 5 ? `${y - 1}-${y}` : `${y}-${y + 1}`;
        const registeredStudents = await RegisteredStudent.find({ 
            academicYear,
            schoolId: req.schoolId 
        });

        const attendanceDocs = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            schoolId: req.schoolId
        }).select('standard division mealTakenStudents alpaharTakenStudents');

        // Create maps for different attendance types
        const attendanceMap = new Set();
        const mdmMap = new Set();
        const alpaharMap = new Set();

        attendanceDocs.forEach(doc => {
            const key = `${doc.standard}|${doc.division}`;
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
        });

        const attendanceRecords = registeredStudents.map(({ standard, division }) => {
            const key = `${standard}|${division}`;
            return {
                standard,
                division,
                attendanceTaken: attendanceMap.has(key),
                mdmTaken: mdmMap.has(key),
                alpaharTaken: alpaharMap.has(key)
            };
        });

        const registeredClasses = registeredStudents.map(({ standard, division }) => ({
            standard,
            division
        }));

        res.json({
            registeredClasses,
            status: {
                date: dateStr,
                attendance: attendanceRecords
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
