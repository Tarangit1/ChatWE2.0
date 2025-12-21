import mongoose from 'mongoose';

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
    },
    { timestamps: true }
);

// Index for efficient querying
chatroomMessageSchema.index({ chatroom: 1, createdAt: -1 });

const ChatroomMessage = mongoose.model('ChatroomMessage', chatroomMessageSchema);
export default ChatroomMessage;
