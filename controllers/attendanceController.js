import Attendance from '../models/Attendace.js';
import RegisteredStudent from '../models/RegisteredStudents.js';
import { getSemiMonthlyReport } from './attendanceControllers/semiMonthlyData.js';
import { downloadSemiMonthlyReportExcel } from './attendanceControllers/semiMonthlyExcel.js';
import { downloadDailyReportExcel } from './attendanceControllers/dailyExcel.js';

export { getSemiMonthlyReport, downloadDailyReportExcel, downloadSemiMonthlyReportExcel };

export const getAttendance = async (req, res) => {
    try {
        const { date } = req.params;
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.find({ date: formattedDate });
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
            date: formattedDate
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createAttendance = async (req, res) => {
    try {
        const { standard, division, registeredStudents, presentStudents, mealTakenStudents, date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.create({
            standard: parseInt(standard),
            division,
            date: formattedDate,
            registeredStudents,
            presentStudents,
            mealTakenStudents
        });
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { standard, division, registeredStudents, presentStudents, mealTakenStudents, date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.findByIdAndUpdate(id, {
            standard: parseInt(standard),
            division,
            date: formattedDate,
            registeredStudents,
            presentStudents,
            mealTakenStudents
        }, { new: true });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const saveAttendance = async (req, res) => {
    try {
        const { standard, division, registeredStudents, presentStudents, mealTakenStudents, date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const data = await Attendance.findOneAndUpdate(
            {
                standard: parseInt(standard),
                division,
                date: formattedDate
            },
            {
                standard: parseInt(standard),
                division,
                date: formattedDate,
                registeredStudents,
                presentStudents,
                mealTakenStudents
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
            date: formattedDate
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

        const academicYear = m < 6 ? `${y - 1}-${y}` : `${y}-${y + 1}`;
        const registeredStudents = await RegisteredStudent.find({ academicYear });

        const startDate = new Date(y, m, startDay);
        const endDate = new Date(y, m, endDay, 23, 59, 59, 999);

        const attendanceDocs = await Attendance.find({
            date: { $gte: startDate, $lte: endDate }
        }).select('standard division date');

        // Build a lookup map
        const attendanceMap = new Set();
        for (const doc of attendanceDocs) {
            const dateStr = doc.date.toISOString().split('T')[0];
            attendanceMap.add(`${dateStr}|${doc.standard}|${doc.division}`);
        }

        // Prepare status array
        const status = [];
        for (let day = startDay; day <= endDay; day++) {
            const dateObj = new Date(y, m, day);
            const dateStr = dateObj.toISOString().split('T')[0];

            const attendanceRecords = registeredStudents.map(({ standard, division }) => {
                const key = `${dateStr}|${standard}|${division}`;
                return {
                    standard,
                    division,
                    attendanceTaken: attendanceMap.has(key)
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

