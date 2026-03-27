import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ExternalLink, Pencil, Trash2, FolderOpen, Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary, LinkGroup, SavedLink } from '@/hooks/useLibrary';
import { useAvatarTheme } from '@/hooks/useTheme';

const Libraries = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { groups, links, loading, addGroup, updateGroup, deleteGroup, addLink, updateLink, deleteLink, getLinksForGroup } = useLibrary();
  useAvatarTheme();

  const [search, setSearch] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [addingLinkTo, setAddingLinkTo] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({ title: '', url: '', notes: '', tags: '' });
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [editLink, setEditLink] = useState({ title: '', url: '', notes: '', tags: '' });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-wider">Loading...</p>
      </div>
    );
  }

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    await addGroup(newGroupName.trim());
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const handleSaveGroupEdit = async (id: string) => {
    if (!editGroupName.trim()) return;
    await updateGroup(id, editGroupName.trim());
    setEditingGroup(null);
  };

  const handleAddLink = async (groupId: string) => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    let url = newLink.url.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const tags = newLink.tags ? newLink.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    await addLink(groupId, newLink.title.trim(), url, newLink.notes.trim(), tags);
    setNewLink({ title: '', url: '', notes: '', tags: '' });
    setAddingLinkTo(null);
  };

  const handleSaveLinkEdit = async (id: string) => {
    if (!editLink.title.trim() || !editLink.url.trim()) return;
    let url = editLink.url.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const tags = editLink.tags ? editLink.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    await updateLink(id, { title: editLink.title.trim(), url, notes: editLink.notes.trim(), tags });
    setEditingLink(null);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredGroups = groups.map(g => {
    const groupLinks = getLinksForGroup(g.id);
    if (!search) return { ...g, links: groupLinks };
    const q = search.toLowerCase();
    const filtered = groupLinks.filter(l =>
      l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) ||
      l.notes.toLowerCase().includes(q) || l.tags.some(t => t.toLowerCase().includes(q))
    );
    const groupMatch = g.name.toLowerCase().includes(q);
    return { ...g, links: groupMatch ? groupLinks : filtered };
  }).filter(g => g.links.length > 0 || (!search && true));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground">
        <div className="container max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <FolderOpen size={18} />
              <h1 className="font-mono text-lg font-bold uppercase tracking-widest">Libraries</h1>
            </div>
          </div>
          <button
            onClick={() => setShowAddGroup(true)}
            className="flex items-center gap-2 border border-foreground px-3 py-2 font-mono text-xs uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
          >
            <Plus size={14} /> New Group
          </button>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search links, groups, tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full font-mono text-xs bg-transparent border border-muted-foreground/30 pl-9 pr-8 py-2.5 text-foreground placeholder:text-muted-foreground/40 focus:border-foreground outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Add Group Form */}
        {showAddGroup && (
          <div className="border border-foreground p-4 mb-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">New Group</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Group name (e.g. AI Resources)"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                autoFocus
                className="flex-1 font-mono text-xs bg-transparent border border-muted-foreground/30 px-3 py-2 text-foreground placeholder:text-muted-foreground/40 focus:border-foreground outline-none"
              />
              <button onClick={handleAddGroup} className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors">
                Create
              </button>
              <button onClick={() => { setShowAddGroup(false); setNewGroupName(''); }} className="font-mono text-[10px] uppercase tracking-wider px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Groups */}
        {filteredGroups.length === 0 && !showAddGroup ? (
          <div className="border border-muted-foreground/20 p-12 text-center">
            <FolderOpen size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">No groups yet</p>
            <p className="font-mono text-[10px] text-muted-foreground/60">Create a group to start saving links</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map(group => {
              const isCollapsed = collapsedGroups.has(group.id);
              const groupLinks = 'links' in group ? (group as any).links as SavedLink[] : getLinksForGroup(group.id);
              return (
                <div key={group.id} className="border border-foreground">
                  {/* Group Header */}
                  <div className="px-4 py-3 border-b border-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button onClick={() => toggleCollapse(group.id)} className="text-muted-foreground hover:text-foreground">
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {editingGroup === group.id ? (
                        <div className="flex gap-2 flex-1">
                          <input
                            type="text"
                            value={editGroupName}
                            onChange={e => setEditGroupName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveGroupEdit(group.id)}
                            autoFocus
                            className="flex-1 font-mono text-xs bg-transparent border border-muted-foreground/30 px-2 py-1 text-foreground focus:border-foreground outline-none"
                          />
                          <button onClick={() => handleSaveGroupEdit(group.id)} className="font-mono text-[9px] uppercase px-2 py-1 border border-foreground hover:bg-foreground hover:text-background">Save</button>
                          <button onClick={() => setEditingGroup(null)} className="font-mono text-[9px] uppercase px-2 py-1 text-muted-foreground hover:text-foreground">✕</button>
                        </div>
                      ) : (
                        <h3 className="font-mono text-xs font-bold uppercase tracking-widest truncate">{group.name}</h3>
                      )}
                      <span className="font-mono text-[9px] text-muted-foreground/60 flex-shrink-0">{groupLinks.length}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => { setAddingLinkTo(group.id); setNewLink({ title: '', url: '', notes: '', tags: '' }); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Add link"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => { setEditingGroup(group.id); setEditGroupName(group.name); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename group"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${group.name}" and all its links?`)) deleteGroup(group.id); }}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete group"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Add Link Form */}
                  {addingLinkTo === group.id && (
                    <div className="px-4 py-3 border-b border-muted-foreground/20 bg-muted/30">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Add Link</p>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="text" placeholder="Title *" value={newLink.title} onChange={e => setNewLink(p => ({ ...p, title: e.target.value }))} autoFocus
                          className="font-mono text-[11px] bg-transparent border border-muted-foreground/30 px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40 focus:border-foreground outline-none" />
                        <input type="text" placeholder="URL *" value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                          className="font-mono text-[11px] bg-transparent border border-muted-foreground/30 px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40 focus:border-foreground outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="text" placeholder="Notes (optional)" value={newLink.notes} onChange={e => setNewLink(p => ({ ...p, notes: e.target.value }))}
                          className="font-mono text-[11px] bg-transparent border border-muted-foreground/30 px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40 focus:border-foreground outline-none" />
                        <input type="text" placeholder="Tags (comma separated)" value={newLink.tags} onChange={e => setNewLink(p => ({ ...p, tags: e.target.value }))}
                          className="font-mono text-[11px] bg-transparent border border-muted-foreground/30 px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40 focus:border-foreground outline-none" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAddLink(group.id)} className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border border-foreground hover:bg-foreground hover:text-background transition-colors">Add</button>
                        <button onClick={() => setAddingLinkTo(null)} className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  {!isCollapsed && groupLinks.length > 0 && (
                    <div className="divide-y divide-muted-foreground/10">
                      {groupLinks.map(link => (
                        <div key={link.id} className="px-4 py-2.5 flex items-center gap-3 group hover:bg-muted/20 transition-colors">
                          {editingLink === link.id ? (
                            <div className="flex-1 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={editLink.title} onChange={e => setEditLink(p => ({ ...p, title: e.target.value }))} autoFocus
                                  className="font-mono text-[11px] bg-transparent border border-muted-foreground/30 px-2 py-1 text-foreground focus:border-foreground outline-none" />
                                <input type="text" value={editLink.url} onChange={e => setEditLink(p => ({ ...p, url: e.target.value }))}
                                  className="font-mono text-[11px] bg-transparent border border-muted-foreground/30 px-2 py-1 text-foreground focus:border-foreground outline-none" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={editLink.notes} onChange={e => setEditLink(p => ({ ...p, notes: e.target.value }))} placeholder="Notes"
                                  className="font-mono text-[11px] bg-transparent border border-muted-foreground/30 px-2 py-1 text-foreground placeholder:text-muted-foreground/40 focus:border-foreground outline-none" />
                                <input type="text" value={editLink.tags} onChange={e => setEditLink(p => ({ ...p, tags: e.target.value }))} placeholder="Tags"
                                  className="font-mono text-[11px] bg-transparent border border-muted-foreground/30 px-2 py-1 text-foreground placeholder:text-muted-foreground/40 focus:border-foreground outline-none" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleSaveLinkEdit(link.id)} className="font-mono text-[9px] uppercase px-2 py-1 border border-foreground hover:bg-foreground hover:text-background">Save</button>
                                <button onClick={() => setEditingLink(null)} className="font-mono text-[9px] uppercase px-2 py-1 text-muted-foreground hover:text-foreground">✕</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 flex items-center gap-2">
                                <ExternalLink size={12} className="flex-shrink-0 text-muted-foreground" />
                                <div className="min-w-0">
                                  <p className="font-mono text-xs truncate">{link.title}</p>
                                  <p className="font-mono text-[9px] text-muted-foreground/60 truncate">{link.url}</p>
                                  {link.notes && <p className="font-mono text-[9px] text-muted-foreground/40 truncate mt-0.5">{link.notes}</p>}
                                </div>
                              </a>
                              {link.tags && link.tags.length > 0 && (
                                <div className="flex gap-1 flex-shrink-0">
                                  {link.tags.map(tag => (
                                    <span key={tag} className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 border border-muted-foreground/20 text-muted-foreground">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => { setEditingLink(link.id); setEditLink({ title: link.title, url: link.url, notes: link.notes || '', tags: link.tags?.join(', ') || '' }); }}
                                  className="p-1 text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button onClick={() => deleteLink(link.id)} className="p-1 text-muted-foreground hover:text-destructive">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!isCollapsed && groupLinks.length === 0 && addingLinkTo !== group.id && (
                    <div className="px-4 py-6 text-center">
                      <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">No links yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-foreground mt-24">
        <div className="container max-w-4xl mx-auto px-6 py-6">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            A <span className="text-white font-bold">Zyphor</span> Product
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Libraries;
