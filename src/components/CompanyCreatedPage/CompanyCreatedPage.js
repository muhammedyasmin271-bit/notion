import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Building2, 
  Mail, 
  ArrowRight, 
  CreditCard,
  Calendar,
  Users
} from 'lucide-react';

const CompanyCreatedPage = () => {
  const location = useLocation();
  const { companyName, companyId, adminEmail, plan } = location.state || {};

  if (!companyName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Access</h1>
          <Link to="/" className="text-cyan-400 hover:text-cyan-300">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png" 
              alt="Mela Note Logo" 
              className="h-10 w-10"
            />
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Mela Note
            </h1>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">
            🎉 Company Created Successfully!
          </h2>
          <p className="text-xl text-blue-100">
            Welcome to your new workspace
          </p>
        </div>

        {/* Company Details Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{companyName}</h3>
                <p className="text-blue-200">Company ID: {companyId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-2xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-semibold">Admin Email</span>
                </div>
                <p className="text-blue-200">{adminEmail}</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">Selected Plan</span>
                </div>
                <p className="text-blue-200">
                  {plan?.name} - {plan?.name === 'Free Trial' ? 'Free for 7 days' : `ETB ${plan?.price}/${plan?.period}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">What's Next?</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="text-white font-semibold">Login to Your Account</h4>
                <p className="text-blue-200">Use your admin email and password to access your workspace</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="text-white font-semibold">Invite Team Members</h4>
                <p className="text-blue-200">Add your team and start collaborating</p>
              </div>
            </div>

            {plan?.name !== 'Free Trial' && (
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="text-white font-semibold">Complete Payment</h4>
                  <p className="text-blue-200">Set up billing to continue after trial period</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = `/login?company=${companyId}`}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center group"
          >
            Login to Your Workspace
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {plan?.name === 'Free Trial' && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4">
              <div className="flex items-center space-x-3 text-green-200">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">
                  Your 7-day free trial starts now! No payment required.
                </span>
              </div>
            </div>
          )}

          <div className="text-center">
            <Link 
              to="/" 
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              ← Back to Landing Page
            </Link>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p className="text-blue-200 mb-2">Need help getting started?</p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <a href="#" className="text-cyan-400 hover:text-cyan-300">
              📧 Support Email
            </a>
            <a href="#" className="text-cyan-400 hover:text-cyan-300">
              📞 Call Support
            </a>
            <a href="#" className="text-cyan-400 hover:text-cyan-300">
              📚 Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyCreatedPage;