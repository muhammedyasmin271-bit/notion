import React from 'react';
import { render, screen } from '@testing-library/react';
import SubmitReportPage from './SubmitReportPage';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn()
}));

// Mock context providers
jest.mock('../../context/AppContext', () => ({
    useAppContext: () => ({
        user: { name: 'Test User', email: 'test@example.com' }
    })
}));

jest.mock('../../context/ThemeContext', () => ({
    useTheme: () => ({
        isDarkMode: false
    })
}));

describe('SubmitReportPage', () => {
    test('renders without crashing', () => {
        render(<SubmitReportPage />);
        expect(screen.getByText('Submit Report')).toBeInTheDocument();
    });

    test('displays report type options', () => {
        render(<SubmitReportPage />);
        expect(screen.getByText('Bug Report')).toBeInTheDocument();
        expect(screen.getByText('Feature Request')).toBeInTheDocument();
        expect(screen.getByText('Performance Issue')).toBeInTheDocument();
    });

    test('has required fields', () => {
        render(<SubmitReportPage />);
        expect(screen.getByLabelText('Title *')).toBeInTheDocument();
        expect(screen.getByLabelText('Description *')).toBeInTheDocument();
    });
});