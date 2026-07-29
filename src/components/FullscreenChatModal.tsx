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
  Trash2,
  Mic,
  Volume2,
  Play,
  Pause,
  Square,
  Check
} from 'lucide-react';
import { ID, Query, Permission, Role } from 'appwrite';
import { 
  client,
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_ANNOUNCEMENTS_COLLECTION_ID, 
  APPWRITE_MESSAGES_COLLECTION_ID, 
  ADMIN_EMAIL,
  formatDisplayEmail 
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

  // Voice Chat Recording & Preview State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Safe localStorage helper to prevent QuotaExceededError
  const safeSetLocalStorage = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage quota exceeded, trimming old items:', e);
      try {
        if (key === 'tautanlumina:private_messages') {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 10) {
            // Keep only latest 10 messages if local storage quota is reached
            const trimmed = parsed.slice(-10);
            localStorage.setItem(key, JSON.stringify(trimmed));
          }
        }
      } catch (err2) {
        console.warn('Failed to prune local storage:', err2);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(t.micNotSupported);
        return;
      }
      discardPreview();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000
        }
      });
      mediaStreamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const options: MediaRecorderOptions = {
        audioBitsPerSecond: 16000
      };
      if (mimeType) options.mimeType = mimeType;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 29) {
            // Maximum limit 30 seconds reached! Automatically stop and show preview for user choice (Batal or Kirim)
            setTimeout(() => {
              stopAndPreviewRecording();
            }, 0);
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err?.message?.includes('not allowed')) {
        alert(t.micNotAllowed);
      } else {
        alert(t.micPermissionDenied);
      }
    }
  };

  const stopAndPreviewRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current as any);
      recordingTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      setIsRecording(false);
      return;
    }

    recorder.onstop = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm'
      });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        const voiceContent = `[AUDIO]${base64Audio}`;
        setRecordedAudioUrl(voiceContent);
        setRecordedAudioDuration(recordingDuration || 1);
        setIsRecording(false);
      };
    };

    if (recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current as any);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
    discardPreview();
  };

  const discardPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setIsPreviewPlaying(false);
    setRecordedAudioUrl(null);
    setRecordedAudioDuration(0);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPreviewPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  const sendVoiceNote = async () => {
    if (!recordedAudioUrl && !isRecording) return;

    setIsUploadingAudio(true);

    if (recordedAudioUrl) {
      await sendAudioMessage(recordedAudioUrl);
      discardPreview();
      setRecordingDuration(0);
      setIsUploadingAudio(false);
    } else if (isRecording) {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        setIsUploadingAudio(false);
        return;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current as any);
        recordingTimerRef.current = null;
      }
      recorder.onstop = async () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const voiceContent = `[AUDIO]${base64Audio}`;
          await sendAudioMessage(voiceContent);
          setIsRecording(false);
          setRecordingDuration(0);
          setIsUploadingAudio(false);
          audioChunksRef.current = [];
        };
      };
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    }
  };

  const sendAudioMessage = async (voiceContent: string) => {
    setSendingMessage(true);
    const targetReceiver = isAdmin ? (selectedChatUser || 'user@lumina.app') : ADMIN_EMAIL;
    const msgObj: PrivateMessageItem = {
      id: 'msg_' + Date.now(),
      senderEmail: userEmail || 'user@lumina.app',
      receiverEmail: targetReceiver,
      content: voiceContent,
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
      await fetchPrivateMessages();
    } catch (err) {
      console.warn('Appwrite send audio message failed, saving locally:', err);
      const updated = [...messages, msgObj];
      setMessages(updated);
      safeSetLocalStorage('tautanlumina:private_messages', JSON.stringify(updated));
    } finally {
      setSendingMessage(false);
    }
  };

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current as any);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const renderChatInputBar = (placeholder: string) => {
    if (isRecording) {
      return (
        <div className="p-3 bg-white border-t border-[#e2ddd5] flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          {/* Tombol Batal */}
          <button
            type="button"
            onClick={cancelRecording}
            className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
          >
            <X size={15} />
            <span className="hidden sm:inline">{t.cancel}</span>
          </button>

          {/* Equalizer Wave + Timer */}
          <div className="flex-1 flex items-center justify-between py-2 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border border-red-200/80 rounded-xl px-3 text-red-600 shadow-inner overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <Mic size={16} className="animate-pulse text-red-600 hidden sm:block" />
              <span className="text-xs font-medium text-red-700">{t.recording}</span>
            </div>

            {/* Sound Wave Animation */}
            <div className="flex items-center gap-0.5 h-4 px-1">
              <span className="w-0.5 bg-red-500 rounded-full h-2 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-0.5 bg-red-500 rounded-full h-4 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-0.5 bg-red-500 rounded-full h-3 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              <span className="w-0.5 bg-red-500 rounded-full h-1 animate-bounce" style={{ animationDelay: '100ms' }}></span>
              <span className="w-0.5 bg-red-500 rounded-full h-4 animate-bounce" style={{ animationDelay: '200ms' }}></span>
            </div>

            {/* Timer (Max 30s) */}
            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold tracking-wider text-red-700 bg-white/80 px-2 py-0.5 rounded-md border border-red-200">
              <span>{formatDuration(recordingDuration)}</span>
              <span className="text-red-400 text-[10px]">/ 00:30</span>
            </div>
          </div>

          {/* Tombol Selesai & Pratinjau */}
          <button
            type="button"
            onClick={stopAndPreviewRecording}
            className="px-3.5 py-2 bg-[#FF4F00] hover:bg-[#e04500] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            title={t.doneAndPreview}
          >
            <Square size={14} className="fill-current" />
            <span>{t.done}</span>
          </button>
        </div>
      );
    }

    if (recordedAudioUrl) {
      return (
        <div className="p-3 bg-amber-50/90 border-t border-amber-200/80 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <audio
            ref={previewAudioRef}
            src={recordedAudioUrl.replace('[AUDIO]', '')}
            onEnded={() => setIsPreviewPlaying(false)}
            className="hidden"
          />

          {/* Tombol Batal */}
          <button
            type="button"
            onClick={discardPreview}
            className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-100/80 border border-red-200 rounded-xl transition-all flex items-center gap-1.5 shrink-0 bg-white"
          >
            <X size={15} />
            <span>{t.cancel}</span>
          </button>

          {/* Preview Player */}
          <div className="flex-1 flex items-center gap-2.5 py-1.5 px-3 bg-white border border-amber-200 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="p-1.5 bg-[#FF4F00] text-white rounded-lg hover:bg-[#e04500] transition-colors shrink-0"
              title={isPreviewPlaying ? t.pause : t.playPreview}
            >
              {isPreviewPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>

            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-neutral-800 truncate">
                {t.previewVoiceMsg}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                <Volume2 size={11} className="text-[#FF4F00]" />
                <span>{formatDuration(recordedAudioDuration)}</span>
                <span className="text-neutral-400">{t.listenBeforeSend}</span>
              </div>
            </div>
          </div>

          {/* Tombol Kirim */}
          <button
            type="button"
            onClick={sendVoiceNote}
            disabled={isUploadingAudio}
            className="px-4 py-2 bg-[#FF4F00] hover:bg-[#e04500] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            {isUploadingAudio ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <>
                <span>{t.send}</span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t border-[#e2ddd5] flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          onClick={startRecording}
          className="p-2.5 text-neutral-500 hover:text-[#FF4F00] hover:bg-orange-50 rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
          title={t.recordVoiceChat}
        >
          <Mic size={18} />
          <span className="text-xs font-medium text-neutral-600 hidden md:inline">{t.voice}</span>
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={placeholder}
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
    );
  };

  const renderMessageContent = (content: string, isSelf: boolean) => {
    if (content.startsWith('[AUDIO]')) {
      const audioSrc = content.replace('[AUDIO]', '');
      return (
        <div className="flex flex-col gap-1.5 min-w-[210px] sm:min-w-[250px] py-1">
          <div className="flex items-center gap-1.5">
            <Volume2 size={15} className={isSelf ? 'text-white/90' : 'text-[#FF4F00]'} />
            <span className={`text-xs font-semibold ${isSelf ? 'text-white' : 'text-neutral-800'}`}>
              {t.voiceMessage}
            </span>
          </div>
          <audio
            controls
            src={audioSrc}
            className="w-full h-9 rounded-lg outline-none"
            controlsList="nodownload"
          />
        </div>
      );
    }
    return content;
  };
  
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
      let response;
      try {
        response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
          [Query.orderDesc('createdAt'), Query.limit(50)]
        );
      } catch {
        response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_ANNOUNCEMENTS_COLLECTION_ID,
          [Query.orderDesc('$createdAt'), Query.limit(50)]
        );
      }
      const items: AnnouncementItem[] = response.documents.map((doc: any) => ({
        $id: doc.$id,
        id: doc.$id || doc.id,
        title: doc.title,
        content: doc.content || '',
        senderEmail: doc.senderEmail || ADMIN_EMAIL,
        senderName: doc.senderName,
        createdAt: typeof doc.createdAt === 'number' ? doc.createdAt : (doc.$createdAt ? new Date(doc.$createdAt).getTime() : Date.now())
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
            senderName: '{t.adminLumina}',
            createdAt: Date.now()
          }
        ];
        setAnnouncements(defaultAnnouncements);
        safeSetLocalStorage('tautanlumina:announcements', JSON.stringify(defaultAnnouncements));
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
      senderName: '{t.adminLumina}',
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
      safeSetLocalStorage('tautanlumina:announcements', JSON.stringify(updated));
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
      let response;
      try {
        response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_MESSAGES_COLLECTION_ID,
          [Query.orderAsc('createdAt'), Query.limit(200)]
        );
      } catch {
        response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_MESSAGES_COLLECTION_ID,
          [Query.orderAsc('$createdAt'), Query.limit(200)]
        );
      }
      const docs: PrivateMessageItem[] = response.documents.map((doc: any) => ({
        $id: doc.$id,
        id: doc.$id || doc.id,
        senderEmail: doc.senderEmail,
        receiverEmail: doc.receiverEmail,
        content: doc.content || '',
        createdAt: typeof doc.createdAt === 'number' ? doc.createdAt : (doc.$createdAt ? new Date(doc.$createdAt).getTime() : Date.now())
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
        safeSetLocalStorage('tautanlumina:private_messages', JSON.stringify(defaultMsgs));
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
      safeSetLocalStorage('tautanlumina:private_messages', JSON.stringify(updated));
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
    safeSetLocalStorage('tautanlumina:announcements', JSON.stringify(updated));
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
    safeSetLocalStorage('tautanlumina:private_messages', JSON.stringify(updated));
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
    safeSetLocalStorage('tautanlumina:private_messages', JSON.stringify(updated));
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
      {/* Compact Top Header with Segmented Tabs & Actions */}
      <div className="p-2 bg-[#f2eee9] border-b border-[#e2ddd5] shrink-0 flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 bg-white rounded-xl p-1 shadow-2xs border border-[#e2ddd5]">
          <button
            onClick={() => {
              setActiveTab('announcements');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-[#FF4F00] text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Megaphone size={15} />
            <span className="truncate">{t.announcements}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('private');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'private'
                ? 'bg-[#FF4F00] text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <MessageSquare size={15} />
            <span className="truncate">{t.myMessages}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0 bg-white rounded-xl p-1 shadow-2xs border border-[#e2ddd5]">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-600 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors cursor-pointer"
            aria-label={t.close}
            title={t.close}
          >
            <X size={18} />
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
                  {t.admin} {t.announcements}
                </span>
                <button
                  onClick={() => setShowAdminPostForm(!showAdminPostForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FF4F00] text-white hover:bg-[#e04500] transition-all"
                >
                  <PlusCircle size={14} />
                  {showAdminPostForm ? t.cancel : t.writeAnnouncement}
                </button>
              </div>
            )}

            {/* Admin Post Announcement Form Drawer/Box */}
            {isAdmin && showAdminPostForm && (
              <div className="p-4 bg-white border-b border-[#e2ddd5] shadow-inner shrink-0">
                <form onSubmit={handlePostAnnouncement} className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-700">
                    {t.writeAnnouncement} (Markdown)
                  </label>
                  <textarea
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder={t.writeAnnouncement}
                    rows={4}
                    className="w-full p-3 text-sm rounded-xl border border-[#e2ddd5] focus:outline-none focus:ring-2 focus:ring-[#FF4F00] bg-[#faf8f5] resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdminPostForm(false)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg text-neutral-600 hover:bg-[#f0ece1]"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={postingAnnouncement || !newAnnouncement.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#FF4F00] text-white hover:bg-[#e04500] disabled:opacity-50"
                    >
                      {postingAnnouncement ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      {t.send}
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
                  {t.noMessages}
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
                          {formatDisplayEmail(item.senderName) || t.adminLumina}
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
                            title={t.delete}
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
                    {t.message} ({userConversations.length})
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#f0ece1]">
                    {userConversations.length === 0 ? (
                      <div className="py-12 text-center text-xs text-neutral-400">
                        {t.noMessages}
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
                                {formatDisplayEmail(email)[0].toUpperCase()}
                              </div>
                              <div className="truncate">
                                <div className="text-sm font-bold text-neutral-900 truncate">
                                  {formatDisplayEmail(email)}
                                </div>
                                <div className="text-xs text-neutral-500 truncate mt-0.5">
                                  {lastMsg ? lastMsg.content : '{t.message}'}
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
                                title={t.deleteAll}
                                aria-label={t.deleteAll}
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
                      {t.back}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-800 truncate max-w-[180px]">
                        {formatDisplayEmail(selectedChatUser)}
                      </span>
                      <button
                        onClick={() => selectedChatUser && handleDeleteUserConversation(selectedChatUser)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t.deleteAll}
                        aria-label={t.deleteAll}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
                    {filteredMessages.length === 0 ? (
                      <div className="py-8 text-center text-xs text-neutral-400">
                        {t.noMessages}
                      </div>
                    ) : (
                      filteredMessages.map((m) => {
                        const isSelf = m.senderEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();
                        return (
                          <div
                            key={m.id || m.$id}
                            className={`w-full flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[10px] text-neutral-400 mb-1 px-1">
                              {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%] ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div
                                className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap [word-break:break-word] shadow-sm min-w-0 ${
                                  isSelf
                                    ? 'bg-[#FF4F00] text-white rounded-br-none'
                                    : 'bg-white text-neutral-900 border border-[#e2ddd5] rounded-bl-none'
                                }`}
                              >
                                {renderMessageContent(m.content, isSelf)}
                              </div>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeletePrivateMessage(m.$id || m.id)}
                                  className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 mb-1"
                                  title={t.delete}
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

                  {/* Input Bar (Voice Recording or Text) */}
                  {renderChatInputBar(t.typeReply)}
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
                      {t.sendToAdmin}
                    </span>
                  </div>
                </div>

                {/* Message Stream (2 Sides) */}
                <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
                  {filteredMessages.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      {t.noMessages}
                    </div>
                  ) : (
                    filteredMessages.map((m) => {
                      const isSelf = m.senderEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();
                      return (
                        <div
                          key={m.id || m.$id}
                          className={`w-full flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[10px] text-neutral-400 mb-1 px-1">
                            {isSelf ? t.you : t.admin} • {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className={`flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%] ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap [word-break:break-word] shadow-sm min-w-0 ${
                                isSelf
                                  ? 'bg-[#FF4F00] text-white rounded-br-none'
                                  : 'bg-white text-neutral-900 border border-[#e2ddd5] rounded-bl-none'
                              }`}
                            >
                              {renderMessageContent(m.content, isSelf)}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeletePrivateMessage(m.$id || m.id)}
                                className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 mb-1"
                                title={t.delete}
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

                {/* Input Bar (Voice Recording or Text) */}
                {renderChatInputBar(t.typeMessage)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
