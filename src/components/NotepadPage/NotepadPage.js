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
	Hash as HashIcon
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { get, post, put, deleteRequest } from '../../services/api';
import { addNotification } from '../../utils/notifications';

const NotepadPage = () => {
	const { user } = useAppContext();
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
				blocks: [{ id: 'block-1', type: 'text', content: '' }],
				tags: []
			};

			const response = await post('/notepad', newNote);
			setNotes(prev => [response, ...prev]);
			setCurrentNote(response);
			setTitle(response.title);
			setBlocks(response.blocks || [{ id: 'block-1', type: 'text', content: '' }]);
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

	// Save note
	const saveNote = async () => {
		if (!currentNote) return;

		try {
			const updatedNote = {
				...currentNote,
				title,
				blocks
			};

			const response = await put(`/notepad/${currentNote._id}`, updatedNote);
			setNotes(prev => prev.map(note =>
				note._id === currentNote._id ? response : note
			));
			setCurrentNote(response);
			addNotification({
				type: 'success',
				title: 'Saved',
				message: 'Note saved successfully'
			});
		} catch (err) {
			console.error('Error saving note:', err);
			addNotification({
				type: 'error',
				title: 'Error',
				message: 'Failed to save note'
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
		setBlocks(note.blocks || [{ id: 'block-1', type: 'text', content: '' }]);
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
			const index = blocks.findIndex(block => block.id === id);
			addBlock(index);
		} else if (e.key === 'Backspace' && e.target.value === '') {
			e.preventDefault();
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

		// For simplicity, we'll just change the block type
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
				addBlock(blocks.findIndex(b => b.id === activeBlockId), 'divider');
				break;
			case 'callout':
				changeBlockType(activeBlockId, 'callout');
				break;
			case 'code':
				changeBlockType(activeBlockId, 'code');
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
				{ id: 'block-2', type: 'text', content: 'Date: ' },
				{ id: 'block-3', type: 'text', content: 'Attendees: ' },
				{ id: 'block-4', type: 'h2', content: 'Agenda' },
				{ id: 'block-5', type: 'bulleted', content: '' },
				{ id: 'block-6', type: 'h2', content: 'Action Items' },
				{ id: 'block-7', type: 'todo', content: '' }
			]
		},
		{
			name: 'Project Plan',
			description: 'Outline your project goals and tasks',
			icon: <Folder className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Project Plan' },
				{ id: 'block-2', type: 'h2', content: 'Overview' },
				{ id: 'block-3', type: 'text', content: '' },
				{ id: 'block-4', type: 'h2', content: 'Goals' },
				{ id: 'block-5', type: 'bulleted', content: '' },
				{ id: 'block-6', type: 'h2', content: 'Timeline' },
				{ id: 'block-7', type: 'text', content: '' }
			]
		},
		{
			name: 'Brainstorm',
			description: 'Organize your ideas and thoughts',
			icon: <Lightbulb className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Brainstorm' },
				{ id: 'block-2', type: 'text', content: 'Topic: ' },
				{ id: 'block-3', type: 'callout', content: 'Add your ideas below' },
				{ id: 'block-4', type: 'bulleted', content: '' },
				{ id: 'block-5', type: 'bulleted', content: '' },
				{ id: 'block-6', type: 'bulleted', content: '' }
			]
		},
		{
			name: 'Weekly Planner',
			description: 'Plan your week with tasks and goals',
			icon: <Calendar className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Weekly Planner' },
				{ id: 'block-2', type: 'h2', content: 'Monday' },
				{ id: 'block-3', type: 'todo', content: '' },
				{ id: 'block-4', type: 'h2', content: 'Tuesday' },
				{ id: 'block-5', type: 'todo', content: '' },
				{ id: 'block-6', type: 'h2', content: 'Wednesday' },
				{ id: 'block-7', type: 'todo', content: '' }
			]
		},
		{
			name: 'Blog Post',
			description: 'Write a blog post with sections',
			icon: <FileText className="w-5 h-5" />,
			blocks: [
				{ id: 'block-1', type: 'h1', content: 'Blog Post Title' },
				{ id: 'block-2', type: 'text', content: 'Introduction' },
				{ id: 'block-3', type: 'h2', content: 'Main Content' },
				{ id: 'block-4', type: 'text', content: '' },
				{ id: 'block-5', type: 'h2', content: 'Conclusion' },
				{ id: 'block-6', type: 'text', content: '' }
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

		try {
			await post(`/notepad/${currentNote._id}/share`, shareSettings);
			addNotification({
				type: 'success',
				title: 'Shared',
				message: 'Note shared successfully'
			});
			setShowShareModal(false);
		} catch (err) {
			console.error('Error sharing note:', err);
			addNotification({
				type: 'error',
				title: 'Error',
				message: 'Failed to share note'
			});
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
			className: `w-full outline-none resize-none border-none bg-transparent py-1 px-2 rounded ${isDarkMode ? 'text-gray-100' : 'text-gray-800'
				}`,
			value: block.content,
			onChange: (e) => updateBlock(block.id, e.target.value),
			onKeyDown: (e) => handleBlockKeyDown(block.id, e),
			onFocus: () => setActiveBlockId(block.id),
			placeholder: getBlockPlaceholder(block.type)
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
							className={`${commonProps.className} text-4xl font-bold`}
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
							className={`${commonProps.className} text-3xl font-bold`}
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
							className={`${commonProps.className} text-2xl font-bold`}
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
						<div className="flex items-center">
							<span className="mr-2">•</span>
							<input {...commonProps} />
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
						<div className="flex items-center">
							<span className="mr-2">{index + 1}.</span>
							<input {...commonProps} />
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
						<div className="flex items-center">
							<input type="checkbox" className="mr-2 mt-1" />
							<input {...commonProps} />
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
						<div className="border-l-4 border-gray-400 pl-4 py-1">
							<input {...commonProps} />
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
						<div className={`w-full rounded-lg p-4 font-mono text-sm ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'
							}`}>
							<textarea
								{...commonProps}
								className="w-full bg-transparent outline-none resize-none"
								rows={Math.max(3, (block.content.match(/\n/g) || []).length + 1)}
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
			default: return 'Type \'/\' for commands';
		}
	};

	// Filter notes based on search and tags
	const filteredNotes = notes.filter(note => {
		const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			note.content?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesTag = selectedTag === 'all' ||
			(selectedTag === 'favorites' && favorites.includes(note._id)) ||
			(note.tags && note.tags.includes(selectedTag));

		return matchesSearch && matchesTag;
	});

	return (
		<div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white' : 'bg-white text-gray-900'}`}>
			<div className="flex h-screen">
				{/* Main Content */}
				<div className="flex-1 flex flex-col">
					{currentNote ? (
						<>
							{/* Toolbar */}
							<div className={`border-b backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} p-6 shadow-lg`}>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										{isEditingTitle ? (
											<input
												ref={titleInputRef}
												type="text"
												value={title}
												onChange={(e) => setTitle(e.target.value)}
												onKeyDown={handleTitleKeyDown}
												onBlur={() => {
													setIsEditingTitle(false);
													saveNote();
												}}
												className={`text-2xl font-bold bg-transparent border-b-2 border-blue-500 outline-none ${isDarkMode ? 'text-white' : 'text-gray-900'
													}`}
											/>
										) : (
											<h1
												onClick={() => setIsEditingTitle(true)}
												className="text-2xl font-bold cursor-text hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-2 py-1"
											>
												{title}
											</h1>
										)}
									</div>

									<div className="flex items-center space-x-3">
										<button
											onClick={saveNote}
											className="flex items-center px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg font-semibold"
										>
											<Save className="w-4 h-4 mr-2" />
											Save
										</button>
										<button
											onClick={() => setShowShareModal(true)}
											className="flex items-center px-4 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-105 shadow-lg font-semibold"
										>
											<Share2 className="w-4 h-4 mr-2" />
											Share
										</button>
										<button className={`p-3 rounded-2xl transition-all duration-300 hover:scale-105 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
											<Download className="w-5 h-5" />
										</button>
										<button
											onClick={() => setShowTemplates(true)}
											className="flex items-center px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg font-semibold"
										>
											<FileText className="w-4 h-4 mr-2" />
											Templates
										</button>
									</div>
								</div>

								{/* Tags for current note */}
								<div className="flex items-center mt-3">
									<Tag className="w-4 h-4 mr-2 text-gray-500" />
									<div className="flex flex-wrap gap-1">
										{currentNote.tags && currentNote.tags.map(tag => (
											<span
												key={tag}
												className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-500 flex items-center"
											>
												{tag}
												<button
													onClick={() => {
														// Remove tag functionality could be added here
													}}
													className="ml-1 hover:text-purple-700"
												>
													<X className="w-3 h-3" />
												</button>
											</span>
										))}
										<button
											onClick={() => setShowTagModal(true)}
											className="px-2 py-1 text-xs rounded-full border border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
										>
											+ Add tag
										</button>
									</div>
								</div>
							</div>

							{/* Content */}
							<div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-900/30 max-h-screen">
								<div className="max-w-3xl mx-auto">
									<div className="space-y-2 min-h-96">
										{blocks.map((block, index) => renderBlock(block, index))}
									</div>

									{/* Add block button */}
									<button
										onClick={() => addBlock(blocks.length - 1)}
										className="flex items-center mt-4 px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
									>
										<Plus className="w-5 h-5 mr-2" />
										Add block
									</button>
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

						<div className={`flex items-center rounded-2xl p-1 mb-6 border-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
							<button
								onClick={() => setViewMode('list')}
								className={`p-3 rounded-xl transition-all duration-200 ${viewMode === 'list'
										? (isDarkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg')
										: (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
									}`}
							>
								<List className="w-5 h-5" />
							</button>
							<button
								onClick={() => setViewMode('grid')}
								className={`p-3 rounded-xl transition-all duration-200 ${viewMode === 'grid'
										? (isDarkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg')
										: (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
									}`}
							>
								<Grid className="w-5 h-5" />
							</button>
						</div>

						{/* Tags Filter */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h3 className="text-sm font-semibold">Tags</h3>
								<button
									onClick={() => setShowTagModal(true)}
									className="text-blue-500 hover:text-blue-700"
								>
									<Plus className="w-4 h-4" />
								</button>
							</div>
							<div className="flex flex-wrap gap-1">
								<button
									onClick={() => setSelectedTag('all')}
									className={`px-2 py-1 text-xs rounded-full ${selectedTag === 'all'
											? 'bg-blue-500 text-white'
											: isDarkMode
												? 'bg-gray-700 text-gray-300'
												: 'bg-gray-200 text-gray-700'
										}`}
								>
									All
								</button>
								<button
									onClick={() => setSelectedTag('favorites')}
									className={`px-2 py-1 text-xs rounded-full flex items-center ${selectedTag === 'favorites'
											? 'bg-yellow-500 text-white'
											: isDarkMode
												? 'bg-gray-700 text-gray-300'
												: 'bg-gray-200 text-gray-700'
										}`}
								>
									<Star className="w-3 h-3 mr-1" />
									Favorites
								</button>
								{tags.map(tag => (
									<button
										key={tag}
										onClick={() => setSelectedTag(tag)}
										className={`px-2 py-1 text-xs rounded-full ${selectedTag === tag
												? 'bg-purple-500 text-white'
												: isDarkMode
													? 'bg-gray-700 text-gray-300'
													: 'bg-gray-200 text-gray-700'
											}`}
									>
										{tag}
									</button>
								))}
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
											<button
												onClick={(e) => {
													e.stopPropagation();
													toggleFavorite(note._id);
												}}
												className="ml-2"
											>
												{favorites.includes(note._id) ? (
													<Star className="w-4 h-4 text-yellow-500 fill-current" />
												) : (
													<Star className="w-4 h-4 text-gray-400" />
												)}
											</button>
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