import Attendance from '../models/Attendace.js';
import RegisteredStudent from '../models/RegisteredStudents.js';
import { getSemiMonthlyReport } from './attendanceControllers/semiMonthlyData.js';
import { downloadSemiMonthlyReportExcel } from './attendanceControllers/semiMonthlyExcel.js';
import { downloadSemiMonthlyAlpaharReportExcel } from './attendanceControllers/semiMonthlyAlpaharExcel.js';
import { downloadDailyReportExcel } from './attendanceControllers/dailyExcel.js';
import { downloadDailyAlpaharReportExcel } from './attendanceControllers/dailyAlpaharExcel.js';
import { getSemiMonthlyReportData } from './attendanceControllers/semiMonthlyDataOnly.js';
import { getDailyReportData } from './attendanceControllers/dailyDataOnly.js';

export { getSemiMonthlyReport, downloadDailyReportExcel, downloadDailyAlpaharReportExcel, downloadSemiMonthlyReportExcel, downloadSemiMonthlyAlpaharReportExcel, getSemiMonthlyReportData, getDailyReportData };

export const getAttendance = async (req, res) => {
    try {
        const { date } = req.params;
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.find({ 
            date: formattedDate,
            schoolId: req.schoolId 
        });
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
            date: formattedDate,
            schoolId: req.schoolId
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createAttendance = async (req, res) => {
    try {
        const { standard, division, registeredStudents, presentStudents, mealTakenStudents, alpaharTakenStudents, date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.create({
            schoolId: req.schoolId,
            standard: parseInt(standard),
            division,
            date: formattedDate,
            registeredStudents,
            presentStudents,
            mealTakenStudents,
            alpaharTakenStudents
        });
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { standard, division, registeredStudents, presentStudents, mealTakenStudents, alpaharTakenStudents, date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];
        
        // First check if the attendance record belongs to the user's school
        const existingRecord = await Attendance.findOne({ _id: id, schoolId: req.schoolId });
        if (!existingRecord) {
            return res.status(404).json({ message: 'Attendance record not found or access denied' });
        }
        
        const data = await Attendance.findByIdAndUpdate(id, {
            standard: parseInt(standard),
            division,
            date: formattedDate,
            registeredStudents,
            presentStudents,
            mealTakenStudents,
            alpaharTakenStudents
        }, { new: true });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const saveAttendance = async (req, res) => {
    try {
        const { standard, division, registeredStudents, presentStudents, mealTakenStudents, alpaharTakenStudents, date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.findOneAndUpdate(
            {
                schoolId: req.schoolId,
                standard: parseInt(standard),
                division,
                date: formattedDate
            },
            {
                schoolId: req.schoolId,
                standard: parseInt(standard),
                division,
                date: formattedDate,
                registeredStudents,
                presentStudents,
                mealTakenStudents,
                alpaharTakenStudents
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
            date: formattedDate,
            schoolId: req.schoolId
        }).sort({ standard: 1, division: 1 });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


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
