import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

// ——— Utils ———
const uid = () => Math.random().toString(36).slice(2, 9);

const BLOCK_TYPES = [
	{ type: "text", label: "Paragraph", hint: "Start typing", icon: "📝" },
	{ type: "h1", label: "Heading 1", hint: "Big section heading", icon: "📰" },
	{ type: "h2", label: "Heading 2", hint: "Medium section heading", icon: "📄" },
	{ type: "h3", label: "Heading 3", hint: "Small section heading", icon: "📃" },
	{ type: "bulleted", label: "Bulleted list", hint: "List with bullets", icon: "•" },
	{ type: "numbered", label: "Numbered list", hint: "Ordered list", icon: "🔢" },
	{ type: "todo", label: "To-do list", hint: "Action items", icon: "☑️" },
	{ type: "toggle", label: "Toggle list", hint: "Collapsible content", icon: "🔽" },
	{ type: "quote", label: "Quote", hint: "Call out a quote", icon: "💬" },
	{ type: "divider", label: "Divider", hint: "Horizontal rule", icon: "➖" },
	{ type: "callout", label: "Callout", hint: "Highlighted text box", icon: "💡" },
	{ type: "image", label: "Image", hint: "Upload or embed image", icon: "🖼️" },
	{ type: "video", label: "Video", hint: "Upload or embed video", icon: "🎥" },
	{ type: "file", label: "File", hint: "Upload any file", icon: "📎" },
	{ type: "bookmark", label: "Web bookmark", hint: "Save a link to any URL", icon: "🔖" },
	{ type: "code", label: "Code", hint: "Code block with syntax highlighting", icon: "💻" },
	{ type: "math", label: "Math equation", hint: "KaTeX/LaTeX math block", icon: "∑" },
	{ type: "table", label: "Table", hint: "Database in table view", icon: "📊" },
	{ type: "board", label: "Board", hint: "Kanban board view", icon: "📋" },
	{ type: "calendar", label: "Calendar", hint: "Calendar view", icon: "📅" }
];

const styles = {
	page: {
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
		minHeight: "100vh",
		direction: "ltr",
		fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
		position: "relative",
		overflow: "hidden"
	},
	mainLayout: {
		display: "flex",
		minHeight: "100vh",
		gap: "0",
		padding: "0"
	},
	container: {
		width: "100%",
		background: "rgba(255, 255, 255, 0.95)",
		padding: "32px 40px",
		overflowY: "auto",
		margin: "0",
		borderRadius: "0",
		boxShadow: "0 0 60px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
		backdropFilter: "blur(30px)",
		border: "1px solid rgba(255, 255, 255, 0.3)",
		height: "100vh",
		display: "flex",
		flexDirection: "column"
	},
	header: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: "48px",
		paddingBottom: "32px",
		borderBottom: "3px solid rgba(102, 126, 234, 0.2)",
		position: "relative",
		background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(102, 126, 234, 0.08) 50%, rgba(240, 147, 251, 0.08) 100%)",
		borderRadius: "24px",
		padding: "28px",
		boxShadow: "0 12px 40px rgba(102, 126, 234, 0.2), 0 4px 12px rgba(240, 147, 251, 0.1)"
	},
	title: {
		width: "100%",
		fontSize: "58px",
		fontWeight: 900,
		border: "3px solid transparent",
		outline: "none",
		color: "#1a202c",
		margin: "0",
		background: "rgba(255, 255, 255, 0.98)",
		direction: "ltr",
		textAlign: "left",
		unicodeBidi: "embed",
		letterSpacing: "-0.03em",
		lineHeight: "1.1",
		transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
		borderRadius: "24px",
		padding: "24px 32px",
		boxShadow: "0 12px 40px rgba(102, 126, 234, 0.2), 0 4px 12px rgba(240, 147, 251, 0.1)",
		backdropFilter: "blur(30px)",
		position: "relative",
		overflow: "hidden",
		border: "2px solid rgba(102, 126, 234, 0.15)"
	},
	titleFocus: {
		background: "rgba(255, 255, 255, 0.95)",
		borderColor: "rgba(102, 126, 234, 0.5)",
		boxShadow: "0 8px 32px rgba(102, 126, 234, 0.2), 0 0 0 4px rgba(102, 126, 234, 0.1)",
		transform: "translateY(-2px) scale(1.01)"
	},
	actionButtons: {
		display: "flex",
		gap: "12px",
		alignItems: "center"
	},
	actionBtn: {
		padding: "14px 24px",
		borderRadius: "16px",
		border: "2px solid rgba(255, 255, 255, 0.3)",
		fontWeight: 700,
		fontSize: "15px",
		cursor: "pointer",
		transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
		display: "flex",
		alignItems: "center",
		gap: "10px",
		position: "relative",
		overflow: "hidden",
		backdropFilter: "blur(10px)"
	},
	saveBtn: {
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		color: "white",
		boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)",
		border: "1px solid rgba(255, 255, 255, 0.2)"
	},
	shareBtn: {
		background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
		color: "white",
		boxShadow: "0 8px 25px rgba(255, 107, 107, 0.4)",
		border: "1px solid rgba(255, 255, 255, 0.2)"
	},
	downloadBtn: {
		background: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
		color: "white",
		boxShadow: "0 8px 25px rgba(0, 210, 255, 0.4)",
		border: "1px solid rgba(255, 255, 255, 0.2)"
	},
	rightSidebar: {
		width: "380px",
		background: "rgba(247, 250, 252, 0.98)",
		padding: "32px 28px",
		borderLeft: "2px solid rgba(226, 232, 240, 0.5)",
		height: "100vh",
		overflowY: "auto",
		backdropFilter: "blur(30px)",
		margin: "0",
		borderRadius: "0",
		boxShadow: "inset 4px 0 24px rgba(102, 126, 234, 0.12), inset 2px 0 8px rgba(240, 147, 251, 0.08)"
	},
	notesGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
		gap: "20px",
		padding: "20px 0"
	},
	noteCard: {
		background: "rgba(255, 255, 255, 0.9)",
		borderRadius: "12px",
		padding: "20px",
		border: "1px solid rgba(102, 126, 234, 0.2)",
		boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
		cursor: "pointer",
		transition: "all 0.2s ease"
	},
	noteCardHover: {
		transform: "translateY(-4px)",
		boxShadow: "0 8px 24px rgba(102, 126, 234, 0.2)",
		borderColor: "rgba(102, 126, 234, 0.4)"
	},
	noteTitle: {
		fontSize: "18px",
		fontWeight: 700,
		color: "#1a202c",
		marginBottom: "8px"
	},
	notePreview: {
		fontSize: "14px",
		color: "#4a5568",
		lineHeight: "1.4",
		marginBottom: "12px",
		display: "-webkit-box",
		WebkitLineClamp: 3,
		WebkitBoxOrient: "vertical",
		overflow: "hidden"
	},
	noteDate: {
		fontSize: "12px",
		color: "#718096",
		fontWeight: 500
	},
	viewHeader: {
		display: "flex",
		alignItems: "center",
		gap: "16px",
		marginBottom: "24px",
		paddingBottom: "16px",
		borderBottom: "2px solid rgba(102, 126, 234, 0.1)"
	},
	backBtn: {
		padding: "8px 16px",
		borderRadius: "8px",
		border: "1px solid rgba(102, 126, 234, 0.3)",
		background: "rgba(102, 126, 234, 0.1)",
		color: "#667eea",
		fontWeight: 600,
		cursor: "pointer",
		transition: "all 0.2s ease"
	},
	viewTitle: {
		fontSize: "28px",
		fontWeight: 800,
		color: "#1a202c"
	},
	sidebarSection: {
		marginBottom: "24px"
	},
	sidebarTitle: {
		fontSize: "18px",
		fontWeight: 700,
		color: "#1a202c",
		marginBottom: "16px",
		display: "flex",
		alignItems: "center",
		gap: "8px"
	},
	quickActionBtn: {
		padding: "16px 20px",
		borderRadius: "16px",
		border: "2px solid",
		background: "rgba(255, 255, 255, 0.9)",
		fontWeight: 700,
		fontSize: "15px",
		cursor: "pointer",
		transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
		display: "flex",
		alignItems: "center",
		gap: "14px",
		width: "100%",
		marginBottom: "12px",
		backdropFilter: "blur(20px)",
		position: "relative",
		overflow: "hidden"
	},
	tipsContainer: {
		background: "linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)",
		borderRadius: "16px",
		padding: "20px",
		border: "1px solid rgba(102, 126, 234, 0.2)",
		boxShadow: "0 8px 20px rgba(102, 126, 234, 0.1)",
		backdropFilter: "blur(10px)"
	},
	tipItem: {
		display: "flex",
		alignItems: "flex-start",
		gap: "12px",
		marginBottom: "12px",
		padding: "8px 0"
	},
	tipIcon: {
		fontSize: "16px",
		minWidth: "20px"
	},
	tipText: {
		fontSize: "13px",
		color: "#4a5568",
		lineHeight: "1.4",
		fontWeight: 500
	},
	statsCard: {
		background: "linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)",
		borderRadius: "16px",
		padding: "20px",
		border: "1px solid rgba(102, 126, 234, 0.25)",
		boxShadow: "0 8px 20px rgba(102, 126, 234, 0.15)",
		backdropFilter: "blur(10px)"
	},
	statItem: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: "4px",
		fontSize: "14px"
	},
	statLabel: {
		color: "#4a5568",
		fontWeight: 500
	},
	statValue: {
		color: "#1a202c",
		fontWeight: 700
	},
	row: {
		display: "flex",
		alignItems: "flex-start",
		gap: 16,
		position: "relative",
		paddingLeft: 0,
		marginBottom: "12px",
		padding: "6px 12px",
		borderRadius: "20px",
		transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
	},
	rowHover: {
		background: "rgba(102, 126, 234, 0.04)",
		boxShadow: "0 2px 8px rgba(102, 126, 234, 0.08)"
	},
	dragCol: {
		width: 32,
		display: "flex",
		gap: 8,
		alignItems: "center",
		justifyContent: "flex-start",
		marginTop: 2,
		opacity: 0,
		transition: "opacity 200ms ease",
	},
	rowHoverDrag: { opacity: 1 },
	iconBtn: {
		width: 24,
		height: 24,
		borderRadius: 6,
		border: "1px solid transparent",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		cursor: "pointer",
		color: "#718096",
		background: "transparent",
		transition: "all 0.2s ease"
	},
	iconBtnHover: {
		background: "#f7fafc",
		borderColor: "#cbd5e0",
		color: "#3182ce"
	},
	blockWrap: { flex: 1, minHeight: 28, position: "relative", width: "100%" },
	block: {
		flex: 1,
		minHeight: 40,
		outline: "none",
		border: "2px solid transparent",
		background: "rgba(255, 255, 255, 0.8)",
		color: "#1a202c",
		lineHeight: 1.8,
		padding: "18px 28px",
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		direction: "ltr !important",
		textAlign: "left !important",
		unicodeBidi: "embed !important",
		writingMode: "horizontal-tb !important",
		fontSize: "20px",
		fontWeight: 400,
		borderRadius: "18px",
		transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
		position: "relative",
		backdropFilter: "blur(15px)",
		boxShadow: "0 4px 12px rgba(102, 126, 234, 0.12), 0 2px 4px rgba(240, 147, 251, 0.08)"
	},
	blockFocus: {
		background: "rgba(255, 255, 255, 0.9)",
		borderColor: "rgba(102, 126, 234, 0.4)",
		boxShadow: "0 4px 20px rgba(102, 126, 234, 0.2), 0 0 0 3px rgba(102, 126, 234, 0.1)",
		transform: "translateY(-1px)"
	},
	blockHover: {
		background: "rgba(255, 255, 255, 0.8)",
		borderColor: "rgba(102, 126, 234, 0.2)",
		boxShadow: "0 3px 12px rgba(102, 126, 234, 0.12)"
	},
	h1: { fontSize: 46, fontWeight: 900, lineHeight: 1.1, margin: "24px 0 16px", color: "#1a202c", letterSpacing: "-0.025em" },
	h2: { fontSize: 36, fontWeight: 800, lineHeight: 1.2, margin: "20px 0 12px", color: "#2d3748", letterSpacing: "-0.02em" },
	h3: { fontSize: 28, fontWeight: 700, lineHeight: 1.3, margin: "18px 0 10px", color: "#4a5568", letterSpacing: "-0.015em" },
	quote: {
		borderLeft: "6px solid rgba(102, 126, 234, 0.7)",
		paddingLeft: 24,
		color: "rgba(26, 32, 44, 0.9)",
		fontStyle: "italic",
		background: "linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)",
		borderRadius: "0 16px 16px 0",
		padding: "20px 24px",
		margin: "16px 0",
		boxShadow: "0 6px 20px rgba(102, 126, 234, 0.15)",
		position: "relative",
		backdropFilter: "blur(10px)"
	},
	bulletDot: {
		width: 10,
		height: 10,
		borderRadius: "50%",
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		marginTop: 14,
		boxShadow: "0 4px 8px rgba(102, 126, 234, 0.4)",
		border: "2px solid rgba(255, 255, 255, 0.8)"
	},
	numberBadge: {
		width: 24,
		textAlign: "right",
		color: "rgba(102, 126, 234, 0.8)",
		marginTop: 0,
		fontWeight: 600,
		fontSize: "14px"
	},
	todoBox: {
		width: 22,
		height: 22,
		borderRadius: 8,
		border: "2px solid rgba(102, 126, 234, 0.5)",
		marginTop: 8,
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		userSelect: "none",
		transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
		background: "rgba(255, 255, 255, 0.9)",
		boxShadow: "0 2px 6px rgba(102, 126, 234, 0.2)"
	},
	todoBoxChecked: {
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		color: "#fff",
		borderColor: "#667eea",
		boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
		transform: "scale(1.05)"
	},
	divider: {
		height: 2,
		background: "linear-gradient(90deg, transparent 0%, rgba(102, 126, 234, 0.3) 50%, transparent 100%)",
		margin: "16px 0",
		border: "none",
		borderRadius: "1px"
	},
	placeholder: {
		position: "absolute",
		color: "rgba(102, 126, 234, 0.4)",
		pointerEvents: "none",
		fontStyle: "italic",
		fontWeight: 500,
		left: "20px",
		top: "12px",
		transition: "all 0.3s ease",
		background: "linear-gradient(135deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.6) 100%)",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		backgroundClip: "text"
	},
	menu: {
		position: "absolute",
		zIndex: 1000,
		background: "rgba(255, 255, 255, 0.95)",
		border: "1px solid rgba(102, 126, 234, 0.2)",
		boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
		borderRadius: 16,
		minWidth: 300,
		maxHeight: 420,
		overflowY: "auto",
		padding: 12,
		backdropFilter: "blur(20px)"
	},
	menuItem: {
		padding: "12px 16px",
		borderRadius: 10,
		cursor: "pointer",
		color: "#2d3748",
		transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
		display: "flex",
		alignItems: "center",
		gap: "12px",
		marginBottom: "4px",
		position: "relative",
		overflow: "hidden"
	},
	menuItemHover: {
		background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
		color: "#667eea",
		transform: "translateX(4px)",
		boxShadow: "0 4px 12px rgba(102, 126, 234, 0.2)"
	},
	indentPad: (level) => ({ paddingLeft: `${level * 32}px` }),
};

// ——— Icons ———
const PlusIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
		<path d="M12 5v14M5 12h14" />
	</svg>
);
const DragDots = () => (
	<div style={{ fontSize: '16px', lineHeight: 1, color: 'currentColor' }}>⋮⋮</div>
);

const SaveIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
		<polyline points="17,21 17,13 7,13 7,21" />
		<polyline points="7,3 7,8 15,8" />
	</svg>
);

const ShareIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<circle cx="18" cy="5" r="3" />
		<circle cx="6" cy="12" r="3" />
		<circle cx="18" cy="19" r="3" />
		<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
		<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
	</svg>
);

const DownloadIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7,10 12,15 17,10" />
		<line x1="12" y1="15" x2="12" y2="3" />
	</svg>
);

const FormatIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<polyline points="4,7 4,4 20,4 20,7" />
		<line x1="9" y1="20" x2="15" y2="20" />
		<line x1="12" y1="4" x2="12" y2="20" />
	</svg>
);

const StatsIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<line x1="18" y1="20" x2="18" y2="10" />
		<line x1="12" y1="20" x2="12" y2="4" />
		<line x1="6" y1="20" x2="6" y2="14" />
	</svg>
);

// ——— Hooks ———
function useCaretToEnd(ref, active) {
	useEffect(() => {
		if (!active || !ref.current) return;
		ref.current.focus();
		const r = document.createRange();
		r.selectNodeContents(ref.current);
		r.collapse(false);
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(r);
	}, [active]);
}

function placeCaretAtStart(el) {
	if (!el) return;
	el.focus();
	const r = document.createRange();
	r.setStart(el, 0);
	r.collapse(true);
	const sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(r);
}

function placeCaretAtEnd(el) {
	if (!el) return;
	const r = document.createRange();
	r.selectNodeContents(el);
	r.collapse(false);
	const sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(r);
}

// ——— Slash menu ———
function SlashMenu({ open, at, onClose, onPick }) {
	const [i, setI] = useState(0);
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") return onClose();
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setI((v) => (v + 1) % BLOCK_TYPES.length);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setI((v) => (v - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length);
			} else if (e.key === "Enter") {
				e.preventDefault();
				onPick(BLOCK_TYPES[i].type);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, i, onClose, onPick]);

	if (!open) return null;
	return (
		<div className="slash-menu" style={{ ...styles.menu, left: at.x, top: at.y }}>
			{BLOCK_TYPES.map((opt, idx) => (
				<div
					key={opt.type}
					style={{ ...styles.menuItem, ...(idx === i ? styles.menuItemHover : {}) }}
					onMouseEnter={() => setI(idx)}
					onMouseDown={(e) => {
						e.preventDefault();
						onPick(opt.type);
					}}
				>
					<span style={{ fontSize: "18px" }}>{opt.icon}</span>
					<div>
						<div style={{ fontWeight: 600, fontSize: "14px" }}>{opt.label}</div>
						<div style={{ fontSize: 12, color: "rgba(74, 85, 104, 0.6)", marginTop: "2px" }}>{opt.hint}</div>
					</div>
				</div>
			))}
		</div>
	);
}

// ——— Note Card Component ———
function NoteCard({ note, onLoad }) {
	const [hovered, setHovered] = useState(false);
	const preview = note.blocks.map(b => b.text).join(' ').slice(0, 100);
	const date = new Date(note.createdAt).toLocaleDateString();

	return (
		<div
			style={{
				...styles.noteCard,
				...(hovered ? styles.noteCardHover : {})
			}}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			onClick={() => onLoad(note)}
		>
			<div style={styles.noteTitle}>{note.title}</div>
			<div style={styles.notePreview}>{preview}...</div>
			<div style={styles.noteDate}>{date}</div>
		</div>
	);
}

// ——— Right Sidebar Components ———
function QuickActions({ onSave, onShare, onDownload }) {
	const [hoveredBtn, setHoveredBtn] = useState(null);

	const actions = [
		{ key: 'save', label: 'Saved Notes', icon: '💾', color: '#667eea', action: onSave },
		{ key: 'share', label: 'Shared Notes', icon: '🔗', color: '#f5576c', action: onShare },
		{ key: 'download', label: 'Received Notes', icon: '📨', color: '#4facfe', action: onDownload },
	];

	return (
		<div style={styles.sidebarSection}>
			<div style={styles.sidebarTitle}>
				📁 My Notes
			</div>
			{actions.map((action) => (
				<button
					key={action.key}
					style={{
						...styles.quickActionBtn,
						borderColor: action.color + '40',
						color: action.color,
						...(hoveredBtn === action.key ? {
							background: action.color + '15',
							borderColor: action.color + '80',
							transform: 'translateY(-3px) scale(1.02)',
							boxShadow: `0 12px 28px ${action.color}35`
						} : {})
					}}
					onMouseEnter={() => setHoveredBtn(action.key)}
					onMouseLeave={() => setHoveredBtn(null)}
					onClick={action.action}
				>
					<span style={{ fontSize: "20px" }}>{action.icon}</span>
					{action.label}
				</button>
			))}
		</div>
	);
}

// ——— Writing Tools Component ———
function WritingTools({ fontSize, setFontSize, darkMode, setDarkMode, autoSave, setAutoSave }) {
	const [hoveredTool, setHoveredTool] = useState(null);

	return (
		<div style={styles.sidebarSection}>
			<div style={styles.sidebarTitle}>
				🛠️ Writing Tools
			</div>
			<div style={styles.tipsContainer}>
				{/* Font Size Control */}
				<div style={{ marginBottom: '16px' }}>
					<label style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '8px', display: 'block' }}>Font Size</label>
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<button
							onClick={() => setFontSize(Math.max(12, fontSize - 2))}
							style={{
								width: '32px',
								height: '32px',
								borderRadius: '8px',
								border: '1px solid rgba(102, 126, 234, 0.3)',
								background: 'rgba(102, 126, 234, 0.1)',
								color: '#667eea',
								cursor: 'pointer',
								fontWeight: 'bold'
							}}
						>-</button>
						<span style={{ minWidth: '40px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>{fontSize}px</span>
						<button
							onClick={() => setFontSize(Math.min(32, fontSize + 2))}
							style={{
								width: '32px',
								height: '32px',
								borderRadius: '8px',
								border: '1px solid rgba(102, 126, 234, 0.3)',
								background: 'rgba(102, 126, 234, 0.1)',
								color: '#667eea',
								cursor: 'pointer',
								fontWeight: 'bold'
							}}
						>+</button>
					</div>
				</div>

				{/* Theme Toggle */}
				<div style={{ marginBottom: '16px' }}>
					<label style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '8px', display: 'block' }}>Theme</label>
					<button
						onClick={() => setDarkMode(!darkMode)}
						style={{
							width: '100%',
							padding: '10px 16px',
							borderRadius: '12px',
							border: '1px solid rgba(102, 126, 234, 0.3)',
							background: darkMode ? 'rgba(45, 55, 72, 0.9)' : 'rgba(102, 126, 234, 0.1)',
							color: darkMode ? '#fff' : '#667eea',
							cursor: 'pointer',
							fontWeight: 600,
							transition: 'all 0.3s ease',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px'
						}}
					>
						{darkMode ? '🌙' : '☀️'} {darkMode ? 'Dark Mode' : 'Light Mode'}
					</button>
				</div>

				{/* Auto Save Toggle */}
				<div style={{ marginBottom: '16px' }}>
					<label style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '8px', display: 'block' }}>Auto Save</label>
					<button
						onClick={() => setAutoSave(!autoSave)}
						style={{
							width: '100%',
							padding: '10px 16px',
							borderRadius: '12px',
							border: '1px solid rgba(102, 126, 234, 0.3)',
							background: autoSave ? 'rgba(56, 161, 105, 0.15)' : 'rgba(229, 62, 62, 0.15)',
							color: autoSave ? '#38a169' : '#e53e3e',
							cursor: 'pointer',
							fontWeight: 600,
							transition: 'all 0.3s ease',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px'
						}}
					>
						{autoSave ? '✅' : '❌'} {autoSave ? 'Enabled' : 'Disabled'}
					</button>
				</div>

				{/* Word Count */}
				<div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.08)', borderRadius: '12px', textAlign: 'center' }}>
					<div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Session Stats</div>
					<div style={{ fontSize: '16px', fontWeight: 700, color: '#667eea' }}>📊 Analytics</div>
				</div>
			</div>
		</div>
	);
}



function DocumentTemplates({ onApplyTemplate }) {
	const [hoveredTemplate, setHoveredTemplate] = useState(null);

	const templates = [
		{ name: 'Meeting Notes', icon: '📝', color: '#667eea', blocks: [{ type: 'h1', text: 'Meeting Notes' }, { type: 'text', text: 'Date: ' + new Date().toLocaleDateString() }, { type: 'h2', text: 'Attendees' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Agenda' }, { type: 'numbered', text: '' }, { type: 'h2', text: 'Action Items' }, { type: 'todo', text: '' }] },
		{ name: 'Project Plan', icon: '📋', color: '#f5576c', blocks: [{ type: 'h1', text: 'Project Plan' }, { type: 'callout', text: 'Project overview and objectives' }, { type: 'h2', text: 'Goals' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Timeline' }, { type: 'numbered', text: '' }, { type: 'h2', text: 'Resources' }, { type: 'text', text: '' }] },
		{ name: 'Study Notes', icon: '📚', color: '#4facfe', blocks: [{ type: 'h1', text: 'Study Notes' }, { type: 'h2', text: 'Key Concepts' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Important Points' }, { type: 'quote', text: 'Key insight or quote' }, { type: 'h2', text: 'Questions' }, { type: 'todo', text: 'Review this topic' }] },
		{ name: 'Daily Journal', icon: '📖', color: '#38a169', blocks: [{ type: 'h1', text: 'Daily Journal' }, { type: 'text', text: new Date().toDateString() }, { type: 'h2', text: 'Today I am grateful for' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Goals for today' }, { type: 'todo', text: '' }, { type: 'h2', text: 'Reflections' }, { type: 'text', text: '' }] },
		{ name: 'Recipe', icon: '👨‍🍳', color: '#ed8936', blocks: [{ type: 'h1', text: 'Recipe Name' }, { type: 'text', text: 'Prep time: | Cook time: | Serves: ' }, { type: 'h2', text: 'Ingredients' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Instructions' }, { type: 'numbered', text: '' }, { type: 'h2', text: 'Notes' }, { type: 'text', text: '' }] },
		{ name: 'Book Review', icon: '📖', color: '#9f7aea', blocks: [{ type: 'h1', text: 'Book Review' }, { type: 'text', text: 'Title: | Author: | Rating: ⭐⭐⭐⭐⭐' }, { type: 'h2', text: 'Summary' }, { type: 'text', text: '' }, { type: 'h2', text: 'Key Takeaways' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Favorite Quotes' }, { type: 'quote', text: '' }] },
		{ name: 'Travel Plan', icon: '✈️', color: '#00d2ff', blocks: [{ type: 'h1', text: 'Travel Plan' }, { type: 'text', text: 'Destination: | Dates: ' }, { type: 'h2', text: 'Itinerary' }, { type: 'numbered', text: '' }, { type: 'h2', text: 'Packing List' }, { type: 'todo', text: '' }, { type: 'h2', text: 'Important Info' }, { type: 'callout', text: 'Emergency contacts and documents' }] },
		{ name: 'Workout Plan', icon: '💪', color: '#e53e3e', blocks: [{ type: 'h1', text: 'Workout Plan' }, { type: 'text', text: 'Date: ' + new Date().toLocaleDateString() }, { type: 'h2', text: 'Warm-up' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Main Workout' }, { type: 'numbered', text: '' }, { type: 'h2', text: 'Cool Down' }, { type: 'bulleted', text: '' }] },
		{ name: 'Bug Report', icon: '🐛', color: '#d69e2e', blocks: [{ type: 'h1', text: 'Bug Report' }, { type: 'text', text: 'Date: ' + new Date().toLocaleDateString() + ' | Priority: High/Medium/Low' }, { type: 'h2', text: 'Description' }, { type: 'text', text: '' }, { type: 'h2', text: 'Steps to Reproduce' }, { type: 'numbered', text: '' }, { type: 'h2', text: 'Expected vs Actual' }, { type: 'text', text: 'Expected: ' }, { type: 'text', text: 'Actual: ' }] },
		{ name: 'Event Planning', icon: '🎉', color: '#f093fb', blocks: [{ type: 'h1', text: 'Event Planning' }, { type: 'text', text: 'Event: | Date: | Location: ' }, { type: 'h2', text: 'Guest List' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Tasks' }, { type: 'todo', text: '' }, { type: 'h2', text: 'Budget' }, { type: 'text', text: '' }] },
		{ name: 'Creative Writing', icon: '✍️', color: '#805ad5', blocks: [{ type: 'h1', text: 'Creative Writing' }, { type: 'quote', text: 'Every story has a beginning...' }, { type: 'h2', text: 'Characters' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Plot Outline' }, { type: 'numbered', text: '' }, { type: 'h2', text: 'Setting' }, { type: 'text', text: '' }] },
		{ name: 'Research Notes', icon: '🔬', color: '#319795', blocks: [{ type: 'h1', text: 'Research Notes' }, { type: 'text', text: 'Topic: | Date: ' + new Date().toLocaleDateString() }, { type: 'h2', text: 'Hypothesis' }, { type: 'callout', text: 'Main research question' }, { type: 'h2', text: 'Sources' }, { type: 'bulleted', text: '' }, { type: 'h2', text: 'Findings' }, { type: 'text', text: '' }] }
	];

	return (
		<div style={styles.sidebarSection}>
			<div style={styles.sidebarTitle}>
				📄 Templates
			</div>
			<div style={{ ...styles.statsCard, padding: '12px', maxHeight: '450px', overflowY: 'auto' }}>
				{templates.map((template, index) => (
					<div
						key={index}
						style={{
							padding: '12px 14px',
							borderRadius: '12px',
							cursor: 'pointer',
							marginBottom: '8px',
							transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							fontSize: '14px',
							fontWeight: 600,
							background: hoveredTemplate === index ? `linear-gradient(135deg, ${template.color}15, ${template.color}25)` : 'rgba(255, 255, 255, 0.5)',
							border: `2px solid ${hoveredTemplate === index ? template.color + '40' : 'transparent'}`,
							transform: hoveredTemplate === index ? 'translateY(-2px) scale(1.02)' : 'translateY(0px) scale(1)',
							boxShadow: hoveredTemplate === index ? `0 8px 25px ${template.color}30` : '0 2px 8px rgba(0,0,0,0.1)',
							color: hoveredTemplate === index ? template.color : '#2d3748'
						}}
						onMouseEnter={() => setHoveredTemplate(index)}
						onMouseLeave={() => setHoveredTemplate(null)}
						onClick={() => onApplyTemplate(template.blocks)}
					>
						<span style={{ fontSize: '18px', minWidth: '20px' }}>{template.icon}</span>
						<span style={{ flex: 1 }}>{template.name}</span>
						{hoveredTemplate === index && (
							<span style={{ fontSize: '12px', opacity: 0.7 }}>✨</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

// ——— Block Component ———
function Block({
	block,
	index,
	numberedIndex,
	onChange,
	onEnter,
	onBackspace,
	onSlashOpen,
	onToggleTodo,
	moveFocus,
	onIndent,
	onOutdent,
	onDragStart,
	onDragOver,
	onDrop,
	fontSize = 18,
}) {
	const [hover, setHover] = useState(false);
	const [focused, setFocused] = useState(false);
	const [iconHover, setIconHover] = useState({ plus: false, drag: false });
	const [showBlockMenu, setShowBlockMenu] = useState(false);
	const ref = useRef(null);

	const styleForType = useMemo(() => {
		let base = {
			...styles.block,
			...(hover ? styles.blockHover : {}),
			...(focused ? styles.blockFocus : {})
		};
		if (block.type === 'h1') return { ...base, ...styles.h1 };
		if (block.type === 'h2') return { ...base, ...styles.h2 };
		if (block.type === 'h3') return { ...base, ...styles.h3 };
		if (block.type === 'quote') return { ...base, ...styles.quote };

		return base;
	}, [block.type, hover, focused, block.text]);

	useCaretToEnd(ref, !!block.focus);

	const placeholder = useMemo(() => {
		switch (block.type) {
			case "h1":
				return "Heading 1";
			case "h2":
				return "Heading 2";
			case "h3":
				return "Heading 3";
			case "quote":
				return "Empty quote";
			default:
				return "";
		}
	}, [block.type]);

	const handleInput = (e) => {
		const element = e.currentTarget;
		// Force LTR direction on the element
		element.dir = 'ltr';
		element.style.direction = 'ltr !important';
		element.style.textAlign = 'left !important';
		element.style.unicodeBidi = 'bidi-override !important';
		element.style.writingMode = 'horizontal-tb !important';

		// Get the text content
		const text = element.textContent || "";

		onChange(index, { text });
		
		// Force cursor to stay LTR after input
		setTimeout(() => {
			element.dir = 'ltr';
			element.style.direction = 'ltr !important';
			element.style.textAlign = 'left !important';
		}, 0);
	};

	const handleKeyDown = (e) => {
		// Arrow navigation
		if (e.key === "ArrowUp") {
			const sel = window.getSelection();
			const atStart = sel && sel.anchorOffset === 0;
			if (atStart) {
				e.preventDefault();
				moveFocus(index - 1, "end");
				return;
			}
		}
		if (e.key === "ArrowDown") {
			const sel = window.getSelection();
			const atEnd =
				sel &&
				ref.current &&
				sel.anchorNode &&
				sel.anchorOffset === (ref.current.textContent || "").length;
			if (atEnd) {
				e.preventDefault();
				moveFocus(index + 1, "end");
				return;
			}
		}

		// Enter creates next block
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (block.type === "divider") return onEnter(index, "text", block.indent);
			onEnter(index, undefined, block.indent);
			return;
		}

		// Backspace deletes empty at start
		if (e.key === "Backspace") {
			const sel = window.getSelection();
			const atStart = sel && sel.anchorOffset === 0;
			const empty = (block.text || "").trim().length === 0;
			if (atStart && empty) {
				e.preventDefault();
				onBackspace(index);
				return;
			}
		}

		// Tab / Shift+Tab for indent/outdent lists
		if (e.key === "Tab") {
			if (block.type === "bulleted" || block.type === "numbered" || block.type === "todo") {
				e.preventDefault();
				if (e.shiftKey) onOutdent(index);
				else onIndent(index);
			}
		}

		// Slash opens menu
		if (e.key === "/") {
			setTimeout(() => {
				const rect = ref.current?.getBoundingClientRect();
				if (rect) onSlashOpen(index, { x: rect.left, y: rect.bottom + 4 });
			}, 0);
		}
	};

	// Markdown-like shortcuts as user types
	useEffect(() => {
		const t = (block.text || "").trimStart();
		if (!t) return;

		// divider ---
		if (t === "---" && block.type !== "divider") {
			onChange(index, { type: "divider", text: "", focus: false });
			return;
		}
		// Headings
		if (t.startsWith("# ")) onChange(index, { type: "h1", text: t.slice(2) });
		else if (t.startsWith("## ")) onChange(index, { type: "h2", text: t.slice(3) });
		else if (t.startsWith("### ")) onChange(index, { type: "h3", text: t.slice(4) });
		// Quote
		else if (t.startsWith("> ")) onChange(index, { type: "quote", text: t.slice(2) });
		// Bulleted
		else if (t.startsWith("- ")) onChange(index, { type: "bulleted", text: t.slice(2) });
		// Numbered "1. "
		else if (/^\d+\.\s/.test(t)) onChange(index, { type: "numbered", text: t.replace(/^\d+\.\s/, "") });
		// Todo "[ ] " or "[x] "
		else if (/^\[( |x|X)\]\s/.test(t)) {
			const checked = /^\[(x|X)\]\s/.test(t);
			onChange(index, { type: "todo", text: t.replace(/^\[( |x|X)\]\s/, ""), checked });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [block.text]);

	const onPaste = (e) => {
		const text = e.clipboardData?.getData("text/plain");
		if (!text) return;
		// Simple Markdown paste split by lines and convert
		const lines = text.split(/\r?\n/);
		if (lines.length === 1) return; // let browser handle simple paste
		e.preventDefault();

		const parsed = lines.map((ln) => {
			const raw = ln;
			const t = raw.trimStart();
			// order matters for headings
			if (t === "---") return { type: "divider", text: "" };
			if (t.startsWith("### ")) return { type: "h3", text: t.slice(4) };
			if (t.startsWith("## ")) return { type: "h2", text: t.slice(3) };
			if (t.startsWith("# ")) return { type: "h1", text: t.slice(2) };
			if (/^\[( |x|X)\]\s/.test(t)) return { type: "todo", text: t.replace(/^\[( |x|X)\]\s/, ""), checked: /^\[(x|X)\]\s/.test(t) };
			if (/^\d+\.\s/.test(t)) return { type: "numbered", text: t.replace(/^\d+\.\s/, "") };
			if (/^-\s/.test(t)) return { type: "bulleted", text: t.slice(2) };
			if (/^>\s/.test(t)) return { type: "quote", text: t.slice(2) };
			return { type: "text", text: raw };
		});

		// Insert parsed blocks replacing current block
		onChange(index, { ...parsed[0], focus: false });
		if (parsed.length > 1) {
			onEnter(index, parsed[1].type);
			// we append rest sequentially
			for (let k = 2; k < parsed.length; k++) {
				onEnter(index + k - 1, parsed[k].type);
			}
			// set text afterwards to avoid caret bugs
			setTimeout(() => {
				parsed.forEach((b, j) => {
					onChange(index + j, { ...b, focus: j === parsed.length - 1 });
				});
			}, 0);
		} else {
			// just update text
			setTimeout(() => {
				onChange(index, { ...parsed[0], focus: true });
			}, 0);
		}
	};

	// Drag and drop via handle
	const dragProps = {
		draggable: true,
		onDragStart: (e) => onDragStart(e, index),
		onDragOver: (e) => onDragOver(e, index),
		onDrop: (e) => onDrop(e, index),
	};

	return (
		<div
			style={{
				...styles.row,
				...styles.indentPad(block.indent || 0),
				...(hover ? styles.rowHover : {})
			}}
			data-block-id={block.id}
			dir="ltr"
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			onDragOver={(e) => onDragOver(e, index)}
			onDrop={(e) => onDrop(e, index)}
		>
			{/* Hidden drag controls - only show on hover */}
			<div style={{ 
				...styles.dragCol, 
				...(hover ? styles.rowHoverDrag : {}),
				position: 'absolute',
				left: '-20px',
				top: '2px',
				opacity: hover ? 1 : 0,
				pointerEvents: hover ? 'auto' : 'none'
			}}>
				<div
					title="Add block"
					style={{ ...styles.iconBtn, ...(iconHover.plus ? styles.iconBtnHover : {}) }}
					onMouseEnter={() => setIconHover((s) => ({ ...s, plus: true }))}
					onMouseLeave={() => setIconHover((s) => ({ ...s, plus: false }))}
					onMouseDown={(e) => {
						e.preventDefault();
						const rect = e.currentTarget.getBoundingClientRect();
						onSlashOpen(index, { x: rect.left, y: rect.bottom + 4 });
					}}
				>
					<PlusIcon />
				</div>
				<div
					title="Drag to move or click for menu"
					style={{ ...styles.iconBtn, ...(iconHover.drag ? styles.iconBtnHover : {}) }}
					onMouseEnter={() => setIconHover((s) => ({ ...s, drag: true }))}
					onMouseLeave={() => setIconHover((s) => ({ ...s, drag: false }))}
					onClick={(e) => {
						e.preventDefault();
						setShowBlockMenu(!showBlockMenu);
					}}
					onContextMenu={(e) => {
						e.preventDefault();
						setShowBlockMenu(!showBlockMenu);
					}}
					{...dragProps}
				>
					<DragDots />
				</div>

				{/* Block Menu */}
				{showBlockMenu && (
					<div
						data-block-menu
						style={{
							position: 'absolute',
							left: '40px',
							top: '0px',
							background: 'rgba(255, 255, 255, 0.95)',
							border: '1px solid rgba(102, 126, 234, 0.2)',
							borderRadius: '12px',
							boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
							zIndex: 1000,
							minWidth: '180px',
							backdropFilter: 'blur(10px)',
							padding: '8px'
						}}
					>
						<div
							style={{
								padding: '8px 12px',
								borderRadius: '8px',
								cursor: 'pointer',
								fontSize: '14px',
								color: '#1a202c',
								transition: 'all 0.2s ease'
							}}
							onMouseEnter={(e) => e.target.style.background = 'rgba(102, 126, 234, 0.1)'}
							onMouseLeave={(e) => e.target.style.background = 'transparent'}
							onClick={() => {
								const rect = ref.current?.getBoundingClientRect();
								if (rect) onSlashOpen(index, { x: rect.left, y: rect.bottom + 4 });
								setShowBlockMenu(false);
							}}
						>
							🔄 Turn into
						</div>
						<div
							style={{
								padding: '8px 12px',
								borderRadius: '8px',
								cursor: 'pointer',
								fontSize: '14px',
								color: '#1a202c',
								transition: 'all 0.2s ease'
							}}
							onMouseEnter={(e) => e.target.style.background = 'rgba(102, 126, 234, 0.1)'}
							onMouseLeave={(e) => e.target.style.background = 'transparent'}
							onClick={() => {
								onEnter(index, block.type, block.indent);
								setShowBlockMenu(false);
							}}
						>
							📋 Duplicate
						</div>
						<div
							style={{
								padding: '8px 12px',
								borderRadius: '8px',
								cursor: 'pointer',
								fontSize: '14px',
								color: '#1a202c',
								transition: 'all 0.2s ease'
							}}
							onMouseEnter={(e) => e.target.style.background = 'rgba(102, 126, 234, 0.1)'}
							onMouseLeave={(e) => e.target.style.background = 'transparent'}
							onClick={() => {
								navigator.clipboard.writeText(window.location.href + '#block-' + block.id);
								setShowBlockMenu(false);
							}}
						>
							🔗 Copy link to block
						</div>
						<div
							style={{
								padding: '8px 12px',
								borderRadius: '8px',
								cursor: 'pointer',
								fontSize: '14px',
								color: '#e53e3e',
								transition: 'all 0.2s ease'
							}}
							onMouseEnter={(e) => e.target.style.background = 'rgba(229, 62, 62, 0.1)'}
							onMouseLeave={(e) => e.target.style.background = 'transparent'}
							onClick={() => {
								setShowBlockMenu(false);
								setTimeout(() => onBackspace(index), 0);
							}}
						>
							🗑️ Delete
						</div>
					</div>
				)}
			</div>

			{block.type === "bulleted" && <div style={styles.bulletDot} />}
			{block.type === "numbered" && (
				<div style={styles.numberBadge}>{numberedIndex}.</div>
			)}
			{block.type === "todo" && (
				<div
					style={{ ...styles.todoBox, ...(block.checked ? styles.todoBoxChecked : {}) }}
					onMouseDown={(e) => {
						e.preventDefault();
						onToggleTodo(index, !block.checked);
					}}
					title="Toggle to-do"
				>
					{block.checked ? "✓" : ""}
				</div>
			)}

			<div style={styles.blockWrap}>
				{block.type === "divider" ? (
					<hr style={styles.divider} />
				) : block.type === "callout" ? (
					<div style={{ background: 'rgba(102, 126, 234, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
						<div
							ref={ref}
							contentEditable
							suppressContentEditableWarning
							style={{ ...styleForType, fontSize: `${fontSize}px`, direction: 'ltr', textAlign: 'left' }}
							onInput={handleInput}
							onKeyDown={handleKeyDown}
							dir="ltr"
						>
							{block.text || '💡 Callout'}
						</div>
					</div>
				) : block.type === "code" ? (
					<div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid #e9ecef', fontFamily: 'monospace' }}>
						<div
							ref={ref}
							contentEditable
							suppressContentEditableWarning
							style={{ ...styleForType, fontFamily: 'monospace', fontSize: `${fontSize}px`, direction: 'ltr', textAlign: 'left' }}
							onInput={handleInput}
							onKeyDown={handleKeyDown}
							dir="ltr"
						>
							{block.text || 'Code block'}
						</div>
					</div>
				) : block.type === "toggle" ? (
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
						<span style={{ cursor: 'pointer', fontSize: '14px', marginTop: '4px' }}>▶</span>
						<div
							ref={ref}
							contentEditable
							suppressContentEditableWarning
							style={{ ...styleForType, flex: 1, fontSize: `${fontSize}px` }}
							onInput={handleInput}
							onKeyDown={handleKeyDown}
							dir="ltr"
						>
							{block.text || 'Toggle list'}
						</div>
					</div>
				) : block.type === 'image' ? (
					block.imageUrl ? (
						<div>
					<img src={block.imageUrl} alt={block.text || 'Uploaded image'} style={{ width: block.imageSize || '100%', height: 'auto', borderRadius: '8px', display: 'block' }} />
					<div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '12px' }}>
						<button onClick={() => onChange(index, { imageSize: '25%' })} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', background: block.imageSize === '25%' ? '#667eea' : '#fff', color: block.imageSize === '25%' ? '#fff' : '#333' }}>25%</button>
						<button onClick={() => onChange(index, { imageSize: '50%' })} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', background: block.imageSize === '50%' ? '#667eea' : '#fff', color: block.imageSize === '50%' ? '#fff' : '#333' }}>50%</button>
						<button onClick={() => onChange(index, { imageSize: '100%' })} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', background: block.imageSize === '100%' || !block.imageSize ? '#667eea' : '#fff', color: block.imageSize === '100%' || !block.imageSize ? '#fff' : '#333' }}>100%</button>
					</div>
				</div>
					) : (
						<div 
							style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #dee2e6', cursor: 'pointer' }}
							onClick={() => {
								const input = document.createElement('input');
								input.type = 'file';
								input.accept = 'image/*';
								input.onchange = (e) => {
									const file = e.target.files[0];
									if (file) {
										const canvas = document.createElement('canvas');
										const ctx = canvas.getContext('2d');
										const img = new Image();
										img.onload = () => {
											const maxWidth = 800;
											const scale = Math.min(1, maxWidth / img.width);
											canvas.width = img.width * scale;
											canvas.height = img.height * scale;
											ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
											const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
											onChange(index, { imageUrl: compressedUrl, text: file.name });
										};
										img.src = URL.createObjectURL(file);
									}
								};
								input.click();
							}}
						>
							<div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
							<div style={{ color: '#6c757d', fontSize: '14px' }}>Click to upload image</div>
						</div>
					)
				) : block.type === 'video' ? (
					block.videoUrl ? (
						<video src={block.videoUrl} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
					) : (
						<div 
							style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #dee2e6', cursor: 'pointer' }}
							onClick={() => {
								const input = document.createElement('input');
								input.type = 'file';
								input.accept = 'video/*';
								input.onchange = (e) => {
									const file = e.target.files[0];
									if (file) {
										const reader = new FileReader();
										reader.onload = (e) => onChange(index, { videoUrl: e.target.result, text: file.name });
										reader.readAsDataURL(file);
									}
								};
								input.click();
							}}
						>
							<div style={{ fontSize: '24px', marginBottom: '8px' }}>🎥</div>
							<div style={{ color: '#6c757d', fontSize: '14px' }}>Click to upload video</div>
						</div>
					)
				) : block.type === 'file' ? (
					block.fileUrl ? (
						<div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
							<a href={block.fileUrl} download={block.text} style={{ color: '#667eea', textDecoration: 'none' }}>📎 {block.text}</a>
						</div>
					) : (
						<div 
							style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #dee2e6', cursor: 'pointer' }}
							onClick={() => {
								const input = document.createElement('input');
								input.type = 'file';
								input.onchange = (e) => {
									const file = e.target.files[0];
									if (file) {
										const reader = new FileReader();
										reader.onload = (e) => onChange(index, { fileUrl: e.target.result, text: file.name });
										reader.readAsDataURL(file);
									}
								};
								input.click();
							}}
						>
							<div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
							<div style={{ color: '#6c757d', fontSize: '14px' }}>Click to upload file</div>
						</div>
					)
				) : block.type === 'bookmark' ? (
					block.bookmarkUrl ? (
						<div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
							<a href={block.bookmarkUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
								🔖 {block.text || block.bookmarkUrl}
							</a>
						</div>
					) : (
						<div 
							style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #dee2e6', cursor: 'pointer' }}
							onClick={() => {
								const url = prompt('Enter URL:');
								if (url) {
									const title = prompt('Enter title (optional):') || url;
									onChange(index, { bookmarkUrl: url, text: title });
								}
							}}
						>
							<div style={{ fontSize: '24px', marginBottom: '8px' }}>🔖</div>
							<div style={{ color: '#6c757d', fontSize: '14px' }}>Click to add bookmark</div>
						</div>
					)
				) : ['math', 'table', 'board', 'calendar'].includes(block.type) ? (
					<div style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #dee2e6' }}>
						<div style={{ fontSize: '24px', marginBottom: '8px' }}>
							{block.type === 'math' ? '∑' : 
							 block.type === 'table' ? '📊' : 
							 block.type === 'board' ? '📋' : '📅'}
						</div>
						<div style={{ color: '#6c757d', fontSize: '14px' }}>
							{block.type.charAt(0).toUpperCase() + block.type.slice(1)} block - Click to configure
						</div>
					</div>
				) : (
					<>

						<div
							ref={ref}
							contentEditable
							suppressContentEditableWarning
							data-placeholder={placeholder || "Type something beautiful..."}
							style={{
								...styleForType,
								direction: 'ltr',
								textAlign: 'left',
								unicodeBidi: 'bidi-override',
								writingMode: 'horizontal-tb',
								fontSize: `${fontSize}px`,
								position: 'relative'
							}}
							onInput={handleInput}
							onKeyDown={handleKeyDown}
							onPaste={onPaste}
							onFocus={() => setFocused(true)}
							onBlur={() => setFocused(false)}
							dir="ltr"
						>
							{block.text}
						</div>
					</>
				)}
			</div>
		</div>
	);
}







// ——— Collaboration Panel ———
function CollaborationPanel() {
	const [collaborators] = useState([
		{ name: '', avatar: '👨‍💼' },
		{ name: '', avatar: '👩‍💻' },
		{ name: '', avatar: '👨‍🎨' }
	]);

	return (
		<div style={styles.sidebarSection}>
			<div style={styles.sidebarTitle}>👥 Collaborators</div>
			<div style={styles.tipsContainer}>
				{collaborators.length === 0 ? (
					<div style={{
						textAlign: 'center',
						padding: '20px 0',
						color: '#718096',
						fontSize: '13px'
					}}>
						No collaborators yet
					</div>
				) : (
					collaborators.map((user, i) => (
						<div key={i} style={{
							display: 'flex',
							alignItems: 'center',
							gap: '10px',
							padding: '8px 0',
							borderBottom: i < collaborators.length - 1 ? '1px solid rgba(102, 126, 234, 0.1)' : 'none'
						}}>
							<span style={{ fontSize: '20px' }}>{user.avatar}</span>
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: '13px', fontWeight: 600, color: '#1a202c' }}>{user.name}</div>
								<div style={{ fontSize: '11px', color: user.status === 'online' ? '#38a169' : user.status === 'editing' ? '#667eea' : '#718096' }}>
									{user.status === 'online' ? '🟢 Online' : user.status === 'editing' ? '✏️ Editing' : '⚫ Offline'}
								</div>
							</div>
						</div>
					))
				)}
				<button style={{
					width: '100%',
					padding: '8px 12px',
					marginTop: '12px',
					border: '1px dashed rgba(102, 126, 234, 0.4)',
					borderRadius: '8px',
					background: 'rgba(102, 126, 234, 0.05)',
					color: '#667eea',
					fontSize: '13px',
					cursor: 'pointer'
				}}>
					+ Invite Collaborator
				</button>
			</div>
		</div>
	);
}

// ——— Main Page ———
export default function NotionLikeProPage() {
	// Force LTR direction globally
	useEffect(() => {
		const style = document.createElement('style');
		style.textContent = `
			* {
				direction: ltr !important;
				text-direction: ltr !important;
			}
			[contenteditable] {
				direction: ltr !important;
				text-align: left !important;
				unicode-bidi: bidi-override !important;
				writing-mode: horizontal-tb !important;
			}
			input {
				direction: ltr !important;
				text-align: left !important;
				unicode-bidi: bidi-override !important;
			}
			body, html {
				direction: ltr !important;
			}
		`;
		document.head.appendChild(style);

		// Force document direction
		document.documentElement.dir = 'ltr';
		document.body.dir = 'ltr';

		// Force keyboard input to be LTR
		const forceLTR = (e) => {
			if (e.target.contentEditable === 'true' || e.target.tagName === 'INPUT') {
				e.target.style.direction = 'ltr';
				e.target.style.textAlign = 'left';
				e.target.dir = 'ltr';
				e.target.style.unicodeBidi = 'bidi-override';
				e.target.style.writingMode = 'horizontal-tb';
			}
		};
		document.addEventListener('keydown', forceLTR);
		document.addEventListener('input', forceLTR);
		document.addEventListener('focus', forceLTR, true);
		document.addEventListener('click', forceLTR);

		return () => {
			document.head.removeChild(style);
			document.removeEventListener('keydown', forceLTR);
			document.removeEventListener('input', forceLTR);
			document.removeEventListener('focus', forceLTR, true);
			document.removeEventListener('click', forceLTR);
		};
	}, []);

	const [currentView, setCurrentView] = useState('editor'); // 'editor', 'saved', 'shared', 'received', 'settings'
	const [title, setTitle] = useState("");
	const [blocks, setBlocks] = useState([
		{ id: uid(), type: "text", text: "", focus: true, indent: 0 },
	]);
	const [fontSize, setFontSize] = useState(18);
	const [darkMode, setDarkMode] = useState(false);
	const [autoSave, setAutoSave] = useState(true);
	const [lastSaved, setLastSaved] = useState(null);

	// Slash menu
	const [menu, setMenu] = useState({ open: false, at: { x: 0, y: 0 }, forIndex: -1 });

	// Numbering for numbered lists (resets on non-numbered)
	const numberedMap = useMemo(() => {
		let n = 0;
		return blocks.map((b) => {
			if (b.type === "numbered") {
				n += 1;
				return n;
			}
			n = 0;
			return null;
		});
	}, [blocks]);

	const updateBlock = (index, patch) => {
		setBlocks((prev) =>
			prev.map((b, i) => (i === index ? { ...b, ...patch, focus: patch.focus ?? b.focus } : b))
		);
	};

	const addBlock = (index, type = "text", indent = 0) => {
		const newBlock = { id: uid(), type, text: "", focus: true, indent };
		setBlocks((prev) => {
			const copy = [...prev];
			copy.splice(index + 1, 0, newBlock);
			return copy;
		});
	};

	const removeBlock = (index) => {
		if (blocks.length === 1) return;
		// merge with previous if possible
		const prev = blocks[index - 1];
		const curr = blocks[index];
		if (prev && prev.type !== "divider") {
			const mergedText = (prev.text || "") + (curr.text || "");
			setBlocks((list) => {
				const copy = [...list];
				copy[index - 1] = { ...prev, text: mergedText, focus: true };
				copy.splice(index, 1);
				return copy;
			});
		} else {
			setBlocks((list) => list.filter((_, i) => i !== index));
		}
	};

	const toggleTodo = (index, next) => updateBlock(index, { checked: next });

	const openSlashMenu = (index, at) => setMenu({ open: true, at, forIndex: index });
	const closeSlashMenu = () => setMenu((m) => ({ ...m, open: false }));

	const applyTypeFromMenu = (type) => {
		const i = menu.forIndex;
		if (i < 0) return;
		if (type === "divider") {
			setBlocks((prev) => {
				const copy = [...prev];
				copy.splice(i + 1, 0, { id: uid(), type: "divider", text: "", indent: 0 });
				return copy;
			});
		} else {
			updateBlock(i, { type });
		}
		closeSlashMenu();
	};

	useEffect(() => {
		const onDocClick = (e) => {
			// Don't close if clicking on + buttons, slash menu, or plus icons in blocks
			if (e.target.closest('.inline-plus') ||
				e.target.closest('.final-plus') ||
				e.target.closest('[data-block-menu]') ||
				e.target.closest('.slash-menu') ||
				e.target.closest('[title="Add block"]')) {
				return;
			}
			closeSlashMenu();
		};
		document.addEventListener("click", onDocClick);
		return () => document.removeEventListener("click", onDocClick);
	}, []);

	// Focus movement for ArrowUp/Down
	const moveFocus = (toIndex, where = "end") => {
		if (toIndex < 0 || toIndex >= blocks.length) return;
		// Delay to ensure DOM updated
		requestAnimationFrame(() => {
			const el = document.querySelector(`[data-block-id="${blocks[toIndex].id}"]`);
			if (el) {
				if (where === "start") placeCaretAtStart(el);
				else placeCaretAtEnd(el);
			}
		});
	};

	// Indent logic
	const indentAt = (i) => {
		setBlocks((prev) =>
			prev.map((b) => (b.id === blocks[i].id ? { ...b, indent: Math.min((b.indent || 0) + 1, 12) } : b))
		);
	};
	const outdentAt = (i) => {
		setBlocks((prev) =>
			prev.map((b) => (b.id === blocks[i].id ? { ...b, indent: Math.max((b.indent || 0) - 1, 0) } : b))
		);
	};

	// Drag and drop reorder
	const dragIndexRef = useRef(null);
	const onDragStart = (e, index) => {
		dragIndexRef.current = index;
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", String(index));
	};
	const onDragOver = (e, index) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};
	const onDrop = (e, index) => {
		e.preventDefault();
		const from = dragIndexRef.current ?? Number(e.dataTransfer.getData("text/plain"));
		const to = index;
		if (Number.isNaN(from) || from === to) return;
		setBlocks((prev) => {
			const copy = [...prev];
			const [moved] = copy.splice(from, 1);
			copy.splice(to, 0, moved);
			return copy;
		});
		dragIndexRef.current = null;
	};

	// Attach data-block-id for caret targeting
	useEffect(() => {
		blocks.forEach((b) => {
			// find the editable node for each block
			const node = document.querySelector(`[data-block-id="${b.id}"]`);
			if (!node) return;
		});
	}, [blocks]);

	// Auto-save functionality
	useEffect(() => {
		if (!autoSave) return;
		const timer = setTimeout(() => {
			if (title.trim() || blocks.some(b => b.text?.trim())) {
				const documentData = {
					id: Date.now(),
					title: title || 'Untitled',
					blocks,
					type: 'autosaved',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
				localStorage.setItem('autosaved-document', JSON.stringify(documentData));
				setLastSaved(new Date());
			}
		}, 3000);
		return () => clearTimeout(timer);
	}, [title, blocks, autoSave]);



	// Action handlers
	const handleSave = () => {
		if (!title.trim() && blocks.every(b => !b.text?.trim())) {
			alert('Cannot save empty document!');
			return;
		}
		const documentData = {
			id: Date.now(),
			title: title || 'Untitled',
			blocks,
			type: 'saved',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
		savedNotes.push(documentData);
		localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
		setLastSaved(new Date());
		alert(`Document "${documentData.title}" saved successfully!`);
	};

	const handleShare = () => {
		if (!title.trim() && blocks.every(b => !b.text?.trim())) {
			alert('Cannot share empty document!');
			return;
		}
		const documentData = {
			id: Date.now(),
			title: title || 'Untitled',
			blocks,
			type: 'shared',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const sharedNotes = JSON.parse(localStorage.getItem('sharedNotes') || '[]');
		sharedNotes.push(documentData);
		localStorage.setItem('sharedNotes', JSON.stringify(sharedNotes));

		const shareText = blocks.map(block => block.text || '').filter(text => text.trim()).join('\n');

		if (navigator.share) {
			navigator.share({
				title: documentData.title,
				text: shareText
			}).then(() => {
				alert(`Document "${documentData.title}" shared successfully!`);
			}).catch(() => {
				navigator.clipboard.writeText(shareText);
				alert('Document copied to clipboard!');
			});
		} else {
			navigator.clipboard.writeText(shareText).then(() => {
				alert(`Document "${documentData.title}" copied to clipboard!`);
			}).catch(() => {
				alert('Failed to copy to clipboard');
			});
		}
	};

	const handleDownload = () => {
		if (!title.trim() && blocks.every(b => !b.text?.trim())) {
			alert('Cannot download empty document!');
			return;
		}
		const content = blocks.map(block => {
			if (block.type === 'divider') return '---';
			if (block.type === 'h1') return `# ${block.text || ''}`;
			if (block.type === 'h2') return `## ${block.text || ''}`;
			if (block.type === 'h3') return `### ${block.text || ''}`;
			if (block.type === 'quote') return `> ${block.text || ''}`;
			if (block.type === 'bulleted') return `- ${block.text || ''}`;
			if (block.type === 'numbered') return `1. ${block.text || ''}`;
			if (block.type === 'todo') return `- [${block.checked ? 'x' : ' '}] ${block.text || ''}`;
			return block.text || '';
		}).filter(line => line.trim()).join('\n\n');

		const filename = (title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const blob = new Blob([content], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${filename}.md`;
		a.click();
		URL.revokeObjectURL(url);
		alert(`Document downloaded as "${filename}.md"`);
	};

	const loadNote = (note) => {
		setTitle(note.title);
		setBlocks(note.blocks);
		setCurrentView('editor');
	};

	const getNotes = (type) => {
		return JSON.parse(localStorage.getItem(`${type}Notes`) || '[]');
	};

	// Add some demo received notes on first load
	useEffect(() => {
		const receivedNotes = localStorage.getItem('receivedNotes');
		if (!receivedNotes) {
			const demoNotes = [
				{
					id: 1,
					title: 'Welcome to Notepad',
					blocks: [{ id: uid(), type: 'text', text: 'This is a demo received note. You can edit and save it!', focus: false, indent: 0 }],
					type: 'received',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				}
			];
			localStorage.setItem('receivedNotes', JSON.stringify(demoNotes));
		}
	}, []);



	const renderNotesView = (type, title) => {
		const notes = getNotes(type);
		return (
			<div style={styles.container}>
				<div style={styles.viewHeader}>
					<button
						style={styles.backBtn}
						onClick={() => setCurrentView('editor')}
					>
						← Back to Editor
					</button>
					<h1 style={styles.viewTitle}>{title}</h1>
				</div>
				{notes.length === 0 ? (
					<div style={{ textAlign: 'center', padding: '60px 20px', color: '#718096' }}>
						<div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
						<h3>No {type} notes yet</h3>
						<p>Start creating and {type === 'saved' ? 'saving' : type === 'shared' ? 'sharing' : 'receiving'} notes to see them here.</p>
					</div>
				) : (
					<div style={styles.notesGrid}>
						{notes.map((note) => (
							<NoteCard key={note.id} note={note} onLoad={loadNote} />
						))}
					</div>
				)}
			</div>
		);
	};

	// render
	return (
		<div style={styles.page} dir="ltr">
			{/* Floating background elements */}
			<div style={{
				position: 'absolute',
				top: '10%',
				left: '5%',
				width: '100px',
				height: '100px',
				background: 'rgba(255, 255, 255, 0.1)',
				borderRadius: '50%',
				animation: 'float 6s ease-in-out infinite',
				pointerEvents: 'none'
			}} />
			<div style={{
				position: 'absolute',
				top: '60%',
				right: '8%',
				width: '80px',
				height: '80px',
				background: 'rgba(255, 255, 255, 0.08)',
				borderRadius: '50%',
				animation: 'float 8s ease-in-out infinite reverse',
				pointerEvents: 'none'
			}} />
			<div style={{
				position: 'absolute',
				top: '30%',
				right: '20%',
				width: '60px',
				height: '60px',
				background: 'rgba(255, 255, 255, 0.06)',
				borderRadius: '50%',
				animation: 'float 10s ease-in-out infinite',
				pointerEvents: 'none'
			}} />
			<style>{`
				@keyframes float {
					0%, 100% { transform: translateY(0px) rotate(0deg); }
					50% { transform: translateY(-20px) rotate(180deg); }
				}
				@keyframes typing-glow {
					0%, 100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15); }
					50% { box-shadow: 0 6px 25px rgba(102, 126, 234, 0.25); }
				}
				@keyframes placeholder-pulse {
					0%, 100% { opacity: 0.5; }
					50% { opacity: 0.8; }
				}
				.title-focus::placeholder {
					background: linear-gradient(135deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.6) 100%);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					font-weight: 600;
					font-style: italic;
					animation: placeholder-pulse 3s ease-in-out infinite;
				}
				.title-focus:focus::placeholder {
					opacity: 0.8;
					transform: translateY(-1px);
					animation: none;
				}
				[contenteditable]:focus {
					animation: typing-glow 2s ease-in-out infinite;
				}
				[contenteditable]:empty:before {
					content: attr(data-placeholder);
					color: rgba(102, 126, 234, 0.4);
					font-style: italic;
					pointer-events: none;
					animation: placeholder-pulse 3s ease-in-out infinite;
				}
				[contenteditable]:focus:empty:before {
					animation: none;
					opacity: 0.6;
				}
			`}</style>
			<div style={styles.mainLayout}>
				{currentView === 'editor' ? (
					<>
					<div style={styles.container}>
						{/* Description Header */}
						<div style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							marginBottom: '32px',
							padding: '16px 24px',
							background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
							borderRadius: '16px',
							border: '2px solid rgba(102, 126, 234, 0.2)',
							boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)'
						}}>
							<span style={{ fontSize: '24px' }}>📄</span>
							<h2 style={{
								fontSize: '28px',
								fontWeight: 800,
								color: '#1a202c',
								margin: 0
							}}>Description</h2>
							<button style={{
								padding: '8px 16px',
								borderRadius: '12px',
								border: '2px solid rgba(102, 126, 234, 0.3)',
								background: 'rgba(102, 126, 234, 0.1)',
								color: '#667eea',
								fontWeight: 600,
								fontSize: '14px',
								cursor: 'pointer',
								transition: 'all 0.2s ease'
							}}>Temp</button>
						</div>
						<div style={styles.header}>
							<input
								style={{
									...styles.title,
									...(title ? {} : { color: 'rgba(102, 126, 234, 0.6)' })
								}}
								className="title-focus"
								placeholder="✨ Start typing your amazing document title..."
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								onFocus={(e) => {
									e.target.style.background = 'rgba(255, 255, 255, 0.98)';
									e.target.style.borderColor = 'rgba(102, 126, 234, 0.6)';
									e.target.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.25), 0 0 0 4px rgba(102, 126, 234, 0.1)';
									e.target.style.transform = 'translateY(-3px) scale(1.01)';
								}}
								onBlur={(e) => {
									e.target.style.background = 'rgba(255, 255, 255, 0.9)';
									e.target.style.borderColor = 'transparent';
									e.target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.1)';
									e.target.style.transform = 'translateY(0px) scale(1)';
								}}
								dir="ltr"
							/>
							<div style={styles.actionButtons}>
								<button
									style={{ ...styles.actionBtn, ...styles.saveBtn }}
									onClick={handleSave}
									onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
									onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
								>
									<SaveIcon />
									Save
								</button>
								<button
									style={{ ...styles.actionBtn, ...styles.shareBtn }}
									onClick={handleShare}
									onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
									onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
								>
									<ShareIcon />
									Share
								</button>
								<button
									style={{ ...styles.actionBtn, ...styles.downloadBtn }}
									onClick={handleDownload}
									onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
									onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
								>
									<DownloadIcon />
									Download
								</button>
								<button
									style={{
										...styles.actionBtn,
										background: "linear-gradient(135deg, #805ad5 0%, #9f7aea 100%)",
										color: "white",
										boxShadow: "0 8px 25px rgba(128, 90, 213, 0.4)",
										border: "1px solid rgba(255, 255, 255, 0.2)"
									}}
									onClick={() => setCurrentView('settings')}
									onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
									onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
								>
									⚙️ Settings
								</button>
							</div>
							{/* Status Bar */}
							<div style={{
								position: 'absolute',
								right: '0',
								top: '100%',
								display: 'flex',
								gap: '16px',
								alignItems: 'center',
								fontSize: '12px',
								color: '#718096',
								marginTop: '8px'
							}}>
								{autoSave && lastSaved && (
									<span>🟢 Auto-saved at {lastSaved.toLocaleTimeString()}</span>
								)}
							</div>
						</div>

						{/* Expanded Typing Area */}
						<div style={{ 
							marginTop: '24px',
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							minHeight: 'calc(100vh - 300px)'
						}}>
							{blocks.map((b, i) => (
								<div key={b.id}>
									{/* Inline + button between blocks */}
									{i > 0 && (
										<div
											style={{
												position: 'relative',
												height: '12px',
												display: 'flex',
												alignItems: 'center',
												paddingLeft: '24px'
											}}
											onMouseEnter={(e) => {
												const btn = e.currentTarget.querySelector('.inline-plus');
												if (btn) btn.style.opacity = '1';
											}}
											onMouseLeave={(e) => {
												const btn = e.currentTarget.querySelector('.inline-plus');
												if (btn) btn.style.opacity = '0';
											}}
										>
											<button
												className="inline-plus"
												style={{
													position: 'absolute',
													left: '0px',
													width: '20px',
													height: '20px',
													borderRadius: '4px',
													border: '1px solid rgba(102, 126, 234, 0.3)',
													background: 'rgba(255, 255, 255, 0.9)',
													color: 'rgba(102, 126, 234, 0.8)',
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													opacity: '0',
													transition: 'all 0.2s ease',
													fontSize: '14px',
													fontWeight: 'bold'
												}}
												onMouseEnter={(e) => {
													e.target.style.background = 'rgba(102, 126, 234, 0.1)';
													e.target.style.borderColor = 'rgba(102, 126, 234, 0.6)';
													e.target.style.transform = 'scale(1.1)';
												}}
												onMouseLeave={(e) => {
													e.target.style.background = 'rgba(255, 255, 255, 0.9)';
													e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)';
													e.target.style.transform = 'scale(1)';
												}}
												onMouseDown={(e) => {
													e.preventDefault();
													const rect = e.target.getBoundingClientRect();
													openSlashMenu(i - 1, { x: rect.left, y: rect.bottom + 4 });
												}}
											>
												+
											</button>
										</div>
									)}

									<div data-block-id={b.id}>
										<Block
											block={b}
											index={i}
											numberedIndex={numberedMap[i] ?? undefined}
											onChange={updateBlock}
											onEnter={addBlock}
											onBackspace={removeBlock}
											onSlashOpen={openSlashMenu}
											onToggleTodo={toggleTodo}
											moveFocus={moveFocus}
											onIndent={indentAt}
											onOutdent={outdentAt}
											onDragStart={onDragStart}
											onDragOver={onDragOver}
											onDrop={onDrop}
											fontSize={fontSize}
										/>
									</div>
								</div>
							))}

							{/* Final + button at the end */}
							<div
								style={{
									position: 'relative',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									paddingLeft: '24px',
									marginTop: '8px'
								}}
								onMouseEnter={(e) => {
									const btn = e.currentTarget.querySelector('.final-plus');
									if (btn) btn.style.opacity = '1';
								}}
								onMouseLeave={(e) => {
									const btn = e.currentTarget.querySelector('.final-plus');
									if (btn) btn.style.opacity = '0';
								}}
							>
								<button
									className="final-plus"
									style={{
										position: 'absolute',
										left: '0px',
										width: '20px',
										height: '20px',
										borderRadius: '4px',
										border: '1px solid rgba(102, 126, 234, 0.3)',
										background: 'rgba(255, 255, 255, 0.9)',
										color: 'rgba(102, 126, 234, 0.8)',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										opacity: '0',
										transition: 'all 0.2s ease',
										fontSize: '14px',
										fontWeight: 'bold'
									}}
									onMouseEnter={(e) => {
										e.target.style.background = 'rgba(102, 126, 234, 0.1)';
										e.target.style.borderColor = 'rgba(102, 126, 234, 0.6)';
										e.target.style.transform = 'scale(1.1)';
									}}
									onMouseLeave={(e) => {
										e.target.style.background = 'rgba(255, 255, 255, 0.9)';
										e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)';
										e.target.style.transform = 'scale(1)';
									}}
									onMouseDown={(e) => {
										e.preventDefault();
										const rect = e.target.getBoundingClientRect();
										openSlashMenu(blocks.length - 1, { x: rect.left, y: rect.bottom + 4 });
									}}
								>
									+
								</button>
							</div>
						</div>

						<SlashMenu
							open={menu.open}
							at={menu.at}
							onClose={closeSlashMenu}
							onPick={applyTypeFromMenu}
						/>
					</div>
					{/* Enhanced Right Sidebar */}
					<div style={styles.rightSidebar}>
						<QuickActions 
							onSave={() => setCurrentView('saved')}
							onShare={() => setCurrentView('shared')}
							onDownload={() => setCurrentView('received')}
						/>
						<WritingTools 
							fontSize={fontSize}
							setFontSize={setFontSize}
							darkMode={darkMode}
							setDarkMode={setDarkMode}
							autoSave={autoSave}
							setAutoSave={setAutoSave}
						/>
						<DocumentTemplates onApplyTemplate={(blocks) => {
							setBlocks(blocks.map(b => ({ ...b, id: uid(), focus: false })));
							setTitle('');
						}} />
						<CollaborationPanel />
					</div>
				</>
				) : null}
				{currentView === 'saved' && renderNotesView('saved', '💾 Saved Notes')}
				{currentView === 'shared' && renderNotesView('shared', '🔗 Shared Notes')}
				{currentView === 'received' && renderNotesView('received', '📨 Received Notes')}
				{currentView === 'settings' && (
					<div style={styles.container}>
						<div style={styles.viewHeader}>
							<button
								style={styles.backBtn}
								onClick={() => setCurrentView('editor')}
							>
								← Back to Editor
							</button>
							<h1 style={styles.viewTitle}>⚙️ Settings</h1>
						</div>
						<div style={{ padding: '20px 0' }}>
							<div style={styles.tipsContainer}>
								<h3 style={{ marginBottom: '16px', color: '#1a202c' }}>Preferences</h3>
								<WritingTools 
									fontSize={fontSize}
									setFontSize={setFontSize}
									darkMode={darkMode}
									setDarkMode={setDarkMode}
									autoSave={autoSave}
									setAutoSave={setAutoSave}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
