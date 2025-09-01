import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  onBack, 
  backTo = 'home',
  showBackButton = true,
  children 
}) => {
  const { setCurrentPage } = useAppContext();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentPage(backTo);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200"
            title={`Back to ${backTo === 'home' ? 'Home' : backTo}`}
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
        )}
        <div>
          <h1 className="flex items-center text-4xl font-extrabold tracking-tight text-gray-900">
            {Icon && <Icon className="mr-3 text-blue-500" />}
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default PageHeader;
