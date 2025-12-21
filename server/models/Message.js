import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    emoji: {
        type: String,
        required: true,
    },
}, { _id: false });

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            default: '',
        },
        messageType: {
            type: String,
            enum: ['text', 'file', 'image', 'video', 'audio', 'gif', 'emoji'],
            default: 'text',
        },
        fileUrl: {
            type: String,
        },
        fileName: {
            type: String,
        },
        fileSize: {
            type: Number,
        },
        mimeType: {
            type: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
        reactions: [reactionSchema],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Index for efficient querying
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ isRead: 1, receiver: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
