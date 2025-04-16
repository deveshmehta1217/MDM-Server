import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    standard: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5, 6, 7, 8]
    },
    division: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D']
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
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
    registeredStudents: {
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
    presentStudents: {
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
    mealTakenStudents: {
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Attendance = mongoose.model('Attendance', AttendanceSchema);
export default Attendance;