import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Target, User, Calendar, Users, CheckCircle, Clock, AlertCircle, X,
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
  { type: "callout", label: "Callout", hint: "Highlighted text box", icon: "💡" }
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
      className="slash-menu"
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
        left: Math.min(at.x, window.innerWidth - 320),
        top: Math.min(at.y, window.innerHeight - 440)
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
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("# ") && block.type !== "h1") {
      onChange(index, { type: "h1", text: t.slice(2) });
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("## ") && block.type !== "h2") {
      onChange(index, { type: "h2", text: t.slice(3) });
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("### ") && block.type !== "h3") {
      onChange(index, { type: "h3", text: t.slice(4) });
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("> ") && block.type !== "quote") {
      onChange(index, { type: "quote", text: t.slice(2) });
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("- ") && block.type !== "bulleted") {
      onChange(index, { type: "bulleted", text: t.slice(2) });
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (/^\d+\.\s/.test(t) && block.type !== "numbered") {
      onChange(index, { type: "numbered", text: t.replace(/^\d+\.\s/, "") });
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (/^\[( |x|X)\]\s/.test(t) && block.type !== "todo") {
      const checked = /^\[(x|X)\]\s/.test(t);
      onChange(index, { type: "todo", text: t.replace(/^\[( |x|X)\]\s/, ""), checked });
      setTimeout(() => {
        onEnter(index, "text", 0);
      }, 0);
    } else if (t.startsWith("| ") && block.type !== "table") {
      onChange(index, {
        type: "table",
        text: "",
        rows: [[t.slice(2), "", ""]]
      });
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
                input.onchange = async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('uploadedBy', 'Goal Description');
                    
                    try {
                      const response = await fetch('http://localhost:5000/api/upload', {
                        method: 'POST',
                        headers: {
                          'x-auth-token': localStorage.getItem('token')
                        },
                        body: formData
                      });
                      
                      if (response.ok) {
                        const uploadedFile = await response.json();
                        console.log('Upload response:', uploadedFile);
                        const imageUrl = uploadedFile.url || uploadedFile.path || `http://localhost:5000/uploads/${uploadedFile.filename}`;
                        onChange(index, { imageUrl: imageUrl, text: file.name });
                        setTimeout(() => {
                          onEnter(index, 'text', 0);
                        }, 100);
                      } else {
                        const errorText = await response.text();
                        console.error('File upload failed:', errorText);
                        alert('Failed to upload image: ' + errorText);
                      }
                    } catch (error) {
                      console.error('Upload error:', error);
                      alert('Error uploading image');
                    }
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
                          width: '150px',
                          maxWidth: '150px',
                          wordWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          verticalAlign: 'top'
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
// Helper function to get default goal data
const getDefaultGoal = () => ({
  name: 'New Goal',
  description: '',
  status: 'Not started',
  priority: 'Medium',
  dueDate: new Date(),
  progress: 0,
  team: []
});

const GoalDetailsPage = ({ goal: propGoal, onClose, onUpdate, isManager, isNewGoal = false }) => {
  // Initialize with default goal data if prop is not provided
  const goal = propGoal || getDefaultGoal();
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saveStatus, setSaveStatus] = useState({});
  const autoSaveTimeoutRef = useRef({});
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  
  // Enhanced goal data
  const [goalData, setGoalData] = useState(() => {
    const defaultGoal = {
      ...goal,
      progress: goal?.progress || 0,
      updateCount: goal?.updateCount || 0,
      isFavorite: goal?.isFavorite || false,
      metrics: {
        timeSpent: '24h 30m',
        completionRate: getProgressPercentage(goal?.status || 'Not started'),
        daysRemaining: goal?.dueDate ? 
          getDaysRemaining(goal.dueDate) : 7,
        priority: goal?.priority || 'Medium'
      },
      team: [
        { id: 1, name: 'John Doe', role: 'Lead', avatar: 'JD', status: 'active' },
        { id: 2, name: 'Jane Smith', role: 'Developer', avatar: 'JS', status: 'active' },
        { id: 3, name: 'Mike Johnson', role: 'Designer', avatar: 'MJ', status: 'away' }
      ]
    };
    return defaultGoal;
  });

  // Add state for timeline and tags editing
  const [editingTimeline, setEditingTimeline] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [timelineData, setTimelineData] = useState({
    dueDate: goal.dueDate || ''
  });
  const [tagsData, setTagsData] = useState(goal.tags || ['Goal', 'High Priority']);

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
      id: 'goal_plan',
      name: 'Goal Plan',
      icon: '🎯',
      description: 'Standard goal planning template'
    },
    {
      id: 'okr_template',
      name: 'OKR Template',
      icon: '📊',
      description: 'Objectives and Key Results structure'
    },
    {
      id: 'smart_goals',
      name: 'SMART Goals',
      icon: '🎯',
      description: 'Specific, Measurable, Achievable, Relevant, Time-bound'
    },
    {
      id: 'milestone_tracker',
      name: 'Milestone Tracker',
      icon: '🏁',
      description: 'Track progress with milestones'
    },
    {
      id: 'quarterly_review',
      name: 'Quarterly Review',
      icon: '📅',
      description: 'Quarterly goal review template'
    }
  ];

  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newTask, setNewTask] = useState({ text: '', priority: 'Medium', dueDate: '' });
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [files, setFiles] = useState([]);

  const addActivity = (action, type = 'update') => {
    const activity = {
      id: Date.now(),
      user: user?.name || 'Unknown',
      action: action,
      timestamp: new Date().toISOString(),
      type: type
    };
    setActivities(prev => [activity, ...prev]);
  };

  // Block-based description editor state
  const [descriptionBlocks, setDescriptionBlocks] = useState([
    { id: uid(), type: "text", text: "", focus: true, indent: 0 },
  ]);
  const [menu, setMenu] = useState({ open: false, at: { x: 0, y: 0 }, forIndex: -1 });

  const navigate = useNavigate();

  // Delete goal function
  const handleDeleteGoal = async () => {
    if (!goalData.id) {
      console.error('No goal ID found');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${goalData.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await apiService.delete(`/goals/${goalData.id}`);

      // Show success message
      alert('Goal deleted successfully!');

      // Navigate back to goals page
      onClose();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
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
    let blockType = type;
    let blockIndent = indent;
    let checked = false;
    
    if (type === "text" && descriptionBlocks[index]) {
      const currentBlock = descriptionBlocks[index];
      if (currentBlock.type === "bulleted" || currentBlock.type === "numbered" || currentBlock.type === "todo") {
        blockType = currentBlock.type;
        blockIndent = currentBlock.indent || 0;
        if (currentBlock.type === "todo") {
          checked = false;
        }
      }
    }
    
    const newBlock = { 
      id: uid(), 
      type: blockType, 
      text: "", 
      focus: true, 
      indent: blockIndent,
      ...(blockType === "todo" && { checked })
    };
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

  // Calculate progress whenever tasks change
  useEffect(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    if (newProgress !== goalData.progress) {
      setGoalData(prev => ({ ...prev, progress: newProgress }));
    }
  }, [tasks]);

  // Load tasks and comments from database
  useEffect(() => {
    if (goalData.id && goalData.id !== 'new') {
      loadGoalData();
    }
  }, [goalData.id]);

  // Also load when component mounts
  useEffect(() => {
    if (goalData.id && goalData.id !== 'new') {
      loadGoalData();
    }
  }, []);

  const loadGoalData = async () => {
    try {
      console.log('Loading goal data for ID:', goalData.id);
      const response = await fetch(`http://localhost:5000/api/goals/${goalData.id}/data`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded goal data:', data);
        if (data.tasks && Array.isArray(data.tasks)) {
          console.log('Setting tasks:', data.tasks);
          setTasks(data.tasks);
        }
        if (data.comments && Array.isArray(data.comments)) {
          setComments(data.comments);
        }
        if (data.activities && Array.isArray(data.activities)) {
          setActivities(data.activities);
        }
      } else {
        console.error('Failed to load goal data:', response.status);
      }
    } catch (error) {
      console.error('Error loading goal data:', error);
    }
  };
  // Initialize blocks from existing description
  useEffect(() => {
    // Try to load from descriptionBlocks first, then fall back to description parsing
    if (goalData.descriptionBlocks && descriptionBlocks.length === 1 && !descriptionBlocks[0].text) {
      try {
        const savedBlocks = JSON.parse(goalData.descriptionBlocks);
        if (Array.isArray(savedBlocks) && savedBlocks.length > 0) {
          setDescriptionBlocks(savedBlocks.map(block => ({ ...block, id: uid(), focus: false })));
          return;
        }
      } catch (error) {
        console.error('Error parsing saved blocks:', error);
      }
    }

    // Use notes field if description is not available (for backward compatibility)
    const existingDescription = goalData.description || goalData.notes;
    if (existingDescription && descriptionBlocks.length === 1 && !descriptionBlocks[0].text) {
      const lines = existingDescription.split('\n');
      const blocks = lines.map((line, i) => {
        const trimmed = line.trimStart();
        let type = "text";
        let text = line;
        let checked = false;
        let indent = 0;
        let rows = null;

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
        } else if (trimmed.startsWith("TABLE:")) {
          type = "table";
          text = "";
          try {
            rows = JSON.parse(trimmed.slice(6));
          } catch (e) {
            rows = [["", "", ""]];
          }
        } else if (trimmed.startsWith("| ")) {
          type = "table";
          text = trimmed.slice(2);
          rows = [["", "", ""]];
        }

        return {
          id: uid(),
          type,
          text,
          checked,
          indent,
          focus: false,
          ...(type === 'table' && { rows: rows || [["", "", ""]] })
        };
      });

      if (blocks.length > 0) {
        setDescriptionBlocks(blocks);
      }
    }
  }, [goalData.description, goalData.notes, goalData.descriptionBlocks]);

  // Update goal description when blocks change - save to database
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
      if (block.type === 'table') return indentStr + `TABLE:${JSON.stringify(block.rows || [["", "", ""]])}`;
      if (block.type === 'image') return indentStr + `![${block.text || ''}](${block.imageUrl || ''})`;
      return indentStr + (block.text || '');
    }).join('\n');

    if (description !== goalData.description) {
      const updatedGoal = { ...goalData, description, descriptionBlocks: JSON.stringify(descriptionBlocks) };
      setGoalData(updatedGoal);
      
      // Auto-save description to database if goal exists
      if (goalData.id && goalData.id !== 'new') {
        // Clear existing timeout
        if (autoSaveTimeoutRef.current.description) {
          clearTimeout(autoSaveTimeoutRef.current.description);
        }
        
        // Set new timeout for auto-save
        autoSaveTimeoutRef.current.description = setTimeout(async () => {
          try {
            await apiService.put(`/goals/${goalData.id}`, { 
              description: description,
              descriptionBlocks: JSON.stringify(descriptionBlocks)
            });
            console.log('Description auto-saved successfully');
          } catch (error) {
            console.error('Failed to auto-save description:', error);
          }
        }, 2000); // Save after 2 seconds of no changes
      }
    }
  }, [descriptionBlocks, goalData.id]);

  // Close slash menu on outside click
  useEffect(() => {
    if (!menu.open) return;
    
    const timer = setTimeout(() => {
      const onDocClick = (e) => {
        if (e.target.closest('.slash-menu') || e.target.closest('[title="Add block"]')) {
          return;
        }
        closeSlashMenu();
      };
      document.addEventListener("click", onDocClick);
      
      return () => document.removeEventListener("click", onDocClick);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [menu.open]);

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all auto-save timeouts when component unmounts
      Object.values(autoSaveTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);
  // Listen for selected users from user management page
  useEffect(() => {
    console.log('Checking for selected users in session storage...');
    const selectedUsers = sessionStorage.getItem('selectedGoalUsers');
    const returnData = sessionStorage.getItem('goalPickerReturn');
    console.log('Session storage selectedGoalUsers:', selectedUsers);
    console.log('Session storage goalPickerReturn:', returnData);

    if (selectedUsers) {
      try {
        if (returnData) {
          const pickerData = JSON.parse(returnData);
          console.log('Found selected users and return data:', selectedUsers, pickerData);
          
          // Restore the complete goal state
          if (pickerData.goalState) {
            const restoredGoal = {
              ...pickerData.goalState,
              forPerson: selectedUsers
            };
            console.log('Restoring goal state:', restoredGoal);
            setGoalData(restoredGoal);
            
            // Restore description blocks if available
            if (pickerData.descriptionBlocks && Array.isArray(pickerData.descriptionBlocks)) {
              console.log('Restoring description blocks:', pickerData.descriptionBlocks);
              setDescriptionBlocks(pickerData.descriptionBlocks);
            }
            
            // Clean up session storage
            sessionStorage.removeItem('selectedGoalUsers');
            sessionStorage.removeItem('goalPickerReturn');
            
            // Force re-render by calling onUpdate
            setTimeout(() => {
              onUpdate && onUpdate(restoredGoal);
            }, 100);
          } else {
            // Fallback to just updating the selected users
            updateGoalWithSelectedUsers(selectedUsers);
          }
        } else {
          // Only selected users available, update just the users
          updateGoalWithSelectedUsers(selectedUsers);
        }
      } catch (error) {
        console.error('Error processing return data:', error);
        // Fallback to just updating the selected users
        updateGoalWithSelectedUsers(selectedUsers);
      }
    } else {
      console.log('No selected users found in session storage');
    }
    
    // Helper function to update goal with selected users
    function updateGoalWithSelectedUsers(users) {
      const updatedGoal = { ...goalData, forPerson: users };
      console.log('Updating goal with selected users:', updatedGoal);
      setGoalData(updatedGoal);
      sessionStorage.removeItem('selectedGoalUsers');
      if (returnData) sessionStorage.removeItem('goalPickerReturn');
      
      // Update parent component after state is set
      setTimeout(() => {
        onUpdate && onUpdate(updatedGoal);
      }, 100);
    }
  }, []);

  // Reset update counter when manager views the goal
  useEffect(() => {
    if (isManager && !isNewGoal && goalData.updateCount > 0) {
      const resetUpdates = async () => {
        try {
          const updatedGoal = { ...goalData, updateCount: 0 };
          setGoalData(updatedGoal);

          if (goalData.id && goalData.id !== 'new') {
            await apiService.put(`/goals/${goalData.id}`, { updateCount: 0 });
          }

          onUpdate && onUpdate(updatedGoal);
        } catch (error) {
          console.error('Failed to reset update counter:', error);
        }
      };

      // Reset after a short delay to ensure the page has loaded
      const timer = setTimeout(resetUpdates, 1000);
      return () => clearTimeout(timer);
    }
  }, [isManager, isNewGoal, goalData.id]);

  // Update timelineData and tagsData when goalData changes
  useEffect(() => {
    setTimelineData({
      dueDate: goalData.dueDate || ''
    });
    setTagsData(goalData.tags || ['Goal', 'High Priority']);
  }, [goalData]);

  function getProgressPercentage(status) {
    switch (status) {
      case 'Done': return 100;
      case 'In progress': return 60;
      case 'Not started': return 0;
      default: return 0;
    }
  }

  function getDaysRemaining(dueDate) {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const today = new Date();

    // If goal has ended
    if (today > due) {
      const daysOverdue = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
      return `${daysOverdue} days overdue`;
    }

    // Calculate remaining days
    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (daysLeft === 0) {
      return `Due today`;
    } else if (daysLeft === 1) {
      return `1 day left`;
    } else {
      return `${daysLeft} days left`;
    }
  }

  const handleFieldEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  // Auto-save function - now only updates local state
  const autoSaveField = async (field, value) => {
    if (!value || value === goalData[field]) return;

    // Only update local state - don't save to backend
    const updatedGoal = {
      ...goalData,
      [field]: value
    };
    setGoalData(updatedGoal);
  };

  // Manual update function
  const handleUpdateGoal = async () => {
    if (!goalData.id || goalData.id === 'new') return;

    setSaveStatus(prev => ({ ...prev, goal: 'saving' }));

    try {
      // Convert description blocks to text
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
        if (block.type === 'table') return indentStr + `TABLE:${JSON.stringify(block.rows || [["", "", ""]])}`;
        if (block.type === 'image') return indentStr + `![${block.text || ''}](${block.imageUrl || ''})`;
        return indentStr + (block.text || '');
      }).join('\n');

      const updatedGoal = {
        ...goalData,
        description: description,
        descriptionBlocks: JSON.stringify(descriptionBlocks),
        tasks: tasks,
        comments: comments,
        activities: activities,
        files: files,
        updateCount: (goalData.updateCount || 0) + 1
      };

      await apiService.put(`/goals/${goalData.id}`, updatedGoal);

      setGoalData(updatedGoal);
      onUpdate && onUpdate(updatedGoal);
      setSaveStatus(prev => ({ ...prev, goal: 'saved' }));

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, goal: null }));
      }, 2000);
    } catch (error) {
      console.error('Update failed:', error);
      setSaveStatus(prev => ({ ...prev, goal: 'error' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, goal: null }));
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
      const updatedGoal = {
        ...goalData,
        dueDate: timelineData.dueDate
      };
      setGoalData(updatedGoal);

      // If it's an existing goal (not new), update in backend
      if (goalData.id && goalData.id !== 'new') {
        await apiService.put(`/goals/${goalData.id}`, {
          dueDate: timelineData.dueDate
        });
      }

      // Call parent update handler
      onUpdate && onUpdate(updatedGoal);

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
      const updatedGoal = {
        ...goalData,
        tags: tagsData
      };
      setGoalData(updatedGoal);

      // If it's an existing goal (not new), update in backend
      if (goalData.id && goalData.id !== 'new') {
        await apiService.put(`/goals/${goalData.id}`, {
          tags: tagsData
        });
      }

      // Call parent update handler
      onUpdate && onUpdate(updatedGoal);

      setEditingTags(false);
    } catch (error) {
      console.error('Error updating tags:', error);
      alert('Failed to update tags. Please try again.');
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now(),
      text: newComment,
      user: user?.name || 'You',
      timestamp: new Date().toISOString(),
      reactions: []
    };
    
    try {
      // Save to database
      if (goalData.id && goalData.id !== 'new') {
        await fetch(`http://localhost:5000/api/goals/${goalData.id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify(comment)
        });
      }
      
      setComments(prev => [...prev, comment]);
      addActivity('added a comment', 'comment');
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.text.trim()) return;
    const task = {
      id: Date.now(),
      ...newTask,
      completed: false,
      createdBy: user?.name || 'Unknown',
      createdAt: new Date().toISOString()
    };
    
    try {
      // Save to database
      if (goalData.id && goalData.id !== 'new') {
        console.log('Saving task to database:', task);
        const response = await fetch(`http://localhost:5000/api/goals/${goalData.id}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify(task)
        });
        console.log('Task save response:', response.status);
        if (!response.ok) {
          console.error('Failed to save task:', await response.text());
        }
      }
      
      setTasks(prev => {
        const updatedTasks = [...prev, task];
        setGoalData(prevData => ({ ...prevData, updateCount: (prevData.updateCount || 0) + 1 }));
        return updatedTasks;
      });
      
      addActivity(`added task "${newTask.text}"`, 'task');
      setNewTask({ text: '', priority: 'Medium', dueDate: '' });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const updatedTask = { ...task, completed: !task.completed };
      
      if (goalData.id && goalData.id !== 'new') {
        await fetch(`http://localhost:5000/api/goals/${goalData.id}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify({ completed: updatedTask.completed })
        });
      }
      
      setTasks(prev => {
        const updatedTasks = prev.map(task =>
          task.id === taskId ? updatedTask : task
        );
        setGoalData(prev => ({ ...prev, updateCount: (prev.updateCount || 0) + 1 }));
        return updatedTasks;
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const deleteTask = async (taskId) => {
    try {
      if (goalData.id && goalData.id !== 'new') {
        await fetch(`http://localhost:5000/api/goals/${goalData.id}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
      }
      setTasks(prev => {
        const updatedTasks = prev.filter(task => task.id !== taskId);
        return updatedTasks;
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const editTask = (task) => {
    setEditingTask(task);
    setNewTask({ text: task.text, priority: task.priority, dueDate: task.dueDate });
    setShowAddTask(true);
  };

  const updateTask = async () => {
    try {
      if (goalData.id && goalData.id !== 'new') {
        await fetch(`http://localhost:5000/api/goals/${goalData.id}/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify(newTask)
        });
      }
      
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? { ...task, ...newTask } : task
      ));
      setEditingTask(null);
      setNewTask({ text: '', priority: 'Medium', dueDate: '' });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const editComment = (comment) => {
    setEditingComment(comment.id);
    setNewComment(comment.text);
  };

  const updateComment = async (commentId) => {
    if (!newComment.trim()) return;
    
    try {
      if (goalData.id && goalData.id !== 'new') {
        await fetch(`http://localhost:5000/api/goals/${goalData.id}/comments/${commentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify({ text: newComment })
        });
      }
      
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? { ...comment, text: newComment } : comment
      ));
      setEditingComment(null);
      setNewComment('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      if (goalData.id && goalData.id !== 'new') {
        await fetch(`http://localhost:5000/api/goals/${goalData.id}/comments/${commentId}`, {
          method: 'DELETE',
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
      }
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleToggleFavorite = () => {
    const updatedGoal = { ...goalData, isFavorite: !goalData.isFavorite };
    setGoalData(updatedGoal);
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
                  <Target className={`w-8 h-8 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
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
                        <h1 className="text-3xl font-bold">{goalData.name || (isNewGoal ? 'New Goal' : 'Untitled Goal')}</h1>
                        {isManager && (
                          <button
                            onClick={() => handleFieldEdit('name', goalData.name)}
                            className={`p-2 rounded-lg transition-all duration-200 border ${isDarkMode
                              ? 'text-blue-400 hover:text-white hover:bg-gray-700 border-gray-600 hover:border-blue-400'
                              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-gray-300 hover:border-blue-500'
                              } shadow-sm hover:shadow-md`}
                            title="Edit goal name"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(goalData.status)}`}>
                      {goalData.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(goalData.priority)}`}>
                      {goalData.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isNewGoal ? (
                <button
                  onClick={() => {
                    if (goalData.name && goalData.name.trim()) {
                      onUpdate && onUpdate(goalData);
                    }
                  }}
                  disabled={!goalData.name || !goalData.name.trim()}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${goalData.name && goalData.name.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  Create Goal
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleFavorite}
                      className={`p-2 rounded-lg transition-colors ${goalData.isFavorite
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                        }`}
                      title={goalData.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-5 h-5 ${goalData.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <div className={`h-8 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                  <div className="flex items-center gap-2">
                    {isManager && (
                      <button
                        onClick={handleDeleteGoal}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Delete Goal"
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
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{goalData.progress}%</span>
          </div>
          <div className={`w-full h-4 rounded-full shadow-inner ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className="h-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 shadow-lg"
              style={{ width: `${goalData.progress}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="flex space-x-8 px-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle, count: tasks.length },
              { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length }
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
                    <p className="text-2xl font-bold">{goalData.status}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`w-4 h-4 ${goalData.metrics.daysRemaining?.includes('overdue') ? 'text-red-500' :
                        goalData.metrics.daysRemaining?.includes('today') ? 'text-yellow-500' :
                          'text-orange-500'
                        }`} />
                      <span className="text-sm font-medium">Timeline</span>
                    </div>
                    <p className={`text-lg font-bold ${goalData.metrics.daysRemaining?.includes('overdue') ? 'text-red-600' :
                      goalData.metrics.daysRemaining?.includes('today') ? 'text-yellow-600' :
                        ''
                      }`}>{goalData.metrics.daysRemaining || 'No due date'}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Priority</span>
                    </div>
                    <p className="text-2xl font-bold">{goalData.priority}</p>
                  </div>
                </div>

                {/* Goal Description */}
                <div className={`p-12 rounded-3xl border-2 min-h-[700px] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <FileText className="w-6 h-6 text-blue-500" />
                      Description
                    </h3>
                    {isManager && (
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
                                    case 'goal_plan':
                                      templateBlocks = [
                                        { type: "h1", text: "Goal Plan" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Goal Overview" },
                                        { type: "text", text: "Brief description of the goal..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Objectives" },
                                        { type: "bulleted", text: "Primary objective" },
                                        { type: "bulleted", text: "Secondary objectives" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Success Metrics" },
                                        { type: "text", text: "How will success be measured..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Action Steps" },
                                        { type: "numbered", text: "First action step" },
                                        { type: "numbered", text: "Second action step" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Resources Needed" },
                                        { type: "text", text: "Required resources and support..." }
                                      ];
                                      break;

                                    case 'okr_template':
                                      templateBlocks = [
                                        { type: "h1", text: "OKR Template" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Objective" },
                                        { type: "text", text: "What do you want to achieve?" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Key Results" },
                                        { type: "numbered", text: "Key Result 1 - Measurable outcome" },
                                        { type: "numbered", text: "Key Result 2 - Measurable outcome" },
                                        { type: "numbered", text: "Key Result 3 - Measurable outcome" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Initiatives" },
                                        { type: "bulleted", text: "Initiative to achieve KR1" },
                                        { type: "bulleted", text: "Initiative to achieve KR2" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Timeline" },
                                        { type: "text", text: "Quarter/timeframe for completion..." }
                                      ];
                                      break;

                                    case 'smart_goals':
                                      templateBlocks = [
                                        { type: "h1", text: "SMART Goal" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Specific" },
                                        { type: "text", text: "What exactly will you accomplish?" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Measurable" },
                                        { type: "text", text: "How will you measure progress?" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Achievable" },
                                        { type: "text", text: "Is this goal realistic?" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Relevant" },
                                        { type: "text", text: "Why is this goal important?" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Time-bound" },
                                        { type: "text", text: "When will you complete this goal?" }
                                      ];
                                      break;

                                    case 'milestone_tracker':
                                      templateBlocks = [
                                        { type: "h1", text: "Milestone Tracker" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Goal Overview" },
                                        { type: "text", text: "Brief description of the overall goal..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Milestones" },
                                        { type: "todo", text: "Milestone 1 - Description", checked: false },
                                        { type: "todo", text: "Milestone 2 - Description", checked: false },
                                        { type: "todo", text: "Milestone 3 - Description", checked: false },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Progress Notes" },
                                        { type: "text", text: "Track progress and learnings..." }
                                      ];
                                      break;

                                    case 'quarterly_review':
                                      templateBlocks = [
                                        { type: "h1", text: "Quarterly Goal Review" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Goal Summary" },
                                        { type: "text", text: "Original goal and objectives..." },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Progress Made" },
                                        { type: "bulleted", text: "Achievement 1" },
                                        { type: "bulleted", text: "Achievement 2" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Challenges Faced" },
                                        { type: "bulleted", text: "Challenge 1" },
                                        { type: "bulleted", text: "Challenge 2" },
                                        { type: "text", text: "" },
                                        { type: "h2", text: "Next Quarter Plan" },
                                        { type: "numbered", text: "Priority 1" },
                                        { type: "numbered", text: "Priority 2" }
                                      ];
                                      break;

                                    default:
                                      templateBlocks = [
                                        { type: "h1", text: template.name },
                                        { type: "text", text: "" },
                                        { type: "text", text: "Start writing your content here..." }
                                      ];
                                  }

                                  // Find current cursor position or use end of blocks
                                  const focusedIndex = descriptionBlocks.findIndex(b => b.focus);
                                  const insertIndex = focusedIndex >= 0 ? focusedIndex : descriptionBlocks.length - 1;
                                  
                                  const newBlocks = templateBlocks.map(block => ({
                                    id: uid(),
                                    ...block,
                                    focus: false
                                  }));

                                  // Insert template blocks at cursor position
                                  const updatedBlocks = [...descriptionBlocks];
                                  updatedBlocks.splice(insertIndex + 1, 0, ...newBlocks);
                                  
                                  // Focus the first template block
                                  if (newBlocks.length > 0) {
                                    updatedBlocks[insertIndex + 1].focus = true;
                                  }

                                  setDescriptionBlocks(updatedBlocks);
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
                    )}
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
                      <div className={`p-8 min-h-[600px] ${isDarkMode ? 'bg-transparent' : 'bg-transparent'}`}>
                        {goalData.description ? (
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
                              if (block.type === 'image') {
                                return block.imageUrl ? (
                                  <div key={index} style={{ paddingLeft: `${(block.indent || 0) * 16}px`, marginBottom: '16px' }}>
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
                                  </div>
                                ) : (
                                  <p key={index} className={`text-xl leading-snug py-0.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} style={{ fontFamily: 'Inter, system-ui, sans-serif', paddingLeft: `${(block.indent || 0) * 16}px` }}>
                                    {block.text || '\u00A0'}
                                  </p>
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
                                                style={{
                                                  width: '150px',
                                                  maxWidth: '150px',
                                                  wordWrap: 'break-word',
                                                  whiteSpace: 'pre-wrap',
                                                  verticalAlign: 'top'
                                                }}
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
                {/* Goal Information */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className="text-lg font-semibold mb-4">Goal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Owner</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {goalData.ownerName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium">{goalData.ownerName || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Due Date</label>
                      {isManager ? (
                        <input
                          type="date"
                          value={goalData.dueDate ? String(goalData.dueDate).slice(0, 10) : ''}
                          onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      ) : (
                        <p className="font-medium mt-1">{goalData.dueDate ? new Date(goalData.dueDate).toLocaleDateString() : 'No due date'}</p>
                      )}
                      <SaveStatusIndicator field="dueDate" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Priority</label>
                      {isManager ? (
                        <select
                          value={goalData.priority || 'Medium'}
                          onChange={(e) => handleFieldChange('priority', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                          <option value="High">🔴 High Priority</option>
                          <option value="Medium">🟡 Medium Priority</option>
                          <option value="Low">🟢 Low Priority</option>
                        </select>
                      ) : (
                        <p className="font-medium mt-1">{goalData.priority || 'Medium'}</p>
                      )}
                      <SaveStatusIndicator field="priority" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <select
                        value={goalData.status || 'Not started'}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          setGoalData(prev => ({ ...prev, status: newStatus }));
                        }}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="Not started">⏸️ Not Started</option>
                        <option value="In progress">▶️ In Progress</option>
                        <option value="Done">✅ Completed</option>
                      </select>
                      {!isManager && (
                        <button
                          onClick={async () => {
                            try {
                              if (goalData.id && goalData.id !== 'new') {
                                // Save status directly to database using status-specific endpoint
                                const response = await fetch(`http://localhost:5000/api/goals/${goalData.id}/status`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-auth-token': localStorage.getItem('token')
                                  },
                                  body: JSON.stringify({ status: goalData.status })
                                });
                                
                                if (response.ok) {
                                  // Force update to parent to move card
                                  onUpdate && onUpdate(goalData);
                                } else {
                                  console.error('Failed to save status');
                                }
                              }
                            } catch (error) {
                              console.error('Save failed:', error);
                            }
                          }}
                          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                      )}
                    </div>
                    {isManager && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="font-medium mt-1">{new Date(goalData.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned To</label>
                      {isManager ? (
                        <div className="mt-1">
                          <textarea
                            value={goalData.forPerson || ''}
                            onChange={(e) => handleFieldChange('forPerson', e.target.value)}
                            placeholder="Enter names separated by commas"
                            rows={3}
                            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'}`}
                          />
                          <button
                            onClick={() => {
                              const currentGoalState = {
                                ...goalData,
                                description: descriptionBlocks.map(block => {
                                  const indentStr = '  '.repeat(block.indent || 0);
                                  if (block.type === 'divider') return indentStr + '---';
                                  if (block.type === 'h1') return indentStr + `# ${block.text || ''}`;
                                  if (block.type === 'h2') return indentStr + `## ${block.text || ''}`;
                                  if (block.type === 'h3') return indentStr + `### ${block.text || ''}`;
                                  if (block.type === 'quote') return indentStr + `> ${block.text || ''}`;
                                  if (block.type === 'bulleted') return indentStr + `- ${block.text || ''}`;
                                  if (block.type === 'numbered') return indentStr + `1. ${block.text || ''}`;
                                  if (block.type === 'todo') return indentStr + `- [${block.checked ? 'x' : ' '}] ${block.text || ''}`;
                                  if (block.type === 'table') return indentStr + `TABLE:${JSON.stringify(block.rows || [["", "", ""]])}`;
                                  return indentStr + (block.text || '');
                                }).join('\n'),
                                descriptionBlocks: JSON.stringify(descriptionBlocks)
                              };
                              
                              sessionStorage.setItem('goalPickerReturn', JSON.stringify({
                                type: 'goal',
                                id: goalData.id,
                                currentAssignment: goalData.forPerson || '',
                                goalState: currentGoalState,
                                descriptionBlocks: descriptionBlocks
                              }));
                              navigate('/users?picker=1');
                            }}
                            className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Pick Users
                          </button>
                          <SaveStatusIndicator field="forPerson" />
                        </div>
                      ) : (
                        <div className={`mt-1 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          {goalData.forPerson ? (
                            <div className="space-y-1">
                              {goalData.forPerson.split(',').map((name, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                    {name.trim().charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium">{name.trim()}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not assigned</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Update Goal Button */}
                    {!isNewGoal && isManager && (
                      <div className="mt-6">
                        <button
                          onClick={handleUpdateGoal}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Save className="w-4 h-4" />
                          Update Goal
                        </button>
                        <SaveStatusIndicator field="goal" />
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
                    <div className="grid grid-cols-2 gap-4">
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
                        onClick={editingTask ? updateTask : addTask}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {editingTask ? 'Update Task' : 'Add Task'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddTask(false);
                          setEditingTask(null);
                          setNewTask({ text: '', priority: 'Medium', dueDate: '' });
                        }}
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editTask(task)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Edit task"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                        {editingComment === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className={`w-full p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateComment(comment.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingComment(null);
                                  setNewComment('');
                                }}
                                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comment.text}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          {comment.reactions && comment.reactions.length > 0 && (
                            <div className="flex gap-1">
                              {comment.reactions.map((reaction, index) => (
                                <span key={index} className="text-lg">{reaction}</span>
                              ))}
                            </div>
                          )}
                          {comment.user === (user?.name || 'You') && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => editComment(comment)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="Edit comment"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
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

export default GoalDetailsPage;