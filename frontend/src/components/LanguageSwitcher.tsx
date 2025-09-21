import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, Settings, Zap, ZapOff } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { 
    uiLanguage, 
    setUILanguage, 
    autoSwitchUI, 
    setAutoSwitchUI, 
    translate 
  } = useLanguage();

  const toggleUILanguage = () => {
    setUILanguage(uiLanguage === 'en' ? 'zh' : 'en');
  };

  const toggleAutoSwitch = () => {
    setAutoSwitchUI(!autoSwitchUI);
  };

  return (
    <div className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
      {/* UI Language Toggle */}
      <button
        onClick={toggleUILanguage}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          uiLanguage === 'zh' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title={translate('language.switchTo')}
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">
          {uiLanguage === 'en' ? '中文' : 'English'}
        </span>
      </button>

      {/* Auto Switch Toggle */}
      <button
        onClick={toggleAutoSwitch}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          autoSwitchUI 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title={autoSwitchUI ? 'Disable auto-switch' : 'Enable auto-switch'}
      >
        {autoSwitchUI ? (
          <Zap className="h-4 w-4" />
        ) : (
          <ZapOff className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {autoSwitchUI ? translate('language.autoSwitch', 'Auto') : translate('language.manual', 'Manual')}
        </span>
      </button>

      {/* Settings Icon */}
      <div className="flex items-center text-gray-400">
        <Settings className="h-4 w-4" />
      </div>
    </div>
  );
};

export default LanguageSwitcher;