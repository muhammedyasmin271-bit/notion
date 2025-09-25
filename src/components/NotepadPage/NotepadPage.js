import React, { useState, useEffect, useRef } from 'react';
import {
	Plus,
	GripVertical,
	Save,
	Share2,
	Download,
	FileText,
	Hash,
	Type,
	List,
	CheckSquare,
	Quote,
	Minus,
	Lightbulb,
	Image,
	Video,
	File,
	Bookmark,
	Code,
	Calendar,
	Table,
	Clipboard,
	Star,
	Archive,
	Trash2,
	Search,
	Filter,
	User,
	Users,
	Eye,
	Edit3,
	X,
	ChevronDown,
	ChevronUp,
	ChevronRight,
	Bold,
	Italic,
	Underline,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Link,
	MoreHorizontal,
	Grid,
	BookOpen,
	Tag,
	Clock,
	Folder,
	Lock,
	Globe,
	UserCheck,
	UserX,
	Copy,
	Move,
	ExternalLink,
	Heart,
	MessageSquare,
	Flag,
	Paperclip,
	AtSign,
	Hash as HashIcon,
	AlertTriangle,
	GraduationCap
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { get, post, put, deleteRequest } from '../../services/api';
import { addNotification } from '../../utils/notifications';
import RoleGuard from '../common/RoleGuard';

const NotepadPage = () => {
	const { user, canCreateNotepad, canShareContent } = useAppContext();
	const { isDarkMode } = useTheme();
	const [notes, setNotes] = useState([]);
	const [currentNote, setCurrentNote] = useState(null);
	const [blocks, setBlocks] = useState([{ id: 'block-1', type: 'text', content: '' }]);
	const [title, setTitle] = useState('');
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [showFormattingMenu, setShowFormattingMenu] = useState(null);
	const [formattingMenuPosition, setFormattingMenuPosition] = useState({ x: 0, y: 0 }); // Track menu position
	const [showTemplates, setShowTemplates] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState('list'); // list, grid
	const [selectedNote, setSelectedNote] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeBlockId, setActiveBlockId] = useState(null);
	const [showShareModal, setShowShareModal] = useState(false);
	const [shareSettings, setShareSettings] = useState({
		shareType: 'private',
		sharedWith: []
	});
	const [showBlockMenu, setShowBlockMenu] = useState(null); // For the 6-dot menu
	const [favorites, setFavorites] = useState([]);
	const [tags, setTags] = useState([]);
	const [selectedTag, setSelectedTag] = useState('all');
	const [showTagModal, setShowTagModal] = useState(false);
	const [newTag, setNewTag] = useState('');
	const [availableUsers, setAvailableUsers] = useState([]);
	const [shareInput, setShareInput] = useState('');
	const [lastSaved, setLastSaved] = useState(null);

	const titleInputRef = useRef(null);
	const formattingMenuRef = useRef(null);
	const blockMenuRef = useRef(null);
	const blockRefs = useRef({});

	// Load notes
	useEffect(() => {
		const fetchNotes = async () => {
			setLoading(true);
			setError(null);
			try {
				const data = await get('/notepad');
				setNotes(data);

				// Extract unique tags
				const allTags = [...new Set(data.flatMap(note => note.tags || []))];
				setTags(allTags);

				// Fetch available users for sharing
				try {
					const usersData = await get('/users');
					console.log('Fetched users:', usersData);
					const filteredUsers = Array.isArray(usersData) ? usersData.filter(u => u._id !== user?.id) : [];
					setAvailableUsers(filteredUsers);
				} catch (err) {
					console.error('Error fetching users:', err);
					// Fallback: try alternative endpoint
					try {
						const altUsersData = await get('/auth/users');
						console.log('Fetched users from alt endpoint:', altUsersData);
						const altFilteredUsers = Array.isArray(altUsersData) ? altUsersData.filter(u => u._id !== user?.id) : [];
						setAvailableUsers(altFilteredUsers);
					} catch (altErr) {
						console.error('Error fetching users from alternative endpoint:', altErr);
					}
				}
			} catch (err) {
				console.error('Error fetching notes:', err);
				setError('Failed to load notes');
			} finally {
				setLoading(false);
			}
		};

		fetchNotes();
	}, []);

	// Focus title input when editing
	useEffect(() => {
		if (isEditingTitle && titleInputRef.current) {
			titleInputRef.current.focus();
		}
	}, [isEditingTitle]);

	// Handle click outside formatting menu
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (formattingMenuRef.current && !formattingMenuRef.current.contains(event.target)) {
				setShowFormattingMenu(null);
			}
			if (blockMenuRef.current && !blockMenuRef.current.contains(event.target)) {
				setShowBlockMenu(null);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Create new note
	const createNewNote = async () => {
		try {
			const newNote = {
				title: 'Untitled',
				content: '',
				blocks: [{ id: 'block-1', type: 'text', text: '', checked: false, indent: 0, focus: false, metadata: {} }],
				category: 'General',
				tags: [],
				isPublic: false
			};

			const response = await post('/notepad', newNote);
			setNotes(prev => [response, ...prev]);
			setCurrentNote(response);
			setTitle(response.title);
			// Convert backend blocks to frontend format
			const convertedBlocks = (response.blocks || []).map(block => ({
				id: block.id,
				type: block.type || 'text',
				content: block.text || '',
				checked: block.checked || false,
				indent: block.indent || 0,
				focus: block.focus || false,
				metadata: block.metadata || {}
			}));
			setBlocks(convertedBlocks.length > 0 ? convertedBlocks : [{ id: 'block-1', type: 'text', content: '' }]);
			setSelectedNote(response._id);

			// Update tags
			if (response.tags) {
				setTags(prev => [...new Set([...prev, ...response.tags])]);
			}
		} catch (err) {
			console.error('Error creating note:', err);
			addNotification({
				type: 'error',
				title: 'Error',
				message: 'Failed to create new note'
			});
		}
	};

	// Save note with complete detailed structure
	const saveNote = async () => {
		if (!currentNote) return;

		try {
			// Generate unique save code
			const saveCode = `NOTE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			
			// Process each block with complete details - match backend schema
			const processedBlocks = blocks.map((block, index) => {
				const blockContent = block.content || '';
				const lines = blockContent.split('\n');
				
				return {
					id: block.id,
					type: block.type || 'text',
					text: blockContent, // Use 'text' instead of 'content' to match backend schema
					checked: block.type === 'todo' ? false : undefined, // Only for todo blocks
					indent: 0, // Default indent
					focus: false, // Default focus
					metadata: {}, // Default metadata
					lines: lines,
					lineCount: lines.length,
					wordCount: blockContent.split(/\s+/).filter(word => word.length > 0).length,
					characterCount: blockContent.length,
					position: index,
					isEmpty: blockContent.trim() === '',
					createdAt: block.createdAt || new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
			});
			
			// Convert all content to string with line preservation
			const fullContent = processedBlocks.map(block => block.text).join('\n');
			const allLines = fullContent.split('\n');
			
			// Calculate comprehensive statistics
			const stats = {
				totalLines: allLines.length,
				nonEmptyLines: allLines.filter(line => line.trim() !== '').length,
				emptyLines: allLines.filter(line => line.trim() === '').length,
				totalWords: fullContent.split(/\s+/).filter(word => word.length > 0).length,
				totalCharacters: fullContent.length,
				totalCharactersNoSpaces: fullContent.replace(/\s/g, '').length,
				totalBlocks: processedBlocks.length,
				nonEmptyBlocks: processedBlocks.filter(block => !block.isEmpty).length,
				emptyBlocks: processedBlocks.filter(block => block.isEmpty).length
			};
			
			// Complete detailed note structure - send only fields that match backend schema
			const updatedNote = {
				...currentNote,
				title: title || 'Untitled',
				blocks: processedBlocks,
				content: fullContent,
				category: currentNote.category || 'General',
				tags: currentNote.tags || [],
				isPublic: currentNote.isPublic || false,
				// Remove extra fields that aren't in backend schema
				lines: undefined,
				stats: undefined,
				saveCode: undefined,
				lastModified: undefined,
				saveTimestamp: undefined,
				createdBy: undefined,
				createdByName: undefined,
				userRole: undefined,
				sharedWith: undefined,
				shareType: undefined,
				version: undefined,
				editHistory: undefined
			};

			console.log('Saving complete note structure:', {
				saveCode,
				stats,
				blockDetails: processedBlocks,
				fullNote: updatedNote
			});
			
			const response = await put(`/notepad/${currentNote._id}`, updatedNote);
			
			// Update local state
			setNotes(prev => prev.map(note =>
				note._id === currentNote._id ? response : note
			));
			setCurrentNote(response);
			setLastSaved(new Date()); // Update save timestamp

			console.log('Note saved successfully with complete details:', response.saveCode);
			addNotification({
				type: 'success',
				title: 'Saved',
				message: 'Note saved successfully with all details'
			});
		} catch (err) {
			console.error('Error saving note:', err);
			addNotification({
				type: 'error',
				title: 'Save Error',
				message: 'Failed to save note: ' + err.message
			});
		}
	};

	// Delete note
	const deleteNote = async (noteId) => {
		if (!window.confirm('Are you sure you want to delete this note?')) return;

		try {
			await deleteRequest(`/notepad/${noteId}`);
			setNotes(prev => prev.filter(note => note._id !== noteId));
			if (currentNote?._id === noteId) {
				setCurrentNote(null);
				setTitle('');
				setBlocks([{ id: 'block-1', type: 'text', content: '' }]);
			}
			addNotification({
				type: 'success',
				title: 'Deleted',
				message: 'Note deleted successfully'
			});
		} catch (err) {
			console.error('Error deleting note:', err);
			addNotification({
				type: 'error',
				title: 'Error',
				message: 'Failed to delete note'
			});
		}
	};

	// Select note
	const selectNote = (note) => {
		setCurrentNote(note);
		setTitle(note.title);
		// Convert backend blocks to frontend format
		const convertedBlocks = (note.blocks || []).map(block => ({
			id: block.id,
			type: block.type || 'text',
			content: block.text || '', // Convert 'text' to 'content' for frontend
			checked: block.checked || false,
			indent: block.indent || 0,
			focus: block.focus || false,
			metadata: block.metadata || {}
		}));
		setBlocks(convertedBlocks.length > 0 ? convertedBlocks : [{ id: 'block-1', type: 'text', content: '' }]);
		setSelectedNote(note._id);
	};

	// Add new block
	const addBlock = (index, type = 'text') => {
		const newBlock = {
			id: `block-${Date.now()}`,
			type,
			content: ''
		};

		const newBlocks = [...blocks];
		newBlocks.splice(index + 1, 0, newBlock);
		setBlocks(newBlocks);
		setActiveBlockId(newBlock.id);

		// Focus the new block after a short delay
		setTimeout(() => {
			if (blockRefs.current[newBlock.id]) {
				blockRefs.current[newBlock.id].focus();
			}
		}, 10);
	};

	// Update block content
	const updateBlock = (id, content) => {
		setBlocks(prev => prev.map(block =>
			block.id === id ? { ...block, content } : block
		));
	};

	// Delete block
	const deleteBlock = (id) => {
		if (blocks.length <= 1) return;

		setBlocks(prev => prev.filter(block => block.id !== id));
	};

	// Change block type
	const changeBlockType = (id, type) => {
		setBlocks(prev => prev.map(block =>
			block.id === id ? { ...block, type } : block
		));
		setShowFormattingMenu(null);
	};

	// Duplicate block
	const duplicateBlock = (id) => {
		const blockIndex = blocks.findIndex(block => block.id === id);
		if (blockIndex === -1) return;

		const blockToDuplicate = blocks[blockIndex];
		const newBlock = {
			...blockToDuplicate,
			id: `block-${Date.now()}`,
			content: blockToDuplicate.content
		};

		const newBlocks = [...blocks];
		newBlocks.splice(blockIndex + 1, 0, newBlock);
		setBlocks(newBlocks);
		setShowBlockMenu(null);
	};

	// Move block up
	const moveBlockUp = (id) => {
		const blockIndex = blocks.findIndex(block => block.id === id);
		if (blockIndex <= 0) return;

		const newBlocks = [...blocks];
		[newBlocks[blockIndex - 1], newBlocks[blockIndex]] = [newBlocks[blockIndex], newBlocks[blockIndex - 1]];
		setBlocks(newBlocks);
		setShowBlockMenu(null);
	};

	// Move block down
	const moveBlockDown = (id) => {
		const blockIndex = blocks.findIndex(block => block.id === id);
		if (blockIndex === -1 || blockIndex === blocks.length - 1) return;

		const newBlocks = [...blocks];
		[newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
		setBlocks(newBlocks);
		setShowBlockMenu(null);
	};

	// Handle key down in block
	const handleBlockKeyDown = (id, e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			const currentIndex = blocks.findIndex(block => block.id === id);
			const currentBlock = blocks[currentIndex];
			
			// Continue list types
			if (currentBlock.type === 'bulleted' || currentBlock.type === 'numbered' || currentBlock.type === 'todo') {
				addBlock(currentIndex, currentBlock.type);
			} else {
				addBlock(currentIndex);
			}
		} else if (e.key === 'Backspace' && e.target.value === '') {
			e.preventDefault();
			const currentIndex = blocks.findIndex(block => block.id === id);
			if (blocks.length > 1 && currentIndex > 0) {
				// Focus previous block before deleting current one
				const prevBlock = blocks[currentIndex - 1];
				setTimeout(() => {
					if (blockRefs.current[prevBlock.id]) {
						blockRefs.current[prevBlock.id].focus();
						// Move cursor to end of previous block
						const element = blockRefs.current[prevBlock.id];
						if (element.setSelectionRange) {
							element.setSelectionRange(element.value.length, element.value.length);
						}
					}
				}, 0);
			}
			deleteBlock(id);
		} else if (e.key === '/' || e.key === '+') {
			e.preventDefault();
			setActiveBlockId(id);
			// Position menu at the end of the current block for slash command
			if (e.key === '/') {
				const blockElement = blockRefs.current[id];
				if (blockElement) {
					const rect = blockElement.getBoundingClientRect();
					setFormattingMenuPosition({ x: rect.left, y: rect.bottom });
				}
				setShowFormattingMenu(id);
			}
		}
	};

	// Handle click on plus button to show formatting menu
	const handlePlusButtonClick = (e, blockId) => {
		e.stopPropagation();
		setActiveBlockId(blockId);

		// Get the position of the clicked plus button
		const rect = e.target.getBoundingClientRect();
		setFormattingMenuPosition({ x: rect.left, y: rect.bottom });

		// Toggle the menu for this block
		setShowFormattingMenu(showFormattingMenu === blockId ? null : blockId);
	};

	// Handle key down in title
	const handleTitleKeyDown = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			setIsEditingTitle(false);
			saveNote();
		}
	};

	// Apply formatting to selected text
	const applyFormatting = (format) => {
		const block = blocks.find(b => b.id === activeBlockId);
		if (!block) return;

		const blockIndex = blocks.findIndex(b => b.id === activeBlockId);

		switch (format) {
			case 'text':
				changeBlockType(activeBlockId, 'text');
				break;
			case 'h1':
				changeBlockType(activeBlockId, 'h1');
				break;
			case 'h2':
				changeBlockType(activeBlockId, 'h2');
				break;
			case 'h3':
				changeBlockType(activeBlockId, 'h3');
				break;
			case 'bulleted':
				changeBlockType(activeBlockId, 'bulleted');
				break;
			case 'numbered':
				changeBlockType(activeBlockId, 'numbered');
				break;
			case 'todo':
				changeBlockType(activeBlockId, 'todo');
				break;
			case 'quote':
				changeBlockType(activeBlockId, 'quote');
				break;
			case 'divider':
				addBlock(blockIndex, 'divider');
				break;
			case 'callout':
				changeBlockType(activeBlockId, 'callout');
				break;
			case 'code':
				changeBlockType(activeBlockId, 'code');
				break;
			case 'table':
				addBlock(blockIndex, 'table');
				break;
			case 'image':
				addBlock(blockIndex, 'image');
				break;
			case 'video':
				addBlock(blockIndex, 'video');
				break;
			case 'link':
				addBlock(blockIndex, 'link');
				break;
			default:
				break;
		}

		// Close the formatting menu
		setShowFormattingMenu(null);
	};

	// Template blocks
	const templates = [
		{
			name: 'Meeting Notes',
			description: 'Capture key points from your meetings',
			icon: <Users className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Meeting Notes' },
				{ id: 'block-2', type: 'text', content: 'Date: ' + new Date().toLocaleDateString() },
				{ id: 'block-3', type: 'text', content: 'Time: ' + new Date().toLocaleTimeString() },
				{ id: 'block-4', type: 'text', content: 'Location: ' },
				{ id: 'block-5', type: 'text', content: 'Meeting Type: ' },
				{ id: 'block-6', type: 'h2', content: 'Attendees' },
				{ id: 'block-7', type: 'bulleted', content: 'Present: ' },
				{ id: 'block-8', type: 'bulleted', content: 'Absent: ' },
				{ id: 'block-9', type: 'h2', content: 'Agenda Items' },
				{ id: 'block-10', type: 'numbered', content: 'Review previous meeting minutes' },
				{ id: 'block-11', type: 'numbered', content: 'Discuss current project status' },
				{ id: 'block-12', type: 'numbered', content: 'Address outstanding issues' },
				{ id: 'block-13', type: 'numbered', content: 'Plan next steps' },
				{ id: 'block-14', type: 'h2', content: 'Discussion Points' },
				{ id: 'block-15', type: 'text', content: '' },
				{ id: 'block-16', type: 'h2', content: 'Decisions Made' },
				{ id: 'block-17', type: 'bulleted', content: '' },
				{ id: 'block-18', type: 'h2', content: 'Action Items' },
				{ id: 'block-19', type: 'todo', content: 'Task 1 - Assigned to: [Name] - Due: [Date]' },
				{ id: 'block-20', type: 'todo', content: 'Task 2 - Assigned to: [Name] - Due: [Date]' },
				{ id: 'block-21', type: 'h2', content: 'Next Meeting' },
				{ id: 'block-22', type: 'text', content: 'Date: ' },
				{ id: 'block-23', type: 'text', content: 'Time: ' },
				{ id: 'block-24', type: 'text', content: 'Location: ' }
			]
		},
		{
			name: 'Project Plan',
			description: 'Comprehensive project planning template',
			icon: <Folder className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Project Plan' },
				{ id: 'block-2', type: 'text', content: 'Project Name: ' },
				{ id: 'block-3', type: 'text', content: 'Project Manager: ' },
				{ id: 'block-4', type: 'text', content: 'Start Date: ' },
				{ id: 'block-5', type: 'text', content: 'End Date: ' },
				{ id: 'block-6', type: 'text', content: 'Budget: ' },
				{ id: 'block-7', type: 'h2', content: 'Project Overview' },
				{ id: 'block-8', type: 'text', content: 'Brief description of the project and its purpose.' },
				{ id: 'block-9', type: 'h2', content: 'Objectives' },
				{ id: 'block-10', type: 'bulleted', content: 'Primary objective 1' },
				{ id: 'block-11', type: 'bulleted', content: 'Primary objective 2' },
				{ id: 'block-12', type: 'bulleted', content: 'Secondary objective 1' },
				{ id: 'block-13', type: 'h2', content: 'Scope' },
				{ id: 'block-14', type: 'text', content: 'What is included in this project:' },
				{ id: 'block-15', type: 'bulleted', content: '' },
				{ id: 'block-16', type: 'text', content: 'What is NOT included in this project:' },
				{ id: 'block-17', type: 'bulleted', content: '' },
				{ id: 'block-18', type: 'h2', content: 'Team Members' },
				{ id: 'block-19', type: 'bulleted', content: 'Team Member 1 - Role' },
				{ id: 'block-20', type: 'bulleted', content: 'Team Member 2 - Role' },
				{ id: 'block-21', type: 'h2', content: 'Milestones' },
				{ id: 'block-22', type: 'todo', content: 'Milestone 1 - Due: [Date]' },
				{ id: 'block-23', type: 'todo', content: 'Milestone 2 - Due: [Date]' },
				{ id: 'block-24', type: 'todo', content: 'Milestone 3 - Due: [Date]' },
				{ id: 'block-25', type: 'h2', content: 'Risks & Mitigation' },
				{ id: 'block-26', type: 'bulleted', content: 'Risk 1: [Description] - Mitigation: [Strategy]' },
				{ id: 'block-27', type: 'bulleted', content: 'Risk 2: [Description] - Mitigation: [Strategy]' },
				{ id: 'block-28', type: 'h2', content: 'Success Criteria' },
				{ id: 'block-29', type: 'numbered', content: 'Criteria 1' },
				{ id: 'block-30', type: 'numbered', content: 'Criteria 2' }
			]
		},
		{
			name: 'Daily Journal',
			description: 'Reflect on your day and thoughts',
			icon: <BookOpen className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Daily Journal' },
				{ id: 'block-2', type: 'text', content: new Date().toLocaleDateString() },
				{ id: 'block-3', type: 'h2', content: 'Today I am grateful for:' },
				{ id: 'block-4', type: 'bulleted', content: '' },
				{ id: 'block-5', type: 'h2', content: 'What happened today:' },
				{ id: 'block-6', type: 'text', content: '' },
				{ id: 'block-7', type: 'h2', content: 'Tomorrow I will:' },
				{ id: 'block-8', type: 'todo', content: '' }
			]
		},
		{
			name: 'Research Notes',
			description: 'Organize research findings and sources',
			icon: <Search className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Research Notes' },
				{ id: 'block-2', type: 'text', content: 'Topic: ' },
				{ id: 'block-3', type: 'h2', content: 'Key Findings' },
				{ id: 'block-4', type: 'bulleted', content: '' },
				{ id: 'block-5', type: 'h2', content: 'Sources' },
				{ id: 'block-6', type: 'numbered', content: '' },
				{ id: 'block-7', type: 'h2', content: 'Next Steps' },
				{ id: 'block-8', type: 'todo', content: '' }
			]
		},
		{
			name: 'Recipe',
			description: 'Document cooking recipes and instructions',
			icon: <BookOpen className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Recipe Name' },
				{ id: 'block-2', type: 'text', content: 'Prep Time: | Cook Time: | Serves: ' },
				{ id: 'block-3', type: 'h2', content: 'Ingredients' },
				{ id: 'block-4', type: 'bulleted', content: '' },
				{ id: 'block-5', type: 'h2', content: 'Instructions' },
				{ id: 'block-6', type: 'numbered', content: '' },
				{ id: 'block-7', type: 'h2', content: 'Notes' },
				{ id: 'block-8', type: 'text', content: '' }
			]
		},
		{
			name: 'Travel Itinerary',
			description: 'Plan your trips and travel schedule',
			icon: <Calendar className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Travel Itinerary' },
				{ id: 'block-2', type: 'text', content: 'Destination: ' },
				{ id: 'block-3', type: 'text', content: 'Dates: ' },
				{ id: 'block-4', type: 'h2', content: 'Day 1' },
				{ id: 'block-5', type: 'bulleted', content: '' },
				{ id: 'block-6', type: 'h2', content: 'Day 2' },
				{ id: 'block-7', type: 'bulleted', content: '' },
				{ id: 'block-8', type: 'h2', content: 'Packing List' },
				{ id: 'block-9', type: 'todo', content: '' }
			]
		},
		{
			name: 'Book Summary',
			description: 'Summarize key points from a book',
			icon: <BookOpen className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Book Summary' },
				{ id: 'block-2', type: 'text', content: 'Book Title: ' },
				{ id: 'block-3', type: 'text', content: 'Author: ' },
				{ id: 'block-4', type: 'h2', content: 'Key Takeaways' },
				{ id: 'block-5', type: 'bulleted', content: '' },
				{ id: 'block-6', type: 'h2', content: 'Important Quotes' },
				{ id: 'block-7', type: 'quote', content: '' }
			]
		},
		{
			name: 'Bug Report',
			description: 'Document software bugs and issues',
			icon: <AlertTriangle className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Bug Report' },
				{ id: 'block-2', type: 'text', content: 'Date: ' + new Date().toLocaleDateString() },
				{ id: 'block-3', type: 'h2', content: 'Description' },
				{ id: 'block-4', type: 'text', content: '' },
				{ id: 'block-5', type: 'h2', content: 'Steps to Reproduce' },
				{ id: 'block-6', type: 'numbered', content: '' },
				{ id: 'block-7', type: 'h2', content: 'Expected vs Actual Result' },
				{ id: 'block-8', type: 'text', content: 'Expected: ' },
				{ id: 'block-9', type: 'text', content: 'Actual: ' }
			]
		},
		{
			name: 'Class Notes',
			description: 'Take structured notes during lectures',
			icon: <GraduationCap className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Class Notes' },
				{ id: 'block-2', type: 'text', content: 'Subject: ' },
				{ id: 'block-3', type: 'text', content: 'Date: ' + new Date().toLocaleDateString() },
				{ id: 'block-4', type: 'h2', content: 'Key Topics' },
				{ id: 'block-5', type: 'bulleted', content: '' },
				{ id: 'block-6', type: 'h2', content: 'Important Concepts' },
				{ id: 'block-7', type: 'text', content: '' },
				{ id: 'block-8', type: 'h2', content: 'Questions/Review' },
				{ id: 'block-9', type: 'todo', content: '' }
			]
		},
		{
			name: 'Weekly Report',
			description: 'Comprehensive weekly status report',
			icon: <Calendar className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Weekly Report' },
				{ id: 'block-2', type: 'text', content: 'Week of: ' + new Date().toLocaleDateString() },
				{ id: 'block-3', type: 'text', content: 'Reported by: ' },
				{ id: 'block-4', type: 'text', content: 'Department/Team: ' },
				{ id: 'block-5', type: 'h2', content: 'Key Accomplishments' },
				{ id: 'block-6', type: 'bulleted', content: 'Completed project milestone X' },
				{ id: 'block-7', type: 'bulleted', content: 'Resolved critical issue Y' },
				{ id: 'block-8', type: 'bulleted', content: 'Delivered feature Z on schedule' },
				{ id: 'block-9', type: 'h2', content: 'Metrics & KPIs' },
				{ id: 'block-10', type: 'text', content: 'Tasks Completed: [Number]' },
				{ id: 'block-11', type: 'text', content: 'Goals Met: [Percentage]%' },
				{ id: 'block-12', type: 'text', content: 'Customer Satisfaction: [Score]' },
				{ id: 'block-13', type: 'h2', content: 'Challenges & Blockers' },
				{ id: 'block-14', type: 'bulleted', content: 'Challenge 1: [Description] - Status: [In Progress/Resolved]' },
				{ id: 'block-15', type: 'bulleted', content: 'Challenge 2: [Description] - Status: [In Progress/Resolved]' },
				{ id: 'block-16', type: 'h2', content: 'Next Week Priorities' },
				{ id: 'block-17', type: 'todo', content: 'Priority 1 - Due: [Date]' },
				{ id: 'block-18', type: 'todo', content: 'Priority 2 - Due: [Date]' },
				{ id: 'block-19', type: 'todo', content: 'Priority 3 - Due: [Date]' },
				{ id: 'block-20', type: 'h2', content: 'Resource Needs' },
				{ id: 'block-21', type: 'bulleted', content: 'Additional team members needed for [Project]' },
				{ id: 'block-22', type: 'bulleted', content: 'Budget approval required for [Item]' },
				{ id: 'block-23', type: 'h2', content: 'Team Updates' },
				{ id: 'block-24', type: 'text', content: 'New team members, departures, role changes, etc.' }
			]
		},
		{
			name: 'Product Requirements',
			description: 'Detailed product requirements document',
			icon: <File className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Product Requirements Document' },
				{ id: 'block-2', type: 'text', content: 'Product Name: ' },
				{ id: 'block-3', type: 'text', content: 'Version: ' },
				{ id: 'block-4', type: 'text', content: 'Date: ' + new Date().toLocaleDateString() },
				{ id: 'block-5', type: 'text', content: 'Product Manager: ' },
				{ id: 'block-6', type: 'h2', content: 'Executive Summary' },
				{ id: 'block-7', type: 'text', content: 'Brief overview of the product and its value proposition.' },
				{ id: 'block-8', type: 'h2', content: 'Problem Statement' },
				{ id: 'block-9', type: 'text', content: 'What problem does this product solve?' },
				{ id: 'block-10', type: 'h2', content: 'Target Audience' },
				{ id: 'block-11', type: 'text', content: 'Primary Users: ' },
				{ id: 'block-12', type: 'text', content: 'Secondary Users: ' },
				{ id: 'block-13', type: 'text', content: 'User Personas: ' },
				{ id: 'block-14', type: 'h2', content: 'Functional Requirements' },
				{ id: 'block-15', type: 'numbered', content: 'User must be able to [action]' },
				{ id: 'block-16', type: 'numbered', content: 'System must support [functionality]' },
				{ id: 'block-17', type: 'numbered', content: 'Product must integrate with [system]' },
				{ id: 'block-18', type: 'h2', content: 'Non-Functional Requirements' },
				{ id: 'block-19', type: 'bulleted', content: 'Performance: [Response time requirements]' },
				{ id: 'block-20', type: 'bulleted', content: 'Security: [Security standards]' },
				{ id: 'block-21', type: 'bulleted', content: 'Scalability: [User capacity]' },
				{ id: 'block-22', type: 'bulleted', content: 'Availability: [Uptime requirements]' },
				{ id: 'block-23', type: 'h2', content: 'User Stories' },
				{ id: 'block-24', type: 'quote', content: 'As a [user type], I want [functionality] so that [benefit]' },
				{ id: 'block-25', type: 'quote', content: 'As a [user type], I want [functionality] so that [benefit]' },
				{ id: 'block-26', type: 'h2', content: 'Success Metrics' },
				{ id: 'block-27', type: 'bulleted', content: 'User adoption rate: [Target]%' },
				{ id: 'block-28', type: 'bulleted', content: 'User satisfaction score: [Target]' },
				{ id: 'block-29', type: 'bulleted', content: 'Performance metric: [Target]' }
			]
		},
		{
			name: 'Event Planning',
			description: 'Complete event planning checklist',
			icon: <Calendar className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Event Planning Checklist' },
				{ id: 'block-2', type: 'text', content: 'Event Name: ' },
				{ id: 'block-3', type: 'text', content: 'Event Date: ' },
				{ id: 'block-4', type: 'text', content: 'Event Time: ' },
				{ id: 'block-5', type: 'text', content: 'Venue: ' },
				{ id: 'block-6', type: 'text', content: 'Expected Attendees: ' },
				{ id: 'block-7', type: 'text', content: 'Budget: ' },
				{ id: 'block-8', type: 'h2', content: '8 Weeks Before' },
				{ id: 'block-9', type: 'todo', content: 'Define event objectives and goals' },
				{ id: 'block-10', type: 'todo', content: 'Set budget and get approval' },
				{ id: 'block-11', type: 'todo', content: 'Book venue and confirm availability' },
				{ id: 'block-12', type: 'todo', content: 'Create guest list' },
				{ id: 'block-13', type: 'h2', content: '6 Weeks Before' },
				{ id: 'block-14', type: 'todo', content: 'Send save-the-date announcements' },
				{ id: 'block-15', type: 'todo', content: 'Book catering services' },
				{ id: 'block-16', type: 'todo', content: 'Arrange transportation if needed' },
				{ id: 'block-17', type: 'todo', content: 'Book entertainment/speakers' },
				{ id: 'block-18', type: 'h2', content: '4 Weeks Before' },
				{ id: 'block-19', type: 'todo', content: 'Send formal invitations' },
				{ id: 'block-20', type: 'todo', content: 'Order decorations and supplies' },
				{ id: 'block-21', type: 'todo', content: 'Confirm all vendors and services' },
				{ id: 'block-22', type: 'todo', content: 'Create event timeline/schedule' },
				{ id: 'block-23', type: 'h2', content: '2 Weeks Before' },
				{ id: 'block-24', type: 'todo', content: 'Confirm RSVPs and final headcount' },
				{ id: 'block-25', type: 'todo', content: 'Finalize seating arrangements' },
				{ id: 'block-26', type: 'todo', content: 'Prepare welcome packets/materials' },
				{ id: 'block-27', type: 'h2', content: '1 Week Before' },
				{ id: 'block-28', type: 'todo', content: 'Final venue walkthrough' },
				{ id: 'block-29', type: 'todo', content: 'Confirm all logistics with team' },
				{ id: 'block-30', type: 'todo', content: 'Prepare contingency plans' },
				{ id: 'block-31', type: 'h2', content: 'Day of Event' },
				{ id: 'block-32', type: 'todo', content: 'Arrive early for setup' },
				{ id: 'block-33', type: 'todo', content: 'Coordinate with vendors' },
				{ id: 'block-34', type: 'todo', content: 'Manage event timeline' },
				{ id: 'block-35', type: 'todo', content: 'Handle any issues that arise' },
				{ id: 'block-36', type: 'h2', content: 'Post-Event' },
				{ id: 'block-37', type: 'todo', content: 'Send thank you messages' },
				{ id: 'block-38', type: 'todo', content: 'Collect feedback from attendees' },
				{ id: 'block-39', type: 'todo', content: 'Review budget and expenses' },
				{ id: 'block-40', type: 'todo', content: 'Document lessons learned' }
			]
		},
		{
			name: 'Job Interview Prep',
			description: 'Comprehensive interview preparation guide',
			icon: <User className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Job Interview Preparation' },
				{ id: 'block-2', type: 'text', content: 'Company: ' },
				{ id: 'block-3', type: 'text', content: 'Position: ' },
				{ id: 'block-4', type: 'text', content: 'Interview Date: ' },
				{ id: 'block-5', type: 'text', content: 'Interview Time: ' },
				{ id: 'block-6', type: 'text', content: 'Interviewer(s): ' },
				{ id: 'block-7', type: 'text', content: 'Interview Format: ' },
				{ id: 'block-8', type: 'h2', content: 'Company Research' },
				{ id: 'block-9', type: 'text', content: 'Company Mission: ' },
				{ id: 'block-10', type: 'text', content: 'Company Values: ' },
				{ id: 'block-11', type: 'text', content: 'Recent News/Updates: ' },
				{ id: 'block-12', type: 'text', content: 'Company Culture: ' },
				{ id: 'block-13', type: 'text', content: 'Key Competitors: ' },
				{ id: 'block-14', type: 'h2', content: 'Role Analysis' },
				{ id: 'block-15', type: 'text', content: 'Key Responsibilities: ' },
				{ id: 'block-16', type: 'text', content: 'Required Skills: ' },
				{ id: 'block-17', type: 'text', content: 'Preferred Qualifications: ' },
				{ id: 'block-18', type: 'text', content: 'Growth Opportunities: ' },
				{ id: 'block-19', type: 'h2', content: 'My Qualifications Match' },
				{ id: 'block-20', type: 'bulleted', content: 'Skill 1: [How I demonstrate this]' },
				{ id: 'block-21', type: 'bulleted', content: 'Skill 2: [How I demonstrate this]' },
				{ id: 'block-22', type: 'bulleted', content: 'Experience 1: [Relevant project/role]' },
				{ id: 'block-23', type: 'bulleted', content: 'Experience 2: [Relevant project/role]' },
				{ id: 'block-24', type: 'h2', content: 'STAR Method Examples' },
				{ id: 'block-25', type: 'text', content: 'Example 1 - Leadership:' },
				{ id: 'block-26', type: 'text', content: 'Situation: [Context]' },
				{ id: 'block-27', type: 'text', content: 'Task: [What needed to be done]' },
				{ id: 'block-28', type: 'text', content: 'Action: [What I did]' },
				{ id: 'block-29', type: 'text', content: 'Result: [Outcome and impact]' },
				{ id: 'block-30', type: 'text', content: 'Example 2 - Problem Solving:' },
				{ id: 'block-31', type: 'text', content: 'Situation: [Context]' },
				{ id: 'block-32', type: 'text', content: 'Task: [What needed to be done]' },
				{ id: 'block-33', type: 'text', content: 'Action: [What I did]' },
				{ id: 'block-34', type: 'text', content: 'Result: [Outcome and impact]' },
				{ id: 'block-35', type: 'h2', content: 'Questions to Ask Them' },
				{ id: 'block-36', type: 'bulleted', content: 'What does success look like in this role?' },
				{ id: 'block-37', type: 'bulleted', content: 'What are the biggest challenges facing the team?' },
				{ id: 'block-38', type: 'bulleted', content: 'How would you describe the company culture?' },
				{ id: 'block-39', type: 'bulleted', content: 'What opportunities are there for professional development?' },
				{ id: 'block-40', type: 'bulleted', content: 'What are the next steps in the interview process?' },
				{ id: 'block-41', type: 'h2', content: 'Logistics' },
				{ id: 'block-42', type: 'todo', content: 'Research directions to interview location' },
				{ id: 'block-43', type: 'todo', content: 'Plan outfit (professional, appropriate)' },
				{ id: 'block-44', type: 'todo', content: 'Prepare copies of resume and references' },
				{ id: 'block-45', type: 'todo', content: 'Practice common interview questions' },
				{ id: 'block-46', type: 'todo', content: 'Prepare portfolio/work samples if relevant' },
				{ id: 'block-47', type: 'h2', content: 'Post-Interview' },
				{ id: 'block-48', type: 'todo', content: 'Send thank you email within 24 hours' },
				{ id: 'block-49', type: 'todo', content: 'Note key points discussed for follow-up' },
				{ id: 'block-50', type: 'todo', content: 'Follow up on timeline if not provided' }
			]
		}
	];

	// Apply template
	const applyTemplate = (template) => {
		setBlocks(template.blocks);
		setShowTemplates(false);
	};

	// Share note
	const shareNote = async () => {
		if (!currentNote) return;

		let sharedWithUsers = [];

		if (user?.role === 'manager') {
			if (shareSettings.sharedWith.length === 0) return;
			sharedWithUsers = shareSettings.sharedWith;
		} else {
			if (!shareInput.trim()) return;
			// For non-managers, we need to convert usernames to user IDs
			const usernames = shareInput.split(',').map(name => name.trim()).filter(name => name);
			console.log('Sharing with usernames:', usernames);

			// Try to find user IDs for these usernames
			if (availableUsers.length > 0) {
				sharedWithUsers = usernames.map(username => {
					const foundUser = availableUsers.find(u =>
						u.username === username || u.name === username || u.email === username
					);
					return foundUser ? foundUser._id : username; // Use ID if found, otherwise use username
				});
			} else {
				// If no available users, just use the usernames as-is
				sharedWithUsers = usernames;
			}
			console.log('Final sharedWithUsers:', sharedWithUsers);
		}

		try {
			// First save the current note content
			await saveNote();

			
			// Then update with sharing info
			const updatedNote = {
				...currentNote,
				title,
				blocks,
				content: blocks.map(block => block.content).join('\n'),
				sharedWith: sharedWithUsers,
				shareType: 'shared'
			};

			const response = await put(`/notepad/${currentNote._id}`, updatedNote);
			
			// Update local state
			setCurrentNote(response);
			setNotes(prev => prev.map(note =>
				note._id === currentNote._id ? response : note
			));

			console.log('Note shared successfully:', response);
			console.log('Updated note sharedWith:', response.sharedWith);
			console.log('Current user ID:', user?.id);
			console.log('Note createdBy:', response.createdBy);
			console.log('sharedWith length:', response.sharedWith?.length);
			console.log('All notes after sharing:', notes.map(n => ({ id: n._id, title: n.title, createdBy: n.createdBy, sharedWith: n.sharedWith })));

			// Automatically switch to "Share Note" filter after sharing
			setSelectedTag('shared');

			setShowShareModal(false);
			setShareSettings({ shareType: 'private', sharedWith: [] });
			setShareInput('');
		} catch (err) {
			console.error('Error sharing note:', err);
		}
	};

	// Toggle favorite
	const toggleFavorite = (noteId) => {
		setFavorites(prev =>
			prev.includes(noteId)
				? prev.filter(id => id !== noteId)
				: [...prev, noteId]
		);
	};

	// Select users for sharing
	const selectUserForSharing = (userId) => {
		setShareSettings(prev => ({
			...prev,
			sharedWith: prev.sharedWith.includes(userId)
				? prev.sharedWith.filter(id => id !== userId)
				: [...prev.sharedWith, userId]
		}));
	};

	// Add tag to note
	const addTagToNote = async (tag) => {
		if (!currentNote || !tag.trim()) return;

		try {
			const updatedTags = [...(currentNote.tags || []), tag.trim()];
			const updatedNote = {
				...currentNote,
				tags: [...new Set(updatedTags)]
			};

			const response = await put(`/notepad/${currentNote._id}`, updatedNote);

			// Update local state
			setCurrentNote(response);
			setNotes(prev => prev.map(note =>
				note._id === currentNote._id ? response : note
			));

			// Update tags list
			setTags(prev => [...new Set([...prev, tag.trim()])]);

			setShowTagModal(false);
			setNewTag('');
		} catch (err) {
			console.error('Error adding tag:', err);
			addNotification({
				type: 'error',
				title: 'Error',
				message: 'Failed to add tag'
			});
		}
	};

	// Render block based on type
	const renderBlock = (block, index) => {
		const commonProps = {
			ref: (el) => blockRefs.current[block.id] = el,
			key: block.id,
			className: `w-full outline-none resize-none border-none bg-transparent py-1 px-2 rounded transition-all duration-200 font-inter leading-relaxed ${isDarkMode ? 'text-gray-100 placeholder-gray-500 focus:bg-gray-800/20' : 'text-gray-800 placeholder-gray-400 focus:bg-gray-50/30'} hover:bg-opacity-30`,
			value: block.content,
			onChange: (e) => updateBlock(block.id, e.target.value),
			onKeyDown: (e) => handleBlockKeyDown(block.id, e),
			onFocus: () => setActiveBlockId(block.id),
			placeholder: getBlockPlaceholder(block.type),
			style: { minHeight: '24px', lineHeight: '1.6' }
		};

		switch (block.type) {
			case 'h1':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<input
							{...commonProps}
							className={`${commonProps.className} text-4xl font-bold tracking-tight`}
							style={{ ...commonProps.style, minHeight: '48px', lineHeight: '1.2' }}
						/>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'h2':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<input
							{...commonProps}
							className={`${commonProps.className} text-3xl font-bold tracking-tight`}
							style={{ ...commonProps.style, minHeight: '40px', lineHeight: '1.3' }}
						/>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'h3':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<input
							{...commonProps}
							className={`${commonProps.className} text-2xl font-bold tracking-tight`}
							style={{ ...commonProps.style, minHeight: '36px', lineHeight: '1.4' }}
						/>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'bulleted':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className="flex items-start w-full">
							<span className="mr-2 mt-1 flex-shrink-0">•</span>
							<input {...commonProps} className={`${commonProps.className} flex-1`} />
						</div>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'numbered':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className="flex items-start w-full">
							<span className="mr-2 mt-1 flex-shrink-0 min-w-[24px]">{index + 1}.</span>
							<input {...commonProps} className={`${commonProps.className} flex-1`} />
						</div>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'todo':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className="flex items-start w-full">
							<input type="checkbox" className="mr-2 mt-1 flex-shrink-0" />
							<input {...commonProps} className={`${commonProps.className} flex-1`} />
						</div>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'quote':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className={`border-l-4 pl-4 py-2 transition-all duration-200 ${isDarkMode ? 'border-blue-500 bg-blue-900/10' : 'border-blue-400 bg-blue-50/50'}`}>
							<input {...commonProps} className={`${commonProps.className} italic text-lg`} style={{ ...commonProps.style, minHeight: '32px' }} />
						</div>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'divider':
				return (
					<div className="flex items-center my-4 relative group">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className="flex-grow border-t border-gray-300"></div>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'callout':
				return (
					<div className="flex items-start group relative bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 my-2">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<Lightbulb className="w-5 h-5 text-blue-500 mr-2 mt-1" />
						<input {...commonProps} />
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'code':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className={`w-full rounded-lg p-4 font-mono text-sm border transition-all duration-200 ${isDarkMode ? 'bg-gray-800/80 text-gray-100 border-gray-700 hover:border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300'}
							}`}>
							<textarea
								{...commonProps}
								className="w-full bg-transparent outline-none resize-none font-mono leading-relaxed"
								rows={Math.max(3, (block.content.match(/\n/g) || []).length + 1)}
								style={{ lineHeight: '1.5' }}
							/>
						</div>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
			case 'table':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={(e) => handlePlusButtonClick(e, block.id)}>
								<Plus className="w-4 h-4" />
							</button>
							<button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className={`w-full border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
							<table className="w-full">
								<tbody>
									<tr>
										<td className={`border p-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
											<input {...commonProps} placeholder="Cell 1" />
										</td>
										<td className={`border p-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
											<input {...commonProps} placeholder="Cell 2" />
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				);
			case 'image':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={(e) => handlePlusButtonClick(e, block.id)}>
								<Plus className="w-4 h-4" />
							</button>
							<button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className={`w-full p-4 border-2 border-dashed rounded-lg text-center ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
							<Image className="w-12 h-12 mx-auto mb-2 text-gray-400" />
							<input {...commonProps} placeholder="Paste image URL or click to upload" />
						</div>
					</div>
				);
			case 'video':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={(e) => handlePlusButtonClick(e, block.id)}>
								<Plus className="w-4 h-4" />
							</button>
							<button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className={`w-full p-4 border-2 border-dashed rounded-lg text-center ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
							<Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
							<input {...commonProps} placeholder="Paste video URL" />
						</div>
					</div>
				);
			case 'link':
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={(e) => handlePlusButtonClick(e, block.id)}>
								<Plus className="w-4 h-4" />
							</button>
							<button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<div className="flex items-start w-full">
							<Link className="w-5 h-5 mr-2 mt-1 text-blue-500 flex-shrink-0" />
							<input {...commonProps} className={`${commonProps.className} flex-1`} placeholder="Paste or type a link" />
						</div>
					</div>
				);
			default: // text
				return (
					<div className="flex items-start group relative">
						<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => handlePlusButtonClick(e, block.id)}
							>
								<Plus className="w-4 h-4" />
							</button>
							<button
								className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
								}}
							>
								<GripVertical className="w-4 h-4" />
							</button>
						</div>
						<textarea 
							ref={(el) => blockRefs.current[block.id] = el}
							value={block.content}
							onChange={(e) => updateBlock(block.id, e.target.value)}
							onKeyDown={(e) => handleBlockKeyDown(block.id, e)}
							onFocus={() => setActiveBlockId(block.id)}
							placeholder={getBlockPlaceholder(block.type)}
							rows={Math.max(1, ((block.content || '').match(/\n/g) || []).length + 1)}
							className={`w-full outline-none resize-none border-none bg-transparent py-1 px-2 rounded transition-all duration-200 font-inter leading-relaxed overflow-hidden ${isDarkMode ? 'text-gray-100 placeholder-gray-500 focus:bg-gray-800/20' : 'text-gray-800 placeholder-gray-400 focus:bg-gray-50/30'} hover:bg-opacity-30`}
							style={{ minHeight: '24px', lineHeight: '1.6' }}
						/>
						{showBlockMenu === block.id && (
							<div
								ref={blockMenuRef}
								className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
									}`}
							>
								<div className="py-1">
									<button
										onClick={() => duplicateBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<Copy className="w-4 h-4 mr-2" />
										Duplicate
									</button>
									<button
										onClick={() => moveBlockUp(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronUp className="w-4 h-4 mr-2" />
										Move up
									</button>
									<button
										onClick={() => moveBlockDown(block.id)}
										className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<ChevronDown className="w-4 h-4 mr-2" />
										Move down
									</button>
									<hr className="my-1 border-gray-200 dark:border-gray-700" />
									<button
										onClick={() => deleteBlock(block.id)}
										className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4 mr-2" />
										Delete
									</button>
								</div>
							</div>
						)}
					</div>
				);
		}
	};

	// Get placeholder text for block
	const getBlockPlaceholder = (type) => {
		switch (type) {
			case 'h1': return 'Heading 1';
			case 'h2': return 'Heading 2';
			case 'h3': return 'Heading 3';
			case 'bulleted': return 'List item';
			case 'numbered': return 'List item';
			case 'todo': return 'To-do item';
			case 'quote': return 'Quote';
			case 'callout': return 'Callout';
			case 'code': return 'Code';
			case 'table': return 'Table cell';
			case 'image': return 'Image URL';
			case 'video': return 'Video URL';
			case 'link': return 'Link URL';
			default: return 'Type \'/\' for commands';
		}
	};

	// Filter notes based on search and tags
	const filteredNotes = notes.filter(note => {
		// Only show notes that have a meaningful title
		const hasTitle = note.title && note.title.trim() !== '' && note.title !== 'Untitled';
		if (!hasTitle) return false;

		const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			note.content?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesTag = selectedTag === 'all' ||
			(selectedTag === 'favorites' && favorites.includes(note._id)) ||
			(selectedTag === 'saved' && note.createdBy === user?.id && (!note.sharedWith || note.sharedWith.length === 0)) ||
			(selectedTag === 'shared' && note.createdBy === user?.id && note.sharedWith && note.sharedWith.length > 0) ||
			(selectedTag === 'received' && note.createdBy !== user?.id && note.sharedWith && (
				note.sharedWith.includes(user?.id) ||
				note.sharedWith.includes(user?.username) ||
				note.sharedWith.includes(user?.name) ||
				note.sharedWith.includes(user?.email)
			)) ||
			(note.tags && note.tags.includes(selectedTag));

		// Debug logging for shared notes
		if (selectedTag === 'shared') {
			console.log('Filtering shared notes:');
			console.log('Note:', { id: note._id, title: note.title, createdBy: note.createdBy, sharedWith: note.sharedWith });
			console.log('User:', { id: user?.id, username: user?.username, name: user?.name, email: user?.email });
			console.log('createdBy === user?.id:', note.createdBy === user?.id);
			console.log('sharedWith exists:', !!note.sharedWith);
			console.log('sharedWith length:', note.sharedWith?.length || 0);
			console.log('Should match shared filter:', note.createdBy === user?.id && note.sharedWith && note.sharedWith.length > 0);
		}

		return matchesSearch && matchesTag;
	});

	return (
		<div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white' : 'bg-white text-gray-900'}`}>
			<div className="flex h-screen">
				{/* Main Content */}
				<div className="flex-1 flex flex-col">
					{currentNote ? (
						<>
							{/* Title Section */}
							<div className={`p-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
								<div className="max-w-3xl mx-auto">
									{isEditingTitle ? (
										<input
											ref={titleInputRef}
											type="text"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											onKeyDown={handleTitleKeyDown}
											onBlur={() => {
												setIsEditingTitle(false);
												// If title is empty after editing, set it to "Untitled"
												if (!title.trim()) {
													setTitle('Untitled');
												}
												saveNote();
											}}
											className={`text-5xl font-bold bg-transparent border-none outline-none w-full leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
											placeholder=""
											autoFocus
											style={{
												fontSize: '3rem',
												lineHeight: '1.2',
												fontWeight: '700',
												letterSpacing: '-0.02em'
											}}
										/>
									) : (
										<div
											onClick={() => {
												setIsEditingTitle(true);
												// Clear the title when clicking to edit from placeholder
												if (title === 'Untitled' || !title.trim()) {
													setTitle('');
												}
											}}
											className="cursor-text"
										>
											{title && title !== 'Untitled' && title.trim() !== '' ? (
												<h1 className={`text-5xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
													style={{
														fontSize: '3rem',
														lineHeight: '1.2',
														fontWeight: '700',
														letterSpacing: '-0.02em'
													}}
												>
													{title}
												</h1>
											) : (
												<div className="w-full">
													<div className={`text-5xl font-bold leading-tight opacity-60 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
														style={{
															fontSize: '3rem',
															lineHeight: '1.2',
															fontWeight: '700',
															letterSpacing: '-0.02em',
															userSelect: 'none'
														}}
													>
														Untitled
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							</div>

							{/* Content */}
							<div className={`flex-1 overflow-y-auto p-8 pb-32 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
								<div className="max-w-3xl mx-auto">
									<div className="space-y-0.5 min-h-96">
										{blocks.map((block, index) => renderBlock(block, index))}
									</div>

									{/* Add block button */}
									<button
										onClick={() => addBlock(blocks.length - 1)}
										className={`flex items-center mt-4 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-500 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
									>
										<Plus className="w-5 h-5 mr-2" />
										Add block
									</button>
								</div>
							</div>

							{/* Bottom Action Bar */}
							<div className={`fixed bottom-0 left-0 right-0 border-t backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} p-4 shadow-lg`}>
								<div className="max-w-3xl mx-auto flex items-center justify-between">
									{/* Note Metadata */}
									<div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
										<div className="flex items-center gap-2">
											<User className="w-3 h-3" />
											<span>Created by: {currentNote?.createdBy === user?.id ? 'You' : (currentNote?.createdByName || 'Unknown')}</span>
										</div>
										<div className="flex items-center gap-2">
											<Clock className="w-3 h-3" />
											<span>Created: {currentNote?.createdAt ? new Date(currentNote.createdAt).toLocaleDateString() : 'Unknown'}</span>
										</div>
									</div>

									{/* Save Status Indicator - Right Side */}
									<div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
										<div className="flex items-center gap-2">
											<div className={`w-2 h-2 rounded-full ${lastSaved ? 'bg-green-500' : 'bg-gray-400'}`}></div>
											<span className={lastSaved ? 'text-green-600' : ''}>
												{lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : 'Not saved'}
											</span>
										</div>
										{/* Specific sharing information */}
										{currentNote?.sharedWith && currentNote.sharedWith.length > 0 ? (
											<div className="flex items-center gap-2">
												<Share2 className="w-3 h-3" />
												<span>you share with {currentNote.sharedWith.length === 1 ? currentNote.sharedWith[0] : `${currentNote.sharedWith.length} users`}</span>
											</div>
										) : currentNote?.createdBy !== user?.id ? (
											<div className="flex items-center gap-2">
												<Users className="w-3 h-3" />
												<span>from {currentNote?.createdByName || 'Unknown'}</span>
											</div>
										) : null}
									</div>
									
									{/* Action Buttons */}
									<div className="flex items-center gap-4">
									<button
										onClick={saveNote}
										className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} shadow-lg`}
									>
										<Save className="w-4 h-4 mr-2" />
										Save
									</button>

										<div className="relative">
											<button
												onClick={async () => {
													if (!showShareModal && availableUsers.length === 0) {
														try {
															const apiService = (await import('../../services/api')).default;
															const response = await apiService.getUsers();
															console.log('Fetched users response:', response);
															const users = response.users || [];
															console.log('Current user:', user);
															console.log('All users from API:', users);
															// Only filter if we have more than 1 user and can identify current user
															if (users.length > 1 && user?._id) {
																const filteredUsers = users.filter(u => u._id !== user._id);
																console.log('Filtered users (excluding creator):', filteredUsers);
																setAvailableUsers(filteredUsers);
															} else {
																console.log('Showing all users (no filtering applied)');
																setAvailableUsers(users);
															}
														} catch (err) {
															console.error('Failed to fetch users:', err);
														}
													}
													setShowShareModal(!showShareModal);
												}}
												className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'} shadow-lg`}
											>
												<Share2 className="w-4 h-4 mr-2" />
												Share
												<ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showShareModal ? 'rotate-180' : ''}`} />
											</button>
											{showShareModal && (
												<div className={`absolute bottom-full mb-2 left-0 w-80 rounded-lg shadow-lg border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
													<div className="p-4">
														<h3 className="text-lg font-semibold mb-3">Share Note</h3>
														<div className="space-y-2 max-h-48 overflow-y-auto">
															{availableUsers.length > 0 ? availableUsers.map(userItem => (
																<button
																	key={userItem._id}
																	onClick={() => selectUserForSharing(userItem._id)}
																	className={`w-full p-3 text-left rounded-lg transition-colors ${
																		shareSettings.sharedWith.includes(userItem._id)
																			? 'bg-blue-500/20 border border-blue-500'
																			: isDarkMode
																				? 'hover:bg-gray-700'
																				: 'hover:bg-gray-100'
																		}`}
																>
																	<div className="flex items-center justify-between">
																		<div className="flex items-center">
																			<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
																				{userItem.name?.charAt(0).toUpperCase() || userItem.username?.charAt(0).toUpperCase() || 'U'}
																			</div>
																			<div>
																				<div className="font-medium">{userItem.name || userItem.username}</div>
																				<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userItem.email} • {userItem.role}</div>
																			</div>
																		</div>
																		{shareSettings.sharedWith.includes(userItem._id) && (
																			<div className="text-blue-500">
																				<Users className="w-4 h-4" />
																			</div>
																		)}
																	</div>
																</button>
															)) : (
																<div className={`p-4 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg`}>
																	{user?.role === 'manager' ? (
																		<>
																			<div className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
																				Select users to share with:
																			</div>
																			<select 
																				multiple
																				className={`w-full px-4 py-3 rounded-lg border h-32 ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
																			>
																				<option value="john">john</option>
																				<option value="mary">mary</option>
																				<option value="alex">alex</option>
																			</select>
																		</>
																	) : (
																		<>
																			<div className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
																				Type usernames to share with:
																			</div>
																			<div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
																				<table className="w-full">
																					<thead className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
																						<tr>
																							<th className={`px-4 py-2 text-left text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Usernames (separated by commas)</th>
																						</tr>
																					</thead>
																					<tbody>
																						<tr className={`${isDarkMode ? 'bg-gray-700/30' : 'bg-white'}`}>
																							<td className={`px-4 py-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
																								<input
																									type="text"
																									value={shareInput}
																									onChange={(e) => setShareInput(e.target.value)}
																									placeholder="john, mary, alex"
																									className={`w-full px-3 py-2 text-sm rounded border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
																								/>
																							</td>
																						</tr>
																					</tbody>
																				</table>
																			</div>
																		</>
																	)}
																</div>
															)}
														</div>
														{shareSettings.sharedWith.length > 0 && (
															<div className="mt-3 p-2 bg-green-500/20 rounded-lg">
																<div className="text-sm text-green-600 font-medium">
																	Share with usernames
																</div>
																<button
																	onClick={() => {
																		shareNote();
																		setShowShareModal(false);
																	}}
																	className="mt-2 w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
																>
																	Share Note
																</button>
															</div>
														)}
													</div>
												</div>
											)}
										</div>

									<div className="relative">
										<button
											onClick={() => setShowTemplates(!showTemplates)}
											className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} shadow-lg`}
										>
											<FileText className="w-4 h-4 mr-2" />
											Templates
											<ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
										</button>
										{showTemplates && (
											<div className={`absolute bottom-full mb-2 left-0 w-80 rounded-lg shadow-lg border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
												<div className="p-4">
													<h3 className="text-lg font-semibold mb-3">Choose Template</h3>
													<div className="space-y-2 max-h-64 overflow-y-auto">
														{templates.map((template, index) => (
															<button
																key={index}
																onClick={() => {
																	applyTemplate(template);
																	setShowTemplates(false);
																}}
																className={`w-full p-3 text-left rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
															>
																<div className="flex items-center">
																	{template.icon}
																	<div className="ml-3">
																		<div className="font-medium">{template.name}</div>
																		<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{template.description}</div>
																	</div>
																</div>
															</button>
														))}
													</div>
												</div>
											</div>
										)}
									</div>
									</div>

								</div>
							</div>
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center p-8">
							<FileText className="w-16 h-16 text-gray-400 mb-4" />
							<h2 className="text-2xl font-bold mb-2">No note selected</h2>
							<p className="text-gray-500 mb-6">Select a note from the sidebar or create a new one</p>
							<button
								onClick={createNewNote}
								className="flex items-center px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
							>
								<Plus className="w-5 h-5 mr-2" />
								Create new note
							</button>
						</div>
					)}
				</div>

				{/* Sidebar */}
				<div className={`w-80 border-l backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} flex flex-col shadow-2xl`}>
					<div className="p-6 border-b border-gray-200 dark:border-gray-700">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-4">
								<div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
									<FileText className="w-6 h-6 text-white" />
								</div>
								<div>
									<h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
										Notes
									</h1>
									<p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create and organize your thoughts</p>
								</div>
							</div>
							<button
								onClick={createNewNote}
								className={`p-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-xl ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'}`}
							>
								<Plus className="w-5 h-5" />
							</button>
						</div>

						<div className="relative mb-6">
							<Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
							<input
								type="text"
								placeholder="Search notes, content, tags..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 ${isDarkMode
									? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
									: 'bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500'
									}`}
							/>
						</div>



						{/* Filter Buttons */}
						<div className="mb-4">
							<div className="flex flex-wrap gap-1">
								<button
									onClick={() => setSelectedTag('saved')}
									className={`px-2 py-1 text-xs rounded-full ${selectedTag === 'saved'
										? 'bg-green-500 text-white'
										: isDarkMode
											? 'bg-gray-700 text-gray-300'
											: 'bg-gray-200 text-gray-700'
										}`}
								>
									Save Note
								</button>
								<button
									onClick={() => setSelectedTag('shared')}
									className={`px-2 py-1 text-xs rounded-full ${selectedTag === 'shared'
										? 'bg-blue-500 text-white'
										: isDarkMode
											? 'bg-gray-700 text-gray-300'
											: 'bg-gray-200 text-gray-700'
										}`}
								>
									Share Note
								</button>
								<button
									onClick={() => setSelectedTag('received')}
									className={`px-2 py-1 text-xs rounded-full ${selectedTag === 'received'
										? 'bg-purple-500 text-white'
										: isDarkMode
											? 'bg-gray-700 text-gray-300'
											: 'bg-gray-200 text-gray-700'
										}`}
								>
									Received Note
								</button>
							</div>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto p-2">
						{loading ? (
							<div className="flex justify-center items-center h-full">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
							</div>
						) : error ? (
							<div className="p-4 text-red-500">{error}</div>
						) : filteredNotes.length === 0 ? (
							<div className="p-4 text-center text-gray-500">
								{searchQuery ? 'No notes found' : 'No notes yet'}
							</div>
						) : (
							<div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-2' : 'space-y-2'}>
								{filteredNotes.map(note => (
									<div
										key={note._id}
										onClick={() => selectNote(note)}
										className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 relative shadow-lg backdrop-blur-sm ${selectedNote === note._id
											? isDarkMode
												? 'bg-blue-900/50 border-2 border-blue-500 ring-2 ring-blue-500/30'
												: 'bg-blue-50 border-2 border-blue-500 ring-2 ring-blue-500/30'
											: isDarkMode
												? 'bg-gray-800/50 border-2 border-gray-700/50 hover:border-gray-600'
												: 'bg-white/70 border-2 border-gray-200/50 hover:border-gray-300'
											}`}
									>
										<div className="flex justify-between items-start">
											<div className="font-medium truncate">{note.title}</div>
											<div className="flex items-center gap-1">
												<button
													onClick={(e) => {
														e.stopPropagation();
														toggleFavorite(note._id);
													}}
													className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
												>
													{favorites.includes(note._id) ? (
														<Star className="w-4 h-4 text-yellow-500 fill-current" />
													) : (
														<Star className="w-4 h-4 text-gray-400" />
													)}
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														deleteNote(note._id);
													}}
													className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</div>
										<div className="text-sm text-gray-500 truncate mt-1">
											{note.content?.substring(0, 50) || 'No content'}
										</div>
										{note.tags && note.tags.length > 0 && (
											<div className="flex flex-wrap gap-1 mt-2">
												{note.tags.slice(0, 3).map(tag => (
													<span
														key={tag}
														className="px-1.5 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-500"
													>
														{tag}
													</span>
												))}
												{note.tags.length > 3 && (
													<span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-500">
														+{note.tags.length - 3}
													</span>
												)}
											</div>
										)}
										<div className="text-xs text-gray-400 mt-2 flex items-center">
											<Clock className="w-3 h-3 mr-1" />
											{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Formatting Menu - Notion Style */}
			{showFormattingMenu && (
				<div
					ref={formattingMenuRef}
					className={`absolute z-50 mt-1 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
					style={{
						minWidth: '250px',
						maxHeight: '300px',
						left: `${formattingMenuPosition.x}px`,
						top: `${formattingMenuPosition.y}px`,
						transform: 'translateY(5px)'
					}}
				>
					<div className="py-2 overflow-y-auto max-h-72">
						{/* Text section */}
						<div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
							Basic blocks
						</div>
						<button
							onClick={() => {
								applyFormatting('text');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Type className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Text</div>
								<div className="text-xs text-gray-500">Just start writing with plain text.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('h1');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Hash className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Heading 1</div>
								<div className="text-xs text-gray-500">Big section heading.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('h2');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Hash className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Heading 2</div>
								<div className="text-xs text-gray-500">Medium section heading.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('h3');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Hash className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Heading 3</div>
								<div className="text-xs text-gray-500">Small section heading.</div>
							</div>
						</button>

						{/* Lists section */}
						<div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
							Lists
						</div>
						<button
							onClick={() => {
								applyFormatting('bulleted');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<List className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Bulleted list</div>
								<div className="text-xs text-gray-500">Create a simple bulleted list.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('numbered');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<List className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Numbered list</div>
								<div className="text-xs text-gray-500">Create a list with numbering.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('todo');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<CheckSquare className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">To-do list</div>
								<div className="text-xs text-gray-500">Track tasks with a to-do list.</div>
							</div>
						</button>

						{/* Media section */}
						<div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
							Media
						</div>
						<button
							onClick={() => {
								applyFormatting('quote');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Quote className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Quote</div>
								<div className="text-xs text-gray-500">Capture a quote.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('divider');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Minus className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Divider</div>
								<div className="text-xs text-gray-500">Visually divide blocks.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('callout');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Lightbulb className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Callout</div>
								<div className="text-xs text-gray-500">Make writing stand out.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('code');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Code className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Code</div>
								<div className="text-xs text-gray-500">Capture a code snippet.</div>
							</div>
						</button>

						{/* Advanced section */}
						<div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
							Advanced
						</div>
						<button
							onClick={() => {
								applyFormatting('table');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Table className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Table</div>
								<div className="text-xs text-gray-500">Add a simple table.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('image');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Image className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Image</div>
								<div className="text-xs text-gray-500">Upload or embed an image.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('video');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Video className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Video</div>
								<div className="text-xs text-gray-500">Embed a video.</div>
							</div>
						</button>
						<button
							onClick={() => {
								applyFormatting('link');
							}}
							className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
						>
							<Link className="w-5 h-5 mr-3 text-gray-500" />
							<div>
								<div className="font-medium">Link</div>
								<div className="text-xs text-gray-500">Add a web link.</div>
							</div>
						</button>
					</div>
				</div>
			)}

			{/* Tag Modal */}
			{showTagModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className={`rounded-lg p-6 w-96 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-semibold">Add Tag</h2>
							<button
								onClick={() => setShowTagModal(false)}
								className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">Tag name</label>
								<input
									type="text"
									value={newTag}
									onChange={(e) => setNewTag(e.target.value)}
									placeholder="Enter tag name"
									className={`w-full p-2 rounded-lg border ${isDarkMode
										? 'bg-gray-700 border-gray-600 text-white'
										: 'bg-gray-50 border-gray-300 text-gray-900'
										}`}
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">Existing tags</label>
								<div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
									{tags.map(tag => (
										<button
											key={tag}
											onClick={() => addTagToNote(tag)}
											className="px-3 py-1 text-sm rounded-full bg-purple-500/20 text-purple-500 hover:bg-purple-500/30"
										>
											{tag}
										</button>
									))}
								</div>
							</div>

							<div className="flex justify-end space-x-2 pt-4">
								<button
									onClick={() => setShowTagModal(false)}
									className={`px-4 py-2 rounded-lg ${isDarkMode
										? 'bg-gray-700 hover:bg-gray-600'
										: 'bg-gray-200 hover:bg-gray-300'
										}`}
								>
									Cancel
								</button>
								<button
									onClick={() => addTagToNote(newTag)}
									disabled={!newTag.trim()}
									className={`px-4 py-2 rounded-lg flex items-center ${newTag.trim()
										? 'bg-blue-500 text-white hover:bg-blue-600'
										: 'bg-gray-300 text-gray-500 cursor-not-allowed'
										}`}
								>
									<Tag className="w-4 h-4 mr-2" />
									Add Tag
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div >
	);
};

export default NotepadPage;