import React, { useState, useEffect } from 'react';
import {
  LayoutGrid as ProjectsIcon,
  Folder as DocumentsIcon,
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus,
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Calendar,
  Target,
  Zap,
  Star,
  Bell,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
  Award,
  BookOpen,
  MessageSquare,
  PieChart,
  LineChart,
  BarChart,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  Calendar as CalendarIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  RotateCcw,
  Save,
  Share2,
  Copy,
  ExternalLink,
  Link,
  Image,
  Video,
  Music,
  File,
  FolderOpen,
  Archive,
  Tag,
  Flag,
  Bookmark,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Reply,
  Forward,
  Archive as ArchiveIcon,
  Trash,
  Restore,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Eye as EyeIcon,
  EyeOff,
  Edit,
  Edit2,
  PenTool,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Terminal,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryHigh,
  BatteryFull,
  Power,
  PowerOff,
  Volume2,
  VolumeX,
  Volume1,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Printer,
  Scanner,
  HardDrive,
  Cpu,
  MemoryStick,
  HardDriveIcon,
  Disc,
  Cd,
  Dvd,
  Usb,
  Bluetooth,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Gamepad2,
  Joystick,
  Mouse,
  Keyboard,
  Touchpad,
  MousePointer,
  Hand,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  CreditCard,
  Wallet,
  Coins,
  DollarSign,
  Euro,
  PoundSterling,
  Yen,
  Rupee,
  Bitcoin,
  Ethereum,
  DollarSign as DollarIcon,
  Percent,
  Hash,
  AtSign,
  Asterisk,
  Plus as PlusIcon,
  Minus,
  Divide,
  Equal,
  NotEqual,
  LessThan,
  GreaterThan,
  LessThanOrEqual,
  GreaterThanOrEqual,
  Infinity,
  Pi,
  Sigma,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Epsilon,
  Zeta,
  Eta,
  Theta,
  Iota,
  Kappa,
  Lambda,
  Mu,
  Nu,
  Xi,
  Omicron,
  Rho,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi,
  Omega,
  Sun,
  Moon,
  Cloud as CloudIcon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudHail,
  CloudFog,
  Wind,
  Thermometer,
  Droplets,
  Umbrella,
  Rainbow,
  Tornado,
  Hurricane,
  Earthquake,
  Volcano,
  Fire,
  Flame,
  Sparkles as SparklesIcon,
  Star as StarIcon,
  Heart as HeartIcon,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  Sad,
  Surprised,
  Confused,
  Wink,
  Kiss,
  Hug,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Clap,
  Wave,
  Peace,
  Victory,
  OkHand,
  PointUp,
  PointDown,
  PointLeft,
  PointRight,
  RaisedHand,
  Vulcan,
  CrossedFingers,
  LoveYou,
  CallMe,
  Metal,
  Horns,
  SignOfTheHorns,
  MiddleFinger,
  IndexPointingUp,
  BackhandIndexPointingUp,
  BackhandIndexPointingDown,
  BackhandIndexPointingLeft,
  BackhandIndexPointingRight,
  IndexPointingUp,
  IndexPointingDown,
  IndexPointingLeft,
  IndexPointingRight,
  Fist,
  FistLeft,
  FistRight,
  FistOncoming,
  FistRaised,
  FistLeft as FistLeftIcon,
  FistRight as FistRightIcon,
  FistOncoming as FistOncomingIcon,
  FistRaised as FistRaisedIcon,
  OpenHands,
  OpenHands as OpenHandsIcon,
  RaisedHands,
  RaisedHands as RaisedHandsIcon,
  ClappingHands,
  ClappingHands as ClappingHandsIcon,
  Handshake,
  Handshake as HandshakeIcon,
  FoldedHands,
  FoldedHands as FoldedHandsIcon,
  WritingHand,
  WritingHand as WritingHandIcon,
  NailPolish,
  NailPolish as NailPolishIcon,
  Selfie,
  Selfie as SelfieIcon,
  Muscle,
  Muscle as MuscleIcon,
  FlexedBiceps,
  FlexedBiceps as FlexedBicepsIcon,
  Leg,
  Leg as LegIcon,
  Foot,
  Foot as FootIcon,
  Ear,
  Ear as EarIcon,
  Nose,
  Nose as NoseIcon,
  Tongue,
  Tongue as TongueIcon,
  Mouth,
  Mouth as MouthIcon,
  Baby,
  Baby as BabyIcon,
  Child,
  Child as ChildIcon,
  Boy,
  Boy as BoyIcon,
  Girl,
  Girl as GirlIcon,
  Adult,
  Adult as AdultIcon,
  OlderAdult,
  OlderAdult as OlderAdultIcon,
  OlderPerson,
  OlderPerson as OlderPersonIcon,
  PersonWithWhiteCane,
  PersonWithWhiteCane as PersonWithWhiteCaneIcon,
  PersonInMotorizedWheelchair,
  PersonInMotorizedWheelchair as PersonInMotorizedWheelchairIcon,
  PersonInManualWheelchair,
  PersonInManualWheelchair as PersonInManualWheelchairIcon,
  PersonRunning,
  PersonRunning as PersonRunningIcon,
  PersonWalking,
  PersonWalking as PersonWalkingIcon,
  PersonStanding,
  PersonStanding as PersonStandingIcon,
  PersonKneeling,
  PersonKneeling as PersonKneelingIcon,
  PersonWithProbingCane,
  PersonWithProbingCane as PersonWithProbingCaneIcon,
  DeafPerson,
  DeafPerson as DeafPersonIcon,
  PersonWithSkullcap,
  PersonWithSkullcap as PersonWithSkullcapIcon,
  WomanWithHeadscarf,
  WomanWithHeadscarf as WomanWithHeadscarfIcon,
  PersonInTuxedo,
  PersonInTuxedo as PersonInTuxedoIcon,
  PersonWithVeil,
  PersonWithVeil as PersonWithVeilIcon,
  PregnantWoman,
  PregnantWoman as PregnantWomanIcon,
  BreastFeeding,
  BreastFeeding as BreastFeedingIcon,
  WomanFeedingBaby,
  WomanFeedingBaby as WomanFeedingBabyIcon,
  PersonFeedingBaby,
  PersonFeedingBaby as PersonFeedingBabyIcon,
  Angel,
  Angel as AngelIcon,
  Santa,
  Santa as SantaIcon,
  MrsClaus,
  MrsClaus as MrsClausIcon,
  MxClaus,
  MxClaus as MxClausIcon,
  Superhero,
  Superhero as SuperheroIcon,
  Supervillain,
  Supervillain as SupervillainIcon,
  Mage,
  Mage as MageIcon,
  Fairy,
  Fairy as FairyIcon,
  Vampire,
  Vampire as VampireIcon,
  Merperson,
  Merperson as MerpersonIcon,
  Elf,
  Elf as ElfIcon,
  Genie,
  Genie as GenieIcon,
  Zombie,
  Zombie as ZombieIcon,
  PersonGettingMassage,
  PersonGettingMassage as PersonGettingMassageIcon,
  PersonGettingHaircut,
  PersonGettingHaircut as PersonGettingHaircutIcon,
  PersonWalking,
  PersonWalking as PersonWalkingIcon,
  PersonStanding,
  PersonStanding as PersonStandingIcon,
  PersonKneeling,
  PersonKneeling as PersonKneelingIcon,
  PersonWithProbingCane,
  PersonWithProbingCane as PersonWithProbingCaneIcon,
  DeafPerson,
  DeafPerson as DeafPersonIcon,
  PersonWithSkullcap,
  PersonWithSkullcap as PersonWithSkullcapIcon,
  WomanWithHeadscarf,
  WomanWithHeadscarf as WomanWithHeadscarfIcon,
  PersonInTuxedo,
  PersonInTuxedo as PersonInTuxedoIcon,
  PersonWithVeil,
  PersonWithVeil as PersonWithVeilIcon,
  PregnantWoman,
  PregnantWoman as PregnantWomanIcon,
  BreastFeeding,
  BreastFeeding as BreastFeedingIcon,
  WomanFeedingBaby,
  WomanFeedingBaby as WomanFeedingBabyIcon,
  PersonFeedingBaby,
  PersonFeedingBaby as PersonFeedingBabyIcon,
  Angel,
  Angel as AngelIcon,
  Santa,
  Santa as SantaIcon,
  MrsClaus,
  MrsClaus as MrsClausIcon,
  MxClaus,
  MxClaus as MxClausIcon,
  Superhero,
  Superhero as SuperheroIcon,
  Supervillain,
  Supervillain as SupervillainIcon,
  Mage,
  Mage as MageIcon,
  Fairy,
  Fairy as FairyIcon,
  Vampire,
  Vampire as VampireIcon,
  Merperson,
  Merperson as MerpersonIcon,
  Elf,
  Elf as ElfIcon,
  Genie,
  Genie as GenieIcon,
  Zombie,
  Zombie as ZombieIcon,
  PersonGettingMassage,
  PersonGettingMassage as PersonGettingMassageIcon,
  PersonGettingHaircut,
  PersonGettingHaircut as PersonGettingHaircutIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { initializeWebPush } from '../../utils/webPush';

const HomePage = () => {
  const { setCurrentPage, user, users } = useAppContext();
  const { isDarkMode } = useTheme();
  const [showInstructions, setShowInstructions] = useState(false);
  
  const handlePageNavigation = (page) => {
    const pageRoutes = {
      'projects': '/projects',
      'goals': '/goals', 
      'documents': '/documents',
      'meeting-notes': '/meeting-notes',
      'notepad': '/notepad',
      'users': '/users'
    };
    
    const route = pageRoutes[page] || `/${page}`;
    window.location.href = route;
  };

  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalGoals: 0,
    completedGoals: 0,
    totalDocuments: 0,
    totalMeetings: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch projects
        const projectsResponse = await fetch('http://localhost:5000/api/projects', {
          headers: { 'x-auth-token': token }
        });
        const projects = projectsResponse.ok ? await projectsResponse.json() : [];

        // Fetch goals
        const goalsResponse = await fetch('http://localhost:5000/api/goals', {
          headers: { 'x-auth-token': token }
        });
        const goals = goalsResponse.ok ? await goalsResponse.json() : [];

        // Fetch documents
        const documentsResponse = await fetch('http://localhost:5000/api/documents', {
          headers: { 'x-auth-token': token }
        });
        const documents = documentsResponse.ok ? await documentsResponse.json() : [];

        // Fetch meeting notes
        const meetingsResponse = await fetch('http://localhost:5000/api/meetings', {
          headers: { 'x-auth-token': token }
        });
        const meetings = meetingsResponse.ok ? await meetingsResponse.json() : [];

        setStats({
          totalProjects: projects.length,
          completedProjects: projects.filter(p => p.status === 'Done').length,
          totalGoals: goals.length,
          completedGoals: goals.filter(g => g.status === 'Done').length,
          totalDocuments: documents.length,
          totalMeetings: meetings.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (user) {
      fetchStats();
    }
    initializeWebPush();
  }, [user]);

  const getProgressPercentage = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const managers = users.filter(u => u.role === 'manager');
  const regularUsers = users.filter(u => u.role === 'user');

  return (
    <div className={`min-h-screen p-8 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className={`text-5xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className={`text-xl ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Projects', value: stats.totalProjects, icon: ProjectsIcon, gradient: 'from-blue-500 to-blue-600' },
            { label: 'Completed', value: stats.completedProjects, icon: CheckCircle, gradient: 'from-green-500 to-green-600' },
            { label: 'In Progress', value: stats.totalProjects - stats.completedProjects, icon: Clock, gradient: 'from-orange-500 to-orange-600' },
            { label: 'Documents', value: stats.totalDocuments, icon: DocumentsIcon, gradient: 'from-purple-500 to-purple-600' }
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className={`p-8 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className={`text-4xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{stat.value}</p>
                <p className={`text-lg font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className={`text-3xl font-bold mb-8 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'New Project', icon: Plus, page: 'projects', gradient: 'from-blue-500 to-indigo-600' },
              { label: 'View Reports', icon: BarChart3, page: 'reports', gradient: 'from-green-500 to-emerald-600' },
              { label: 'Create Note', icon: FileText, page: 'notepad', gradient: 'from-purple-500 to-violet-600' }
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => handlePageNavigation(action.page)}
                className={`group p-8 rounded-2xl bg-gradient-to-r ${action.gradient} text-white font-bold text-xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
              >
                <div className="flex items-center justify-center gap-4">
                  <action.icon className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                  {action.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects Overview */}
          <div 
            onClick={() => handlePageNavigation('projects')}
            className={`group p-8 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
            } shadow-xl`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                  <ProjectsIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Projects</h3>
              </div>
              <ArrowRight className={`w-6 h-6 group-hover:translate-x-2 transition-transform duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={`text-lg ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Total Projects</span>
                <span className={`text-3xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{stats.totalProjects}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-lg ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Completed</span>
                <span className={`text-3xl font-bold text-green-500`}>{stats.completedProjects}</span>
              </div>
              <div className={`w-full h-3 rounded-full ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${getProgressPercentage(stats.completedProjects, stats.totalProjects)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Documents Overview */}
          <div 
            onClick={() => handlePageNavigation('documents')}
            className={`group p-8 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
            } shadow-xl`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 shadow-lg">
                  <DocumentsIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Documents</h3>
              </div>
              <ArrowRight className={`w-6 h-6 group-hover:translate-x-2 transition-transform duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-center">
              <p className={`text-6xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-transparent`}>
                {stats.totalDocuments}
              </p>
              <p className={`text-xl ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Files stored</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;