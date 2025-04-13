// middleware/roleCheck.js
export const isTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied. Teachers only.' });
    }
    next();
};

export const isPrincipal = (req, res, next) => {
    if (req.user.role !== 'principal') {
        return res.status(403).json({ message: 'Access denied. Principal only.' });
    }
    next();
};

export const isAssignedTeacher = async (req, res, next) => {
    try {
        // Check if the teacher is assigned to the class in the request
        if (req.user.role === 'teacher' &&
            req.params.classId &&
            req.user.assignedClass.toString() !== req.params.classId) {
            return res.status(403).json({
                message: 'Access denied. You can only manage your assigned class.'
            });
        }
        next();
    } catch (error) {
        next(error);
    }
};