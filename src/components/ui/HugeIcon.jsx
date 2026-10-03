import { forwardRef, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Search01Icon,
  Cancel01Icon,
  Edit02Icon,
  SparklesIcon,
  FlashIcon,
  LockIcon,
  SquareUnlock01Icon,
  Bookmark01Icon,
  BookmarkCheck01Icon,
  Share01Icon,
  Clock01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CpuIcon,
  GraduationCapIcon,
  UserGroupIcon,
  Globe02Icon,
  ChurchIcon,
  News01Icon,
  Brain02Icon,
  Megaphone01Icon,
  Mail01Icon,
  Award01Icon,
  FlameIcon,
  AnalyticsUpIcon,
  PlayIcon,
  PauseIcon,
  RotateLeft01Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
  VolumeLowIcon,
  Tick01Icon,
  Logout01Icon,
  Delete02Icon,
  UserBlock01Icon,
  ExternalLinkIcon,
  FileCheckIcon,
  ShieldCheckIcon,
  ZapIcon,
  PaintBoardIcon,
  Notification01Icon,
  SlidersHorizontalIcon,
  Alert01Icon,
  Tag01Icon,
  BookOpen01Icon,
  CheckmarkBadge01Icon,
  Home01Icon,
  CloudIcon,
  HelpCircleIcon,
  Calendar01Icon,
  CalendarDaysIcon,
  Briefcase01Icon,
  Coffee01Icon,
  Key01Icon,
  FrownIcon,
  SmileIcon,
  MehIcon,
  HeartIcon,
  TrophyIcon,
  GiftIcon,
  ServerIcon,
  Rocket01Icon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Copy01Icon,
  Link01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  HeadphonesIcon,
  PencilEdit02Icon,
  Dumbbell01Icon,
  Call02Icon,
  EarIcon,
  WavesIcon,
  CloudRainIcon,
  WindIcon,
  Music01Icon,
  Activity01Icon,
  Ticket01Icon,
  Loading01Icon,
  DashboardSquare02Icon,
  Login01Icon,
  Message01Icon,
  MessageSquareIcon,
  ClipboardListIcon,
  ReloadIcon,
  TerminalIcon,
  Target01Icon,
  Wrench01Icon,
  Bug01Icon,
  LibraryIcon,
  CubeIcon,
  Wallet01Icon,
  Camera01Icon,
  FingerPrintScanIcon,
} from "@hugeicons/core-free-icons";

// Bảng ánh xạ tên biểu tượng từ Material Symbols & Lucide sang Hugeicons
export const HUGE_ICON_MAP = {
  // Navigation & Actions
  search: Search01Icon,
  close: Cancel01Icon,
  cancel: Cancel01Icon,
  clear: Cancel01Icon,
  arrow_forward: ArrowRight01Icon,
  arrow_right: ArrowRight01Icon,
  chevron_right: ChevronRightIcon,
  arrow_back: ArrowLeft01Icon,
  arrow_left: ArrowLeft01Icon,
  chevron_left: ChevronLeftIcon,
  chevron_down: ChevronDownIcon,
  chevron_up: ChevronUpIcon,
  home: Home01Icon,
  external_link: ExternalLinkIcon,
  open_in_new: ExternalLinkIcon,
  share: Share01Icon,
  share2: Share01Icon,
  copy: Copy01Icon,
  link: Link01Icon,

  // App & Shell Navigation
  today: Calendar01Icon,
  apps: DashboardSquare02Icon,
  grid: DashboardSquare02Icon,
  dashboard: DashboardSquare02Icon,
  notifications: Notification01Icon,
  activity: Activity01Icon,
  login: Login01Icon,
  person: UserIcon,

  // User & Profile
  user: UserIcon,
  profile: UserIcon,
  user_x: UserBlock01Icon,
  user_block: UserBlock01Icon,
  edit: Edit02Icon,
  edit3: Edit02Icon,
  pencil: PencilEdit02Icon,
  pen: PencilEdit02Icon,
  logout: Logout01Icon,
  log_out: Logout01Icon,

  // Status & Utility
  check: Tick01Icon,
  tick: Tick01Icon,
  checkmark: Tick01Icon,
  check_circle: CheckmarkCircle02Icon,
  check_circle2: CheckmarkCircle02Icon,
  circle: CircleIcon,
  verified: CheckmarkBadge01Icon,
  schedule: Clock01Icon,
  clock: Clock01Icon,
  time: Clock01Icon,
  calendar: Calendar01Icon,
  calendar_days: CalendarDaysIcon,
  bookmark: Bookmark01Icon,
  bookmark_border: Bookmark01Icon,
  bookmark_added: BookmarkCheck01Icon,
  bookmark_check: BookmarkCheck01Icon,
  tag: Tag01Icon,
  bolt: FlashIcon,
  flash: FlashIcon,
  zap: ZapIcon,
  sparkles: SparklesIcon,
  award: Award01Icon,
  flame: FlameIcon,
  fire: FlameIcon,
  trending_up: AnalyticsUpIcon,
  analytics: AnalyticsUpIcon,
  star: StarIcon,
  trophy: TrophyIcon,
  gift: GiftIcon,
  ticket: Ticket01Icon,
  loader: Loading01Icon,
  loader2: Loading01Icon,

  // Emotions & Mood
  heart: HeartIcon,
  smile: SmileIcon,
  meh: MehIcon,
  frown: FrownIcon,

  // Categories & Domains
  newspaper: News01Icon,
  news: News01Icon,
  all: News01Icon,
  memory: CpuIcon,
  cpu: CpuIcon,
  code: CpuIcon,
  technology: CpuIcon,
  terminal: TerminalIcon,
  school: GraduationCapIcon,
  academic: GraduationCapIcon,
  graduation_cap: GraduationCapIcon,
  groups: UserGroupIcon,
  users: UserGroupIcon,
  community: UserGroupIcon,
  world: Globe02Icon,
  public: Globe02Icon,
  globe: Globe02Icon,
  church: ChurchIcon,
  catholic: ChurchIcon,
  business_center: Briefcase01Icon,
  briefcase: Briefcase01Icon,
  local_cafe: Coffee01Icon,
  coffee: Coffee01Icon,
  library: LibraryIcon,
  target: Target01Icon,
  wrench: Wrench01Icon,
  bug: Bug01Icon,
  rocket: Rocket01Icon,
  server: ServerIcon,
  blocks: CubeIcon,

  // Media & Controls & Therapy
  play: PlayIcon,
  play_arrow: PlayIcon,
  pause: PauseIcon,
  spa: SparklesIcon,
  campfire: FlameIcon,
  local_fire_department: FlameIcon,
  receipt: FileCheckIcon,
  receipt_long: FileCheckIcon,
  rotate_ccw: RotateLeft01Icon,
  reload: ReloadIcon,
  refresh: ReloadIcon,
  refresh_cw: ReloadIcon,
  volume_up: VolumeHighIcon,
  volume_high: VolumeHighIcon,
  volume2: VolumeHighIcon,
  volume_down: VolumeLowIcon,
  volume_low: VolumeLowIcon,
  volume1: VolumeLowIcon,
  volume_off: VolumeMute01Icon,
  volume_mute: VolumeMute01Icon,
  volumex: VolumeMute01Icon,
  music: Music01Icon,
  waves: WavesIcon,
  rain: CloudRainIcon,
  cloud_rain: CloudRainIcon,
  wind: WindIcon,
  headphones: HeadphonesIcon,
  dumbbell: Dumbbell01Icon,
  ear: EarIcon,
  call: Call02Icon,
  phone: Call02Icon,
  message: Message01Icon,
  message_square: MessageSquareIcon,
  clipboard_list: ClipboardListIcon,

  // System & Security
  lock: LockIcon,
  unlock: SquareUnlock01Icon,
  key: Key01Icon,
  shield_check: ShieldCheckIcon,
  file_check: FileCheckIcon,
  file_check2: FileCheckIcon,
  book_open: BookOpen01Icon,
  palette: PaintBoardIcon,
  bell: Notification01Icon,
  notification: Notification01Icon,
  settings: SlidersHorizontalIcon,
  sliders: SlidersHorizontalIcon,
  sliders_horizontal: SlidersHorizontalIcon,
  alert: Alert01Icon,
  alert_triangle: Alert01Icon,
  warning: Alert01Icon,
  error: Alert01Icon,
  trash: Delete02Icon,
  trash2: Delete02Icon,
  delete: Delete02Icon,
  mail: Mail01Icon,
  email: Mail01Icon,
  campaign: Megaphone01Icon,
  megaphone: Megaphone01Icon,
  psychology: Brain02Icon,
  brain: Brain02Icon,
  cloud: CloudIcon,
  cloud_off: CloudIcon,
  help: HelpCircleIcon,
};

/**
 * Thành phần HugeIcon chuẩn hoá toàn hệ thống.
 * Hỗ trợ nhận trực tiếp Hugeicon object qua prop `icon`, hoặc tên biểu tượng qua prop `name`.
 */
export const HugeIcon = forwardRef(function HugeIcon(
  {
    icon,
    name,
    size = 18,
    color = "currentColor",
    strokeWidth = 1.5,
    className = "",
    style,
    ...rest
  },
  ref
) {
  const resolvedIcon = useMemo(() => {
    if (icon) return icon;
    if (name) {
      const clean = String(name).toLowerCase().trim().replace(/-/g, "_");
      if (HUGE_ICON_MAP[clean]) return HUGE_ICON_MAP[clean];
      // fallback tìm kiếm theo từ khoá
      const match = Object.keys(HUGE_ICON_MAP).find((k) => clean.includes(k) || k.includes(clean));
      if (match) return HUGE_ICON_MAP[match];
    }
    return SparklesIcon;
  }, [icon, name]);

  return (
    <HugeiconsIcon
      ref={ref}
      icon={resolvedIcon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-hidden={rest["aria-hidden"] ?? true}
      {...rest}
    />
  );
});

export default HugeIcon;

/**
 * Helper tạo component wrapper tương thích với Lucide/chuẩn React
 */
export function createHugeIcon(iconDef) {
  return forwardRef(function CreatedHugeIcon(props, ref) {
    return <HugeIcon ref={ref} icon={iconDef} {...props} />;
  });
}

// ── Common drop-in Icon Components ──────────────────────────────────────────
export const User = createHugeIcon(UserIcon);
export const UserRound = createHugeIcon(UserIcon);
export const UserX = createHugeIcon(UserBlock01Icon);
export const Users = createHugeIcon(UserGroupIcon);
export const Search = createHugeIcon(Search01Icon);
export const X = createHugeIcon(Cancel01Icon);
export const Edit3 = createHugeIcon(Edit02Icon);
export const Pencil = createHugeIcon(PencilEdit02Icon);
export const Sparkles = createHugeIcon(SparklesIcon);
export const Zap = createHugeIcon(ZapIcon);
export const Flame = createHugeIcon(FlameIcon);
export const Award = createHugeIcon(Award01Icon);
export const Trophy = createHugeIcon(TrophyIcon);
export const Star = createHugeIcon(StarIcon);
export const Gift = createHugeIcon(GiftIcon);
export const Ticket = createHugeIcon(Ticket01Icon);
export const Lock = createHugeIcon(LockIcon);
export const Unlock = createHugeIcon(SquareUnlock01Icon);
export const ShieldCheck = createHugeIcon(ShieldCheckIcon);
export const Palette = createHugeIcon(PaintBoardIcon);
export const Globe = createHugeIcon(Globe02Icon);
export const Bell = createHugeIcon(Notification01Icon);
export const SlidersHorizontal = createHugeIcon(SlidersHorizontalIcon);
export const ChevronRight = createHugeIcon(ChevronRightIcon);
export const ChevronLeft = createHugeIcon(ChevronLeftIcon);
export const ChevronDown = createHugeIcon(ChevronDownIcon);
export const ChevronUp = createHugeIcon(ChevronUpIcon);
export const ArrowRight = createHugeIcon(ArrowRight01Icon);
export const ArrowLeft = createHugeIcon(ArrowLeft01Icon);
export const LogOut = createHugeIcon(Logout01Icon);
export const Share2 = createHugeIcon(Share01Icon);
export const ExternalLink = createHugeIcon(ExternalLinkIcon);
export const Copy = createHugeIcon(Copy01Icon);
export const LinkIcon = createHugeIcon(Link01Icon);
export const Check = createHugeIcon(Tick01Icon);
export const CheckCircle = createHugeIcon(CheckmarkCircle02Icon);
export const CheckCircle2 = createHugeIcon(CheckmarkCircle02Icon);
export const Circle = createHugeIcon(CircleIcon);
export const AlertTriangle = createHugeIcon(Alert01Icon);
export const Trash2 = createHugeIcon(Delete02Icon);
export const Clock = createHugeIcon(Clock01Icon);
export const Calendar = createHugeIcon(Calendar01Icon);
export const BookOpen = createHugeIcon(BookOpen01Icon);
export const FileCheck2 = createHugeIcon(FileCheckIcon);
export const GraduationCap = createHugeIcon(GraduationCapIcon);
export const TrendingUp = createHugeIcon(AnalyticsUpIcon);
export const Wind = createHugeIcon(WindIcon);
export const Brain = createHugeIcon(Brain02Icon);
export const Dumbbell = createHugeIcon(Dumbbell01Icon);
export const Headphones = createHugeIcon(HeadphonesIcon);
export const Volume2 = createHugeIcon(VolumeHighIcon);
export const VolumeX = createHugeIcon(VolumeMute01Icon);
export const MessageSquare = createHugeIcon(MessageSquareIcon);
export const ClipboardList = createHugeIcon(ClipboardListIcon);
export const Activity = createHugeIcon(Activity01Icon);
export const RefreshCw = createHugeIcon(ReloadIcon);
export const Hand = createHugeIcon(HeartIcon); // fallback to Heart/Hand
export const Phone = createHugeIcon(Call02Icon);
export const Heart = createHugeIcon(HeartIcon);
export const Ear = createHugeIcon(EarIcon);
export const Waves = createHugeIcon(WavesIcon);
export const CloudRain = createHugeIcon(CloudRainIcon);
export const Music = createHugeIcon(Music01Icon);
export const RotateCcw = createHugeIcon(RotateLeft01Icon);
export const Smile = createHugeIcon(SmileIcon);
export const Meh = createHugeIcon(MehIcon);
export const Frown = createHugeIcon(FrownIcon);
export const Loader2 = createHugeIcon(Loading01Icon);
export const Terminal = createHugeIcon(TerminalIcon);
export const Cpu = createHugeIcon(CpuIcon);
export const Server = createHugeIcon(ServerIcon);
export const Rocket = createHugeIcon(Rocket01Icon);
export const Target = createHugeIcon(Target01Icon);
export const Wrench = createHugeIcon(Wrench01Icon);
export const Bug = createHugeIcon(Bug01Icon);
export const Library = createHugeIcon(LibraryIcon);
export const Home = createHugeIcon(Home01Icon);
export const Blocks = createHugeIcon(CubeIcon);
export const Wallet = createHugeIcon(Wallet01Icon);
export const Camera = createHugeIcon(Camera01Icon);
export const Scan = createHugeIcon(FingerPrintScanIcon);
