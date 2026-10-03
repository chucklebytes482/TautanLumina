import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  BookOpen, 
  Sparkles, 
  Folder, 
  Lock, 
  MessageSquare, 
  Cloud, 
  Search, 
  Lightbulb,
  X,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Mic,
  Compass,
  ArrowRight,
  Key
} from 'lucide-react';
import { useI18n, LanguageCode } from '../lib/i18n';

type GuideTab = 'overview' | 'bookmarks' | 'organization' | 'pin' | 'chat' | 'sync';

export const GuideTabContent: React.FC = () => {
  const { lang, t } = useI18n();
  const [activeSection, setActiveSection] = useState<GuideTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Localized markdown content for 6 languages with identical structure & detail
  const guideContents: Record<LanguageCode, Record<GuideTab, { title: string; subtitle: string; icon: any; content: string }>> = {
    id: {
      overview: {
        title: 'Pengenalan TautanLumina',
        subtitle: 'Buku panduan lengkap & ringkasan fitur utama',
        icon: BookOpen,
        content: `
### Selamat datang di TautanLumina ✨

**TautanLumina** adalah aplikasi penyimpan tautan (bookmark) dan catatan pribadi yang cepat dan minimalis.

#### 🚀 Fitur Utama Unggulan:
* **Penamaan Otomatis dari URL**: Secara otomatis mengambil nama judul dari alamat URL yang disimpan dengan mengecualikan \`https/\`, garis miring (\`/\`), dan titik (\`.\`) serta pemisahan spasi otomatis.
* **Organisasi Folder & Posisi**: Susun item dalam folder kustom dan urutkan posisi dengan presisi menggunakan papan angka (Keypad Move).
* **Perlindungan PIN Folder**: Kunci folder sensitif menggunakan PIN 4 digit yang aman.
* **Pesan Suara (Voice Note)**: Kirim pesan suara hingga 30 detik dengan fitur pratinjau sebelum dikirim.
* **Akses Luring & Sinkronisasi Awan**: Tersinkronisasi otomatis ke Awan Appwrite saat terhubung internet.
        `
      },
      bookmarks: {
        title: 'Bookmark & Penamaan URL',
        subtitle: 'Cara menambah, mengedit, dan otomatisasi judul dari URL',
        icon: Sparkles,
        content: `
### Cara Menambah & Mengelola Bookmark

1. **Menambah Bookmark**:
   * Tempelkan tautan URL langsung ke kolom pencarian / input utama di bagian atas.
   * Tekan tombol **+ Bookmark**. Aplikasi secara otomatis mengekstrak judul dari URL dengan kata dan spasi yang rapi.

2. **Format Ulang & Edit Judul & URL**:
   * Klik tombol **Titik Tiga (\`...\`)** pada kartu bookmark.
   * Pilih **Format Ulang Judul** untuk memperbarui judul dari URL.
   * Pilih **Edit Judul & URL** untuk mengubah nama atau URL bookmark secara manual.

💡 *Tips: Kolom pencarian utama mendukung penyaringan cepat judul bookmark dan nama catatan secara real-time.*
        `
      },
      organization: {
        title: 'Folder & Urutan Posisi',
        subtitle: 'Kelola folder dan susun urutan dengan Keypad Move',
        icon: Folder,
        content: `
### Pengorganisasian & Penataan Item

1. **Membuat Folder Baru**:
   * Klik tombol **+ Folder** di bagian atas untuk membuat folder penyimpanan baru.

2. **Memindahkan Item**:
   * **Drag & Drop**: Seret kartu bookmark atau catatan lalu lepaskan di atas folder atau di antara posisi item lain.
   * **Keypad Move (Pindah ke Posisi)**:
     * Klik tombol **\`...\`** pada item -> pilih **Pindah ke Posisi**.
     * Masukkan nomor urut tujuan pada papan tombol angka untuk memindahkan posisi secara presisi.

3. **Folder Sistem**:
   * Folder **Catatan** dan **Hello World** adalah folder khusus untuk mengorganisir catatan cepat Anda.
        `
      },
      pin: {
        title: 'Keamanan & PIN Folder',
        subtitle: 'Perlindungan akses folder pribadi dengan PIN 4 digit',
        icon: Lock,
        content: `
### Mengunci Folder dengan PIN

1. **Mengaktifkan Kunci Folder**:
   * Klik menu **\`...\`** pada folder yang ingin dilindungi.
   * Pilih **Kunci PIN**. Jika PIN belum diatur, Anda akan diminta membuat PIN 4 digit pertama kali.

2. **Membuka Folder Terkunci**:
   * Saat mengeklik folder terkunci, masukkan PIN 4 digit Anda untuk membuka akses.

3. **Lupa / Reset PIN**:
   * Jika Anda lupa PIN, masuk ke menu **Pengaturan** (\`PanelLeft\` ikon kiri atas) -> **Keamanan PIN**.
   * Anda dapat me-reset PIN menggunakan kata sandi akun Appwrite Anda.
        `
      },
      chat: {
        title: 'Pesan Suara & Komunikasi',
        subtitle: 'Voice recorder 30 detik & pratinjau sebelum dikirim',
        icon: MessageSquare,
        content: `
### Fitur Pesan Suara & Komunikasi

1. **Membuka Chat**:
   * Buka jendela **Pesan** atau **Pengumuman** dari menu utama.

2. **Voice Note (Pesan Suara)**:
   * Tekan ikon mikrofon untuk merekam suara.
   * **Maksimal 30 detik**: Perekaman otomatis berhenti di detik ke-30.
   * **Pratinjau Suara**: Setelah rekam, Anda dapat *Memutar/Mendengarkan* pratinjau atau *Membatalkan* sebelum mengeklik **Kirim**.
        `
      },
      sync: {
        title: 'Awan & Ekspor Data',
        subtitle: 'Cadangan data otomatis, ekspor JSON, & status akun',
        icon: Cloud,
        content: `
### Sinkronisasi & Cadangan Data

1. **Sinkronisasi Otomatis**:
   * Data Anda selalu tersimpan secara lokal di browser dan otomatis tersinkronisasi ke akun Appwrite Anda saat terhubung internet.

2. **Ekspor & Impor (Backup)**:
   * Buka menu **Pengaturan** -> bagian **Data & Cadangan**.
   * Pilih **Ekspor JSON** untuk menyimpan cadangan semua bookmark & catatan.
   * Pilih **Impor JSON atau HTML** untuk memulihkan atau mengimpor bookmark dari browser lain.

3. **Langganan Pro**:
   * Buka menu **Pengaturan** -> **Langganan**.
   * Dapatkan akses ke fitur Pro tanpa batas seperti pesan pribadi ke admin, komentar pengumuman, dan kunci folder.
        `
      }
    },
    en: {
      overview: {
        title: 'Welcome to TautanLumina',
        subtitle: 'Comprehensive guide & core features overview',
        icon: BookOpen,
        content: `
### Welcome to TautanLumina ✨

**TautanLumina** is a fast, minimalist bookmark & personal note management application.

#### 🚀 Key Features:
* **Automatic URL Titles**: Generates clean titles with proper spaces for saved URLs automatically.
* **Folders & Reordering**: Group items in custom folders and reorder precisely using a numeric keypad (Keypad Move).
* **Folder PIN Security**: Protect sensitive folders with a secure 4-digit PIN lock.
* **Voice Notes & Communication**: Send voice messages up to 30 seconds with audio preview before sending.
* **Offline Access & Cloud Sync**: Automatically synchronized with Appwrite Cloud when online.
        `
      },
      bookmarks: {
        title: 'Bookmarks & URL Naming',
        subtitle: 'How to add, edit, and generate clean titles from URLs',
        icon: Sparkles,
        content: `
### Adding & Managing Bookmarks

1. **Adding a Bookmark**:
   * Paste any URL directly into the top search/input field.
   * Click **+ Bookmark**. The app will automatically parse the URL and generate a clean title with spaces.

2. **Regenerate & Edit Title & URL**:
   * Click the **Three Dots (\`...\`)** button on any bookmark card.
   * Select **Regenerate Title** to update the title from URL.
   * Select **Edit Title & URL** to manually update the name or URL of a bookmark.

💡 *Tip: The main search field allows quick real-time filtering of bookmark titles and note contents.*
        `
      },
      organization: {
        title: 'Folders & Item Reordering',
        subtitle: 'Organize items with folders and Keypad Move positioning',
        icon: Folder,
        content: `
### Folder Management & Reordering

1. **Create New Folder**:
   * Click the **+ Folder** button at the top to create a new storage folder.

2. **Moving Items**:
   * **Drag & Drop**: Drag bookmark or note cards onto folders or drop between item positions.
   * **Keypad Move (Move to Position)**:
     * Click **\`...\`** on any item -> select **Move to Position**.
     * Enter target position index on numeric keypad for instant and precise placement.

3. **System Folders**:
   * The **Notes** and **Hello World** folders are specialized built-in system folders for organizing quick notes.
        `
      },
      pin: {
        title: 'Folder Security & PIN',
        subtitle: 'Lock private folders with 4-digit PIN protection',
        icon: Lock,
        content: `
### Protecting Folders with PIN

1. **Activating Folder Lock**:
   * Click the **\`...\`** menu on any folder you want to protect.
   * Select **Lock PIN**. If PIN is not set yet, you will be prompted to create a 4-digit PIN first.

2. **Unlocking Folders**:
   * Click a locked folder and enter your 4-digit PIN to gain access.

3. **Forgot / Reset PIN**:
   * If you forget your PIN, go to **Settings** (\`PanelLeft\` top-left icon) -> **PIN Security**.
   * You can reset your PIN anytime using your Appwrite account password.
        `
      },
      chat: {
        title: 'Voice Notes & Communication',
        subtitle: '30s voice recording and preview audio',
        icon: MessageSquare,
        content: `
### Voice Message & Communication Features

1. **Open Chat**:
   * Open the **Messages** or **Announcements** window from the main menu.

2. **Voice Notes**:
   * Tap the microphone icon to record your voice.
   * **30-second Limit**: Recording automatically stops at 30 seconds.
   * **Voice Preview**: Listen to playback or cancel before clicking **Send**.
        `
      },
      sync: {
        title: 'Cloud Sync & Data Backup',
        subtitle: 'Local backup, JSON export/import, & account features',
        icon: Cloud,
        content: `
### Data Sync & Backup

1. **Automatic Sync**:
   * Your data is always saved locally in your browser and automatically synchronized with your Appwrite account when connected to the internet.

2. **Export & Import (Backup)**:
   * Open **Settings** -> **Data & Backup** section.
   * Click **Export JSON** to save a full backup of all bookmarks & notes.
   * Click **Import JSON or HTML** to restore or import bookmarks from other browsers.

3. **Pro Subscription**:
   * Go to **Settings** -> **Subscription**.
   * Unlock unlimited Pro features such as private messages to admin, announcement comments, and folder locks.
        `
      }
    },
    zh: {
      overview: {
        title: 'TautanLumina 概览',
        subtitle: '完整使用指南与核心功能速览',
        icon: BookOpen,
        content: `
### 欢迎使用 TautanLumina ✨

**TautanLumina** 是一款极简、快速的书签与个人笔记管理应用。

#### 🚀 核心功能：
* **URL 自动命名**：为保存的 URL 自动提取并整理精简标题。
* **文件夹与位置排序**：将项目整理到自定义文件夹中，并使用数字键盘（Keypad Move）精准调整顺序。
* **文件夹 PIN 码锁定**：使用安全的 4 位数 PIN 码锁定保护隐私文件夹。
* **语音消息**：支持长达 30 秒的语音录制并在发送前进行播放预览。
* **离线访问与云端同步**：联网时自动与 Appwrite 云端同步。
        `
      },
      bookmarks: {
        title: '书签与 URL 命名',
        subtitle: '添加、编辑与 URL 提取书签标题说明',
        icon: Sparkles,
        content: `
### 添加与管理书签

1. **添加书签**：
   * 将 URL 链接直接粘贴至顶部搜索/输入框。
   * 点击 **+ 书签**，系统将自动从网址提取格式整洁的标题。

2. **重新生成与编辑标题及 URL**：
   * 点击书签卡片上的 **三点菜单 (\`...\`)**。
   * 选择 **重新生成标题** 以根据 URL 更新标题。
   * 选择 **编辑标题与 URL** 手动更改书签的名称或 URL。

💡 *提示：顶部主搜索框支持实时快速筛选书签标题和笔记内容。*
        `
      },
      organization: {
        title: '文件夹与位置排序',
        subtitle: '文件夹管理与数字键盘移动定位',
        icon: Folder,
        content: `
### 文件夹管理与排序

1. **新建文件夹**：
   * 点击顶部的 **+ 文件夹** 按钮创建新的存储文件夹。

2. **移动项目**：
   * **拖拽排序**：直接拖动书签或笔记卡片放入文件夹或调整项目位置。
   * **数字键盘移动（移动到位置）**：
     * 点击项目的 **\`...\`** 菜单 -> 选择 **移动到位置**。
     * 在数字键盘上输入目标序号，实现精准快速定位。

3. **系统文件夹**：
   * **笔记** 和 **Hello World** 是内置的系统专有文件夹，用于快速整理笔记。
        `
      },
      pin: {
        title: '文件夹安全与 PIN 码',
        subtitle: '使用 4 位数 PIN 码保护隐私文件夹',
        icon: Lock,
        content: `
### 使用 PIN 码保护文件夹

1. **开启文件夹锁定**：
   * 点击需要保护的文件夹上的 **\`...\`** 菜单。
   * 选择 **PIN 码锁定**。若尚未设置 PIN 码，系统将提示您首次创建 4 位数 PIN 码。

2. **解锁受保护文件夹**：
   * 点击已被锁定的文件夹，输入 4 位数 PIN 码即可进入访问。

3. **忘记 / 重置 PIN 码**：
   * 如忘记 PIN 码，请前往 **设置**（左上角 \`PanelLeft\` 图标）-> **PIN 码安全**。
   * 您可以随时使用 Appwrite 账号密码进行重置。
        `
      },
      chat: {
        title: '语音消息与沟通',
        subtitle: '30 秒语音录制与发送前预览',
        icon: MessageSquare,
        content: `
### 语音消息与沟通功能

1. **打开对话窗口**：
   * 从主菜单打开 **消息** 或 **公告** 窗口。

2. **语音消息（Voice Note）**：
   * 点击麦克风图标开始录制语音。
   * **最长 30 秒**：录音会在第 30 秒时自动停止。
   * **语音预览**：录音完成后，可以在点击 **发送** 前 *播放/听取* 预览或 *取消* 录音。
        `
      },
      sync: {
        title: '云端同步与数据备份',
        subtitle: '自动云端同步、JSON 导入导出与订阅说明',
        icon: Cloud,
        content: `
### 数据同步与备份恢复

1. **自动云端同步**：
   * 您的数据始终安全保存在本地浏览器中，联网时会自动同步至您的 Appwrite 云端账号。

2. **导入与导出（备份）**：
   * 打开 **设置** -> **数据与备份** 页面。
   * 选择 **导出 JSON** 保存所有书签和笔记的完整备份。
   * 选择 **导入 JSON 或 HTML** 恢复备份或导入其他浏览器的书签。

3. **Pro 订阅**：
   * 打开 **设置** -> **订阅** 页面。
   * 解锁无限 Pro 会员特权，如管理员私信、公告评论与文件夹解锁等。
        `
      }
    },
    ja: {
      overview: {
        title: 'TautanLumina の概要',
        subtitle: '詳細な使い方ガイド＆主要機能一覧',
        icon: BookOpen,
        content: `
### TautanLumina へようこそ ✨

**TautanLumina** は、高速でミニマルなブックマーク＆個人ノート管理アプリケーションです。

#### 🚀 主な機能:
* **URL 自動タイトル作成**: 保存した URL から整ったタイトルを自動抽出。
* **フォルダ整理と順序変更**: カスタムフォルダで項目を整理し、数字キーパッド（Keypad Move）で位置を正確に変更。
* **フォルダ PIN ロック**: 安全な 4 桁の PIN コードで大切なフォルダを保護。
* **音声メッセージ**: 最大 30 秒の音声メッセージを送信前にプレビュー試聴可能。
* **オフライン閲覧とクラウド同期**: オンライン接続時に Appwrite クラウドへ自動同期。
        `
      },
      bookmarks: {
        title: 'ブックマーク＆ URL 自動命名',
        subtitle: 'ブックマークの追加・編集と URL タイトル生成',
        icon: Sparkles,
        content: `
### ブックマークの追加と管理

1. **ブックマークの追加**:
   * 上部の検索/入力欄に URL を直接貼り付けます。
   * **+ ブックマーク** ボタンを押すと、アプリが自動で URL から短いタイトルを生成します。

2. **タイトルの再生成・URL 手動編集**:
   * ブックマークカードの **三点メニュー (\`...\`)** をクリック。
   * **タイトルを再生成** を選ぶと URL からタイトルを更新します。
   * **タイトルと URL の編集** を選ぶと手動でお好みの名称や URL に変更できます。

💡 *ヒント: 上部メイン検索バーでブックマークタイトルやノート内容をリアルタイム検索できます。*
        `
      },
      organization: {
        title: 'フォルダと順序並び替え',
        subtitle: 'フォルダ管理とキーパッド移動による順序変更',
        icon: Folder,
        content: `
### フォルダ管理とアイテムの並び替え

1. **新しいフォルダの作成**:
   * 上部の **+ フォルダ** ボタンをクリックして新しい整理フォルダを作成します。

2. **アイテムの移動**:
   * **ドラッグ＆ドロップ**: カードをドラッグしてフォルダ内やアイテム間に移動します。
   * **キーパッド移動 (指定位置へ移動)**:
     * アイテムの **\`...\`** -> **指定位置へ移動** を選択。
     * 数字キーパッドで移動先の番号を入力し、正確かつ瞬時に移動できます。

3. **システムフォルダ**:
   * **ノート** や **Hello World** はクイックメモ専用のシステムフォルダです。
        `
      },
      pin: {
        title: 'フォルダセキュリティと PIN',
        subtitle: '4 桁の PIN コードでフォルダを保護',
        icon: Lock,
        content: `
### PIN コードによるフォルダ保護

1. **フォルダロックの有効化**:
   * 保護したいフォルダの **\`...\`** メニューをクリック。
   * **PIN ロック** を選択。初回利用時は 4 桁の PIN コードを設定します。

2. **ロックされたフォルダの解除**:
   * ロック中のフォルダをクリックし、4 桁の PIN コードを入力してアクセスします。

3. **PIN の忘却・リセット**:
   * PIN を忘れた場合は、**設定** (左上 \`PanelLeft\` アイコン) -> **PIN セキュリティ** へ移動。
   * Appwrite アカウントのパスワードを使用して PIN をリセットできます。
        `
      },
      chat: {
        title: '音声メッセージ',
        subtitle: '30 秒録音、事前試聴機能',
        icon: MessageSquare,
        content: `
### 音声メッセージ機能

1. **チャットを開く**:
   * メインメニューから **メッセージ** または **お知らせ** 画面を開きます。

2. **音声メッセージ (Voice Note)**:
   * マイクアイコンを押して録音を開始します。
   * **最大 30 秒**: 30 秒に達すると自動的に録音が停止します。
   * **音声プレビュー**: 送信前に *再生/試聴* や *キャンセル* を選択できます。
        `
      },
      sync: {
        title: 'クラウド同期＆データバックアップ',
        subtitle: '自動クラウド同期、JSON 入出力、Pro 特典',
        icon: Cloud,
        content: `
### データ同期とバックアップ

1. **自動クラウド同期**:
   * データは常にブラウザローカルに保存され、オンライン時に Appwrite クラウドと自動同期されます。

2. **エクスポート/インポート (バックアップ)**:
   * **設定** -> **データとバックアップ** を開きます。
   * **JSON エクスポート** で全ブックマークとノートのバックアップを保存。
   * **JSON / HTML インポート** で復元や他ブラウザのブックマークを取り込めます。

3. **Pro サブスクリプション**:
   * **設定** -> **サブスクリプション** を開きます。
   * 管理者へのプライベートメッセージや無制限のフォルダロックなどの Pro 機能を解放します。
        `
      }
    },
    ko: {
      overview: {
        title: 'TautanLumina 소개',
        subtitle: '상세 사용 설명서 및 핵심 기능 한눈에 보기',
        icon: BookOpen,
        content: `
### TautanLumina에 오신 것을 환영합니다 ✨

**TautanLumina**는 빠르고 미니멀한 북마크 및 개인 메모 관리 애플리케이션입니다.

#### 🚀 주요 기능:
* **URL 자동 제목 생성**: 저장한 URL에 대해 깨끗한 제목을 자동으로 생성합니다.
* **폴더 및 순서 정렬**: 맞춤 폴더에 항목을 정리하고 숫자 키패드(Keypad Move)를 사용하여 정확하게 위치를 변경합니다.
* **폴더 PIN 잠금**: 안전한 4자리 PIN 코드로 중요한 폴더를 보호합니다.
* **음성 메시지**: 전송 전 음성을 미리 들을 수 있는 최대 30초 음성 메시지를 지원합니다.
* **오프라인 접근 & 클라우드 동기화**: 온라인 연결 시 Appwrite 클라우드와 자동 동기화됩니다.
        `
      },
      bookmarks: {
        title: '북마크 & URL 제목 생성',
        subtitle: '북마크 추가, 수정 및 URL 제목 사용법',
        icon: Sparkles,
        content: `
### 북마크 추가 및 관리

1. **북마크 추가**:
   * 상단 검색/입력창에 URL을 직접 붙여넣습니다.
   * **+ 북마크** 버튼을 누르면 URL에서 정돈된 제목을 자동으로 생성합니다.

2. **제목 재생성 및 URL 편집**:
   * 북마크 카드의 **점 3개 메뉴 (\`...\`)** 를 클릭합니다.
   * **제목 재생성**을 선택하여 URL 기반 제목을 업데이트하거나,
   * **제목 및 URL 편집**을 선택하여 원하는 이름이나 URL을 직접 변경할 수 있습니다.

💡 *팁: 상단 메인 검색창을 통해 북마크 제목과 메모 내용을 실시간으로 필터링할 수 있습니다.*
        `
      },
      organization: {
        title: '폴더 & 위치 이동 정렬',
        subtitle: '폴더 정리 및 키패드 이동 정렬',
        icon: Folder,
        content: `
### 폴더 관리 및 순서 변경

1. **새 폴더 생성**:
   * 상단의 **+ 폴더** 버튼을 클릭하여 새 저장 폴더를 만듭니다.

2. **항목 이동 및 정렬**:
   * **드래그 앤 드롭**: 카드를 드래그하여 폴더 안이나 항목 사이 위치로 이동합니다.
   * **키패드 이동 (위치로 이동)**:
     * 항목의 **\`...\`** -> **위치로 이동** 선택.
     * 숫자 키패드로 이동할 순번을 입력하여 정확하게 정렬합니다.

3. **시스템 폴더**:
   * **메모** 및 **Hello World** 폴더는 빠른 메모 정리를 위한 전용 시스템 폴더입니다.
        `
      },
      pin: {
        title: '폴더 보안 & PIN 잠금',
        subtitle: '4자리 PIN 코드로 중요 폴더 잠금 설정',
        icon: Lock,
        content: `
### PIN 코드로 폴더 보호하기

1. **폴더 잠금 활성화**:
   * 보호할 폴더의 **\`...\`** 메뉴 클릭.
   * **PIN 잠금** 선택. PIN이 설정되어 있지 않은 경우 먼저 4자리 PIN을 생성합니다.

2. **잠긴 폴더 해제**:
   * 잠긴 폴더를 클릭하고 4자리 PIN 코드를 입력하여 접근합니다.

3. **PIN 재설정**:
   * PIN을 잊어버린 경우 **설정** (좌측 상단 \`PanelLeft\` 아이콘) -> **PIN 보안**으로 이동합니다.
   * Appwrite 계정 비밀번호를 사용하여 언제든지 PIN을 재설정할 수 있습니다.
        `
      },
      chat: {
        title: '음성 메시지',
        subtitle: '30초 녹음 및 사전 듣기 기능',
        icon: MessageSquare,
        content: `
### 음성 메시지 기능

1. **챗 창 열기**:
   * 메인 메뉴에서 **메시지** 또는 **공지사항** 창을 엽니다.

2. **음성 메시지 (Voice Note)**:
   * 마이크 아이콘을 눌러 음성 녹음을 시작합니다.
   * **최대 30초**: 30초에 도달하면 녹음이 자동으로 중지됩니다.
   * **음성 미리듣기**: 전송 전 *재생/미리듣기* 또는 *취소*를 선택할 수 있습니다.
        `
      },
      sync: {
        title: '클라우드 동기화 & 백업',
        subtitle: '자동 동기화, JSON 내보내기/가져오기 & Pro 혜택',
        icon: Cloud,
        content: `
### 데이터 동기화 및 백업

1. **자동 클라우드 동기화**:
   * 데이터는 항상 브라우저 로컬에 저장되며, 온라인 상태일 때 Appwrite 클라우드 계정과 자동 동기화됩니다.

2. **내보내기 & 가져오기 (백업)**:
   * **설정** -> **데이터 & 백업** 메뉴를 엽니다.
   * **JSON 내보내기**로 모든 북마크 및 메모의 전체 백업을 저장합니다.
   * **JSON 또는 HTML 가져오기**로 복원하거나 타 브라우저의 북마크를 가져올 수 있습니다.

3. **Pro 구독**:
   * **설정** -> **구독** 메뉴를 엽니다.
   * 관리자 개인 메시지 및 무제한 폴더 잠금 등 Pro 전용 기능을 잠금 해제합니다.
        `
      }
    },
    ru: {
      overview: {
        title: 'О сервисе TautanLumina',
        subtitle: 'Полное руководство пользователя и обзор функций',
        icon: BookOpen,
        content: `
### Добро пожаловать в TautanLumina ✨

**TautanLumina** — это быстрый, минималистичный менеджер закладок и личных заметок.

#### 🚀 Основные возможности:
* **Авто-заголовки URL**: Автоматически извлекает аккуратные названия для сохраненных URL.
* **Папки и сортировка**: Группируйте элементы в папки и точно меняйте их порядок с помощью цифровой клавиатуры (Keypad Move).
* **Защита папок PIN-кодом**: Защищайте конфиденциальные папки надежным 4-значным PIN-кодом.
* **Голосовые сообщения**: Отправляйте голосовые сообщения длительностью до 30 секунд с предварительным прослушиванием.
* **Автономный доступ и облачная синхронизация**: Автоматическая синхронизация с Appwrite Cloud при подключении к сети.
        `
      },
      bookmarks: {
        title: 'Закладки и авто-заголовки URL',
        subtitle: 'Добавление, редактирование и генерация названий из URL',
        icon: Sparkles,
        content: `
### Добавление и управление закладками

1. **Добавление закладки**:
   * Вставьте ссылку URL непосредственно в верхнюю строку поиска/ввода.
   * Нажмите **+ Закладка**. Приложение автоматически извлечет красивый заголовок из URL.

2. **Перегенерация и редактирование заголовка и URL**:
   * Нажмите кнопку **Три точки (\`...\`)** на карточке закладки.
   * Выберите **Перегенерировать заголовок** для обновления заголовка из URL.
   * Выберите **Редактировать заголовок и URL** для ручного изменения названия или URL.

💡 *Совет: Главная строка поиска позволяет мгновенно фильтровать закладки и заметки в реальном времени.*
        `
      },
      organization: {
        title: 'Папки и позиционирование',
        subtitle: 'Организация папок и точное перемещение Keypad Move',
        icon: Folder,
        content: `
### Организация папок и элементов

1. **Создание новой папки**:
   * Нажмите кнопку **+ Папка** вверху для создания новой папки.

2. **Перемещение элементов**:
   * **Drag & Drop**: Перетаскивайте карточки в папки или между элементами.
   * **Перемещение по клавиатуре (На позицию)**:
     * Нажмите **\`...\`** на элементе -> выберите **На позицию**.
     * Введите нужный номер на цифровой клавиатуре для точного перемещения.

3. **Системные папки**:
   * Папки **Заметки** и **Hello World** — встроенные системные папки для быстрых заметок.
        `
      },
      pin: {
        title: 'Безопасность и PIN-код',
        subtitle: 'Защита личных папок с помощью 4-значного PIN-кода',
        icon: Lock,
        content: `
### Защита папок PIN-кодом

1. **Включение блокировки**:
   * Нажмите меню **\`...\`** на папке, которую хотите защитить.
   * Выберите **Заблокировать PIN**. Если PIN еще не задан, вам будет предложено создать 4-значный PIN-код.

2. **Разблокировка папок**:
   * Нажмите на заблокированную папку и введите 4-значный PIN-код для доступа.

3. **Сброс PIN-кода**:
   * Если вы забыли PIN, перейдите в **Настройки** (значок \`PanelLeft\` вверху слева) -> **PIN Безопасность**.
   * Вы можете сбросить PIN в любое время с помощью пароля от аккаунта Appwrite.
        `
      },
      chat: {
        title: 'Голосовые сообщения',
        subtitle: '30 сек запись и предпрослушивание',
        icon: MessageSquare,
        content: `
### Голосовые сообщения

1. **Открытие чата**:
   * Откройте окно **Сообщения** или **Объявления** из главного меню.

2. **Голосовые сообщения (Voice Note)**:
   * Нажмите значок микрофона для начала записи.
   * **Максимум 30 секунд**: Запись автоматически останавливается на 30-й секунде.
   * **Предпросмотр**: Прослушайте запись или отмените ее перед нажатием **Отправить**.
        `
      },
      sync: {
        title: 'Синхронизация и бэкап',
        subtitle: 'Авто-синхронизация, экспорт JSON и возможности Pro',
        icon: Cloud,
        content: `
### Синхронизация данных и резервное копирование

1. **Автоматическая синхронизация**:
   * Данные всегда сохраняются локально в браузере и автоматически синхронизируются с вашим аккаунтом Appwrite Cloud в сети.

2. **Экспорт и импорт (Бэкап)**:
   * Перейдите в **Настройки** -> **Данные и бэкап**.
   * Выберите **Экспорт JSON** для сохранения полной копии всех закладок и заметок.
   * Выберите **Импорт JSON / HTML** для восстановления или импорта закладок из других браузеров.

3. **Подписка Pro**:
   * Перейдите в **Настройки** -> **Подписка**.
   * Разблокируйте доступ к функциям Pro, таким как личные сообщения администратору и снятие ограничений.
        `
      }
    }
  };

  const currentLang = (guideContents[lang] ? lang : 'id') as LanguageCode;
  const sections = guideContents[currentLang];
  const tabKeys: GuideTab[] = ['overview', 'bookmarks', 'organization', 'pin', 'chat', 'sync'];

  const filteredSectionKeys = tabKeys.filter(key => {
    if (!searchQuery.trim()) return true;
    const item = sections[key];
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
  });

  const activeIndex = tabKeys.indexOf(activeSection);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#faf8f5] dark:bg-[#161618] overflow-hidden text-neutral-800 dark:text-neutral-100">
      {/* Search & Header Section */}
      <div className="p-3 sm:p-4 border-b border-[#e5e0d8] dark:border-[#2d2d35] bg-white/80 dark:bg-[#1c1c20]/90 backdrop-blur-md shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FF4F00]/10 text-[#FF4F00] rounded-xl border border-[#FF4F00]/20 shrink-0">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                {t('guide.title') || 'Panduan Penggunaan'}
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                Pusat bantuan & instruksi fitur TautanLumina
              </p>
            </div>
          </div>

          <div className="relative flex items-center w-full sm:w-72 shrink-0">
            <Search size={15} className="absolute left-3 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('guide.searchPlaceholder') || 'Cari topik panduan...'}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#f4f0ea] dark:bg-[#28282e] border border-[#e2ddd5] dark:border-[#383842] rounded-xl text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 transition-all placeholder:text-neutral-400"
            />
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
                title="Hapus pencarian"
                aria-label="Hapus pencarian"
              >
                <X size={13} />
              </button>
            ) : (
              <span className="absolute right-3 text-[10px] text-neutral-400 font-mono hidden sm:inline-block pointer-events-none">
                🔍
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Responsive Guide Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-w-0">
        {/* Navigation Tabs (Mobile horizontal scroll / Desktop sidebar) */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#e5e0d8] dark:border-[#2d2d35] bg-[#f4f0ea]/60 dark:bg-[#1a1a1d] p-2.5 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 no-scrollbar">
          {tabKeys.map((tabKey) => {
            const item = sections[tabKey];
            const Icon = item.icon;
            const isActive = activeSection === tabKey;
            const isMatch = filteredSectionKeys.includes(tabKey);

            if (!isMatch && searchQuery.trim()) return null;

            return (
              <button
                key={tabKey}
                onClick={() => setActiveSection(tabKey)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-left whitespace-nowrap md:whitespace-normal transition-all cursor-pointer relative group ${
                  isActive 
                    ? 'bg-white dark:bg-[#28282e] text-[#FF4F00] shadow-2xs border border-[#FF4F00]/30 font-bold' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100 border border-transparent'
                }`}
                title={item.title}
              >
                <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  isActive ? 'bg-[#FF4F00]/10 text-[#FF4F00]' : 'bg-neutral-200/50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'
                }`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate leading-tight">{item.title}</div>
                  <div className="text-[10px] font-normal text-neutral-400 dark:text-neutral-500 truncate hidden md:block mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
                {isActive && (
                  <div className="hidden md:block w-1.5 h-4 rounded-full bg-[#FF4F00] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Viewer Panel */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-[#161618] min-w-0">
          {filteredSectionKeys.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                <Search size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Tidak ditemukan hasil untuk "{searchQuery}"
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                  Coba kata kunci lain atau bersihkan pencarian untuk melihat panduan.
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#FF4F00] text-white rounded-xl shadow-2xs hover:bg-[#e04500] transition-colors cursor-pointer"
              >
                Bersihkan Pencarian
              </button>
            </div>
          ) : (
            sections[activeSection] && (
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
                {/* Hero Topic Banner Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FF4F00]/10 via-[#FF4F00]/5 to-transparent dark:from-[#FF4F00]/15 dark:via-[#FF4F00]/5 dark:to-transparent border border-[#FF4F00]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-3 bg-white dark:bg-[#28282e] text-[#FF4F00] rounded-xl shadow-xs border border-[#FF4F00]/20 shrink-0">
                      {React.createElement(sections[activeSection].icon, { size: 24 })}
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FF4F00]/15 text-[#FF4F00] text-[10px] font-bold uppercase tracking-wider mb-1">
                        <Zap size={10} /> Topik Panduan
                      </span>
                      <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-neutral-100 m-0 leading-tight truncate">
                        {sections[activeSection].title}
                      </h2>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 truncate">
                        {sections[activeSection].subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overview Feature Grid Card (Only on Overview tab) */}
                {activeSection === 'overview' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-[#faf8f5] dark:bg-[#1e1e22] border border-[#e5e0d8] dark:border-[#2d2d35] space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        <Sparkles size={14} className="text-[#FF4F00]" />
                        <span>Otomatisasi Judul URL</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Ekstraksi otomatis judul ringkas dari URL dengan pemisahan spasi yang rapi secara instan.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#faf8f5] dark:bg-[#1e1e22] border border-[#e5e0d8] dark:border-[#2d2d35] space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        <Folder size={14} className="text-[#FF4F00]" />
                        <span>Keypad Move Position</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Pindahkan dan susun urutan bookmark & catatan menggunakan nomor tombol angka presisi.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#faf8f5] dark:bg-[#1e1e22] border border-[#e5e0d8] dark:border-[#2d2d35] space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        <Lock size={14} className="text-[#FF4F00]" />
                        <span>PIN 4-Digit Folder</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Kunci folder rahasia dengan PIN aman 4 angka dan fitur reset kata sandi.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#faf8f5] dark:bg-[#1e1e22] border border-[#e5e0d8] dark:border-[#2d2d35] space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        <Mic size={14} className="text-[#FF4F00]" />
                        <span>Voice Message & Preview</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Rekam pesan suara hingga 30 detik dengan tombol pratinjau putar sebelum kirim.
                      </p>
                    </div>
                  </div>
                )}

                {/* Formatted Markdown Body */}
                <div className="prose dark:prose-invert prose-xs sm:prose-sm max-w-none text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  <ReactMarkdown>{sections[activeSection].content}</ReactMarkdown>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
