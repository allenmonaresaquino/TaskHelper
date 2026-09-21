import React, { useState, useEffect } from 'react';
import { Task, Subtask, Priority, Status } from '../types';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Plus, 
  Calendar, 
  GitBranch, 
  Tag as TagIcon, 
  Layers, 
  CheckCircle2, 
  Circle, 
  Sliders, 
  AlertCircle,
  ExternalLink,
  Clock,
  Check,
  X
} from 'lucide-react';

interface TaskEditorPageProps {
  task: Task | null; // null means creating a new task
  existingCategories: string[];
  existingTags: string[];
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export const TaskEditorPage: React.FC<TaskEditorPageProps> = ({
  task,
  existingCategories,
  existingTags,
  onSave,
  onCancel,
  onDelete,
}) => {
  const isEditing = Boolean(task);

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [status, setStatus] = useState<Status>(task?.status || 'todo');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [category, setCategory] = useState(task?.category || (existingCategories[0] || 'General'));
  const [customCategory, setCustomCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [githubUrl, setGithubUrl] = useState(task?.githubUrl || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [autoProgress, setAutoProgress] = useState(task?.autoProgress ?? true);
  const [manualProgress, setManualProgress] = useState(task?.progress || 0);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync state if task prop changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate || '');
      setCategory(task.category || 'General');
      setTags(task.tags || []);
      setGithubUrl(task.githubUrl || '');
      setSubtasks(task.subtasks || []);
      setAutoProgress(task.autoProgress ?? true);
      setManualProgress(task.progress || 0);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate('');
      setCategory(existingCategories[0] || 'General');
      setCustomCategory('');
      setTags([]);
      setGithubUrl('');
      setSubtasks([]);
      setAutoProgress(true);
      setManualProgress(0);
    }
    setErrors({});
  }, [task, existingCategories]);

  // Compute live progress percentage
  const currentProgress = React.useMemo(() => {
    if (status === 'completed') return 100;
    if (autoProgress && subtasks.length > 0) {
      const completed = subtasks.filter((s) => s.completed).length;
      return Math.round((completed / subtasks.length) * 100);
    }
    return manualProgress;
  }, [autoProgress, subtasks, manualProgress, status]);

  // Compute deadline countdown text
  const deadlineInfo = React.useMemo(() => {
    if (!dueDate) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const target = new Date(dueDate).getTime();
    const today = new Date(todayStr).getTime();
    const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) {
      return { text: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`, isOverdue: true };
    }
    if (diff === 0) {
      return { text: 'Due today', isDueToday: true };
    }
    if (diff === 1) {
      return { text: 'Due tomorrow', isUpcoming: true };
    }
    return { text: `Due in ${diff} days`, isUpcoming: true };
  }, [dueDate]);

  // Keyboard shortcut: Ctrl+S or Cmd+S to save, Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, description, priority, status, dueDate, category, customCategory, tags, githubUrl, subtasks, autoProgress, manualProgress]);

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(`#${clean}`)) {
      setTags([...tags, `#${clean}`]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSt: Subtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setSubtasks([...subtasks, newSt]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const setQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrors({ title: 'Task title is required' });
      return;
    }

    const finalCategory = category === 'new_custom' ? customCategory.trim() || 'General' : category;

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        progress: currentProgress,
        autoProgress,
        dueDate,
        category: finalCategory,
        tags,
        githubUrl: githubUrl.trim() || undefined,
        subtasks,
      },
      task?.id
    );

    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onCancel();
    }, 400);
  };

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            type="button"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Return to task list (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tasks</span>
          </button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40">
              {isEditing ? 'Editing Task' : 'New Task'}
            </span>
            {isEditing && task?.updatedAt && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:inline-block">
                Last updated {new Date(task.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {isEditing && task && onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to permanently delete this task?')) {
                  onDelete(task.id);
                  onCancel();
                }
              }}
              type="button"
              className="px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition border border-transparent hover:border-rose-200 dark:hover:border-rose-900 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={onCancel}
            type="button"
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            type="button"
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs hover:shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout for Maximum Readability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Column: Primary Content (Title, Description, Subtasks) - 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title Input */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({});
              }}
              placeholder="e.g. Implement OAuth2 PKCE Authentication Flow"
              className={`w-full text-xl sm:text-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent border-b ${
                errors.title 
                  ? 'border-rose-400 focus:border-rose-500' 
                  : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400'
              } pb-2 focus:outline-none transition`}
              autoFocus={!isEditing}
            />
            {errors.title && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Description Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Detailed Description & Notes
              </label>
              <span className="text-[11px] text-slate-400">
                {description.length} characters
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write detailed context, implementation specifications, reproduction steps, or acceptance criteria..."
              rows={7}
              className="w-full text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-y focus:outline-none font-sans"
            />
          </div>

          {/* Subtasks & Checklist Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Milestones & Subtasks</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({completedSubtasksCount}/{subtasks.length} completed)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Break down this task into structured, checkable deliverables.
                </p>
              </div>

              {subtasks.length > 0 && (
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {Math.round((completedSubtasksCount / subtasks.length) * 100)}%
                </div>
              )}
            </div>

            {/* Subtask Progress Bar */}
            {subtasks.length > 0 && (
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.round((completedSubtasksCount / subtasks.length) * 100)}%` }}
                />
              </div>
            )}

            {/* Quick Add Subtask Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a new subtask (press Enter)..."
                className="flex-1 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subtask</span>
              </button>
            </div>

            {/* Subtask List */}
            {subtasks.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No subtasks added yet. Type milestone deliverables above to track incremental progress.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {subtasks.map((st, index) => (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      st.completed
                        ? 'bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(st.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition shrink-0 cursor-pointer ${
                          st.completed
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-xs select-none break-words ${st.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'}`}>
                        {st.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      title="Remove subtask"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Properties Sidebar (Status, Priority, Due Date, Category, Tags, GitHub) - 4 cols */}
        <div className="lg:col-span-4 space-y-5">
          {/* Status Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Task Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'todo', label: 'To Do', color: 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300' },
                { value: 'in_progress', label: 'In Progress', color: 'border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' },
                { value: 'review', label: 'In Review', color: 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300' },
                { value: 'completed', label: 'Completed', color: 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatus(item.value as Status)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${
                    status === item.value
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold border-transparent shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Priority Urgency
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { value: 'low', label: 'Low', activeClass: 'bg-slate-600 text-white' },
                { value: 'medium', label: 'Medium', activeClass: 'bg-blue-600 text-white' },
                { value: 'high', label: 'High', activeClass: 'bg-amber-600 text-white' },
                { value: 'urgent', label: 'Urgent', activeClass: 'bg-rose-600 text-white' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPriority(item.value as Priority)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium transition cursor-pointer text-center ${
                    priority === item.value
                      ? `${item.activeClass} font-bold shadow-xs`
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date & Deadline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Target Deadline
              </label>
              {deadlineInfo && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  deadlineInfo.isOverdue
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                    : deadlineInfo.isDueToday
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                }`}>
                  {deadlineInfo.text}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7)}
                className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition"
              >
                +1 Week
              </button>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-[10px] px-2 py-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition ml-auto"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Progress ({currentProgress}%)
              </label>
              <button
                type="button"
                onClick={() => setAutoProgress(!autoProgress)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                  autoProgress
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {autoProgress ? 'Auto from Subtasks' : 'Manual Progress'}
              </button>
            </div>

            {!autoProgress ? (
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={manualProgress}
                  onChange={(e) => setManualProgress(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Automatically calculated based on completed subtasks ({completedSubtasksCount}/{subtasks.length}).
              </p>
            )}
          </div>

          {/* Category & Project Tags */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              >
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="new_custom">+ Create Custom Category...</option>
              </select>

              {category === 'new_custom' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter new category name..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none mt-2"
                />
              )}
            </div>

            {/* Project Tags */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                Project Tags
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add #tag (Enter)..."
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 rounded-xl text-xs transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GitHub Integration */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                <span>GitHub Link</span>
              </label>
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/org/repo/pull/123"
              className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-mono"
            />
            <p className="text-[11px] text-slate-400 leading-normal">
              Attach a Pull Request, Issue, or commit URL related to these changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
