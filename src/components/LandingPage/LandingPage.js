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
  Send
} from 'lucide-react';

const LandingPage = () => {
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
  const [contactInfo, setContactInfo] = React.useState({
    email: 'support@melanote.com',
    phone: '+251 911 234 567',
    address: 'Addis Ababa, Ethiopia'
  });

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
        const response = await fetch('http://localhost:9000/api/settings/payment');
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

    // Fetch contact information from settings
    const fetchContactInfo = async () => {
      try {
        const response = await fetch('http://localhost:9000/api/settings/contact');
        if (response.ok) {
          const data = await response.json();
          if (data.email || data.phone || data.address) {
            setContactInfo({
              email: data.email || 'support@melanote.com',
              phone: data.phone || '+251 911 234 567',
              address: data.address || 'Addis Ababa, Ethiopia'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
        // Keep default values
      }
    };
    fetchContactInfo();
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
      const response = await fetch('http://localhost:9000/api/contact/submit', {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <img 
                  src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png" 
                  alt="Mela Note Logo" 
                  className="h-12 w-12"
                />
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  Mela Note
                </h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <a href="#features" className="text-white/80 hover:text-white px-4 py-2 text-lg font-semibold transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-sm">
                  Features
                </a>
                <a href="#pricing" className="text-white/80 hover:text-white px-4 py-2 text-lg font-semibold transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-sm">
                  Pricing
                </a>
                <a href="#about" className="text-white/80 hover:text-white px-4 py-2 text-lg font-semibold transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-sm">
                  About
                </a>
                <a href="#contact" className="text-white/80 hover:text-white px-4 py-2 text-lg font-semibold transition-all duration-300 hover:bg-white/10 rounded-xl backdrop-blur-sm">
                  Contact
                </a>
                <Link 
                  to="/super-admin/login" 
                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl text-sm font-bold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Super Admin
                </Link>
                <a 
                  href="#pricing" 
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-4 rounded-2xl text-lg font-black hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/25"
                >
                  Get Started
                </a>
              </div>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-cyan-400 p-2"
              >
                {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/40 backdrop-blur-xl border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-4 py-3 text-white/80 hover:text-white font-semibold rounded-xl hover:bg-white/10">
                Features
              </a>
              <a href="#pricing" className="block px-4 py-3 text-white/80 hover:text-white font-semibold rounded-xl hover:bg-white/10">
                Pricing
              </a>
              <a href="#about" className="block px-4 py-3 text-white/80 hover:text-white font-semibold rounded-xl hover:bg-white/10">
                About
              </a>
              <a href="#contact" className="block px-4 py-3 text-white/80 hover:text-white font-semibold rounded-xl hover:bg-white/10">
                Contact
              </a>
              <Link to="/super-admin/login" className="block px-4 py-3 text-gray-300 font-semibold rounded-xl hover:bg-white/10">
                Super Admin
              </Link>
              <a href="#pricing" className="block px-4 py-3 text-cyan-400 font-black rounded-xl hover:bg-white/10">
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
          <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-4000"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <div className="mb-12">
              <span className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/20 backdrop-blur-sm">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                🚀 Revolutionary Team Workspace - Powered by Mela Note
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-8xl xl:text-9xl font-black text-white mb-8 lg:mb-12 leading-tight">
              Transform Your
              <span className="bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent block mt-2 lg:mt-4">
                Team's Future
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-blue-100 mb-12 lg:mb-16 max-w-5xl mx-auto leading-relaxed font-light px-4">
              Experience the next generation of collaboration with Mela Note's AI-powered workspace. 
              Built for Ethiopian businesses, designed for global success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-8 justify-center mb-12 lg:mb-16 px-4">
              <a 
                href="#pricing" 
                className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 lg:px-12 py-4 lg:py-6 rounded-xl lg:rounded-2xl text-lg lg:text-2xl font-black hover:from-blue-700 hover:to-blue-800 transition-all duration-500 transform hover:scale-105 lg:hover:scale-110 shadow-2xl hover:shadow-blue-500/25 flex items-center justify-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10">Start Free Trial</span>
                <ArrowRight className="relative z-10 ml-2 lg:ml-4 w-5 h-5 lg:w-7 lg:h-7 group-hover:translate-x-1 lg:group-hover:translate-x-2 transition-transform duration-300" />
              </a>
              <a 
                href="#pricing" 
                className="group border-2 border-white/30 text-white px-8 lg:px-12 py-4 lg:py-6 rounded-xl lg:rounded-2xl text-lg lg:text-2xl font-black hover:bg-white/10 transition-all duration-500 flex items-center justify-center backdrop-blur-sm hover:border-white/50"
              >
                <Play className="mr-2 lg:mr-4 w-5 h-5 lg:w-7 lg:h-7 group-hover:scale-110 transition-transform" />
                Watch Demo
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto px-4">
              <div className="flex items-center justify-center bg-white/10 backdrop-blur-sm px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl border border-white/20">
                <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 mr-2 lg:mr-3 flex-shrink-0" />
                <span className="text-white font-semibold text-sm lg:text-base">7-day free trial</span>
              </div>
              <div className="flex items-center justify-center bg-white/10 backdrop-blur-sm px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl border border-white/20">
                <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 mr-2 lg:mr-3 flex-shrink-0" />
                <span className="text-white font-semibold text-sm lg:text-base">No credit card required</span>
              </div>
              <div className="flex items-center justify-center bg-white/10 backdrop-blur-sm px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl border border-white/20">
                <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 mr-2 lg:mr-3 flex-shrink-0" />
                <span className="text-white font-semibold text-sm lg:text-base">Ethiopian payment support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Everything you need to
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent block">
                succeed
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Powerful features designed to streamline your workflow and boost team productivity to new heights.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative bg-white p-8 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl" style={{backgroundImage: `linear-gradient(135deg, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})`}}></div>
                <div className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-6 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10"></div>
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Trusted by teams worldwide
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join thousands of companies already transforming their workflow
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-5xl md:text-6xl font-black text-white mb-2 group-hover:scale-110 transition-transform">10K+</div>
                <div className="text-blue-100 font-semibold">Active Users</div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-5xl md:text-6xl font-black text-white mb-2 group-hover:scale-110 transition-transform">500+</div>
                <div className="text-blue-100 font-semibold">Companies</div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-5xl md:text-6xl font-black text-white mb-2 group-hover:scale-110 transition-transform">99.9%</div>
                <div className="text-blue-100 font-semibold">Uptime</div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-5xl md:text-6xl font-black text-white mb-2 group-hover:scale-110 transition-transform">24/7</div>
                <div className="text-blue-100 font-semibold">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 mb-4 lg:mb-6">
              Simple, transparent
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent block">
                pricing
              </span>
            </h2>
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Choose the perfect plan for your team. All plans include our core features with no hidden costs.
            </p>
            <p className="text-sm lg:text-base text-gray-500 max-w-2xl mx-auto mt-4 px-4">
              * Prices shown are examples based on {exampleUserLimit} users at {pricePerUserPerMonth} ETB per user per month. Final price depends on your company's user limit.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {pricing.map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-2xl lg:rounded-3xl shadow-xl p-6 lg:p-8 border-2 ${plan.color} transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${plan.popular ? 'transform scale-105' : 'hover:scale-105'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs lg:text-sm font-bold shadow-lg">
                      ⭐ Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6 lg:mb-8">
                  <h3 className="text-xl lg:text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm lg:text-base">{plan.description}</p>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-lg lg:text-xl font-bold text-gray-600 mr-1">{plan.currency}</span>
                    <span className="text-3xl lg:text-5xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1 text-sm lg:text-lg font-semibold">{plan.period}</span>
                  </div>
                  {plan.popular && (
                    <div className="text-green-600 font-semibold text-xs lg:text-sm">
                      Save 20% annually
                    </div>
                  )}
                </div>
                <ul className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium text-sm lg:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  to={`/create-company?plan=${plan.planId}`}
                  className={`w-full py-3 lg:py-4 px-4 lg:px-6 rounded-xl lg:rounded-2xl font-bold text-center block transition-all duration-300 transform hover:scale-105 text-sm lg:text-base ${
                    plan.planId === 'free_trial'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl'
                      : plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-200 hover:border-gray-300'
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
      <section id="about" className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
                Built for
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  modern teams
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Our platform combines the best of project management, document collaboration, 
                and team communication in one seamless experience. Built with cutting-edge 
                technologies and designed for infinite scalability.
              </p>
              <div className="space-y-6">
                <div className="flex items-center group">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-700 font-semibold text-lg">Global accessibility with 99.9% uptime</span>
                </div>
                <div className="flex items-center group">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-700 font-semibold text-lg">Enterprise-grade security and compliance</span>
                </div>
                <div className="flex items-center group">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-700 font-semibold text-lg">Lightning-fast performance and real-time sync</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -translate-y-16 translate-x-16 opacity-10"></div>
                <div className="relative">
                  <div className="flex justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-8 h-8 text-yellow-400 fill-current mx-1 animate-pulse" style={{animationDelay: `${i * 0.1}s`}} />
                    ))}
                  </div>
                  <blockquote className="text-xl text-gray-700 mb-6 font-medium leading-relaxed text-center">
                    "This platform has completely transformed how our team collaborates. The intuitive 
                    interface and powerful features have increased our productivity by 40% in just 3 months."
                  </blockquote>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                      SJ
                    </div>
                    <cite className="text-gray-600 font-semibold">
                      Sarah Johnson
                    </cite>
                    <div className="text-sm text-gray-500 mt-1">
                      Project Manager at TechCorp
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Get in
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                Touch
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Contact Information</h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Reach out to us through any of these channels. We're here to help you succeed.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Email</h4>
                    <a href={`mailto:${contactInfo.email}`} className="text-gray-600 hover:text-blue-600 transition-colors text-lg">
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Phone</h4>
                    <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="text-gray-600 hover:text-purple-600 transition-colors text-lg">
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-lg">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Address</h4>
                    <p className="text-gray-600 text-lg">
                      {contactInfo.address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Business Hours</h4>
                <div className="space-y-2 text-gray-600">
                  <p className="flex justify-between">
                    <span className="font-semibold">Monday - Friday:</span>
                    <span>9:00 AM - 6:00 PM EAT</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold">Saturday:</span>
                    <span>10:00 AM - 4:00 PM EAT</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold">Sunday:</span>
                    <span>Closed</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-bold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-900"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-900"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-bold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-900"
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-bold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none text-gray-900"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  {contactSubmitStatus.type === 'loading' ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black opacity-20"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        </div>
        <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
            Ready to transform
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
              your workflow?
            </span>
          </h2>
          <p className="text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of teams already using our platform to achieve extraordinary results together.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a 
              href="#pricing" 
              className="group bg-white text-blue-600 px-12 py-6 rounded-2xl text-xl font-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl inline-flex items-center justify-center"
            >
              Start Your Free Trial
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link 
              to="/login" 
              className="group border-2 border-white/30 text-white px-12 py-6 rounded-2xl text-xl font-black hover:bg-white/10 transition-all duration-300 inline-flex items-center justify-center backdrop-blur-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png" 
                  alt="Mela Note Logo" 
                  className="h-10 w-10"
                />
                <h3 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  Mela Note
                </h3>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                The complete workspace for modern teams to collaborate, manage projects, and achieve their most ambitious goals.
              </p>
              <div className="flex space-x-4 mt-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <span className="text-white font-bold">f</span>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <span className="text-white font-bold">t</span>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <span className="text-white font-bold">in</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-xl">Product</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#features" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Pricing</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Sign Up</Link></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-xl">Company</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#about" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">About</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 transform inline-block">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400 text-lg">
              &copy; 2024 Mela Note. All rights reserved. Made with ❤️ for modern teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;