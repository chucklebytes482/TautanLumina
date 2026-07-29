import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { missingTranslations } from './i18n-missing';

export type LanguageCode = 'id' | 'en' | 'zh' | 'ja' | 'ko' | 'ru';

export const translations = {
  id: {
    room1Announcements: 'Ruang 1: Pengumuman',
    room2AdminChat: 'Ruang 2: Chat Admin',
    micNotSupported: 'Perangkat Anda tidak mendukung perekaman suara.',
    micNotAllowed: 'Akses mikrofon tidak diizinkan. Silakan izinkan akses mikrofon di pengaturan browser Anda atau buka aplikasi di Tab Baru.',
    micPermissionDenied: 'Izin mikrofon tidak diberikan atau perangkat mikrofon tidak ditemukan.',
    cancel: 'Batal',
    recording: 'Merekam...',
    done: 'Selesai',
    previewVoiceMsg: 'Pratinjau Pesan Suara',
    listenBeforeSend: '• Dengarkan sebelum kirim',
    send: 'Kirim',
    recordVoiceChat: 'Rekam Voice Chat (Maks 30 detik)',
    voice: 'Voice',
    typeReply: 'Ketik balasan...',
    typeMessage: 'Ketik pesan Anda di sini...',
    voiceMessage: 'Pesan Suara',
    unreadMessages: 'Pesan Belum Dibaca',
    writeAnnouncement: 'Tulis pengumuman...',
    message: 'Pesan',
    admin: 'Admin',
    searchConversation: 'Cari percakapan...',
    deleteAll: 'Hapus Semua',
    searching: 'Mencari...',
    noMessages: 'Belum ada pesan.',
    delete: 'Hapus',
    adminLumina: 'Admin TautanLumina',
    announcements: 'Pengumuman',
    myMessages: 'Pesan Saya',
    doneAndPreview: 'Selesai & Pratinjau Suara',
    pause: 'Jeda',
    playPreview: 'Putar Pratinjau',
    you: 'Anda',
    justNow: 'Baru saja',
    today: 'Hari ini',
    yesterday: 'Kemarin',
    sendToAdmin: 'Kirim Pesan ke Admin',
    back: 'Kembali',
    close: 'Tutup',
    refresh: 'Refresh',
    deleteSuccess: 'Berhasil dihapus',
    deleteConfirm: 'Yakin ingin menghapus?'
  },
  en: {
    room1Announcements: 'Room 1: Announcements',
    room2AdminChat: 'Room 2: Admin Chat',
    micNotSupported: 'Your device does not support voice recording.',
    micNotAllowed: 'Microphone access is not allowed. Please allow it in your browser settings or open the app in a New Tab.',
    micPermissionDenied: 'Microphone permission not granted or device not found.',
    cancel: 'Cancel',
    recording: 'Recording...',
    done: 'Done',
    previewVoiceMsg: 'Voice Message Preview',
    listenBeforeSend: '• Listen before sending',
    send: 'Send',
    recordVoiceChat: 'Record Voice Chat (Max 30 seconds)',
    voice: 'Voice',
    typeReply: 'Type a reply...',
    typeMessage: 'Type your message here...',
    voiceMessage: 'Voice Message',
    unreadMessages: 'Unread Messages',
    writeAnnouncement: 'Write an announcement...',
    message: 'Message',
    admin: 'Admin',
    searchConversation: 'Search conversations...',
    deleteAll: 'Delete All',
    searching: 'Searching...',
    noMessages: 'No messages yet.',
    delete: 'Delete',
    adminLumina: 'Admin TautanLumina',
    announcements: 'Announcements',
    myMessages: 'My Messages',
    doneAndPreview: 'Done & Preview Audio',
    pause: 'Pause',
    playPreview: 'Play Preview',
    you: 'You',
    justNow: 'Just now',
    today: 'Today',
    yesterday: 'Yesterday',
    sendToAdmin: 'Send Message to Admin',
    back: 'Back',
    close: 'Close',
    refresh: 'Refresh',
    deleteSuccess: 'Successfully deleted',
    deleteConfirm: 'Are you sure you want to delete?'
  },
  zh: {
    room1Announcements: '房间 1: 公告',
    room2AdminChat: '房间 2: 管理员聊天',
    micNotSupported: '您的设备不支持语音录制。',
    micNotAllowed: '不允许访问麦克风。请在浏览器设置中允许它，或在新标签页中打开应用程序。',
    micPermissionDenied: '未授予麦克风权限或未找到设备。',
    cancel: '取消',
    recording: '录音中...',
    done: '完成',
    previewVoiceMsg: '语音消息预览',
    listenBeforeSend: '• 发送前试听',
    send: '发送',
    recordVoiceChat: '录制语音（最长30秒）',
    voice: '语音',
    typeReply: '输入回复...',
    typeMessage: '在此输入您的消息...',
    voiceMessage: '语音消息',
    unreadMessages: '未读消息',
    writeAnnouncement: '写公告...',
    message: '消息',
    admin: '管理员',
    searchConversation: '搜索对话...',
    deleteAll: '删除全部',
    searching: '搜索中...',
    noMessages: '暂无消息。',
    delete: '删除',
    adminLumina: 'Lumina 管理员',
    announcements: '公告',
    myMessages: '我的消息',
    doneAndPreview: '完成并试听',
    pause: '暂停',
    playPreview: '播放预览',
    you: '您',
    justNow: '刚刚',
    today: '今天',
    yesterday: '昨天',
    sendToAdmin: '发送消息给管理员',
    back: '返回',
    close: '关闭',
    refresh: '刷新',
    deleteSuccess: '成功删除',
    deleteConfirm: '您确定要删除吗？'
  },
  ja: {
    room1Announcements: 'ルーム 1: お知らせ',
    room2AdminChat: 'ルーム 2: 管理者チャット',
    micNotSupported: 'お使いのデバイスは音声録音をサポートしていません。',
    micNotAllowed: 'マイクへのアクセスが許可されていません。ブラウザの設定で許可するか、新しいタブでアプリを開いてください。',
    micPermissionDenied: 'マイクの許可が与えられていないか、デバイスが見つかりません。',
    cancel: 'キャンセル',
    recording: '録音中...',
    done: '完了',
    previewVoiceMsg: '音声のプレビュー',
    listenBeforeSend: '• 送信前に聞く',
    send: '送信',
    recordVoiceChat: '音声録音 (最大30秒)',
    voice: '音声',
    typeReply: '返信を入力...',
    typeMessage: 'ここにメッセージを入力...',
    voiceMessage: '音声メッセージ',
    unreadMessages: '未読メッセージ',
    writeAnnouncement: 'お知らせを書く...',
    message: 'メッセージ',
    admin: '管理者',
    searchConversation: '会話を検索...',
    deleteAll: 'すべて削除',
    searching: '検索中...',
    noMessages: 'メッセージはまだありません。',
    delete: '削除',
    adminLumina: 'Lumina 管理者',
    announcements: 'お知らせ',
    myMessages: 'マイメッセージ',
    doneAndPreview: '完了＆プレビュー',
    pause: '一時停止',
    playPreview: 'プレビューを再生',
    you: 'あなた',
    justNow: 'たった今',
    today: '今日',
    yesterday: '昨日',
    sendToAdmin: '管理者にメッセージを送信',
    back: '戻る',
    close: '閉じる',
    refresh: '更新',
    deleteSuccess: '正常に削除されました',
    deleteConfirm: '本当に削除しますか？'
  },
  ko: {
    room1Announcements: '1번 방: 공지사항',
    room2AdminChat: '2번 방: 관리자 채팅',
    micNotSupported: '기기에서 음성 녹음을 지원하지 않습니다.',
    micNotAllowed: '마이크 접근이 허용되지 않았습니다. 브라우저 설정에서 허용하시거나 새 탭에서 앱을 열어주세요.',
    micPermissionDenied: '마이크 권한이 거부되었거나 마이크 장치를 찾을 수 없습니다.',
    cancel: '취소',
    recording: '녹음 중...',
    done: '완료',
    previewVoiceMsg: '음성 메시지 미리보기',
    listenBeforeSend: '• 전송 전 미리듣기',
    send: '전송',
    recordVoiceChat: '음성 녹음 (최대 30초)',
    voice: '음성',
    typeReply: '답장 입력...',
    typeMessage: '메시지를 입력하세요...',
    voiceMessage: '음성 메시지',
    unreadMessages: '읽지 않은 메시지',
    writeAnnouncement: '공지사항 작성...',
    message: '메시지',
    admin: '관리자',
    searchConversation: '대화 검색...',
    deleteAll: '전체 삭제',
    searching: '검색 중...',
    noMessages: '메시지가 없습니다.',
    delete: '삭제',
    adminLumina: 'Lumina 관리자',
    announcements: '공지사항',
    myMessages: '내 메시지',
    doneAndPreview: '완료 및 음성 미리듣기',
    pause: '일시정지',
    playPreview: '미리보기 재생',
    you: '나',
    justNow: '방금 전',
    today: '오늘',
    yesterday: '어제',
    sendToAdmin: '관리자에게 메시지 보내기',
    back: '뒤로',
    close: '닫기',
    refresh: '새로고침',
    deleteSuccess: '성공적으로 삭제되었습니다',
    deleteConfirm: '정말 삭제하시겠습니까?'
  },
  ru: {
    room1Announcements: 'Комната 1: Объявления',
    room2AdminChat: 'Комната 2: Чат с админом',
    micNotSupported: 'Ваше устройство не поддерживает запись голоса.',
    micNotAllowed: 'Доступ к микрофону запрещен. Пожалуйста, разрешите его в настройках браузера или откройте приложение в новой вкладке.',
    micPermissionDenied: 'Разрешение на микрофон не предоставлено или устройство не найдено.',
    cancel: 'Отмена',
    recording: 'Запись...',
    done: 'Готово',
    previewVoiceMsg: 'Предпросмотр аудио',
    listenBeforeSend: '• Прослушать перед отправкой',
    send: 'Отправить',
    recordVoiceChat: 'Запись голоса (макс. 30 сек)',
    voice: 'Голос',
    typeReply: 'Введите ответ...',
    typeMessage: 'Введите ваше сообщение...',
    voiceMessage: 'Сообщение',
    unreadMessages: 'Непрочитанные сообщения',
    writeAnnouncement: 'Написать объявление...',
    message: 'Сообщение',
    admin: 'Админ',
    searchConversation: 'Поиск диалогов...',
    deleteAll: 'Удалить все',
    searching: 'Поиск...',
    noMessages: 'Сообщений пока нет.',
    delete: 'Удалить',
    adminLumina: 'Админ Lumina',
    announcements: 'Объявления',
    myMessages: 'Мои сообщения',
    doneAndPreview: 'Готово и прослушать',
    pause: 'Пауза',
    playPreview: 'Воспроизвести',
    you: 'Вы',
    justNow: 'Только что',
    today: 'Сегодня',
    yesterday: 'Вчера',
    sendToAdmin: 'Отправить сообщение Админу',
    back: 'Назад',
    close: 'Закрыть',
    refresh: 'Обновить',
    deleteSuccess: 'Успешно удалено',
    deleteConfirm: 'Вы уверены, что хотите удалить?'
  }
};

export interface LanguageItem {
  code: LanguageCode;
  name: string;
  flag: string;
  label: string;
}

export const languages: LanguageItem[] = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', label: 'ID' },
  { code: 'en', name: 'English', flag: '🇬🇧', label: 'EN' },
  { code: 'zh', name: '中文', flag: '🇨🇳', label: 'ZH' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', label: 'JA' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', label: 'KO' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', label: 'RU' }
];

const I18nContext = createContext<{lang: LanguageCode, setLang: (l: LanguageCode) => void, t: any} | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>('id');

  useEffect(() => {
    const savedLang = localStorage.getItem('tautanlumina:lang') as LanguageCode;
    if (savedLang && translations[savedLang]) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    localStorage.setItem('tautanlumina:lang', newLang);
  };

  const tObj = translations[lang] || translations.id;
  const missingObj = (missingTranslations as any)[lang] || missingTranslations.id;

  // A helper function that works both as t('nested.key') AND t.someProp
  const tFn = (key: string) => {
    const keys = key.split('.');
    let val: any = missingObj;
    for (const k of keys) {
      if (val && val[k] !== undefined) {
        val = val[k];
      } else {
        // Fallback to ID or EN
        let fallback: any = (missingTranslations as any).id || (missingTranslations as any).en;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) fallback = fallback[fk];
          else { fallback = key; break; }
        }
        val = fallback;
        break;
      }
    }
    return val;
  };

  const tProxy = new Proxy(tFn, {
    get(target, prop) {
      if (typeof prop === 'string' && prop in tObj) {
        return (tObj as any)[prop];
      }
      return Reflect.get(target, prop);
    }
  });

  return <I18nContext.Provider value={{ lang, setLang, t: tProxy }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
