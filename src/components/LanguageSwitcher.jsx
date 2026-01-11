import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { languages } from '../i18n/translations';

const LanguageSwitcher = () => {
    const { currentLanguage, changeLanguage } = useLanguage();

    const handleLanguageChange = (langCode) => {
        console.log('Changing language to:', langCode); // Debug log
        changeLanguage(langCode);
        localStorage.setItem('mavi_language', langCode);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center'
        }}>
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    title={lang.name}
                    style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: currentLanguage === lang.code
                            ? 'rgba(102, 126, 234, 0.3)'
                            : 'rgba(255, 255, 255, 0.05)',
                        border: currentLanguage === lang.code
                            ? '2px solid #667eea'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '1.5rem',
                        padding: 0
                    }}
                    onMouseEnter={(e) => {
                        if (currentLanguage !== lang.code) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (currentLanguage !== lang.code) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }
                    }}
                >
                    {lang.flag}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
