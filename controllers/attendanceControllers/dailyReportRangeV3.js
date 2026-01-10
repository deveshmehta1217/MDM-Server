import Attendance from "../../models/Attendace.js";
import { prepareDailyReport } from "./dailyReportCombinedV3.js";

export const getDailyReportRangeV3 = async (req, res) => {
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
            
            const dateData = await prepareDailyReport(req.schoolId, dateStr, breakAt);

            // Add this day's report to the collection
            dailyReports.push({
                ...dateData,
                dateISO: dateStr,
                hasData: dateData?.records?.length > 0
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
