import { useRef, useEffect } from 'react';
import { BsImage, BsFileEarmark, BsCameraVideo, BsMusicNote } from 'react-icons/bs';

const FileUpload = ({ onFileSelect, onClose }) => {
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                alert('File size must be less than 50MB');
                return;
            }
            onFileSelect(file);
        }
    };

    const openFilePicker = (accept = '*/*') => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
    };

    const fileTypes = [
        {
            icon: <BsImage />,
            label: 'Images',
            accept: 'image/*',
            color: '#4facfe',
        },
        {
            icon: <BsCameraVideo />,
            label: 'Videos',
            accept: 'video/*',
            color: '#f093fb',
        },
        {
            icon: <BsMusicNote />,
            label: 'Audio',
            accept: 'audio/*',
            color: '#38ef7d',
        },
        {
            icon: <BsFileEarmark />,
            label: 'Documents',
            accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar',
            color: '#667eea',
        },
    ];

    return (
        <div
            ref={containerRef}
            className="picker-panel"
            style={{ width: '200px', padding: '8px' }}
        >
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {fileTypes.map((type) => (
                <button
                    key={type.label}
                    onClick={() => openFilePicker(type.accept)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                >
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: type.color,
                            fontSize: '1.1rem',
                        }}
                    >
                        {type.icon}
                    </span>
                    <span style={{ fontSize: '0.9rem' }}>{type.label}</span>
                </button>
            ))}

            <div
                style={{
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    marginTop: '8px',
                    paddingTop: '8px',
                }}
            >
                <button
                    onClick={() => openFilePicker('*/*')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        fontSize: '0.85rem',
                    }}
                    onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                >
                    Browse all files...
                </button>
            </div>
        </div>
    );
};

export default FileUpload;
