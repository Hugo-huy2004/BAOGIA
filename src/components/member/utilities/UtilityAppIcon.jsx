import {
  Badge,
  Blocks,
  Brain,
  Castle,
  Code2,
  Gamepad2,
  GraduationCap,
  Grid3X3,
  Infinity as InfinityIcon,
  Info,
  Keyboard,
  QrCode,
  Radio,
  Rocket,
  ShoppingBag,
  Sparkles,
  Swords,
  UsersRound,
  Waves,
  Zap,
} from "lucide-react";

const ICONS = Object.freeze({
  bio: Badge,
  study: GraduationCap,
  ide: Code2,
  hugoso: GraduationCap,
  team: UsersRound,
  psychology: Brain,
  radio: Radio,
  handle: QrCode,
  arcade: Gamepad2,
  aura: Waves,
  info: Info,
  store: ShoppingBag,
  arcade_chess: Castle,
  arcade_2048: Blocks,
  arcade_caro: Swords,
  arcade_snake: InfinityIcon,
  arcade_survivor: Rocket,
});

const SIZE_CLASS = Object.freeze({
  small: "h-10 w-10 rounded-[13px]",
  medium: "h-14 w-14 rounded-[17px]",
  large: "h-16 w-16 rounded-[20px]",
});

const GLYPH_CLASS = Object.freeze({
  small: "h-5 w-5",
  medium: "h-7 w-7",
  large: "h-8 w-8",
});

export default function UtilityAppIcon({ app, gradient, size = "medium", className = "" }) {
  const Icon = ICONS[app?.id] || Sparkles;
  return (
    <span
      className={`utility-app-icon inline-flex shrink-0 items-center justify-center bg-gradient-to-br ${gradient} ${SIZE_CLASS[size] || SIZE_CLASS.medium} ${className}`}
      aria-hidden="true"
      data-app-id={app?.id}
    >
      <Icon className={GLYPH_CLASS[size] || GLYPH_CLASS.medium} strokeWidth={1.9} />
    </span>
  );
}
