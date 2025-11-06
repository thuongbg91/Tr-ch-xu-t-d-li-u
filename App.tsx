import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ExtractedData } from './types';
import { extractInfoFromData } from './services/geminiService';
import { FileUploadIcon, LoaderIcon, ErrorIcon, CopyIcon, CheckIcon, SunIcon, MoonIcon, EditIcon } from './components/Icons';

declare var XLSX: any;

const LOADING_MESSAGES = [
    "Đang đọc và xác thực tệp...",
    "Gửi dữ liệu đến Gemini AI...",
    "AI đang phân tích bảng tính...",
    "Đang định dạng kết quả...",
    "Sắp xong rồi, chờ một chút nhé..."
];

type Theme = 'light' | 'dark';

const ThemeToggle: React.FC<{ theme: Theme; setTheme: (theme: Theme) => void }> = ({ theme, setTheme }) => {
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors duration-300"
            style={{ 
                backgroundColor: 'var(--glass-btn-bg)',
                border: '1px solid var(--glass-btn-border)',
                color: 'var(--icon-primary)'
            }}
            aria-label={`Chuyển sang chế độ ${theme === 'light' ? 'tối' : 'sáng'}`}
        >
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>
    );
};

const ResultsDisplay: React.FC<{ data: ExtractedData; onUploadAnother: () => void }> = ({ data, onUploadAnother }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isEditingQuickCopy, setIsEditingQuickCopy] = useState(false);

    const itemsWithQuantity = data.items.filter(item => item.quantity && item.quantity > 0);
    const orderPart = `Hàng IT${data.orderTitle ? ` ${data.orderTitle}` : ''}: ${itemsWithQuantity.map(item => `${item.name}: ${item.quantity}`).join(', ')}`;
    const quickCopyText = `Người nhận: ${data.shippingInfo.recipient}\n${orderPart}`;
    
    const [editableQuickCopyText, setEditableQuickCopyText] = useState(quickCopyText);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditableQuickCopyText(quickCopyText);
    }, [quickCopyText]);

    useEffect(() => {
        if (isEditingQuickCopy && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [isEditingQuickCopy, editableQuickCopyText]);

    const handleCopy = useCallback((textToCopy: string, fieldName: string) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        }).catch(err => console.error('Failed to copy text: ', err));
    }, []);
    
    const buttonStyle: React.CSSProperties = {
        backgroundColor: 'var(--glass-btn-bg)',
        border: '1px solid var(--glass-btn-border)',
        color: 'var(--text-primary)'
    };
    
    const buttonHoverStyle: React.CSSProperties = { backgroundColor: 'var(--glass-btn-bg-hover)' };

    const CopyButton: React.FC<{ textToCopy: string; fieldName: string; ariaLabel: string }> = ({ textToCopy, fieldName, ariaLabel }) => {
        const isCopied = copiedField === fieldName;
        return (
            <button 
                onClick={() => handleCopy(textToCopy, fieldName)}
                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 flex-shrink-0 ${isCopied ? 'text-green-400' : ''}`}
                style={{ ...buttonStyle }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor!} 
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor!}
                aria-label={ariaLabel}
            >
                {isCopied ? (
                    <>
                        <CheckIcon className="w-5 h-5" />
                        <span>Đã chép!</span>
                    </>
                ) : (
                    <>
                        <CopyIcon className="w-5 h-5" />
                        <span>Sao chép</span>
                    </>
                )}
            </button>
        );
    };

    return (
        <div className="w-full max-w-screen-xl mx-auto rounded-3xl shadow-2xl p-6 md:p-8 animate-fade-in" style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(24px)' }}>
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-accent)' }}>Trích xuất hoàn tất</h2>
                <button 
                  onClick={onUploadAnother} 
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-semibold" 
                  style={buttonStyle}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor!}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor!}
                  aria-label="Tải lên một tệp Excel khác">
                    <FileUploadIcon className="w-5 h-5" style={{ color: 'var(--icon-primary)' }}/>
                    <span>Tải tệp khác</span>
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                <div className="space-y-5">
                    {data.orderTitle && (
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(128, 128, 128, 0.1)' }}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Tiêu đề đơn hàng</h3>
                            <div className="flex items-start justify-between gap-4">
                                <p className="flex-1 text-lg break-words" style={{ color: 'var(--text-primary)' }}>{data.orderTitle}</p>
                                <CopyButton textToCopy={data.orderTitle} fieldName="orderTitle" ariaLabel="Sao chép tiêu đề đơn hàng" />
                            </div>
                        </div>
                    )}
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(128, 128, 128, 0.1)' }}>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Người nhận</h3>
                        <div className="flex items-start justify-between gap-4">
                            <p className="flex-1 text-lg break-words" style={{ color: 'var(--text-primary)' }}>{data.shippingInfo.recipient}</p>
                             <CopyButton textToCopy={data.shippingInfo.recipient} fieldName="recipient" ariaLabel="Sao chép thông tin người nhận" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(128, 128, 128, 0.1)' }}><h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Địa chỉ</h3><p className="text-md" style={{ color: 'var(--text-primary)' }}>{data.shippingInfo.address}</p></div>
                        {data.deliveryDate && (
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(128, 128, 128, 0.1)' }}><h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Ngày giao hàng</h3><p className="text-md" style={{ color: 'var(--text-primary)' }}>{data.deliveryDate}</p></div>
                        )}
                    </div>
                     <div className="pt-2">
                        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-accent)' }}>Sao chép nhanh</h3>
                        <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--glass-border)' }}>
                            {isEditingQuickCopy ? (
                                <textarea
                                    ref={textareaRef}
                                    value={editableQuickCopyText}
                                    onChange={(e) => setEditableQuickCopyText(e.target.value)}
                                    className="w-full bg-transparent text-sm p-0 focus:outline-none resize-none overflow-hidden"
                                    style={{ color: 'var(--text-primary)'}}
                                    autoFocus
                                    onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
                                />
                            ) : (
                                <div className="text-left whitespace-pre-wrap text-sm break-words" style={{ color: 'var(--text-primary)' }}>
                                    {editableQuickCopyText.split('\n').map((line, i) => (
                                        <p key={i} className={i === 0 && editableQuickCopyText.includes('\n') ? 'mb-2' : ''}>{line}</p>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-2 mt-2">
                                <button 
                                    onClick={() => setIsEditingQuickCopy(!isEditingQuickCopy)} 
                                    className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 flex-shrink-0"
                                    style={{ ...buttonStyle }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor!}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor!}
                                    aria-label={isEditingQuickCopy ? 'Lưu thay đổi' : 'Chỉnh sửa'}
                                >
                                    {isEditingQuickCopy ? (
                                        <>
                                            <CheckIcon className="w-5 h-5" />
                                            <span>Lưu</span>
                                        </>
                                    ) : (
                                        <>
                                            <EditIcon className="w-5 h-5" />
                                            <span>Chỉnh sửa</span>
                                        </>
                                    )}
                                </button>
                                <CopyButton textToCopy={editableQuickCopyText} fieldName="quickCopy" ariaLabel="Sao chép nhanh toàn bộ kết quả" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col min-h-0">
                    <h3 className="text-lg font-bold mb-3 flex-shrink-0" style={{ color: 'var(--text-accent)' }}>Danh sách thiết bị</h3>
                    <div className="overflow-auto rounded-xl" style={{ border: '1px solid var(--glass-border)', backgroundColor: 'rgba(128, 128, 128, 0.1)' }}>
                        <table className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead className="sticky top-0 z-10" style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(128, 128, 128, 0.1)' }}>
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider border-b" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>Tên thiết bị</th>
                                    <th scope="col" className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider border-b" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>Số lượng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((item, index) => (
                                    <tr key={index} className="transition-colors duration-150" style={{ color: 'var(--text-primary)' }}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-t" style={{ borderColor: 'var(--glass-border)' }}>{item.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono border-t" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>{item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
};

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  disabled: boolean;
  onClick: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, disabled, onClick }) => {
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0] && !disabled) {
            onFileUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <label 
            onClick={onClick}
            onDragOver={handleDragOver} 
            onDrop={handleDrop} 
            className={`relative block w-full max-w-2xl rounded-3xl p-8 text-center shadow-lg transition-all duration-300 transform ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}`}
            style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(12px)' }}
        >
            <div className="flex flex-col items-center justify-center space-y-4">
                <FileUploadIcon className="w-16 h-16 transition-colors duration-300" style={{ color: 'var(--icon-accent)' }}/>
                <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Kéo & thả tệp Excel của bạn vào đây</span>
                <span style={{ color: 'var(--text-secondary)' }}>hoặc nhấn để chọn tệp</span>
            </div>
        </label>
    );
};

export default function App() {
    const [file, setFile] = useState<File | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [theme, setTheme] = useState<Theme>('dark');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) setTheme(savedTheme);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('light', theme === 'light');
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isLoading) {
            let messageIndex = 0;
            setLoadingMessage(LOADING_MESSAGES[0]);
            interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                setLoadingMessage(LOADING_MESSAGES[messageIndex]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleFileUpload = useCallback(async (uploadedFile: File) => {
        if (!/\.(xlsx|xls)$/i.test(uploadedFile.name)) {
            setError('Vui lòng tải lên tệp Excel hợp lệ (.xlsx, .xls).');
            return;
        }
        setIsLoading(true); setError(null); setExtractedData(null); setFile(uploadedFile);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                if (!data) throw new Error("Không thể đọc tệp.");
                const workbook = XLSX.read(data, { type: 'array' });
                const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
                setExtractedData(await extractInfoFromData(csvData));
            } catch (err) {
                console.error(err);
                setError('Không thể trích xuất dữ liệu. Vui lòng kiểm tra định dạng tệp hoặc thử lại.');
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => { setError('Không thể đọc tệp.'); setIsLoading(false); }
        reader.readAsArrayBuffer(uploadedFile);
    }, []);
    
    const handleReset = () => {
        setFile(null); setExtractedData(null); setIsLoading(false); setError(null);
    };

    const handleUploadAnother = () => {
        handleReset();
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
        }
        e.target.value = ''; // Allow re-uploading the same file
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <header className="w-full max-w-screen-xl mx-auto flex justify-between items-center p-4">
                <div></div> {/* Spacer */}
                <div className="text-center">
                     <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl" style={{ color: 'var(--text-primary)'}}>
                        Trích xuất dữ liệu <span style={{ color: 'var(--text-accent)' }}>Excel</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base sm:text-lg md:mt-4 md:max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
                        Tải lên bảng tính của bạn và để AI tự động trích xuất dữ liệu.
                    </p>
                </div>
                <ThemeToggle theme={theme} setTheme={setTheme} />
            </header>
            
            <main className="flex w-full flex-1 flex-col items-center justify-center text-center px-4">
                {!extractedData && (
                    <div className="w-full flex flex-col items-center justify-center space-y-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center space-y-4 p-12 rounded-3xl w-full max-w-md" style={{ backgroundColor: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}>
                                <LoaderIcon className="w-12 h-12" style={{ color: 'var(--icon-accent)' }} />
                                <p className="text-lg" style={{ color: 'var(--text-primary)' }}>{loadingMessage}</p>
                                {file && <p className="mt-2 text-sm truncate w-full px-4" style={{ color: 'var(--text-secondary)' }}>{file.name}</p>}
                            </div>
                        ) : (
                             <FileUploader 
                                onFileUpload={handleFileUpload} 
                                disabled={isLoading} 
                                onClick={() => !isLoading && fileInputRef.current?.click()}
                             />
                        )}

                        {error && (
                            <div className="mt-6 flex items-center space-x-3 rounded-2xl bg-red-500/20 border border-red-500/30 backdrop-blur-md p-4 text-red-300 animate-fade-in">
                                <ErrorIcon className="w-6 h-6" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                )}
                
                {extractedData && !isLoading && <ResultsDisplay data={extractedData} onUploadAnother={handleUploadAnother} />}
            </main>
            
            <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={isLoading}
            />

            <footer className="w-full text-center p-4 mt-auto">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Hỗ trợ bởi Gemini API</p>
            </footer>
        </div>
    );
}