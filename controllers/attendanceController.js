import Attendance from '../models/Attendace.js';
import RegisteredStudent from '../models/RegisteredStudents.js';

import { getSemiMonthlyReport } from './attendanceControllers/semiMonthlyData.js';
import { downloadSemiMonthlyReportExcel } from './attendanceControllers/semiMonthlyExcel.js';
import { downloadSemiMonthlyAlpaharReportExcel } from './attendanceControllers/semiMonthlyAlpaharExcel.js';
import { downloadDailyReportExcel } from './attendanceControllers/dailyExcel.js';
import { downloadDailyAlpaharReportExcel } from './attendanceControllers/dailyAlpaharExcel.js';
import { getSemiMonthlyReportData } from './attendanceControllers/semiMonthlyDataOnly.js';
import { getDailyReportData } from './attendanceControllers/dailyDataOnly.js';
import { getDailyReport } from './attendanceControllers/dailyReportData.js';
import { getDailyAttendanceStatus } from './attendanceControllers/dailyStatus.js';
import { getAttendanceStatus } from './attendanceControllers/semiMonthlyStatus.js';
import { getDailyReportDataV2 } from './attendanceControllers/dailyReportCombined.js';
import { getSemiMonthlyReportV2 } from './attendanceControllers/semiMonthlyReportV2.js';
import { getDailyReportRangeV2 } from './attendanceControllers/dailyReportRangeV2.js';
import { getDailyReportDataV3 } from './attendanceControllers/dailyReportCombinedV3.js';
import { getDailyReportRangeV3 } from './attendanceControllers/dailyReportRangeV3.js';
export { 
    getDailyReport,
    getSemiMonthlyReport,
    downloadDailyReportExcel,
    downloadDailyAlpaharReportExcel,
    downloadSemiMonthlyReportExcel,
    downloadSemiMonthlyAlpaharReportExcel,
    getSemiMonthlyReportData,
    getDailyReportData,
    getDailyAttendanceStatus,
    getAttendanceStatus,
    getDailyReportDataV2,
    getDailyReportDataV3,
    getSemiMonthlyReportV2,
    getDailyReportRangeV2,
    getDailyReportRangeV3,
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
