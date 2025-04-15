import RegisteredStudents from '../models/registeredStudents.js';

export const getRegisteredStudents = async (req, res) => {
    try {
        const { academicYear } = req.params;
        const data = await RegisteredStudents.find({ academicYear });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getRegisteredStudentsByClass = async (req, res) => {
    try {
        const { standard, division, academicYear } = req.params;
        const data = await RegisteredStudents.findOne({
            standard: parseInt(standard),
            division,
            academicYear
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createRegisteredStudent = async (req, res) => {
    try {
        const { standard, division, counts, academicYear } = req.body;
        if (!academicYear) {
            return res.status(400).json({ message: 'Academic year is required' });
        }
        const data = await RegisteredStudents.create({
            standard: parseInt(standard),
            division,
            counts,
            academicYear
        });
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateRegisteredStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { standard, division, counts, academicYear } = req.body;
        if (!academicYear) {
            return res.status(400).json({ message: 'Academic year is required' });
        }
        const data = await RegisteredStudents.findByIdAndUpdate(id, {
            standard: parseInt(standard),
            division,
            counts,
            academicYear
        }, { new: true });
        res.status(201).json(data);
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
                standard: parseInt(standard),
                division,
                academicYear
            },
            {
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};