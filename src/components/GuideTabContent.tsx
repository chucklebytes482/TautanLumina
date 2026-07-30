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
  X
} from 'lucide-react';
import { useI18n, LanguageCode } from '../lib/i18n';

type GuideTab = 'overview' | 'bookmarks' | 'organization' | 'pin' | 'chat' | 'sync';

export const GuideTabContent: React.FC = () => {
  const { lang, t } = useI18n();
  const [activeSection, setActiveSection] = useState<GuideTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Localized markdown content for 6 languages with identical structure & detail
  const guideContents: Record<LanguageCode, Record<GuideTab, { title: string; icon: any; content: string }>> = {
    id: {
      overview: {
        title: 'Pengenalan TautanLumina',
        icon: BookOpen,
        content: `
### Selamat datang di TautanLumina ✨

**TautanLumina** adalah aplikasi penyimpan tautan (bookmark) dan catatan pribadi yang cepat, minimalis, dan cerdas.

#### 🚀 Fitur Utama:
* **Penamaan AI Otomatis**: Menghasilkan judul ringkas otomatis (maksimal 15 karakter) untuk URL yang disimpan.
* **Organisasi Folder & Posisi**: Susun item dalam folder kustom dan urutkan posisi dengan presisi menggunakan papan angka (Keypad Move).
* **Perlindungan PIN Folder**: Kunci folder sensitif menggunakan PIN 4 digit yang aman.
* **Chat AI & Voice Note**: Berinteraksi dengan AI dan kirim pesan suara hingga 30 detik dengan fitur pratinjau sebelum dikirim.
* **Sinkronisasi Awan & Offline**: Data tersimpan aman di perangkat lokal dan tersinkronisasi otomatis ke Awan Appwrite saat terhubung internet.
        `
      },
      bookmarks: {
        title: 'Bookmark & Penamaan AI',
        icon: Sparkles,
        content: `
### Cara Menambah & Mengelola Bookmark

1. **Menambah Bookmark**:
   * Tempelkan tautan URL langsung ke kolom pencarian / input utama di bagian atas.
   * Tekan tombol **+ Bookmark**. AI secara otomatis menganalisis URL dan membuat judul ringkas (maksimal 15 karakter).

2. **Generate Ulang & Edit Judul**:
   * Klik tombol **Titik Tiga (\`...\`)** pada kartu bookmark.
   * Pilih **Generate Ulang Judul** untuk meminta AI membuat judul baru.
   * Pilih **Edit Judul** untuk mengubah nama bookmark secara manual sesuai keinginan Anda.

💡 *Tips: Kolom pencarian utama mendukung penyaringan cepat judul bookmark dan nama catatan.*
        `
      },
      organization: {
        title: 'Folder & Urutan Posisi',
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
        title: 'Chat AI & Pesan Suara',
        icon: MessageSquare,
        content: `
### Fitur Chat AI & Voice Chat

1. **Membuka Chat**:
   * Buka jendela **Pesan** atau **Pengumuman** dari menu utama.

2. **Memilih Model AI**:
   * Buka menu **Model AI** untuk memilih model AI gratis atau pro. Daftar model diurutkan berdasarkan peringkat skor kualitas terbaik secara otomatis.

3. **Voice Note (Pesan Suara)**:
   * Tekan ikon mikrofon untuk merekam suara.
   * **Maksimal 30 detik**: Perekaman otomatis berhenti di detik ke-30.
   * **Pratinjau Suara**: Setelah rekam, Anda dapat *Memutar/Mendengarkan* pratinjau atau *Membatalkan* sebelum mengeklik **Kirim**.
        `
      },
      sync: {
        title: 'Awan & Ekspor Data',
        icon: Cloud,
        content: `
### Sinkronisasi & Cadangan Data

1. **Sinkronisasi Otomatis**:
   * Data Anda selalu tersimpan secara lokal di browser dan otomatis tersinkronisasi ke akun Appwrite Anda saat terhubung internet.

2. **Ekspor & Impor (Backup)**:
   * Buka menu **Pengaturan** -> bagian **Data & Cadangan**.
   * Pilih **Ekspor JSON** untuk menyimpan cadangan semua bookmark & catatan.
   * Pilih **Impor JSON atau HTML** untuk memulihkan atau mengimpor bookmark dari browser lain.
        `
      }
    },
    en: {
      overview: {
        title: 'Welcome to TautanLumina',
        icon: BookOpen,
        content: `
### Welcome to TautanLumina ✨

**TautanLumina** is a fast, minimalist, and intelligent bookmark & personal note management application.

#### 🚀 Key Features:
* **Automatic AI Titles**: Generates concise titles (maximum 15 characters) for saved URLs automatically.
* **Folders & Reordering**: Group items in custom folders and reorder precisely using a numeric keypad (Keypad Move).
* **Folder PIN Security**: Protect sensitive folders with a secure 4-digit PIN lock.
* **AI Chat & Voice Notes**: Interact with AI models and send voice messages up to 30 seconds with audio preview before sending.
* **Cloud Sync & Offline Mode**: Data is saved locally in your browser and automatically synchronized with Appwrite Cloud when online.
        `
      },
      bookmarks: {
        title: 'Bookmarks & AI Naming',
        icon: Sparkles,
        content: `
### Adding & Managing Bookmarks

1. **Adding a Bookmark**:
   * Paste any URL directly into the top search/input field.
   * Click **+ Bookmark**. AI will automatically analyze the URL and generate a short title (maximum 15 characters).

2. **Regenerate & Edit Title**:
   * Click the **Three Dots (\`...\`)** button on any bookmark card.
   * Select **Regenerate Title** to request a new AI-generated title.
   * Select **Edit Title** to manually rename the bookmark to your preference.

💡 *Tip: The main search field allows quick real-time filtering of bookmark titles and note contents.*
        `
      },
      organization: {
        title: 'Folders & Item Reordering',
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
        title: 'AI Chat & Voice Notes',
        icon: MessageSquare,
        content: `
### AI Chat & Voice Message Features

1. **Open Chat**:
   * Open the **Messages** or **Announcements** window from the main menu.

2. **Select AI Models**:
   * Open **AI Model** menu to choose free or pro AI models sorted automatically by quality score.

3. **Voice Notes**:
   * Tap the microphone icon to record your voice.
   * **30-second Limit**: Recording automatically stops at 30 seconds.
   * **Voice Preview**: Listen to playback or cancel before clicking **Send**.
        `
      },
      sync: {
        title: 'Cloud Sync & Data Backup',
        icon: Cloud,
        content: `
### Data Sync & Backup

1. **Automatic Sync**:
   * Your data is always saved locally in your browser and automatically synchronized with your Appwrite account when connected to the internet.

2. **Export & Import (Backup)**:
   * Open **Settings** -> **Data & Backup** section.
   * Click **Export JSON** to save a full backup of all bookmarks & notes.
   * Click **Import JSON or HTML** to restore or import bookmarks from other browsers.
        `
      }
    },
    zh: {
      overview: {
        title: 'TautanLumina 概览',
        icon: BookOpen,
        content: `
### 欢迎使用 TautanLumina ✨

**TautanLumina** 是一款极简、快速且智能的书签与个人笔记管理应用。

#### 🚀 核心功能：
* **AI 自动命名**：为保存的 URL 自动生成精简标题（最多 15 个字符）。
* **文件夹与位置排序**：将项目整理到自定义文件夹中，并使用数字键盘（Keypad Move）精准调整顺序。
* **文件夹 PIN 码锁定**：使用安全的 4 位数 PIN 码锁定保护隐私文件夹。
* **AI 对话与语音消息**：与 AI 互动，支持长达 30 秒的语音录制并在发送前进行播放预览。
* **云端同步与离线存储**：数据安全存储于本地浏览器，并在联网时自动同步至 Appwrite 云端。
        `
      },
      bookmarks: {
        title: '书签与 AI 命名',
        icon: Sparkles,
        content: `
### 添加与管理书签

1. **添加书签**：
   * 将 URL 链接直接粘贴至顶部搜索/输入框。
   * 点击 **+ 书签**，AI 将自动分析网址并生成精简标题（最多 15 个字符）。

2. **重新生成与编辑标题**：
   * 点击书签卡片上的 **三点菜单 (\`...\`)**。
   * 选择 **重新生成标题** 以请求 AI 重新生成标题。
   * 选择 **编辑标题** 手动修改为自定义名称。

💡 *提示：顶部主搜索框支持实时快速筛选书签标题和笔记内容。*
        `
      },
      organization: {
        title: '文件夹与位置排序',
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
        title: 'AI 对话与语音消息',
        icon: MessageSquare,
        content: `
### AI 对话与语音消息功能

1. **打开对话窗口**：
   * 从主菜单打开 **消息** 或 **公告** 窗口。

2. **选择 AI 模型**：
   * 打开 **AI 模型** 菜单自由选择免费或高级 AI 模型，列表按质量评分自动排序。

3. **语音消息（Voice Note）**：
   * 点击麦克风图标开始录制语音。
   * **最长 30 秒**：录音会在第 30 秒时自动停止。
   * **语音预览**：录音完成后，可以在点击 **发送** 前 *播放/听取* 预览或 *取消* 录音。
        `
      },
      sync: {
        title: '云端同步与数据备份',
        icon: Cloud,
        content: `
### 数据同步与备份恢复

1. **自动云端同步**：
   * 您的数据始终安全保存在本地浏览器中，联网时会自动同步至您的 Appwrite 云端账号。

2. **导入与导出（备份）**：
   * 打开 **设置** -> **数据与备份** 页面。
   * 选择 **导出 JSON** 保存所有书签和笔记的完整备份。
   * 选择 **导入 JSON 或 HTML** 恢复备份或导入其他浏览器的书签。
        `
      }
    },
    ja: {
      overview: {
        title: 'TautanLumina の概要',
        icon: BookOpen,
        content: `
### TautanLumina へようこそ ✨

**TautanLumina** は、高速でミニマル、かつスマートなブックマーク＆個人ノート管理アプリケーションです。

#### 🚀 主な機能:
* **AI 自動タイトル作成**: 保存した URL に対して簡潔なタイトル（最大 15 文字）を自動生成。
* **フォルダ整理と順序変更**: カスタムフォルダで項目を整理し、数字キーパッド（Keypad Move）で位置を正確に変更。
* **フォルダ PIN ロック**: 安全な 4 桁の PIN コードで大切なフォルダを保護。
* **AI チャット＆音声メッセージ**: AI と会話でき、最大 30 秒の音声メッセージを送信前にプレビュー試聴可能。
* **クラウド同期＆オフライン**: ローカルブラウザに安全に保存され、インターネット接続時に Appwrite クラウドへ自動同期。
        `
      },
      bookmarks: {
        title: 'ブックマーク＆ AI 自動命名',
        icon: Sparkles,
        content: `
### ブックマークの追加と管理

1. **ブックマークの追加**:
   * 上部の検索/入力欄に URL を直接貼り付けます。
   * **+ ブックマーク** ボタンを押すと、AI が自動で URL を解析し、短いタイトル（最大 15 文字）を生成します。

2. **タイトルの再生成・手動編集**:
   * ブックマークカードの **三点メニュー (\`...\`)** をクリック。
   * **タイトルを再生成** を選ぶと AI が新しいタイトルを作成します。
   * **タイトルを編集** を選ぶと手動でお好みの名称に変更できます。

💡 *ヒント: 上部メイン検索バーでブックマークタイトルやノート内容をリアルタイム検索できます。*
        `
      },
      organization: {
        title: 'フォルダと順序並び替え',
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
        title: 'AI チャット＆音声メッセージ',
        icon: MessageSquare,
        content: `
### AI チャットと音声メッセージ機能

1. **チャットを開く**:
   * メインメニューから **メッセージ** または **お知らせ** 画面を開きます。

2. **AI モデルの選択**:
   * **AI モデル** メニューから無料/プロモデルを選択。スコア順に自動ソートされます。

3. **音声メッセージ (Voice Note)**:
   * マイクアイコンを押して録音を開始します。
   * **最大 30 秒**: 30 秒に達すると自動的に録音が停止します。
   * **音声プレビュー**: 送信前に *再生/試聴* や *キャンセル* を選択できます。
        `
      },
      sync: {
        title: 'クラウド同期＆データバックアップ',
        icon: Cloud,
        content: `
### データ同期とバックアップ

1. **自動クラウド同期**:
   * データは常にブラウザローカルに保存され、オンライン時に Appwrite クラウドと自動同期されます。

2. **エクスポート/インポート (バックアップ)**:
   * **設定** -> **データとバックアップ** を開きます。
   * **JSON エクスポート** で全ブックマークとノートのバックアップを保存。
   * **JSON / HTML インポート** で復元や他ブラウザのブックマークを取り込めます。
        `
      }
    },
    ko: {
      overview: {
        title: 'TautanLumina 소개',
        icon: BookOpen,
        content: `
### TautanLumina에 오신 것을 환영합니다 ✨

**TautanLumina**는 빠르고 미니멀하며 스마트한 북마크 및 개인 메모 관리 애플리케이션입니다.

#### 🚀 주요 기능:
* **AI 자동 제목 생성**: 저장한 URL에 대해 최적화된 짧은 제목(최대 15자)을 자동으로 생성합니다.
* **폴더 및 순서 정렬**: 맞춤 폴더에 항목을 정리하고 숫자 키패드(Keypad Move)를 사용하여 정확하게 위치를 변경합니다.
* **폴더 PIN 잠금**: 안전한 4자리 PIN 코드로 중요한 폴더를 보호합니다.
* **AI 챗 & 음성 메시지**: AI와 대화하고 전송 전 음성을 미리 들을 수 있는 최대 30초 음성 메시지를 지원합니다.
* **클라우드 동기화 & 오프라인**: 브라우저 로컬에 안전하게 저장되며 인터넷 연결 시 Appwrite 클라우드와 자동 동기화됩니다.
        `
      },
      bookmarks: {
        title: '북마크 & AI 제목 생성',
        icon: Sparkles,
        content: `
### 북마크 추가 및 관리

1. **북마크 추가**:
   * 상단 검색/입력창에 URL을 직접 붙여넣습니다.
   * **+ 북마크** 버튼을 누르면 AI가 URL을 분석하여 짧은 제목(최대 15자)을 자동으로 생성합니다.

2. **제목 재생성 및 편집**:
   * 북마크 카드의 **점 3개 메뉴 (\`...\`)** 를 클릭합니다.
   * **제목 재생성**을 선택하여 새 AI 제목을 생성하거나,
   * **제목 편집**을 선택하여 원하는 이름으로 직접 변경할 수 있습니다.

💡 *팁: 상단 메인 검색창을 통해 북마크 제목과 메모 내용을 실시간으로 필터링할 수 있습니다.*
        `
      },
      organization: {
        title: '폴더 & 위치 이동 정렬',
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
        title: 'AI 챗 & 음성 메시지',
        icon: MessageSquare,
        content: `
### AI 챗 및 음성 메시지 기능

1. **챗 창 열기**:
   * 메인 메뉴에서 **메시지** 또는 **공지사항** 창을 엽니다.

2. **AI 모델 선택**:
   * **AI 모델** 메뉴에서 무료 및 프로 모델을 선택합니다. 모델 목록은 품질 점수순으로 자동 정렬됩니다.

3. **음성 메시지 (Voice Note)**:
   * 마이크 아이콘을 눌러 음성 녹음을 시작합니다.
   * **최대 30초**: 30초에 도달하면 녹음이 자동으로 중지됩니다.
   * **음성 미리듣기**: 전송 전 *재생/미리듣기* 또는 *취소*를 선택할 수 있습니다.
        `
      },
      sync: {
        title: '클라우드 동기화 & 백업',
        icon: Cloud,
        content: `
### 데이터 동기화 및 백업

1. **자동 클라우드 동기화**:
   * 데이터는 항상 브라우저 로컬에 저장되며, 온라인 상태일 때 Appwrite 클라우드 계정과 자동 동기화됩니다.

2. **내보내기 & 가져오기 (백업)**:
   * **설정** -> **데이터 & 백업** 메뉴를 엽니다.
   * **JSON 내보내기**로 모든 북마크 및 메모의 전체 백업을 저장합니다.
   * **JSON 또는 HTML 가져오기**로 복원하거나 타 브라우저의 북마크를 가져올 수 있습니다.
        `
      }
    },
    ru: {
      overview: {
        title: 'О сервисе TautanLumina',
        icon: BookOpen,
        content: `
### Добро пожаловать в TautanLumina ✨

**TautanLumina** — это быстрый, минималистичный и умный менеджер закладок и личных заметок.

#### 🚀 Основные возможности:
* **Авто-заголовки ИИ**: Автоматически генерирует короткие названия (максимум 15 символов) для сохраненных URL.
* **Папки и сортировка**: Группируйте элементы в папки и точно меняйте их порядок с помощью цифровой клавиатуры (Keypad Move).
* **Защита папок PIN-кодом**: Защищайте конфиденциальные папки надежным 4-значным PIN-кодом.
* **ИИ Чат и Голосовые**: Общайтесь с ИИ и отправляйте голосовые сообщения длительностью до 30 секунд с предварительным прослушиванием.
* **Облачная синхронизация**: Данные надежно сохраняются локально в браузере и автоматически синхронизируются с Appwrite Cloud при подключении к сети.
        `
      },
      bookmarks: {
        title: 'Закладки и авто-заголовки ИИ',
        icon: Sparkles,
        content: `
### Добавление и управление закладками

1. **Добавление закладки**:
   * Вставьте ссылку URL непосредственно в верхнюю строку поиска/ввода.
   * Нажмите **+ Закладка**. ИИ проанализирует URL и автоматически создаст короткий заголовок (макс. 15 символов).

2. **Перегенерация и редактирование**:
   * Нажмите кнопку **Три точки (\`...\`)** на карточке закладки.
   * Выберите **Перегенерировать заголовок** для запроса нового заголовка ИИ.
   * Выберите **Редактировать заголовок** для ручного изменения названия.

💡 *Совет: Главная строка поиска позволяет мгновенно фильтровать закладки и заметки в реальном времени.*
        `
      },
      organization: {
        title: 'Папки и позиционирование',
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
        title: 'ИИ Чат и Голосовые',
        icon: MessageSquare,
        content: `
### ИИ Чат и голосовые сообщения

1. **Открытие чата**:
   * Откройте окно **Сообщения** или **Объявления** из главного меню.

2. **Выбор модели ИИ**:
   * Откройте меню **Модель ИИ** для выбора бесплатной или про модели, отсортированных по рейтингу качества.

3. **Голосовые сообщения (Voice Note)**:
   * Нажмите значок микрофона для начала записи.
   * **Максимум 30 секунд**: Запись автоматически останавливается на 30-й секунде.
   * **Предпросмотр**: Прослушайте запись или отмените ее перед нажатием **Отправить**.
        `
      },
      sync: {
        title: 'Синхронизация и бэкап',
        icon: Cloud,
        content: `
### Синхронизация данных и резервное копирование

1. **Автоматическая синхронизация**:
   * Данные всегда сохраняются локально в браузере и автоматически синхронизируются с вашим аккаунтом Appwrite Cloud в сети.

2. **Экспорт и импорт (Бэкап)**:
   * Перейдите в **Настройки** -> **Данные и бэкап**.
   * Выберите **Экспорт JSON** для сохранения полной копии всех закладок и заметок.
   * Выберите **Импорт JSON / HTML** для восстановления или импорта закладок из других браузеров.
        `
      }
    }
  };

  const currentLang = (guideContents[lang] ? lang : 'id') as LanguageCode;
  const sections = guideContents[currentLang];

  const filteredSectionKeys = (Object.keys(sections) as GuideTab[]).filter(key => {
    if (!searchQuery.trim()) return true;
    const item = sections[key];
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fdfcfb] dark:bg-[#161618] overflow-hidden">
      {/* Top Search Bar inside Guide Tab */}
      <div className="p-3 border-b border-[#e2ddd5] dark:border-[#2d2d35] bg-white dark:bg-[#1e1e22] shrink-0">
        <div className="relative flex items-center max-w-xl mx-auto">
          <Search size={16} className="absolute left-3 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('guide.searchPlaceholder') || 'Cari topik panduan...'}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[#faf8f5] dark:bg-[#28282e] border border-[#e2ddd5] dark:border-[#383842] rounded-xl text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Guide Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#e2ddd5] dark:border-[#2d2d35] bg-[#faf8f5]/80 dark:bg-[#1a1a1d] p-2 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 no-scrollbar">
          {(Object.keys(sections) as GuideTab[]).map((tabKey) => {
            const item = sections[tabKey];
            const Icon = item.icon;
            const isActive = activeSection === tabKey;
            const isMatch = filteredSectionKeys.includes(tabKey);

            if (!isMatch && searchQuery.trim()) return null;

            return (
              <button
                key={tabKey}
                onClick={() => setActiveSection(tabKey)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-left whitespace-nowrap md:whitespace-normal transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white dark:bg-[#28282e] text-[#FF4F00] border border-[#FF4F00]/30 shadow-xs' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#FF4F00]' : 'text-neutral-400'} />
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Viewer */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-[#161618]">
          {sections[activeSection] && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#e2ddd5] dark:border-[#2d2d35]">
                {React.createElement(sections[activeSection].icon, { size: 24, className: 'text-[#FF4F00]' })}
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 m-0">
                  {sections[activeSection].title}
                </h2>
              </div>

              <div className="markdown-body text-xs sm:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                <ReactMarkdown>{sections[activeSection].content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guide Footer Notice */}
      <div className="p-2.5 border-t border-[#e2ddd5] dark:border-[#2d2d35] bg-[#faf8f5] dark:bg-[#1e1e22] flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 shrink-0 px-4">
        <div className="flex items-center gap-1.5">
          <Lightbulb size={14} className="text-[#FF4F00]" />
          <span>TautanLumina • {t('guide.title') || 'Panduan Penggunaan'}</span>
        </div>
        <span className="text-[11px] opacity-75">v1.0</span>
      </div>
    </div>
  );
};
