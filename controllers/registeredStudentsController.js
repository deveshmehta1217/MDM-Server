import RegisteredStudents from '../models/RegisteredStudents.js';
import TeacherClassAssignment from '../models/TeacherClassAssignment.js';

export const getRegisteredStudentsByClass = async (req, res) => {
    try {
        const { standard, division, academicYear } = req.params;
        const data = await RegisteredStudents.findOne({
            standard: parseInt(standard),
            division,
            academicYear,
            schoolId: req.schoolId
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const saveRegisteredStudent = async (req, res) => {
    try {
        const { standard, division, counts, academicYear } = req.body;
        if (!academicYear) {
            return res.status(400).json({ message: 'Academic year is required' });
        }
        
        const data = await RegisteredStudents.findOneAndUpdate(
            {
                schoolId: req.schoolId,
                standard: parseInt(standard),
                division,
                academicYear
            },
            {
                schoolId: req.schoolId,
                standard: parseInt(standard),
                division,
                counts,
                academicYear
            },
            { 
                new: true,
                upsert: true
            }
        );
        res.status(200).json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
