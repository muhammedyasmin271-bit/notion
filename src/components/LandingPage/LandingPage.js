import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  FileText, 
  BarChart3, 
  MessageSquare,
  Shield,
  Zap,
  Globe,
  Star,
  Menu,
  X,
  Play,
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  Calendar,
  CheckSquare,
  Gmail,
  Slack,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LandingPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [pricePerUserPerMonth, setPricePerUserPerMonth] = React.useState(1);
  const [exampleUserLimit] = React.useState(10); // Default example: 10 users
  const [contactForm, setContactForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [contactSubmitStatus, setContactSubmitStatus] = React.useState({ type: '', message: '' });

  // Calculate prices based on price per user per month
  const calculatePrice = (months, discount = 0) => {
    const basePrice = exampleUserLimit * pricePerUserPerMonth * months;
    const discountedPrice = basePrice * (1 - discount / 100);
    return Math.round(discountedPrice);
  };

  React.useEffect(() => {
    // Fetch price per user per month from settings
    const fetchPricePerUser = async () => {
      try {
        // Try to fetch without auth first (for public landing page)
        const response = await fetch($backendUrl/api/settings/payment');
        if (response.ok) {
          const data = await response.json();
          if (data.pricePerUserPerMonth) {
            setPricePerUserPerMonth(data.pricePerUserPerMonth);
          }
        }
      } catch (error) {
        // If auth required, use default value
        console.error('Error fetching price per user:', error);
        // Keep default value of 1
      }
    };
    fetchPricePerUser();
  }, []);

  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSubmitStatus({ type: 'loading', message: 'Sending message...' });
    
    try {
      const response = await fetch($backendUrl/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setContactSubmitStatus({ 
        type: 'success', 
        message: data.message || 'Thank you! We\'ll get back to you soon.' 
      });
      setContactForm({ name: '', email: '', phone: '', message: '' });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setContactSubmitStatus({ type: '', message: '' });
      }, 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setContactSubmitStatus({ 
        type: 'error', 
        message: error.message || 'Failed to send message. Please try again.' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setContactSubmitStatus({ type: '', message: '' });
      }, 5000);
    }
  };

  const features = [
    {
      icon: <Users className="w-12 h-12" />,
      title: "Team Collaboration",
      description: "Seamless team management with role-based access and real-time collaboration tools.",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: <FileText className="w-12 h-12" />,
      title: "Document Management",
      description: "Upload, organize, and share all file types with professional document handling.",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: <BarChart3 className="w-12 h-12" />,
      title: "Analytics & Reports",
      description: "Comprehensive analytics dashboard with interactive charts and data visualization.",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: <MessageSquare className="w-12 h-12" />,
      title: "Smart Notepad",
      description: "Professional markdown editor with formatting tools and auto-completion.",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Enterprise Security",
      description: "JWT authentication, role-based permissions, and secure data handling.",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Real-time Updates",
      description: "Live notifications, instant messaging, and synchronized team updates.",
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: <Star className="w-12 h-12" />,
      title: "Points & Rewards System",
      description: "Gamified productivity with points for completing tasks on time. Earn more points for early completion and high-priority projects.",
      color: "from-blue-600 to-blue-700"
    }
  ];

  const pricing = [
    {
      name: "Free Trial",
      price: "0",
      currency: "ETB",
      period: "/7 days",
      description: "Try all features free",
      features: [
        "All features included",
        "7 days full access",
        "Pay after 7 days",
        "No credit card required"
      ],
      popular: false,
      color: "border-green-500 ring-2 ring-green-100",
      planId: "free_trial"
    },
    {
      name: "One Month Plan",
      price: calculatePrice(1).toLocaleString(),
      currency: "ETB",
      period: "/month",
      description: `Based on ${exampleUserLimit} users × ${pricePerUserPerMonth} ETB/month`,
      features: [
        "1 month subscription",
        "Pay within 24 hours",
        "Access after payment",
        "Flexible user limit"
      ],
      popular: false,
      color: "border-gray-200",
      planId: "one_month"
    },
    {
      name: "Three Month Plan",
      price: calculatePrice(3, 5).toLocaleString(),
      currency: "ETB",
      period: "/3 months",
      description: `Save 5% - ${exampleUserLimit} users × ${pricePerUserPerMonth} ETB × 3 months`,
      features: [
        "3 months subscription",
        "5% discount",
        "Pay within 24 hours",
        "Access after payment"
      ],
      popular: true,
      color: "border-blue-500 ring-4 ring-blue-100",
      planId: "three_month"
    },
    {
      name: "Six Month Plan",
      price: calculatePrice(6, 10).toLocaleString(),
      currency: "ETB",
      period: "/6 months",
      description: `Save 10% - ${exampleUserLimit} users × ${pricePerUserPerMonth} ETB × 6 months`,
      features: [
        "6 months subscription",
        "10% discount",
        "Pay within 24 hours",
        "Access after payment"
      ],
      popular: false,
      color: "border-gray-200",
      planId: "six_month"
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#141414] text-white' 
        : 'bg-gray-100 text-gray-900'
    }`} style={isDarkMode ? { backgroundColor: '#141414' } : {
      backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23999\" fill-opacity=\"0.4\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1.5\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
    }}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full backdrop-blur-sm border-b z-50 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              {/* Mela Note Logo */}
              <div className={`p-1.5 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
              }`}>
                <img 
                  src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png" 
                  alt="Mela Note Logo" 
                  className={`h-10 w-10 object-contain transition-all duration-300 ${
                    isDarkMode ? 'brightness-0 invert' : ''
                  }`}
                />
              </div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Mela Note
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`px-4 py-2 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Features
              </a>
              <a href="#pricing" className={`px-4 py-2 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Pricing
              </a>
              <a href="#about" className={`px-4 py-2 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Resources
              </a>
              <a href="#contact" className={`px-4 py-2 text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Contact
              </a>
              <Link 
                to="/login" 
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Sign in
              </Link>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode 
                    ? 'text-yellow-400 hover:bg-gray-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <a 
                href="#pricing" 
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Get demo
              </a>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode 
                    ? 'text-yellow-400 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={isDarkMode ? 'text-gray-300 p-2' : 'text-gray-700 p-2'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className={`block px-4 py-3 font-medium transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Features
              </a>
              <a href="#pricing" className={`block px-4 py-3 font-medium transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Pricing
              </a>
              <a href="#about" className={`block px-4 py-3 font-medium transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Resources
              </a>
              <a href="#contact" className={`block px-4 py-3 font-medium transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Contact
              </a>
              <Link to="/login" className={`block px-4 py-3 font-medium transition-colors ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}>
                Sign in
              </Link>
              <a href="#pricing" className={`block px-4 py-3 font-semibold rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}>
                Get demo
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 overflow-hidden min-h-screen flex items-center">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="relative">
            {/* Central Content */}
            <div className="text-center mb-16 relative z-10">
              {/* Central Logo */}
              <div className="flex justify-center mb-8">
                <div className={`relative w-24 h-24 rounded-xl shadow-lg flex items-center justify-center transform rotate-3 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-2 border-gray-700' 
                    : 'bg-white border-2 border-gray-100'
                }`}>
                  <img 
                    src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png" 
                    alt="Mela Note Logo" 
                    className={`w-16 h-16 object-contain transition-all duration-300 ${
                      isDarkMode ? 'brightness-0 invert' : ''
                    }`}
                  />
                </div>
              </div>
              
              <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Think, plan, and track
                <span className={`block text-4xl sm:text-5xl lg:text-6xl mt-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  all in one place
                </span>
              </h1>
              <p className={`text-lg sm:text-xl mb-8 max-w-2xl mx-auto ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Efficiently manage your tasks and boost productivity.
              </p>
              <a 
                href="#pricing" 
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get free demo
              </a>
            </div>

            {/* Supporting Visual Elements */}
            <div className="relative mt-20">
              {/* Top-Left: Sticky Note */}
              <div className="absolute top-0 left-0 md:left-10 transform -rotate-6 z-20 hidden md:block">
                <div className={`relative w-64 p-4 rounded shadow-lg ${
                  isDarkMode ? 'bg-yellow-600' : 'bg-yellow-200'
                }`} style={{ transform: 'perspective(1000px) rotateY(-5deg)' }}>
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-red-500 rounded-full"></div>
                  <p className={`text-sm mt-2 leading-relaxed ${
                    isDarkMode ? 'text-gray-900' : 'text-gray-800'
                  }`}>
                    Take notes to keep track of crucial details, and accomplish more tasks with ease.
                  </p>
                  <div className={`mt-4 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <CheckSquare className={`w-6 h-6 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Top-Right: Reminders */}
              <div className="absolute top-0 right-0 md:right-10 transform rotate-3 z-20 hidden md:block">
                <div className="relative">
                  <Clock className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`} />
                  <div className={`rounded-lg shadow-lg p-4 w-64 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-white'
                  }`} style={{ transform: 'perspective(1000px) rotateY(5deg)' }}>
                    <h3 className={`font-semibold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Reminders</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Today's Meeting</p>
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Call with marketing team</p>
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Time 13:00 - 13:45</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom-Left: Today's Tasks */}
              <div className="absolute bottom-0 left-0 md:left-10 transform rotate-2 z-20 hidden md:block">
                <div className={`rounded-lg shadow-lg p-4 w-72 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                }`} style={{ transform: 'perspective(1000px) rotateY(-3deg)' }}>
                  <h3 className={`font-semibold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Today's tasks</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">8</span>
                          </div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>New Ideas for campaign</span>
                        </div>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Sep 10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>60%</span>
                        <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">3</span>
                          </div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>Design PPT #4</span>
                        </div>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Sep 18</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>100%</span>
                        <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom-Right: Integrations */}
              <div className="absolute bottom-0 right-0 md:right-10 transform -rotate-2 z-20 hidden md:block">
                <div className={`rounded-lg shadow-lg p-4 w-64 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                }`} style={{ transform: 'perspective(1000px) rotateY(3deg)' }}>
                  <h3 className={`font-semibold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>100+ Integrations</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 font-bold text-lg">M</span>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Slack className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-24 relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Everything you need to succeed
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Powerful features designed to streamline your workflow and boost team productivity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className={`group relative p-6 rounded-xl border hover:shadow-lg transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:border-blue-500' 
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}>
                <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Points System Section */}
      <section className={`py-20 relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
              <Star className="w-8 h-8 text-yellow-600 fill-current" />
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Gamified Productivity System
            </h2>
            <p className={`text-lg max-w-3xl mx-auto mb-8 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Stay motivated with our built-in points and rewards system. Complete tasks on time, 
              meet deadlines, and watch your team's productivity soar!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className={`text-center p-6 rounded-xl border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Early Completion</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Earn up to 30 points for completing projects ahead of schedule</p>
            </div>
            
            <div className={`text-center p-6 rounded-xl border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Priority Multipliers</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Get 2x points for critical tasks, 1.5x for high priority projects</p>
            </div>
            
            <div className={`text-center p-6 rounded-xl border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Team Rankings</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Track individual and company performance with point-based ratings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-20 relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Trusted by teams worldwide
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Join thousands of companies already transforming their workflow
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`rounded-lg p-6 border hover:shadow-md transition-shadow ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>10K+</div>
                <div className={`font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Active Users</div>
              </div>
            </div>
            <div className="text-center">
              <div className={`rounded-lg p-6 border hover:shadow-md transition-shadow ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>500+</div>
                <div className={`font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Companies</div>
              </div>
            </div>
            <div className="text-center">
              <div className={`rounded-lg p-6 border hover:shadow-md transition-shadow ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>99.9%</div>
                <div className={`font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Uptime</div>
              </div>
            </div>
            <div className="text-center">
              <div className={`rounded-lg p-6 border hover:shadow-md transition-shadow ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>24/7</div>
                <div className={`font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`py-24 relative transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Simple, transparent pricing
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Choose the perfect plan for your team. All plans include our core features with no hidden costs.
            </p>
            <p className={`text-sm max-w-2xl mx-auto mt-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              * Prices shown are examples based on {exampleUserLimit} users at {pricePerUserPerMonth} ETB per user per month. Final price depends on your company's user limit.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((plan, index) => (
              <div key={index} className={`relative rounded-xl shadow-md p-6 border-2 transition-all duration-300 hover:shadow-lg ${
                isDarkMode 
                  ? plan.popular 
                    ? 'bg-gray-700 border-blue-500 ring-4 ring-blue-900' 
                    : 'bg-gray-700 border-gray-600'
                  : plan.popular 
                    ? 'bg-white border-blue-500 ring-4 ring-blue-100' 
                    : 'bg-white border-gray-200'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isDarkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{plan.name}</h3>
                  <p className={`mb-4 text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{plan.description}</p>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className={`text-lg font-semibold mr-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{plan.currency}</span>
                    <span className={`text-4xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{plan.price}</span>
                    <span className={`ml-1 text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                        isDarkMode ? 'bg-green-900' : 'bg-green-100'
                      }`}>
                        <CheckCircle className={`w-3 h-3 ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`} />
                      </div>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  to={`/create-company?plan=${plan.planId}`}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-center block transition-all duration-300 text-sm ${
                    plan.planId === 'free_trial'
                      ? isDarkMode
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                      : plan.popular 
                      ? isDarkMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      : isDarkMode
                        ? 'bg-gray-600 text-white hover:bg-gray-500 border-2 border-gray-500'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-200'
                  }`}
                >
                  {plan.planId === 'free_trial' ? 'Start Free Trial' : plan.popular ? 'Choose Plan' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`py-24 relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 leading-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Built for modern teams
              </h2>
              <p className={`text-lg mb-8 leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Our platform combines the best of project management, document collaboration, 
                and team communication in one seamless experience. Built with cutting-edge 
                technologies and designed for infinite scalability.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                    isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                  }`}>
                    <Globe className={`w-5 h-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <span className={`font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Global accessibility with 99.9% uptime</span>
                </div>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                    isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                  }`}>
                    <Shield className={`w-5 h-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <span className={`font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Enterprise-grade security and compliance</span>
                </div>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                    isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                  }`}>
                    <Zap className={`w-5 h-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <span className={`font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Lightning-fast performance and real-time sync</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className={`rounded-xl p-8 shadow-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current mx-1" />
                  ))}
                </div>
                <blockquote className={`text-lg mb-6 font-medium leading-relaxed text-center ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  "This platform has completely transformed how our team collaborates. The intuitive 
                  interface and powerful features have increased our productivity by 40% in just 3 months."
                </blockquote>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-semibold">
                    SJ
                  </div>
                  <cite className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Sarah Johnson
                  </cite>
                  <div className={`text-sm mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Project Manager at TechCorp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className={`py-24 relative overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Get in Touch
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className={`text-2xl font-bold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Contact Information</h3>
                <p className={`mb-6 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Reach out to us through any of these channels. We're here to help you succeed.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                    isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                  }`}>
                    <Mail className={`w-5 h-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`text-base font-semibold mb-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Email</h4>
                    <a href="mailto:support@melanote.com" className={`hover:text-blue-600 transition-colors ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      support@melanote.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                    isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                  }`}>
                    <Phone className={`w-5 h-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`text-base font-semibold mb-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Phone</h4>
                    <a href="tel:+251911234567" className={`hover:text-blue-600 transition-colors ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      +251 911 234 567
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                    isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                  }`}>
                    <MapPin className={`w-5 h-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`text-base font-semibold mb-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Address</h4>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Addis Ababa, Ethiopia
                    </p>
                  </div>
                </div>
              </div>

              <div className={`pt-6 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Business Hours</h4>
                <div className={`space-y-2 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <p className="flex justify-between">
                    <span className="font-medium">Monday - Friday:</span>
                    <span>9:00 AM - 6:00 PM EAT</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium">Saturday:</span>
                    <span>10:00 AM - 4:00 PM EAT</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium">Sunday:</span>
                    <span>Closed</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className={`rounded-xl p-6 shadow-md border ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label htmlFor="contact-name" className={`block text-sm font-bold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactInputChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-800' 
                        : 'border-gray-200 text-gray-900'
                    }`}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className={`block text-sm font-bold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactInputChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-800' 
                        : 'border-gray-200 text-gray-900'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="contact-phone" className={`block text-sm font-bold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-800' 
                        : 'border-gray-200 text-gray-900'
                    }`}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className={`block text-sm font-bold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactInputChange}
                    required
                    rows={6}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-800' 
                        : 'border-gray-200 text-gray-900'
                    }`}
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                {contactSubmitStatus.message && (
                  <div className={`p-4 rounded-xl ${
                    contactSubmitStatus.type === 'success' 
                      ? 'bg-green-50 border-2 border-green-200 text-green-800' 
                      : contactSubmitStatus.type === 'error'
                      ? 'bg-red-50 border-2 border-red-200 text-red-800'
                      : 'bg-blue-50 border-2 border-blue-200 text-blue-800'
                  }`}>
                    {contactSubmitStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={contactSubmitStatus.type === 'loading'}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {contactSubmitStatus.type === 'loading' ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to transform your workflow?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using our platform to achieve extraordinary results together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#pricing" 
              className="group bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link 
              to="/login" 
              className="group border-2 border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-1.5 rounded-lg bg-gray-800/50">
                  <img 
                    src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png" 
                    alt="Mela Note Logo" 
                    className="h-10 w-10 object-contain brightness-0 invert"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Mela Note
                </h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                The complete workspace for modern teams to collaborate, manage projects, and achieve their most ambitious goals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 Mela Note. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;