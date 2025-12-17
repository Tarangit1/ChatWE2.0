import { useState, useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { BsSearch } from 'react-icons/bs';

const EmojiGifPicker = ({ onEmojiSelect, onGifSelect, onClose }) => {
    const [activeTab, setActiveTab] = useState('emoji');
    const [gifSearch, setGifSearch] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const pickerRef = useRef(null);

    const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Fetch trending GIFs on mount
    useEffect(() => {
        if (activeTab === 'gif' && gifs.length === 0) {
            fetchTrendingGifs();
        }
    }, [activeTab]);

    // Search GIFs with debounce
    useEffect(() => {
        if (activeTab === 'gif') {
            const timer = setTimeout(() => {
                if (gifSearch.trim()) {
                    searchGifs(gifSearch);
                } else {
                    fetchTrendingGifs();
                }
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [gifSearch, activeTab]);

    const fetchTrendingGifs = async () => {
        if (!GIPHY_API_KEY || GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY') {
            // Use placeholder GIFs if no API key
            setGifs([
                { id: '1', url: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif' },
                { id: '2', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyE/giphy.gif' },
                { id: '3', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
                { id: '4', url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' },
            ]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
            );
            const data = await response.json();
            setGifs(
                data.data.map((gif) => ({
                    id: gif.id,
                    url: gif.images.fixed_height.url,
                }))
            );
        } catch (error) {
            console.error('Failed to fetch GIFs:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchGifs = async (query) => {
        if (!GIPHY_API_KEY || GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY') {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
            );
            const data = await response.json();
            setGifs(
                data.data.map((gif) => ({
                    id: gif.id,
                    url: gif.images.fixed_height.url,
                }))
            );
        } catch (error) {
            console.error('Failed to search GIFs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmojiSelect = (emoji) => {
        onEmojiSelect(emoji.native);
    };

    return (
        <div className="picker-panel" ref={pickerRef}>
            <div className="picker-tabs">
                <button
                    className={`picker-tab ${activeTab === 'emoji' ? 'active' : ''}`}
                    onClick={() => setActiveTab('emoji')}
                >
                    😊 Emoji
                </button>
                <button
                    className={`picker-tab ${activeTab === 'gif' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gif')}
                >
                    🎬 GIF
                </button>
            </div>

            {activeTab === 'emoji' && (
                <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="dark"
                    previewPosition="none"
                    skinTonePosition="search"
                    maxFrequentRows={2}
                    perLine={8}
                />
            )}

            {activeTab === 'gif' && (
                <>
                    <div className="gif-search">
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search GIFs..."
                                value={gifSearch}
                                onChange={(e) => setGifSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="gif-grid">
                        {loading ? (
                            <div
                                style={{
                                    gridColumn: '1 / -1',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    padding: '2rem',
                                }}
                            >
                                <div className="loading-spinner"></div>
                            </div>
                        ) : (
                            gifs.map((gif) => (
                                <div
                                    key={gif.id}
                                    className="gif-item"
                                    onClick={() => onGifSelect(gif.url)}
                                >
                                    <img src={gif.url} alt="GIF" loading="lazy" />
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default EmojiGifPicker;
