import mongoose from 'mongoose';

const RegisteredStudentSchema = new mongoose.Schema({
    schoolId: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{11}$/.test(v);
            },
            message: 'School ID must be exactly 11 digits'
        },
        index: true
    },
    standard: {
        type: Number,
        required: true,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    },
    division: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D']
    },
    academicYear: {
        type: String,
        required: true,
        default: () => {
            const currYear = new Date().getFullYear();
            const currMonth = new Date().getMonth();

            return currMonth < 5 ? `${currYear - 1}-${currYear}` : `${currYear}-${currYear + 1}`;
        }
    },
    counts: {
        general: {
            male: {
                type: Number,
                required: true,
                default: 0
            },
            female: {
                type: Number,
                required: true,
                default: 0
            },
        },
        obc: {
            male: {
                type: Number,
                required: true,
                default: 0
            },
            female: {
                type: Number,
                required: true,
                default: 0
            },
        },
        sc: {
            male: {
                type: Number,
                required: true,
                default: 0
            },
            female: {
                type: Number,
                required: true,
                default: 0
            },
        },
        st: {
            male: {
                type: Number,
                required: true,
                default: 0
            },
            female: {
                type: Number,
                required: true,
                default: 0
            },
        },
    },
    // Class lock status fields
    isLocked: {
        type: Boolean,
        default: false
    },
    lastLockedStatusUpdatedAt: {
        type: Date
    },
    lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true,
});

const RegisteredStudent = mongoose.model('RegisteredStudent', RegisteredStudentSchema);
export default RegisteredStudent;
