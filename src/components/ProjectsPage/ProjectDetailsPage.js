import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Flag, User, Calendar, Users, CheckCircle, Clock, AlertCircle, X,
  BarChart3, MessageSquare, Paperclip, Activity, Send, Plus,
  TrendingUp, Award, FileText, Edit3, Save, ArrowLeft,
  Star, Zap, Timer, Eye, Heart, Share2, MoreHorizontal, GripVertical,
  Trash2, Circle, Tag
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

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
  { type: "table", label: "Table", hint: "Create a table", icon: "▦" },
  { type: "quote", label: "Quote", hint: "Call out a quote", icon: "💬" },
  { type: "divider", label: "Divider", hint: "Horizontal rule", icon: "➖" },
  { type: "callout", label: "Callout", hint: "Highlighted text box", icon: "💡" },
  { type: "image", label: "Image", hint: "Upload an image", icon: "🖼️" },
  { type: "video", label: "Video", hint: "Upload a video", icon: "🎥" }
];

// ——— Icons ———
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const DragDots = () => (
  <div style={{ fontSize: '16px', lineHeight: 1, color: 'currentColor' }}>⋮⋮</div>
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
function SlashMenu({ open, at, onClose, onPick, isDarkMode }) {
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
    <div
      style={{
        position: 'fixed',
        zIndex: 1000,
        background: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(102, 126, 234, 0.2)'}`,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        borderRadius: 16,
        minWidth: 300,
        maxHeight: 420,
        overflowY: 'auto',
        padding: 12,
        backdropFilter: 'blur(20px)',
        left: at.x,
        top: at.y
      }}
    >
      {BLOCK_TYPES.map((opt, idx) => (
        <div
          key={opt.type}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            cursor: 'pointer',
            color: isDarkMode ? '#e5e7eb' : '#2d3748',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '4px',
            position: 'relative',
            overflow: 'hidden',
            background: idx === i ? (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(102, 126, 234, 0.1)') : 'transparent',
            transform: idx === i ? 'translateX(4px)' : 'translateX(0px)',
            boxShadow: idx === i ? '0 4px 12px rgba(102, 126, 234, 0.2)' : 'none'
          }}
          onMouseEnter={() => setI(idx)}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(opt.type);
          }}
        >
          <span style={{ fontSize: '18px' }}>{opt.icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{opt.label}</div>
            <div style={{ fontSize: 12, color: isDarkMode ? 'rgba(156, 163, 175, 0.8)' : 'rgba(74, 85, 104, 0.6)', marginTop: '2px' }}>{opt.hint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ——— Block Component ———
function DescriptionBlock({
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
  isDarkMode = false,
}) {
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [iconHover, setIconHover] = useState({ plus: false, drag: false });
  const ref = useRef(null);

  const blockStyles = {
    row: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      position: 'relative',
      paddingLeft: (block.indent || 0) * 32,
      marginBottom: '0px',
      padding: '1px 0px',
      transition: 'all 0.2s ease',
      background: 'transparent'
    },
    dragCol: {
      width: 24,
      display: 'flex',
      gap: 3,
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginTop: 2,
      opacity: hover ? 1 : 0,
      transition: 'opacity 200ms ease',
      position: 'absolute',
      left: '-32px',
      top: '2px'
    },
    iconBtn: {
      width: 24,
      height: 24,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: isDarkMode ? '#9ca3af' : '#718096',
      background: 'transparent',
      transition: 'all 0.2s ease',
      fontSize: '12px'
    },
    iconBtnHover: {
      background: 'transparent',
      color: isDarkMode ? '#60a5fa' : '#3182ce',
      transform: 'scale(1.1) translateY(-1px)',
      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
    },
    block: {
      flex: 1,
      minHeight: 28,
      outline: 'none',
      border: 'none',
      background: 'transparent',
      color: isDarkMode ? '#f3f4f6' : '#1a202c',
      lineHeight: 1.4,
      padding: '4px 12px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      direction: 'ltr',
      textAlign: 'left',
      fontSize: '16px',
      fontWeight: 400,
      transition: 'all 0.2s ease',
      position: 'relative'
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: isDarkMode ? '#9ca3af' : '#4a5568',
      marginTop: 10
    },
    numberBadge: {
      width: 20,
      textAlign: 'right',
      color: isDarkMode ? '#9ca3af' : '#4a5568',
      marginTop: 0,
      fontWeight: 600,
      fontSize: '14px'
    },
    todoBox: {
      width: 16,
      height: 16,
      borderRadius: 4,
      border: `2px solid ${isDarkMode ? '#6b7280' : '#9ca3af'}`,
      marginTop: 6,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      transition: 'all 0.2s ease',
      background: block.checked ? (isDarkMode ? '#6b7280' : '#9ca3af') : 'transparent',
      color: block.checked ? '#fff' : 'transparent',
      fontSize: '10px'
    },
    divider: {
      height: 1,
      background: isDarkMode ? '#374151' : '#e5e7eb',
      margin: '4px 0',
      border: 'none'
    }
  };

  useCaretToEnd(ref, !!block.focus);

  const placeholder = useMemo(() => {
    switch (block.type) {
      case "h1": return "Heading 1";
      case "h2": return "Heading 2";
      case "h3": return "Heading 3";
      case "quote": return "Quote";
      case "bulleted": return "List item";
      case "numbered": return "List item";
      case "todo": return "To-do item";
      case "table": return "Table content";
      case "callout": return "Callout";
      case "image": return "Upload an image";
      case "video": return "Upload a video";
      default: return "Type something...";
    }
  }, [block.type]);

  const handleInput = (e) => {
    const text = e.currentTarget.textContent || "";
    onChange(index, { text });
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      const sel = window.getSelection();
      if (sel && sel.anchorOffset === 0) {
        e.preventDefault();
        moveFocus(index - 1, "end");
      }
    } else if (e.key === "ArrowDown") {
      const sel = window.getSelection();
      const atEnd = sel && ref.current && sel.anchorOffset === (ref.current.textContent || "").length;
      if (atEnd) {
        e.preventDefault();
        moveFocus(index + 1, "end");
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter(index, block.type === "divider" ? "text" : undefined, block.indent);
    } else if (e.key === "Backspace") {
      const sel = window.getSelection();
      const atStart = sel && sel.anchorOffset === 0;
      const empty = (block.text || "").trim().length === 0;
      if (atStart && empty) {
        e.preventDefault();
        onBackspace(index);
      }
    } else if (e.key === "Tab") {
      if (["bulleted", "numbered", "todo"].includes(block.type)) {
        e.preventDefault();
        if (e.shiftKey) onOutdent(index);
        else onIndent(index);
      }
    } else if (e.key === "/") {
      setTimeout(() => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) onSlashOpen(index, { x: rect.left, y: rect.bottom + 4 });
      }, 0);
    }
  };

  // Auto-format typed shortcuts
  useEffect(() => {
    const t = (block.text || "").trimStart();
    if (!t) return;

    if (t === "---" && block.type !== "divider") {
      onChange(index, { type: "divider", text: "", focus: false });
      // Add a new line after formatting
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("# ") && block.type !== "h1") {
      onChange(index, { type: "h1", text: t.slice(2) });
      // Add a new line after formatting
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("## ") && block.type !== "h2") {
      onChange(index, { type: "h2", text: t.slice(3) });
      // Add a new line after formatting
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("### ") && block.type !== "h3") {
      onChange(index, { type: "h3", text: t.slice(4) });
      // Add a new line after formatting
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("> ") && block.type !== "quote") {
      onChange(index, { type: "quote", text: t.slice(2) });
      // Add a new line after formatting
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("- ") && block.type !== "bulleted") {
      onChange(index, { type: "bulleted", text: t.slice(2) });
      // Add a new line after formatting
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (/^\d+\.\s/.test(t) && block.type !== "numbered") {
      onChange(index, { type: "numbered", text: t.replace(/^\d+\.\s/, "") });
      // Add a new line after formatting
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (/^\[( |x|X)\]\s/.test(t) && block.type !== "todo") {
      const checked = /^\[(x|X)\]\s/.test(t);
      onChange(index, { type: "todo", text: t.replace(/^\[( |x|X)\]\s/, ""), checked });
      // Add a new line after formatting
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("| ") && block.type !== "table") {
      onChange(index, {
        type: "table",
        text: "",
        rows: [[t.slice(2), "", ""]]
      });
      // Add a new line after formatting
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    }
  }, [block.text, onChange, index, onEnter]);

  const getBlockStyle = () => {
    let style = { ...blockStyles.block };
    if (block.type === 'h1') {
      style = { ...style, fontSize: '24px', fontWeight: 700, margin: '8px 0 4px' };
    } else if (block.type === 'h2') {
      style = { ...style, fontSize: '20px', fontWeight: 600, margin: '6px 0 3px' };
    } else if (block.type === 'h3') {
      style = { ...style, fontSize: '18px', fontWeight: 600, margin: '4px 0 2px' };
    } else if (block.type === 'quote') {
      style = {
        ...style,
        paddingLeft: 16,
        fontStyle: 'italic'
      };
    } else if (block.type === 'callout') {
      style = {
        ...style,
        padding: '8px 16px'
      };
    } else if (block.type === 'divider') {
      style = {
        ...style,
        height: 1,
        background: isDarkMode ? '#374151' : '#e5e7eb',
        margin: '4px 0',
        border: 'none'
      };
    } else if (block.type === 'table') {
      style = {
        ...style,
        padding: '0',
        minHeight: 'auto'
      };
    }
    return style;
  };

  return (
    <div
      style={blockStyles.row}
      data-block-id={block.id}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Drag controls */}
      <div style={blockStyles.dragCol}>
        <div
          title="Add block"
          style={{ ...blockStyles.iconBtn, ...(iconHover.plus ? blockStyles.iconBtnHover : {}) }}
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
          title="Drag to move"
          style={{ ...blockStyles.iconBtn, ...(iconHover.drag ? blockStyles.iconBtnHover : {}) }}
          onMouseEnter={() => setIconHover((s) => ({ ...s, drag: true }))}
          onMouseLeave={() => setIconHover((s) => ({ ...s, drag: false }))}
          draggable
          onDragStart={(e) => onDragStart(e, index)}
          onDragOver={(e) => onDragOver(e, index)}
          onDrop={(e) => onDrop(e, index)}
        >
          <DragDots />
        </div>
      </div>

      {/* Block type indicators */}
      {block.type === "bulleted" && <div style={blockStyles.bulletDot} />}
      {block.type === "numbered" && (
        <div style={blockStyles.numberBadge}>{numberedIndex}.</div>
      )}
      {block.type === "todo" && (
        <div
          style={blockStyles.todoBox}
          onMouseDown={(e) => {
            e.preventDefault();
            onToggleTodo(index, !block.checked);
          }}
          title="Toggle to-do"
        >
          {block.checked ? "✓" : ""}
        </div>
      )}

      {/* Block content */}
      <div style={{ flex: 1 }}>
        {block.type === "divider" ? (
          <hr style={blockStyles.divider} />
        ) : block.type === "image" ? (
          block.imageUrl ? (
            <div style={{ position: 'relative' }}>
              <img
                src={block.imageUrl}
                alt={block.text || 'Uploaded image'}
                style={{
                  width: block.imageSize || '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block',
                  maxWidth: '100%'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '12px' }}>
                <button
                  onClick={() => onChange(index, { imageSize: '25%' })}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: block.imageSize === '25%' ? '#667eea' : '#fff',
                    color: block.imageSize === '25%' ? '#fff' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  25%
                </button>
                <button
                  onClick={() => onChange(index, { imageSize: '50%' })}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: block.imageSize === '50%' ? '#667eea' : '#fff',
                    color: block.imageSize === '50%' ? '#fff' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  50%
                </button>
                <button
                  onClick={() => onChange(index, { imageSize: '100%' })}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: block.imageSize === '100%' || !block.imageSize ? '#667eea' : '#fff',
                    color: block.imageSize === '100%' || !block.imageSize ? '#fff' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  100%
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                background: isDarkMode ? '#374151' : '#f8f9fa',
                borderRadius: '8px',
                border: `2px dashed ${isDarkMode ? '#6b7280' : '#dee2e6'}`,
                cursor: 'pointer',
                color: isDarkMode ? '#9ca3af' : '#6c757d'
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      onChange(index, { imageUrl: e.target.result, text: file.name });
                      // Automatically add a new line after image upload
                      setTimeout(() => {
                        onEnter(index, 'text', 0);
                      }, 100);
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
              <div style={{ fontSize: '14px' }}>Click to upload image</div>
            </div>
          )
        ) : block.type === "table" ? (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: isDarkMode ? '#1f2937' : '#ffffff',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <tbody>
                {(block.rows || [["", "", ""]]).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={{
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          padding: '8px 12px',
                          textAlign: 'left',
                          color: isDarkMode ? '#f3f4f6' : '#1f2937',
                          minWidth: '100px'
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newRows = [...(block.rows || [["", "", ""]])];
                          newRows[rowIndex][cellIndex] = e.target.textContent;
                          onChange(index, { rows: newRows });
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const currentRows = block.rows || [["", "", ""]];
                  const newRows = [...currentRows, Array(currentRows[0]?.length || 3).fill("")];
                  onChange(index, { rows: newRows });
                }}
                style={{
                  padding: '4px 8px',
                  background: isDarkMode ? '#374151' : '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                + Add Row
              </button>
              <button
                onClick={() => {
                  const currentRows = block.rows || [["", "", ""]];
                  const newRows = currentRows.map(row => [...row, ""]);
                  onChange(index, { rows: newRows });
                }}
                style={{
                  padding: '4px 8px',
                  background: isDarkMode ? '#374151' : '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                + Add Column
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            data-placeholder={placeholder}
            style={getBlockStyle()}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            {block.text}
          </div>
        )}
      </div>
    </div >
  );
}

const ProjectDetailsPage = ({ project, onClose, onUpdate, isManager, isNewProject = false }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saveStatus, setSaveStatus] = useState({});
  const autoSaveTimeoutRef = useRef({});
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  // Enhanced project data
  const [projectData, setProjectData] = useState({
    ...project,
    progress: 0,
    updateCount: project.updateCount || 0,
    isFavorite: project.isFavorite || false,
    metrics: {
      timeSpent: '24h 30m',
      completionRate: getProgressPercentage(project.status),
      daysRemaining: getDaysRemaining(project.startDate, project.endDate),
      priority: project.priority || 'Medium'
    },
    team: [
      { id: 1, name: 'John Doe', role: 'Lead', avatar: 'JD', status: 'active' },
      { id: 2, name: 'Jane Smith', role: 'Developer', avatar: 'JS', status: 'active' },
      { id: 3, name: 'Mike Johnson', role: 'Designer', avatar: 'MJ', status: 'away' }
    ]
  });



  // Add state for timeline and tags editing
  const [editingTimeline, setEditingTimeline] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [timelineData, setTimelineData] = useState({
    startDate: project.startDate || '',
    endDate: project.endDate || ''
  });
  const [tagsData, setTagsData] = useState(project.tags || ['Project', 'High Priority']);

  // Function to apply a template
  const applyTemplate = (templateBlocks) => {
    // Clear existing blocks and add template blocks
    const newBlocks = templateBlocks.map(block => ({
      id: uid(),
      ...block,
      focus: false
    }));

    // Add a new empty block at the end
    newBlocks.push({ id: uid(), type: "text", text: "", focus: true });

    setDescriptionBlocks(newBlocks);
    setShowTemplateDropdown(false);
  };

  // Template options
  const templates = [
    {
      id: 'project_plan',
      name: 'Project Plan',
      icon: '📋',
      description: 'Standard project planning template'
    },
    {
      id: 'meeting_notes',
      name: 'Meeting Notes',
      icon: '📝',
      description: 'Structure for documenting meetings'
    },
    {
      id: 'research_paper',
      name: 'Research Paper',
      icon: '📚',
      description: 'Academic research paper structure'
    },
    {
      id: 'product_spec',
      name: 'Product Specification',
      icon: '📱',
      description: 'Template for product specifications'
    },
    {
      id: 'retrospective',
      name: 'Retrospective',
      icon: '🔍',
      description: 'Project retrospective template'
    },
    {
      id: 'brainstorming',
      name: 'Brainstorming',
      icon: '💡',
      description: 'Ideas and brainstorming session'
    },
    {
      id: 'sprint_planning',
      name: 'Sprint Planning',
      icon: '🏃',
      description: 'Agile sprint planning template'
    },
    {
      id: 'user_story',
      name: 'User Story',
      icon: '👤',
      description: 'User story template for features'
    },
    {
      id: 'bug_report',
      name: 'Bug Report',
      icon: '🐛',
      description: 'Template for reporting bugs'
    },
    {
      id: 'release_notes',
      name: 'Release Notes',
      icon: '📢',
      description: 'Release notes template'
    }
  ];

  const [tasks, setTasks] = useState([
    { id: 1, text: 'Define project requirements', completed: true, assignee: 'John Doe', priority: 'High', dueDate: '2024-01-20' },
    { id: 2, text: 'Create project plan', completed: false, assignee: 'Jane Smith', priority: 'Medium', dueDate: '2024-01-25' },
    { id: 3, text: 'Set up development environment', completed: false, assignee: 'Mike Johnson', priority: 'Low', dueDate: '2024-01-30' }
  ]);

  const [comments, setComments] = useState([
    { id: 1, text: 'This project aligns perfectly with our Q1 objectives. Great work on the planning phase!', user: 'Manager', timestamp: new Date().toISOString(), reactions: ['👍', '🎯'] },
    { id: 2, text: 'I suggest we add more specific metrics to track our progress better.', user: 'John Doe', timestamp: new Date().toISOString(), reactions: ['💡'] }
  ]);

  const [activities, setActivities] = useState([
    { id: 1, user: 'John Doe', action: 'completed milestone "Initial Planning"', timestamp: new Date().toISOString(), type: 'milestone' },
    { id: 2, user: 'Jane Smith', action: 'added 3 new tasks', timestamp: new Date().toISOString(), type: 'task' },
    { id: 3, user: 'Manager', action: 'updated priority to High', timestamp: new Date().toISOString(), type: 'update' }
  ]);

  const [newComment, setNewComment] = useState('');
  const [newTask, setNewTask] = useState({ text: '', assignee: '', priority: 'Medium', dueDate: '' });
  const [showAddTask, setShowAddTask] = useState(false);

  // Block-based description editor state
  const [descriptionBlocks, setDescriptionBlocks] = useState([
    { id: uid(), type: "text", text: "", focus: true, indent: 0 },
  ]);
  const [menu, setMenu] = useState({ open: false, at: { x: 0, y: 0 }, forIndex: -1 });

  const navigate = useNavigate();

  // Delete project function
  const handleDeleteProject = async () => {
    if (!projectData.id) {
      console.error('No project ID found');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${projectData.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await apiService.delete(`/projects/${projectData.id}`);

      // Show success message
      alert('Project deleted successfully!');

      // Navigate back to projects page
      onClose();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Block management functions
  const numberedMap = useMemo(() => {
    let n = 0;
    return descriptionBlocks.map((b) => {
      if (b.type === "numbered") {
        n += 1;
        return n;
      }
      n = 0;
      return null;
    });
  }, [descriptionBlocks]);

  const updateBlock = (index, patch) => {
    setDescriptionBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch, focus: patch.focus ?? b.focus } : b))
    );
  };

  const addBlock = (index, type = "text", indent = 0) => {
    const newBlock = { id: uid(), type, text: "", focus: true, indent };
    setDescriptionBlocks((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, newBlock);
      return copy;
    });
  };

  const removeBlock = (index) => {
    if (descriptionBlocks.length === 1) return;
    const prev = descriptionBlocks[index - 1];
    const curr = descriptionBlocks[index];
    if (prev && prev.type !== "divider") {
      const mergedText = (prev.text || "") + (curr.text || "");
      setDescriptionBlocks((list) => {
        const copy = [...list];
        copy[index - 1] = { ...prev, text: mergedText, focus: true };
        copy.splice(index, 1);
        return copy;
      });
    } else {
      setDescriptionBlocks((list) => list.filter((_, i) => i !== index));
    }
  };

  const toggleTodo = (index, next) => updateBlock(index, { checked: next });

  const openSlashMenu = (index, at) => setMenu({ open: true, at, forIndex: index });
  const closeSlashMenu = () => setMenu((m) => ({ ...m, open: false }));

  const applyTypeFromMenu = (type) => {
    const i = menu.forIndex;
    if (i < 0) return;
    if (type === "divider") {
      setDescriptionBlocks((prev) => {
        const copy = [...prev];
        copy.splice(i + 1, 0, { id: uid(), type: "divider", text: "", indent: 0 });
        return copy;
      });
    } else if (type === "table") {
      updateBlock(i, { type: "table", text: "", rows: [["", "", ""]] });
    } else {
      updateBlock(i, { type });
    }
    closeSlashMenu();
  };

  const moveFocus = (toIndex, where = "end") => {
    if (toIndex < 0 || toIndex >= descriptionBlocks.length) return;
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-block-id="${descriptionBlocks[toIndex].id}"]`);
      if (el) {
        if (where === "start") placeCaretAtStart(el);
        else placeCaretAtEnd(el);
      }
    });
  };

  const indentAt = (i) => {
    setDescriptionBlocks((prev) =>
      prev.map((b) => (b.id === descriptionBlocks[i].id ? { ...b, indent: Math.min((b.indent || 0) + 1, 6) } : b))
    );
  };

  const outdentAt = (i) => {
    setDescriptionBlocks((prev) =>
      prev.map((b) => (b.id === descriptionBlocks[i].id ? { ...b, indent: Math.max((b.indent || 0) - 1, 0) } : b))
    );
  };

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
    setDescriptionBlocks((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
    dragIndexRef.current = null;
  };

  // Initialize blocks from existing description
  useEffect(() => {
    if (projectData.description && descriptionBlocks.length === 1 && !descriptionBlocks[0].text) {
      const lines = projectData.description.split('\n');
      const blocks = lines.map((line, i) => {
        const trimmed = line.trimStart();
        let type = "text";
        let text = line;
        let checked = false;
        let indent = 0;

        // Calculate indent level
        const leadingSpaces = line.length - line.trimStart().length;
        indent = Math.floor(leadingSpaces / 2);

        // Detect block types
        if (trimmed === "---") {
          type = "divider";
          text = "";
        } else if (trimmed.startsWith("### ")) {
          type = "h3";
          text = trimmed.slice(4);
        } else if (trimmed.startsWith("## ")) {
          type = "h2";
          text = trimmed.slice(3);
        } else if (trimmed.startsWith("# ")) {
          type = "h1";
          text = trimmed.slice(2);
        } else if (/^\[( |x|X)\]\s/.test(trimmed)) {
          type = "todo";
          checked = /^\[(x|X)\]\s/.test(trimmed);
          text = trimmed.replace(/^\[( |x|X)\]\s/, "");
        } else if (/^\d+\.\s/.test(trimmed)) {
          type = "numbered";
          text = trimmed.replace(/^\d+\.\s/, "");
        } else if (/^-\s/.test(trimmed)) {
          type = "bulleted";
          text = trimmed.slice(2);
        } else if (/^>\s/.test(trimmed)) {
          type = "quote";
          text = trimmed.slice(2);
        } else if (trimmed.startsWith("| ")) {
          type = "table";
          text = trimmed.slice(2);
        }

        return {
          id: uid(),
          type,
          text,
          checked,
          indent,
          focus: false,
          ...(type === 'table' && { rows: [["", "", ""]] })
        };
      });

      if (blocks.length > 0) {
        setDescriptionBlocks(blocks);
      }
    }
  }, [projectData.description]);

  // Update project description when blocks change - only local state
  useEffect(() => {
    const description = descriptionBlocks.map(block => {
      const indentStr = '  '.repeat(block.indent || 0);
      if (block.type === 'divider') return indentStr + '---';
      if (block.type === 'h1') return indentStr + `# ${block.text || ''}`;
      if (block.type === 'h2') return indentStr + `## ${block.text || ''}`;
      if (block.type === 'h3') return indentStr + `### ${block.text || ''}`;
      if (block.type === 'quote') return indentStr + `> ${block.text || ''}`;
      if (block.type === 'bulleted') return indentStr + `- ${block.text || ''}`;
      if (block.type === 'numbered') return indentStr + `1. ${block.text || ''}`;
      if (block.type === 'todo') return indentStr + `- [${block.checked ? 'x' : ' '}] ${block.text || ''}`;
      if (block.type === 'table') return indentStr + `| ${block.text || ''}`;
      return indentStr + (block.text || '');
    }).join('\n');

    if (description !== projectData.description) {
      const updatedProject = { ...projectData, description };
      setProjectData(updatedProject);
      // Don't auto-update - only update local state
    }
  }, [descriptionBlocks]);

  // Close slash menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (e.target.closest('.slash-menu') || e.target.closest('[title="Add block"]')) {
        return;
      }
      closeSlashMenu();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Close template dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close the template dropdown when clicking inside a table cell
      const isTableCell = event.target.closest('td');
      const isTemplateDropdown = event.target.closest('.template-dropdown');
      const isButton = event.target.closest('button');

      if (showTemplateDropdown && !isTableCell && !isTemplateDropdown && !isButton) {
        setShowTemplateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTemplateDropdown]);

  // Listen for selected users from user management page
  useEffect(() => {
    console.log('Checking for selected users in session storage...');
    const selectedUsers = sessionStorage.getItem('selectedProjectUsers');
    console.log('Session storage selectedProjectUsers:', selectedUsers);

    if (selectedUsers) {
      console.log('Found selected users, updating project:', selectedUsers);
      const updatedProject = { ...projectData, forPerson: selectedUsers };
      console.log('Updated project data:', updatedProject);
      setProjectData(updatedProject);
      sessionStorage.removeItem('selectedProjectUsers');
      // Force re-render by calling onUpdate
      setTimeout(() => {
        onUpdate && onUpdate(updatedProject);
      }, 100);
    } else {
      console.log('No selected users found in session storage');
    }
  }, []);

  // Reset update counter when manager views the project
  useEffect(() => {
    if (isManager && !isNewProject && projectData.updateCount > 0) {
      const resetUpdates = async () => {
        try {
          const updatedProject = { ...projectData, updateCount: 0 };
          setProjectData(updatedProject);

          if (projectData.id && projectData.id !== 'new') {
            await apiService.put(`/projects/${projectData.id}`, { updateCount: 0 });
          }

          onUpdate && onUpdate(updatedProject);
        } catch (error) {
          console.error('Failed to reset update counter:', error);
        }
      };

      // Reset after a short delay to ensure the page has loaded
      const timer = setTimeout(resetUpdates, 1000);
      return () => clearTimeout(timer);
    }
  }, [isManager, isNewProject, projectData.id]);

  // Update timelineData and tagsData when projectData changes
  useEffect(() => {
    setTimelineData({
      startDate: projectData.startDate || '',
      endDate: projectData.endDate || ''
    });
    setTagsData(projectData.tags || ['Project', 'High Priority']);
  }, [projectData]);

  function getProgressPercentage(status) {
    switch (status) {
      case 'Done': return 100;
      case 'In progress': return 60;
      case 'Not started': return 0;
      default: return 0;
    }
  }

  function getDaysRemaining(startDate, endDate) {
    if (!endDate) return null;

    const today = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = new Date(endDate);

    // If project hasn't started yet, calculate days until start
    if (start && today < start) {
      const daysUntilStart = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
      return `${daysUntilStart} until start`;
    }

    // If project has ended
    if (today > end) {
      const daysOverdue = Math.ceil((today - end) / (1000 * 60 * 60 * 24));
      return `${daysOverdue} days overdue`;
    }

    // Calculate remaining days
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return '1 day left';
    } else {
      return `${diffDays} days left`;
    }
  }

  const handleFieldEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  // Auto-save function - now only updates local state
  const autoSaveField = async (field, value) => {
    if (!value || value === projectData[field]) return;

    // Only update local state - don't save to backend
    const updatedProject = {
      ...projectData,
      [field]: value
    };
    setProjectData(updatedProject);
  };

  // Manual update function
  const handleUpdateProject = async () => {
    if (!projectData.id || projectData.id === 'new') return;

    setSaveStatus(prev => ({ ...prev, project: 'saving' }));

    try {
      const updatedProject = {
        ...projectData,
        updateCount: (projectData.updateCount || 0) + 1
      };

      await apiService.put(`/projects/${projectData.id}`, updatedProject);

      setProjectData(updatedProject);
      onUpdate && onUpdate(updatedProject);
      setSaveStatus(prev => ({ ...prev, project: 'saved' }));

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, project: null }));
      }, 2000);
    } catch (error) {
      console.error('Update failed:', error);
      setSaveStatus(prev => ({ ...prev, project: 'error' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, project: null }));
      }, 3000);
    }
  };

  // Handle field change with auto-save
  const handleFieldChange = (field, value) => {
    setEditValue(value);

    // Clear existing timeout
    if (autoSaveTimeoutRef.current[field]) {
      clearTimeout(autoSaveTimeoutRef.current[field]);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current[field] = setTimeout(() => {
      autoSaveField(field, value);
    }, 1000);
  };

  const handleFieldSave = async (field) => {
    // Clear timeout and save immediately
    if (autoSaveTimeoutRef.current[field]) {
      clearTimeout(autoSaveTimeoutRef.current[field]);
    }

    await autoSaveField(field, editValue);
    setEditingField(null);
    setEditValue('');
  };

  // Save status indicator component
  const SaveStatusIndicator = ({ field }) => {
    const status = saveStatus[field];
    if (!status) return null;

    return (
      <div className="flex items-center gap-1 text-xs">
        {status === 'saving' && (
          <>
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-600">Saving...</span>
          </>
        )}
        {status === 'saved' && (
          <>
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-green-600">Saved</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-3 h-3 text-red-600" />
            <span className="text-red-600">Error</span>
          </>
        )}
      </div>
    );
  };

  // Add new functions for timeline and tags editing
  const handleTimelineEdit = () => {
    setEditingTimeline(true);
  };

  const handleTimelineSave = async () => {
    try {
      const updatedProject = {
        ...projectData,
        startDate: timelineData.startDate,
        endDate: timelineData.endDate
      };
      setProjectData(updatedProject);

      // If it's an existing project (not new), update in backend
      if (projectData.id && projectData.id !== 'new') {
        await apiService.put(`/projects/${projectData.id}`, {
          startDate: timelineData.startDate,
          endDate: timelineData.endDate
        });
      }

      // Call parent update handler
      onUpdate && onUpdate(updatedProject);

      setEditingTimeline(false);
    } catch (error) {
      console.error('Error updating timeline:', error);
      alert('Failed to update timeline. Please try again.');
    }
  };

  const handleTagsEdit = () => {
    setEditingTags(true);
  };

  const handleTagsSave = async () => {
    try {
      const updatedProject = {
        ...projectData,
        tags: tagsData
      };
      setProjectData(updatedProject);

      // If it's an existing project (not new), update in backend
      if (projectData.id && projectData.id !== 'new') {
        await apiService.put(`/projects/${projectData.id}`, {
          tags: tagsData
        });
      }

      // Call parent update handler
      onUpdate && onUpdate(updatedProject);

      setEditingTags(false);
    } catch (error) {
      console.error('Error updating tags:', error);
      alert('Failed to update tags. Please try again.');
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now(),
      text: newComment,
      user: user?.name || 'You',
      timestamp: new Date().toISOString(),
      reactions: []
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const addTask = () => {
    if (!newTask.text.trim()) return;
    const task = {
      id: Date.now(),
      ...newTask,
      completed: false
    };
    setTasks(prev => {
      const updatedTasks = [...prev, task];

      // Recalculate progress
      const completedTasks = updatedTasks.filter(task => task.completed).length;
      const totalTasks = updatedTasks.length;
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setProjectData(prevData => ({
        ...prevData,
        progress: newProgress,
        updateCount: (prevData.updateCount || 0) + 1
      }));

      return updatedTasks;
    });
    setNewTask({ text: '', assignee: '', priority: 'Medium', dueDate: '' });
    setShowAddTask(false);
  };

  const toggleTask = (taskId) => {
    setTasks(prev => {
      const updatedTasks = prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );

      // Calculate progress based on completed tasks
      const completedTasks = updatedTasks.filter(task => task.completed).length;
      const totalTasks = updatedTasks.length;
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Update project progress and increment update counter
      setProjectData(prev => ({
        ...prev,
        progress: newProgress,
        updateCount: (prev.updateCount || 0) + 1
      }));

      return updatedTasks;
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleToggleFavorite = () => {
    const updatedProject = { ...projectData, isFavorite: !projectData.isFavorite };
    setProjectData(updatedProject);
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'text-green-600 bg-green-100';
      case 'In progress': return 'text-blue-600 bg-blue-100';
      case 'Not started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Block editor styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${isDarkMode ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)'};
          font-style: italic;
          pointer-events: none;
        }
        [contenteditable]:focus:empty:before {
          opacity: 0.7;
        }
        .slash-menu {
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode ? '#6b7280 transparent' : '#d1d5db transparent'};
        }
        .slash-menu::-webkit-scrollbar {
          width: 6px;
        }
        .slash-menu::-webkit-scrollbar-track {
          background: transparent;
        }
        .slash-menu::-webkit-scrollbar-thumb {
          background-color: ${isDarkMode ? '#6b7280' : '#d1d5db'};
          border-radius: 3px;
        }
        .slash-menu::-webkit-scrollbar-thumb:hover {
          background-color: ${isDarkMode ? '#9ca3af' : '#9ca3af'};
        }
      `}</style>
      {/* Header */}
      <div className={`flex-shrink-0 border-b backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 border-gray-700' : 'bg-gradient-to-r from-white/95 via-blue-50/95 to-white/95 border-gray-200'
        }`}>
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
                  <Flag className={`w-8 h-8 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    {editingField === 'name' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className={`text-3xl font-bold bg-transparent border-b-2 focus:outline-none transition-all duration-300 px-2 py-1 rounded-lg ${isDarkMode
                            ? 'border-blue-400 text-white focus:border-blue-300 focus:bg-gray-800/50'
                            : 'border-blue-500 text-gray-900 focus:border-blue-600 focus:bg-blue-50/30'
                            }`}
                          style={{
                            caretColor: '#3b82f6',
                            fontFamily: 'Inter, system-ui, sans-serif'
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleFieldSave('name');
                            } else if (e.key === 'Escape') {
                              setEditingField(null);
                              setEditValue('');
                            }
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleFieldSave('name')} className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors" title="Save">
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingField(null);
                            setEditValue('');
                          }}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold">{projectData.name || (isNewProject ? 'New Project' : 'Untitled Project')}</h1>
                        {isManager && (
                          <button
                            onClick={() => handleFieldEdit('name', projectData.name)}
                            className={`p-2 rounded-lg transition-all duration-200 border ${isDarkMode
                              ? 'text-blue-400 hover:text-white hover:bg-gray-700 border-gray-600 hover:border-blue-400'
                              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-gray-300 hover:border-blue-500'
                              } shadow-sm hover:shadow-md`}
                            title="Edit project name"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(projectData.status)}`}>
                      {projectData.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(projectData.priority)}`}>
                      {projectData.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Update Indicator */}
              {!isNewProject && projectData.updateCount > 0 && (
                <div className="relative">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold animate-pulse">
                    {projectData.updateCount > 99 ? '99+' : projectData.updateCount}
                  </div>
                </div>
              )}

              {isNewProject ? (
                <button
                  onClick={() => {
                    if (projectData.name && projectData.name.trim()) {
                      onUpdate && onUpdate(projectData);
                    }
                  }}
                  disabled={!projectData.name || !projectData.name.trim()}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${projectData.name && projectData.name.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  Create Project
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleFavorite}
                      className={`p-2 rounded-lg transition-colors ${projectData.isFavorite
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                        }`}
                      title={projectData.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-5 h-5 ${projectData.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <div className={`h-8 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                  <div className="flex items-center gap-2">
                    {isManager && (
                      <button
                        onClick={handleDeleteProject}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Overall Progress
            </span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{projectData.progress}%</span>
          </div>
          <div className={`w-full h-4 rounded-full shadow-inner ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className="h-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 shadow-lg"
              style={{ width: `${projectData.progress}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="flex space-x-8 px-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle, count: tasks.length },
              { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
              { id: 'files', label: 'Files', icon: Paperclip },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? (isDarkMode ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600')
                    : (isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700')
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8 pb-16">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <p className="text-2xl font-bold">{projectData.status}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`w-4 h-4 ${projectData.metrics.daysRemaining?.includes('overdue') ? 'text-red-500' :
                        projectData.metrics.daysRemaining?.includes('today') ? 'text-yellow-500' :
                          projectData.metrics.daysRemaining?.includes('until start') ? 'text-blue-500' :
                            'text-orange-500'
                        }`} />
                      <span className="text-sm font-medium">Timeline</span>
                    </div>
                    <p className={`text-lg font-bold ${projectData.metrics.daysRemaining?.includes('overdue') ? 'text-red-600' :
                      projectData.metrics.daysRemaining?.includes('today') ? 'text-yellow-600' :
                        projectData.metrics.daysRemaining?.includes('until start') ? 'text-blue-600' :
                          ''
                      }`}>{projectData.metrics.daysRemaining || 'No end date'}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Priority</span>
                    </div>
                    <p className="text-2xl font-bold">{projectData.priority}</p>
                  </div>
                </div>

                {/* Project Description */}
                <div className={`p-12 rounded-3xl border-2 min-h-[700px] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <FileText className="w-6 h-6 text-blue-500" />
                      Description
                    </h3>
                    <div className="relative template-dropdown">
                      <button
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                        onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                      >
                        Temp
                      </button>

                      {/* Template Dropdown */}
                      {showTemplateDropdown && (
                        <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg z-10 border max-h-96 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          <div className="py-2">
                            <div className={`px-4 py-2 text-sm font-semibold border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              Choose a template
                            </div>
                            {templates.map((template) => (
                              <button
                                key={template.id}
                                className={`w-full text-left px-4 py-3 hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors flex items-start gap-3`}
                                onClick={() => {
                                  let templateBlocks = [];

                                  switch (template.id) {
                                    case 'project_plan':
                                      templateBlocks = [
                                        { type: "h1", text: "Project Plan" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Project Overview" },
                                        { type: "text", text: "Brief description of the project..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Goals & Objectives" },
                                        { type: "bulleted", text: "Primary goal" },
                                        { type: "bulleted", text: "Secondary goals" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Timeline" },
                                        { type: "text", text: "Key milestones and deadlines..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Team & Responsibilities" },
                                        { type: "bulleted", text: "Team member 1 - Role" },
                                        { type: "bulleted", text: "Team member 2 - Role" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Resources" },
                                        { type: "text", text: "Required resources and budget..." }
                                      ];
                                      break;

                                    case 'meeting_notes':
                                      templateBlocks = [
                                        { type: "h1", text: "Meeting Notes" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Date & Time" },
                                        { type: "text", text: "Date: " },
                                        { type: "text", text: "Time: " },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Attendees" },
                                        { type: "bulleted", text: "Name (Role)" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Agenda" },
                                        { type: "numbered", text: "First agenda item" },
                                        { type: "numbered", text: "Second agenda item" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Discussion Notes" },
                                        { type: "text", text: "Key points discussed..." },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Action Items" },
                                        { type: "todo", text: "Task 1", checked: false },
                                        { type: "todo", text: "Task 2", checked: false },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Next Meeting" },
                                        { type: "text", text: "Date: " }
                                      ];
                                      break;

                                    case 'research_paper':
                                      templateBlocks = [
                                        { type: "h1", text: "Research Paper Title" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Abstract" },
                                        { type: "text", text: "Brief summary of the research..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Introduction" },
                                        { type: "text", text: "Background and context..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Literature Review" },
                                        { type: "text", text: "Review of existing research..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Methodology" },
                                        { type: "text", text: "Research methods and approach..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Results" },
                                        { type: "text", text: "Findings and data analysis..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Discussion" },
                                        { type: "text", text: "Interpretation of results..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Conclusion" },
                                        { type: "text", text: "Summary and implications..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "References" },
                                        { type: "text", text: "[1] Reference 1" },
                                        { type: "text", text: "[2] Reference 2" }
                                      ];
                                      break;

                                    case 'product_spec':
                                      templateBlocks = [
                                        { type: "h1", text: "Product Specification" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Overview" },
                                        { type: "text", text: "Product name and brief description..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Features" },
                                        { type: "bulleted", text: "Key feature 1" },
                                        { type: "bulleted", text: "Key feature 2" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Technical Requirements" },
                                        { type: "text", text: "Technical specifications..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "User Stories" },
                                        { type: "text", text: "As a [user], I want [goal] so that [benefit]" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Design Mockups" },
                                        { type: "text", text: "Visual representations..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Acceptance Criteria" },
                                        { type: "todo", text: "Criteria 1", checked: false },
                                        { type: "todo", text: "Criteria 2", checked: false }
                                      ];
                                      break;

                                    case 'retrospective':
                                      templateBlocks = [
                                        { type: "h1", text: "Project Retrospective" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "What Went Well" },
                                        { type: "bulleted", text: "Positive aspect 1" },
                                        { type: "bulleted", text: "Positive aspect 2" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "What Didn't Go Well" },
                                        { type: "bulleted", text: "Challenge 1" },
                                        { type: "bulleted", text: "Challenge 2" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Improvements for Next Time" },
                                        { type: "numbered", text: "Improvement 1" },
                                        { type: "numbered", text: "Improvement 2" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Action Items" },
                                        { type: "todo", text: "Follow-up task 1", checked: false },
                                        { type: "todo", text: "Follow-up task 2", checked: false }
                                      ];
                                      break;

                                    case 'brainstorming':
                                      templateBlocks = [
                                        { type: "h1", text: "Brainstorming Session" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Date & Participants" },
                                        { type: "text", text: "Date: " },
                                        { type: "text", text: "Participants: " },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Topic" },
                                        { type: "text", text: "Main topic or problem to solve..." },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Ideas" },
                                        { type: "bulleted", text: "Idea 1" },
                                        { type: "bulleted", text: "Idea 2" },
                                        { type: "bulleted", text: "Idea 3" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Evaluation" },
                                        { type: "text", text: "Assessment of ideas..." },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Next Steps" },
                                        { type: "todo", text: "Action item 1", checked: false },
                                        { type: "todo", text: "Action item 2", checked: false }
                                      ];
                                      break;

                                    case 'sprint_planning':
                                      templateBlocks = [
                                        { type: "h1", text: "Sprint Planning" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Sprint Goals" },
                                        { type: "text", text: "Main objectives for this sprint..." },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Team Capacity" },
                                        { type: "text", text: "Available hours: " },
                                        { type: "text", text: "Team members: " },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "User Stories" },
                                        { type: "bulleted", text: "Story 1 - Priority: High" },
                                        { type: "bulleted", text: "Story 2 - Priority: Medium" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Tasks" },
                                        { type: "todo", text: "Task 1", checked: false },
                                        { type: "todo", text: "Task 2", checked: false },
                                        { type: "todo", text: "Task 3", checked: false },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Definition of Done" },
                                        { type: "text", text: "Criteria for completion..." }
                                      ];
                                      break;

                                    case 'user_story':
                                      templateBlocks = [
                                        { type: "h1", text: "User Story" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Title" },
                                        { type: "text", text: "Brief, descriptive title..." },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "User Role" },
                                        { type: "text", text: "Who will use this feature?" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "User Need" },
                                        { type: "text", text: "What does the user want to accomplish?" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "User Benefit" },
                                        { type: "text", text: "Why is this important to the user?" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Acceptance Criteria" },
                                        { type: "todo", text: "Criterion 1", checked: false },
                                        { type: "todo", text: "Criterion 2", checked: false },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Notes" },
                                        { type: "text", text: "Additional information..." }
                                      ];
                                      break;

                                    case 'bug_report':
                                      templateBlocks = [
                                        { type: "h1", text: "Bug Report" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Summary" },
                                        { type: "text", text: "Brief description of the bug..." },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Steps to Reproduce" },
                                        { type: "numbered", text: "Step 1" },
                                        { type: "numbered", text: "Step 2" },
                                        { type: "numbered", text: "Step 3" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Expected Result" },
                                        { type: "text", text: "What should happen?" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Actual Result" },
                                        { type: "text", text: "What actually happens?" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Environment" },
                                        { type: "text", text: "Browser/OS: " },
                                        { type: "text", text: "Version: " },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Priority" },
                                        { type: "text", text: "High/Medium/Low" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Attachments" },
                                        { type: "text", text: "Screenshots or files..." }
                                      ];
                                      break;

                                    case 'release_notes':
                                      templateBlocks = [
                                        { type: "h1", text: "Release Notes" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Version" },
                                        { type: "text", text: "vX.X.X" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Release Date" },
                                        { type: "text", text: "Date: " },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Highlights" },
                                        { type: "bulleted", text: "Major feature 1" },
                                        { type: "bulleted", text: "Major feature 2" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "New Features" },
                                        { type: "bulleted", text: "Feature 1" },
                                        { type: "bulleted", text: "Feature 2" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Bug Fixes" },
                                        { type: "bulleted", text: "Fix 1" },
                                        { type: "bulleted", text: "Fix 2" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Known Issues" },
                                        { type: "bulleted", text: "Issue 1" },
                                        { type: "text", text: "" },
                                        { type: "h3", text: "Upgrade Notes" },
                                        { type: "text", text: "Important information for upgrading..." }
                                      ];
                                      break;

                                    default:
                                      templateBlocks = [
                                        { type: "h1", text: template.name },
                                        { type: "text", text: "" },
                                        { type: "text", text: "Start writing your content here..." }
                                      ];
                                  }

                                  const newBlocks = templateBlocks.map(block => ({
                                    id: uid(),
                                    ...block,
                                    focus: false
                                  }));

                                  // Add a new empty line at the end for continued typing
                                  newBlocks.push({ id: uid(), type: "text", text: "", focus: true });

                                  setDescriptionBlocks(newBlocks);
                                  setShowTemplateDropdown(false);
                                }}
                              >
                                <span className="text-xl">{template.icon}</span>
                                <div>
                                  <div className="font-medium">{template.name}</div>
                                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {template.description}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`flex flex-col gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isManager ? (
                      <div className="space-y-0 min-h-[600px]">
                        {descriptionBlocks.map((block, index) => (
                          <DescriptionBlock
                            key={block.id}
                            block={block}
                            index={index}
                            numberedIndex={numberedMap[index]}
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
                            isDarkMode={isDarkMode}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={`p-8 rounded-2xl border-2 min-h-[600px] ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50/50 border-gray-200'}`}>
                        {projectData.description ? (
                          <div className="space-y-0">
                            {descriptionBlocks.map((block, index) => {
                              if (block.type === 'divider') {
                                return <hr key={index} className="my-3 border-gray-300" />;
                              }
                              if (block.type === 'h1') {
                                return <h1 key={index} className="text-3xl font-bold mb-2 mt-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{block.text}</h1>;
                              }
                              if (block.type === 'h2') {
                                return <h2 key={index} className="text-2xl font-bold mb-2 mt-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{block.text}</h2>;
                              }
                              if (block.type === 'h3') {
                                return <h3 key={index} className="text-xl font-bold mb-1 mt-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{block.text}</h3>;
                              }
                              if (block.type === 'quote') {
                                return (
                                  <blockquote key={index} className={`border-l-4 border-blue-500 pl-4 py-2 my-2 italic ${isDarkMode ? 'bg-gray-700/30' : 'bg-blue-50/50'}`}>
                                    {block.text}
                                  </blockquote>
                                );
                              }
                              if (block.type === 'bulleted') {
                                return (
                                  <div key={index} className="flex items-start gap-2 ml-4">
                                    <span className="text-blue-500 font-bold mt-1">•</span>
                                    <span className="flex-1">{block.text}</span>
                                  </div>
                                );
                              }
                              if (block.type === 'numbered') {
                                const number = numberedMap[index] || 1;
                                return (
                                  <div key={index} className="flex items-start gap-2 ml-4">
                                    <span className="text-blue-500 font-bold mt-1">{number}.</span>
                                    <span className="flex-1">{block.text}</span>
                                  </div>
                                );
                              }
                              if (block.type === 'todo') {
                                return (
                                  <div key={index} className="flex items-start gap-2 ml-4">
                                    <span className={`w-4 h-4 border-2 border-blue-500 rounded mt-1 flex items-center justify-center ${block.checked ? 'bg-blue-500 text-white' : 'bg-transparent'}`}>
                                      {block.checked ? '✓' : ''}
                                    </span>
                                    <span className={`flex-1 ${block.checked ? 'line-through text-gray-500' : ''}`}>{block.text}</span>
                                  </div>
                                );
                              }
                              if (block.type === 'callout') {
                                return (
                                  <div key={index} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                                    💡 {block.text}
                                  </div>
                                );
                              }
                              if (block.type === 'table') {
                                return (
                                  <div key={index} className="overflow-x-auto my-2">
                                    <table className={`min-w-full border-collapse rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                      <tbody>
                                        {block.rows && block.rows.map((row, rowIndex) => (
                                          <tr key={rowIndex}>
                                            {row.map((cell, cellIndex) => (
                                              <td
                                                key={cellIndex}
                                                className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-2 text-sm`}
                                              >
                                                {cell}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              }
                              return (
                                <p key={index} className={`text-xl leading-snug py-0.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: 'Inter, system-ui, sans-serif', paddingLeft: `${(block.indent || 0) * 16}px` }}>
                                  {block.text || '\u00A0'}
                                </p>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl">No description provided yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>


              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-8">
                {/* Project Information */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className="text-lg font-semibold mb-4">Project Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Owner</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {projectData.ownerName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium">{projectData.ownerName || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      {isManager ? (
                        <input
                          type="date"
                          value={projectData.startDate ? String(projectData.startDate).slice(0, 10) : ''}
                          onChange={(e) => handleFieldChange('startDate', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      ) : (
                        <p className="font-medium mt-1">{projectData.startDate ? new Date(projectData.startDate).toLocaleDateString() : 'No start date'}</p>
                      )}
                      <SaveStatusIndicator field="startDate" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      {isManager ? (
                        <input
                          type="date"
                          value={projectData.endDate ? String(projectData.endDate).slice(0, 10) : ''}
                          onChange={(e) => handleFieldChange('endDate', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      ) : (
                        <p className="font-medium mt-1">{projectData.endDate ? new Date(projectData.endDate).toLocaleDateString() : 'No end date'}</p>
                      )}
                      <SaveStatusIndicator field="endDate" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Priority</label>
                      {isManager ? (
                        <select
                          value={projectData.priority || 'Medium'}
                          onChange={(e) => handleFieldChange('priority', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                          <option value="High">🔴 High Priority</option>
                          <option value="Medium">🟡 Medium Priority</option>
                          <option value="Low">🟢 Low Priority</option>
                        </select>
                      ) : (
                        <p className="font-medium mt-1">{projectData.priority || 'Medium'}</p>
                      )}
                      <SaveStatusIndicator field="priority" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <select
                        value={projectData.status || 'Not started'}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="Not started">⏸️ Not Started</option>
                        <option value="In progress">▶️ In Progress</option>
                        <option value="Done">✅ Completed</option>
                      </select>
                      <SaveStatusIndicator field="status" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="font-medium mt-1">{new Date(projectData.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned To</label>
                      {isManager ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={projectData.forPerson || ''}
                            onChange={(e) => handleFieldChange('forPerson', e.target.value)}
                            placeholder="Team or person"
                            className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'}`}
                          />
                          <button
                            onClick={() => {
                              sessionStorage.setItem('projectPickerReturn', JSON.stringify({
                                type: 'project',
                                id: projectData.id,
                                currentAssignment: projectData.forPerson || ''
                              }));
                              navigate('/users?picker=1');
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Pick
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium mt-1">{projectData.forPerson || 'Not assigned'}</p>
                          <p className="text-xs text-blue-600 mt-1">Debug: forPerson = "{projectData.forPerson}"</p>
                          {projectData.forPerson && (
                            <p className="text-xs text-green-600 mt-1">✓ Users assigned: {projectData.forPerson}</p>
                          )}
                        </>
                      )}
                      <SaveStatusIndicator field="forPerson" />
                    </div>

                    {/* Update Project Button */}
                    {!isNewProject && (
                      <div className="mt-6">
                        <button
                          onClick={handleUpdateProject}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Save className="w-4 h-4" />
                          Update Project
                        </button>
                        <SaveStatusIndicator field="project" />
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Tasks</h2>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>

              {showAddTask && (
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="✨ Describe the task you want to add..."
                        value={newTask.text}
                        onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                        className={`w-full p-5 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 shadow-sm hover:shadow-md ${isDarkMode
                          ? 'bg-gray-800/60 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-700/80 focus:border-blue-400 focus:ring-blue-500/20 hover:border-gray-500'
                          : 'bg-white/90 border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-400 focus:ring-blue-500/10 hover:border-gray-300'
                          } backdrop-blur-sm`}
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontSize: '18px',
                          caretColor: '#3b82f6'
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <select
                        value={newTask.assignee}
                        onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                      >
                        <option value="">Select assignee</option>
                        {projectData.team.map(member => (
                          <option key={member.id} value={member.name}>{member.name}</option>
                        ))}
                      </select>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                      >
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                      </select>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={addTask}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Task
                      </button>
                      <button
                        onClick={() => setShowAddTask(false)}
                        className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                          }`}
                      >
                        {task.completed && <CheckCircle className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? 'line-through opacity-75' : ''}`}>
                          {task.text}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Assigned to: {task.assignee || 'Unassigned'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Comments</h2>

              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || 'Y'}
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="💬 Share your thoughts, feedback, or questions..."
                        rows={5}
                        className={`w-full p-6 rounded-2xl border-2 resize-none transition-all duration-300 focus:outline-none focus:ring-4 shadow-sm hover:shadow-md ${isDarkMode
                          ? 'bg-gray-800/60 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-700/80 focus:border-blue-400 focus:ring-blue-500/20 hover:border-gray-500'
                          : 'bg-white/90 border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-400 focus:ring-blue-500/10 hover:border-gray-300'
                          } backdrop-blur-sm`}
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontSize: '18px',
                          lineHeight: '1.6',
                          caretColor: '#3b82f6'
                        }}
                      />
                      {/* Character count or typing indicator could go here */}
                      {newComment.length > 0 && (
                        <div className={`absolute bottom-3 right-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {newComment.length} characters
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {comment.user.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{comment.user}</span>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comment.text}</p>
                        {comment.reactions && comment.reactions.length > 0 && (
                          <div className="flex gap-1 mt-3">
                            {comment.reactions.map((reaction, index) => (
                              <span key={index} className="text-lg">{reaction}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Files & Attachments</h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  <Paperclip className="w-4 h-4" />
                  Upload File
                  <input type="file" className="hidden" />
                </label>
              </div>

              <div className="text-center py-12">
                <Paperclip className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upload documents, images, or other files related to this project
                </p>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Activity Timeline</h2>

              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'milestone' ? 'bg-green-100 text-green-600' :
                        activity.type === 'task' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                        {activity.type === 'milestone' ? <CheckCircle className="w-5 h-5" /> :
                          activity.type === 'task' ? <CheckCircle className="w-5 h-5" /> :
                            <Zap className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className="font-semibold">{activity.user}</span> {activity.action}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slash Menu */}
      <SlashMenu
        open={menu.open}
        at={menu.at}
        onClose={closeSlashMenu}
        onPick={applyTypeFromMenu}
        isDarkMode={isDarkMode}
      />


    </div>
  );
};

export default ProjectDetailsPage;