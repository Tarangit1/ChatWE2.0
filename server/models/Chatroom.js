import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const chatroomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
        accessKey: {
            type: String,
            // Hashed key for private rooms
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        avatar: {
            type: String,
            default: '',
        },
        maxMembers: {
            type: Number,
            default: 100,
        },
    },
    { timestamps: true }
);

// Hash access key before saving
chatroomSchema.pre('save', async function (next) {
    if (this.isModified('accessKey') && this.accessKey) {
        const salt = await bcrypt.genSalt(10);
        this.accessKey = await bcrypt.hash(this.accessKey, salt);
    }
    next();
});

// Method to verify access key
chatroomSchema.methods.verifyAccessKey = async function (key) {
    if (!this.accessKey) return true; // Public room
    return await bcrypt.compare(key, this.accessKey);
};

const Chatroom = mongoose.model('Chatroom', chatroomSchema);
export default Chatroom;
