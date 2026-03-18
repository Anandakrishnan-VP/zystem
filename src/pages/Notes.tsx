import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotes, Note } from '@/hooks/useNotes';
import { useAvatarTheme } from '@/hooks/useTheme';

const Notes = () => {
  const { user, loading: authLoading } = useAuth();
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const navigate = useNavigate();
  useAvatarTheme();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const activeNote = notes.find(n => n.id === activeId);

  const selectNote = (note: Note) => {
    // Save current before switching
    if (activeId && (title !== activeNote?.title || content !== activeNote?.content)) {
      updateNote(activeId, title, content);
    }
    setActiveId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    autoSave(activeId!, val, content);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    autoSave(activeId!, title, val);
  };

  const autoSave = (id: string, t: string, c: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => updateNote(id, t, c), 800);
  };

  const handleNew = async () => {
    const note = await addNote();
    if (note) {
      setActiveId(note.id);
      setTitle(note.title);
      setContent(note.content);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
    if (activeId === id) {
      setActiveId(null);
      setTitle('');
      setContent('');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-wider">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-foreground">
        <div className="container max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeId) updateNote(activeId, title, content);
                navigate('/');
              }}
              className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="font-mono text-lg font-bold uppercase tracking-widest">Notes</h1>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider border border-foreground px-3 py-2 hover:bg-foreground hover:text-background transition-colors"
          >
            <Plus size={14} />
            New
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — note list */}
        <aside className="w-64 border-r border-muted-foreground/20 overflow-y-auto flex-shrink-0">
          {notes.length === 0 ? (
            <div className="p-6 text-center">
              <FileText size={24} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="font-mono text-xs text-muted-foreground/50">No notes yet</p>
            </div>
          ) : (
            notes.map(note => (
              <button
                key={note.id}
                onClick={() => selectNote(note)}
                className={`w-full text-left px-4 py-3 border-b border-muted-foreground/10 hover:bg-muted/30 transition-colors group ${
                  activeId === note.id ? 'bg-muted/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold truncate">
                      {note.title || 'Untitled'}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">
                      {note.content?.slice(0, 50) || 'Empty note'}
                    </p>
                    <p className="font-mono text-[9px] text-muted-foreground/50 mt-1">
                      {formatDate(note.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </button>
            ))
          )}
        </aside>

        {/* Editor */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeId ? (
            <>
              <div className="px-8 pt-6 pb-2">
                <input
                  type="text"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Note title..."
                  className="w-full bg-transparent font-mono text-xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/30 border-none"
                />
              </div>
              <div className="flex-1 px-8 pb-8 overflow-y-auto">
                <textarea
                  value={content}
                  onChange={e => handleContentChange(e.target.value)}
                  placeholder="Start writing..."
                  className="w-full h-full bg-transparent font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/20 border-none resize-none"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground/40">
                  Select a note or create a new one
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notes;
