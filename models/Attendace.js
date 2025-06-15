import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true,
        default: Date.now
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
    alpaharTakenStudents: {
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
    takenBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'takenByRole'
    },
    takenByRole: {
        type: String,
        enum: ['PRINCIPAL', 'TEACHER'],
        required: true
    },
    takenAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Attendance = mongoose.model('Attendance', AttendanceSchema);
export default Attendance;
