import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  X, 
  Megaphone, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  User, 
  ShieldCheck, 
  Database,
  ArrowLeft,
  PlusCircle,
  Inbox,
  Trash2
} from 'lucide-react';
import { ID, Query, Permission, Role } from 'appwrite';
import { 
  client,
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_ANNOUNCEMENTS_COLLECTION_ID, 
  APPWRITE_MESSAGES_COLLECTION_ID, 
  ADMIN_EMAIL 
} from '../lib/appwrite';
import { useI18n } from '../lib/i18n';

interface FullscreenChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
}

export interface AnnouncementItem {
  $id?: string;
  id: string;
  title?: string;
  content: string;
  senderEmail: string;
  senderName?: string;
  createdAt: number;
}

export interface PrivateMessageItem {
  $id?: string;
  id: string;
  senderEmail: string;
  receiverEmail: string;
  content: string;
  createdAt: number;
}

export const FullscreenChatModal: React.FC<FullscreenChatModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'announcements' | 'private'>('announcements');
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Announcements State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [showAdminPostForm, setShowAdminPostForm] = useState(false);

  // Private Messages State
  const [messages, setMessages] = useState<PrivateMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  
  // Appwrite Status
  const [appwriteStatus, setAppwriteStatus] = useState<'synced' | 'local_fallback' | 'checking'>('checking');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine user email
  useEffect(() => {
    const email = currentUserEmail || localStorage.getItem('tautanlumina:current_user_email') || 'user@lumina.app';
    setUserEmail(email);
  }, [currentUserEmail, isOpen]);

  const isAdmin = userEmail.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'private' && (selectedChatUser || !isAdmin)) {
      scrollToBottom();
    }
  }, [messages, activeTab, selectedChatUser, isAdmin]);

  // Load Announcements
  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
        [Query.orderDesc('createdAt'), Query.limit(50)]
      );
      const items: AnnouncementItem[] = response.documents.map((doc: any) => ({
        $id: doc.$id,
        id: doc.$id || doc.id,
        title: doc.title,
        content: doc.content || '',
        senderEmail: doc.senderEmail || ADMIN_EMAIL,
        senderName: doc.senderName,
        createdAt: typeof doc.createdAt === 'number' ? doc.createdAt : new Date(doc.$createdAt).getTime()
      }));
      setAnnouncements(items);
      setAppwriteStatus('synced');
    } catch (e) {
      console.warn('Appwrite announcements collection fetch fallback:', e);
      const localData = localStorage.getItem('tautanlumina:announcements');
      if (localData) {
        try {
          setAnnouncements(JSON.parse(localData));
        } catch {}
      } else {
        const defaultAnnouncements: AnnouncementItem[] = [
          {
            id: 'welcome-1',
            title: 'Selamat Datang di TautanLumina Chat',
            content: `### 📢 Pengumuman Resmi Lumina\n\nSelamat datang di ruang pengumuman dan komunikasi **TautanLumina**.\n\n- Ruang ini khusus menampilkan pengumuman resmi dari Admin.\n- Format teks mendukung **Markdown** dan **Plain Text**.\n- Untuk berkonsultasi secara privat dengan Admin, silakan gunakan tab **Chat Private Admin**.`,
            senderEmail: ADMIN_EMAIL,
            senderName: 'Admin Lumina',
            createdAt: Date.now()
          }
        ];
        setAnnouncements(defaultAnnouncements);
        localStorage.setItem('tautanlumina:announcements', JSON.stringify(defaultAnnouncements));
      }
      setAppwriteStatus('local_fallback');
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // Post Announcement (Admin only)
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newAnnouncement.trim()) return;

    setPostingAnnouncement(true);
    const newItem: AnnouncementItem = {
      id: 'ann_' + Date.now(),
      content: newAnnouncement.trim(),
      senderEmail: userEmail || ADMIN_EMAIL,
      senderName: 'Admin Lumina',
      createdAt: Date.now()
    };

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
        ID.unique(),
        {
          content: newItem.content,
          senderEmail: newItem.senderEmail,
          senderName: newItem.senderName,
          createdAt: newItem.createdAt
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
          Permission.read(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      setNewAnnouncement('');
      setShowAdminPostForm(false);
      await fetchAnnouncements();
    } catch (err) {
      console.warn('Appwrite post announcement failed, saving locally:', err);
      const updated = [newItem, ...announcements];
      setAnnouncements(updated);
      localStorage.setItem('tautanlumina:announcements', JSON.stringify(updated));
      setNewAnnouncement('');
      setShowAdminPostForm(false);
    } finally {
      setPostingAnnouncement(false);
    }
  };

  // Load Private Messages
  const fetchPrivateMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_MESSAGES_COLLECTION_ID,
        [Query.orderAsc('createdAt'), Query.limit(200)]
      );
      const docs: PrivateMessageItem[] = response.documents.map((doc: any) => ({
        $id: doc.$id,
        id: doc.$id || doc.id,
        senderEmail: doc.senderEmail,
        receiverEmail: doc.receiverEmail,
        content: doc.content || '',
        createdAt: typeof doc.createdAt === 'number' ? doc.createdAt : new Date(doc.$createdAt).getTime()
      }));
      setMessages(docs);
      setAppwriteStatus('synced');
    } catch (e) {
      console.warn('Appwrite private messages fetch fallback:', e);
      const localData = localStorage.getItem('tautanlumina:private_messages');
      if (localData) {
        try {
          setMessages(JSON.parse(localData));
        } catch {}
      } else {
        const defaultMsgs: PrivateMessageItem[] = [
          {
            id: 'msg-1',
            senderEmail: ADMIN_EMAIL,
            receiverEmail: userEmail || 'user@lumina.app',
            content: 'Halo! Ada yang bisa kami bantu mengenai TautanLumina?',
            createdAt: Date.now() - 3600000
          }
        ];
        setMessages(defaultMsgs);
        localStorage.setItem('tautanlumina:private_messages', JSON.stringify(defaultMsgs));
      }
      setAppwriteStatus('local_fallback');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send Private Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    const targetReceiver = isAdmin ? (selectedChatUser || 'user@lumina.app') : ADMIN_EMAIL;
    const msgObj: PrivateMessageItem = {
      id: 'msg_' + Date.now(),
      senderEmail: userEmail || 'user@lumina.app',
      receiverEmail: targetReceiver,
      content: newMessage.trim(),
      createdAt: Date.now()
    };

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          senderEmail: msgObj.senderEmail,
          receiverEmail: msgObj.receiverEmail,
          content: msgObj.content,
          createdAt: msgObj.createdAt
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
          Permission.read(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      setNewMessage('');
      await fetchPrivateMessages();
    } catch (err) {
      console.warn('Appwrite send message failed, saving locally:', err);
      const updated = [...messages, msgObj];
      setMessages(updated);
      localStorage.setItem('tautanlumina:private_messages', JSON.stringify(updated));
      setNewMessage('');
    } finally {
      setSendingMessage(false);
    }
  };

  // Delete Announcement (Admin only)
  const handleDeleteAnnouncement = async (docId: string) => {
    if (!isAdmin || !docId) return;
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
        docId
      );
    } catch (err) {
      console.warn('Appwrite delete announcement fallback:', err);
    }
    const updated = announcements.filter((a) => a.$id !== docId && a.id !== docId);
    setAnnouncements(updated);
    localStorage.setItem('tautanlumina:announcements', JSON.stringify(updated));
  };

  // Delete Private Message (Admin only)
  const handleDeletePrivateMessage = async (docId: string) => {
    if (!isAdmin || !docId) return;
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_MESSAGES_COLLECTION_ID,
        docId
      );
    } catch (err) {
      console.warn('Appwrite delete message fallback:', err);
    }
    const updated = messages.filter((m) => m.$id !== docId && m.id !== docId);
    setMessages(updated);
    localStorage.setItem('tautanlumina:private_messages', JSON.stringify(updated));
  };

  // Delete all private messages for a specific user (Admin only)
  const handleDeleteUserConversation = async (targetEmail: string) => {
    if (!isAdmin || !targetEmail) return;
    const userMsgs = messages.filter(
      (m) => m.senderEmail.toLowerCase() === targetEmail.toLowerCase() || m.receiverEmail.toLowerCase() === targetEmail.toLowerCase()
    );
    for (const msg of userMsgs) {
      const docId = msg.$id || msg.id;
      if (docId) {
        try {
          await databases.deleteDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_MESSAGES_COLLECTION_ID,
            docId
          );
        } catch (err) {
          console.warn('Appwrite delete message fallback:', err);
        }
      }
    }
    const updated = messages.filter(
      (m) => m.senderEmail.toLowerCase() !== targetEmail.toLowerCase() && m.receiverEmail.toLowerCase() !== targetEmail.toLowerCase()
    );
    setMessages(updated);
    localStorage.setItem('tautanlumina:private_messages', JSON.stringify(updated));
    if (selectedChatUser?.toLowerCase() === targetEmail.toLowerCase()) {
      setSelectedChatUser(null);
    }
  };

  // Fast Periodic Polling Sync for seamless real-time updates without WebSocket disconnection errors
  useEffect(() => {
    if (!isOpen) return;

    // Initial fetch
    fetchAnnouncements();
    fetchPrivateMessages();

    // Fast 3-second polling interval for real-time chat updates
    const intervalId = setInterval(() => {
      fetchAnnouncements();
      fetchPrivateMessages();
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen]);

  // Extract distinct user conversations for Admin
  const userConversations = Array.from(
    new Set(
      messages
        .flatMap((m) => [m.senderEmail, m.receiverEmail])
        .filter((email) => email && email.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase().trim())
    )
  );

  // Filter messages for current chat session
  const filteredMessages = messages.filter((m) => {
    if (isAdmin) {
      if (!selectedChatUser) return false;
      return (
        (m.senderEmail.toLowerCase() === selectedChatUser.toLowerCase() && m.receiverEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
        (m.senderEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() && m.receiverEmail.toLowerCase() === selectedChatUser.toLowerCase())
      );
    } else {
      return (
        (m.senderEmail.toLowerCase() === userEmail.toLowerCase() && m.receiverEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
        (m.senderEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() && m.receiverEmail.toLowerCase() === userEmail.toLowerCase()) ||
        (m.senderEmail.toLowerCase() === userEmail.toLowerCase() || m.receiverEmail.toLowerCase() === userEmail.toLowerCase())
      );
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#faf8f5] text-neutral-900 animate-in fade-in duration-200">
      {/* Header - Mobile Minimalist */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e2ddd5] shrink-0">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-9 h-9 rounded-full bg-[#FF4F00]/10 flex items-center justify-center text-[#FF4F00] shrink-0">
            <MessageSquare size={19} />
          </div>
          <div className="truncate">
            <div className="text-base font-bold text-neutral-900 leading-tight truncate">
              {activeTab === 'announcements' ? 'Ruang 1: Pengumuman' : 'Ruang 2: Chat Admin'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 truncate">
              <span className="truncate">{userEmail}</span>
              {isAdmin && (
                <span className="px-1.5 py-0.2 rounded bg-[#FF4F00] text-white font-bold text-[9px] uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={activeTab === 'announcements' ? fetchAnnouncements : fetchPrivateMessages}
            title="Refresh"
            className="p-2.5 rounded-full text-neutral-600 hover:bg-[#f0ece1] active:bg-[#e2ddd5] transition-colors"
          >
            <RefreshCw size={18} className={(loadingAnnouncements || loadingMessages) ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full text-neutral-600 hover:bg-[#f0ece1] active:bg-[#e2ddd5] transition-colors"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Top Segmented Tab Switcher (Mobile Minimalist) */}
      <div className="p-2 bg-[#f2eee9] border-b border-[#e2ddd5] shrink-0">
        <div className="grid grid-cols-2 bg-white rounded-xl p-1 shadow-sm border border-[#e2ddd5]">
          <button
            onClick={() => {
              setActiveTab('announcements');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'announcements'
                ? 'bg-[#FF4F00] text-white shadow'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Megaphone size={15} />
            <span className="truncate">Pengumuman</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('private');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'private'
                ? 'bg-[#FF4F00] text-white shadow'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <MessageSquare size={15} />
            <span className="truncate">Chat Private</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-[#fdfcfb]">
        {/* ================= TAB 1: PENGUMUMAN PUBLIK ================= */}
        {activeTab === 'announcements' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* If Admin: Show toggle button to post new announcement */}
            {isAdmin && (
              <div className="p-3 bg-white border-b border-[#e2ddd5] shrink-0 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-600">
                  Panel Pengumuman Admin
                </span>
                <button
                  onClick={() => setShowAdminPostForm(!showAdminPostForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FF4F00] text-white hover:bg-[#e04500] transition-all"
                >
                  <PlusCircle size={14} />
                  {showAdminPostForm ? 'Batal' : 'Tulis Pengumuman'}
                </button>
              </div>
            )}

            {/* Admin Post Announcement Form Drawer/Box */}
            {isAdmin && showAdminPostForm && (
              <div className="p-4 bg-white border-b border-[#e2ddd5] shadow-inner shrink-0">
                <form onSubmit={handlePostAnnouncement} className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-700">
                    Tulis Pengumuman (Teks / Markdown)
                  </label>
                  <textarea
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="Ketik teks pengumuman di sini..."
                    rows={4}
                    className="w-full p-3 text-sm rounded-xl border border-[#e2ddd5] focus:outline-none focus:ring-2 focus:ring-[#FF4F00] bg-[#faf8f5] resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdminPostForm(false)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg text-neutral-600 hover:bg-[#f0ece1]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={postingAnnouncement || !newAnnouncement.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#FF4F00] text-white hover:bg-[#e04500] disabled:opacity-50"
                    >
                      {postingAnnouncement ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      Posting
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Announcements List View (Mobile Clean Minimalist) */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
              {announcements.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
                  <Inbox size={32} className="text-neutral-300" />
                  Belum ada pengumuman saat ini.
                </div>
              ) : (
                announcements.map((item) => (
                  <div
                    key={item.id || item.$id}
                    className="p-4 bg-white border border-[#e2ddd5] rounded-xl shadow-sm text-xs leading-relaxed"
                  >
                    <div className="flex items-center justify-between border-b border-[#f0ece1] pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#FF4F00]/10 text-[#FF4F00] flex items-center justify-center font-bold text-[10px]">
                          📢
                        </div>
                        <span className="font-bold text-neutral-900 text-xs">
                          {item.senderName || 'Admin Lumina'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAnnouncement(item.$id || item.id)}
                            className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Hapus Pengumuman"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="markdown-body text-neutral-800 space-y-1 font-sans break-words">
                      <ReactMarkdown>{item.content}</ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: CHAT PRIVATE ADMIN ================= */}
        {activeTab === 'private' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* ADMIN VIEW: List of users OR single active conversation */}
            {isAdmin ? (
              selectedChatUser === null ? (
                /* ADMIN VIEW - LIST OF USER CHATS */
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                  <div className="p-3 bg-[#faf8f5] border-b border-[#e2ddd5] text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Daftar Pesan Pengguna ({userConversations.length})
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#f0ece1]">
                    {userConversations.length === 0 ? (
                      <div className="py-12 text-center text-xs text-neutral-400">
                        Belum ada pesan masuk dari pengguna.
                      </div>
                    ) : (
                      userConversations.map((email) => {
                        const userMsgs = messages.filter(
                          (m) => m.senderEmail.toLowerCase() === email.toLowerCase() || m.receiverEmail.toLowerCase() === email.toLowerCase()
                        );
                        const lastMsg = userMsgs[userMsgs.length - 1];

                        return (
                          <div
                            key={email}
                            className="w-full p-3.5 transition-colors hover:bg-[#faf8f5] flex items-center justify-between gap-3 border-b border-[#f0ece1]"
                          >
                            <button
                              onClick={() => setSelectedChatUser(email)}
                              className="flex-1 flex items-center gap-3 truncate text-left"
                            >
                              <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {email[0].toUpperCase()}
                              </div>
                              <div className="truncate">
                                <div className="text-sm font-bold text-neutral-900 truncate">
                                  {email}
                                </div>
                                <div className="text-xs text-neutral-500 truncate mt-0.5">
                                  {lastMsg ? lastMsg.content : 'Memulai percakapan'}
                                </div>
                              </div>
                            </button>
                            <div className="flex items-center gap-2 shrink-0">
                              {lastMsg && (
                                <span className="text-[10px] text-neutral-400">
                                  {new Date(lastMsg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUserConversation(email);
                                }}
                                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title={`Hapus semua chat dengan ${email}`}
                                aria-label={`Hapus semua chat dengan ${email}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* ADMIN VIEW - ACTIVE CONVERSATION WITH SELECTED USER */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Subheader with Back Button & Delete User Chat Button */}
                  <div className="p-2.5 bg-white border-b border-[#e2ddd5] flex items-center justify-between shrink-0">
                    <button
                      onClick={() => setSelectedChatUser(null)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-[#f0ece1] rounded-lg transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Daftar User
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-800 truncate max-w-[180px]">
                        {selectedChatUser}
                      </span>
                      <button
                        onClick={() => selectedChatUser && handleDeleteUserConversation(selectedChatUser)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Semua Chat User Ini"
                        aria-label="Hapus Semua Chat User Ini"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
                    {filteredMessages.length === 0 ? (
                      <div className="py-8 text-center text-xs text-neutral-400">
                        Belum ada percakapan. Balas pesan pengguna di bawah ini.
                      </div>
                    ) : (
                      filteredMessages.map((m) => {
                        const isSelf = m.senderEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();
                        return (
                          <div
                            key={m.id || m.$id}
                            className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[10px] text-neutral-400 mb-0.5 px-1">
                              {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`flex items-center gap-1.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                                  isSelf
                                    ? 'bg-[#FF4F00] text-white rounded-br-none'
                                    : 'bg-white text-neutral-900 border border-[#e2ddd5] rounded-bl-none'
                                }`}
                              >
                                {m.content}
                              </div>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeletePrivateMessage(m.$id || m.id)}
                                  className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                  title="Hapus Pesan"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Plaintext Input Bar */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-white border-t border-[#e2ddd5] flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ketik balasan (plaintext)..."
                      className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-[#e2ddd5] focus:outline-none focus:ring-2 focus:ring-[#FF4F00] bg-[#faf8f5]"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="p-2.5 bg-[#FF4F00] hover:bg-[#e04500] text-white rounded-xl transition-all shadow-sm disabled:opacity-50 shrink-0"
                    >
                      {sendingMessage ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </form>
                </div>
              )
            ) : (
              /* REGULAR USER VIEW: Direct 2-side chat stream with Admin */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Admin Contact Header */}
                <div className="p-2.5 bg-white border-b border-[#e2ddd5] flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-medium text-neutral-600">
                      Pesan kepada Admin: <strong className="text-neutral-900">{ADMIN_EMAIL}</strong>
                    </span>
                  </div>
                </div>

                {/* Message Stream (2 Sides) */}
                <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
                  {filteredMessages.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      Belum ada percakapan. Ketik pesan Anda di bawah ini untuk dikirimkan langsung ke Admin.
                    </div>
                  ) : (
                    filteredMessages.map((m) => {
                      const isSelf = m.senderEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();
                      return (
                        <div
                          key={m.id || m.$id}
                          className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-neutral-400 mb-0.5 px-1">
                            {isSelf ? 'Anda' : 'Admin'} • {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className={`flex items-center gap-1.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                                isSelf
                                  ? 'bg-[#FF4F00] text-white rounded-br-none'
                                  : 'bg-white text-neutral-900 border border-[#e2ddd5] rounded-bl-none'
                              }`}
                            >
                              {m.content}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeletePrivateMessage(m.$id || m.id)}
                                className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                title="Hapus Pesan"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Plaintext Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-[#e2ddd5] flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan Anda di sini..."
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-[#e2ddd5] focus:outline-none focus:ring-2 focus:ring-[#FF4F00] bg-[#faf8f5]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="p-2.5 bg-[#FF4F00] hover:bg-[#e04500] text-white rounded-xl transition-all shadow-sm disabled:opacity-50 shrink-0"
                  >
                    {sendingMessage ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
