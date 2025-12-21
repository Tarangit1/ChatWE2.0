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

const chatroomMessageSchema = new mongoose.Schema(
    {
        chatroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chatroom',
            required: true,
        },
        sender: {
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
            enum: ['text', 'file', 'image', 'video', 'audio', 'gif', 'emoji', 'system'],
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
        reactions: [reactionSchema],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatroomMessage',
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for efficient querying
chatroomMessageSchema.index({ chatroom: 1, createdAt: -1 });
chatroomMessageSchema.index({ chatroom: 1, isPinned: 1 });

const ChatroomMessage = mongoose.model('ChatroomMessage', chatroomMessageSchema);
export default ChatroomMessage;
