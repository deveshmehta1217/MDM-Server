
import Attendance from '../models/Attendace.js';

// GET /api/averages/:year/:month
export const getMonthlyPresentAverages = async (req, res) => {
	try {
		const { year, month } = req.params;
		const schoolId = req.schoolId;
		// Parse year and month
		const y = parseInt(year);
		const m = parseInt(month) - 1; // JS months are 0-based
		const start = new Date(Date.UTC(y, m, 1));
		const end = new Date(Date.UTC(y, m + 1, 1));

		// Query all attendance for the month, for this school
		const records = await Attendance.find({
			schoolId,
			date: { $gte: start, $lt: end }
		}).lean();




		// Group by standard and division, and track registered students from the last date of the month for each std/div
		const stdDivMap = {};
		const stdDivLastAttendance = {};
		for (const rec of records) {
			const std = rec.standard;
			const div = rec.division;
			if (!stdDivMap[std]) stdDivMap[std] = {};
			if (!stdDivMap[std][div]) {
				stdDivMap[std][div] = {
					male: 0,
					female: 0,
					total: 0,
					days: 0
				};
			}
			// Track the attendance record with the latest date for this std/div
			if (!stdDivLastAttendance[std]) stdDivLastAttendance[std] = {};
			if (!stdDivLastAttendance[std][div] || new Date(rec.date) > new Date(stdDivLastAttendance[std][div].date)) {
				stdDivLastAttendance[std][div] = rec;
			}
			const present = rec.presentStudents;
			const male = (present.general?.male || 0) + (present.obc?.male || 0) + (present.sc?.male || 0) + (present.st?.male || 0);
			const female = (present.general?.female || 0) + (present.obc?.female || 0) + (present.sc?.female || 0) + (present.st?.female || 0);
			stdDivMap[std][div].male += male;
			stdDivMap[std][div].female += female;
			stdDivMap[std][div].total += male + female;
			stdDivMap[std][div].days += 1;
		}

		// For each standard, sum across all its divisions
		const result = {};
		let schoolMale = 0, schoolFemale = 0, schoolTotal = 0, schoolDays = 0;
		let schoolRegMale = 0, schoolRegFemale = 0, schoolRegTotal = 0;
		for (const std of Object.keys(stdDivMap)) {
			let stdMale = 0, stdFemale = 0, stdTotal = 0, stdDays = 0;
			let regMale = 0, regFemale = 0, regTotal = 0;
			for (const div of Object.keys(stdDivMap[std])) {
				const d = stdDivMap[std][div];
				stdMale += d.male;
				stdFemale += d.female;
				stdTotal += d.total;
				stdDays += d.days;
				// Registered students from the last date of the month for this std/div
				const lastRec = stdDivLastAttendance[std][div];
				if (lastRec) {
					const reg = lastRec.registeredStudents;
					const regM = (reg.general?.male || 0) + (reg.obc?.male || 0) + (reg.sc?.male || 0) + (reg.st?.male || 0);
					const regF = (reg.general?.female || 0) + (reg.obc?.female || 0) + (reg.sc?.female || 0) + (reg.st?.female || 0);
					regMale += regM;
					regFemale += regF;
					regTotal += regM + regF;
				}
			}
			const avgMale = stdDays ? stdMale / stdDays : 0;
			const avgFemale = stdDays ? stdFemale / stdDays : 0;
			const avgTotal = stdDays ? stdTotal / stdDays : 0;
			const percentMale = regMale ? (avgMale / regMale) * 100 : 0;
			const percentFemale = regFemale ? (avgFemale / regFemale) * 100 : 0;
			const percentTotal = regTotal ? (avgTotal / regTotal) * 100 : 0;
			result[std] = {
				averageMale: Number(avgMale.toFixed(2)),
				averageFemale: Number(avgFemale.toFixed(2)),
				averageTotal: Number(avgTotal.toFixed(2)),
				registeredMale: regMale,
				registeredFemale: regFemale,
				registeredTotal: regTotal,
				percentMale: Number(percentMale.toFixed(2)),
				percentFemale: Number(percentFemale.toFixed(2)),
				percentTotal: Number(percentTotal.toFixed(2)),
				workingDays: stdDays
			};
			schoolMale += stdMale;
			schoolFemale += stdFemale;
			schoolTotal += stdTotal;
			schoolDays += stdDays;
			schoolRegMale += regMale;
			schoolRegFemale += regFemale;
			schoolRegTotal += regTotal;
		}

		// School total average (weighted by total days)
		const schoolAvg = {
			averageMale: schoolDays ? Number((schoolMale / schoolDays).toFixed(2)) : 0,
			averageFemale: schoolDays ? Number((schoolFemale / schoolDays).toFixed(2)) : 0,
			averageTotal: schoolDays ? Number((schoolTotal / schoolDays).toFixed(2)) : 0,
			registeredMale: schoolRegMale,
			registeredFemale: schoolRegFemale,
			registeredTotal: schoolRegTotal,
			percentMale: schoolRegMale ? Number(((schoolMale / schoolDays) / schoolRegMale * 100).toFixed(2)) : 0,
			percentFemale: schoolRegFemale ? Number(((schoolFemale / schoolDays) / schoolRegFemale * 100).toFixed(2)) : 0,
			percentTotal: schoolRegTotal ? Number(((schoolTotal / schoolDays) / schoolRegTotal * 100).toFixed(2)) : 0,
			workingDays: schoolDays
		};

		res.json({
			year: y,
			month: m + 1,
			standards: result,
			schoolAverage: schoolAvg
		});
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};
