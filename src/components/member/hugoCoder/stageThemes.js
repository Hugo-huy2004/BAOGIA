import { Terminal, Cpu, Brain, Shield, Rocket, Server } from "lucide-react";

// Bảng màu & biểu tượng riêng của từng chặng — DÙNG CHUNG cho bản đồ hành trình
// (LessonsSidebar), trang Quản lý (HugoCoderHub) và mọi nơi hiển thị chặng,
// để màu Chặng N luôn nhất quán khắp HugoCoder.
export const STAGE_THEME = {
  basic: {
    icon: Terminal,
    banner: "from-blue-500 to-indigo-600",
    soft: "from-blue-500/15 via-indigo-500/5 to-transparent border-blue-500/25",
    text: "text-blue-500",
    node: "bg-gradient-to-br from-blue-400 to-indigo-600 border-blue-300/60",
    ring: "ring-blue-500/40",
    bar: "bg-gradient-to-r from-blue-400 to-indigo-500",
    chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500"
  },
  intermediate: {
    icon: Cpu,
    banner: "from-emerald-500 to-teal-600",
    soft: "from-emerald-500/15 via-teal-500/5 to-transparent border-emerald-500/25",
    text: "text-emerald-500",
    node: "bg-gradient-to-br from-emerald-400 to-teal-600 border-emerald-300/60",
    ring: "ring-emerald-500/40",
    bar: "bg-gradient-to-r from-emerald-400 to-teal-500",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500"
  },
  advanced: {
    icon: Brain,
    banner: "from-violet-500 to-purple-600",
    soft: "from-violet-500/15 via-purple-500/5 to-transparent border-violet-500/25",
    text: "text-violet-500",
    node: "bg-gradient-to-br from-violet-400 to-purple-600 border-violet-300/60",
    ring: "ring-violet-500/40",
    bar: "bg-gradient-to-r from-violet-400 to-purple-500",
    chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dot: "bg-violet-500"
  },
  security: {
    icon: Shield,
    banner: "from-rose-500 to-pink-600",
    soft: "from-rose-500/15 via-pink-500/5 to-transparent border-rose-500/25",
    text: "text-rose-500",
    node: "bg-gradient-to-br from-rose-400 to-pink-600 border-rose-300/60",
    ring: "ring-rose-500/40",
    bar: "bg-gradient-to-r from-rose-400 to-pink-500",
    chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500"
  },
  project: {
    icon: Rocket,
    elite: true,
    banner: "from-indigo-600 via-violet-600 to-fuchsia-600",
    soft: "from-violet-500/15 via-fuchsia-500/8 to-transparent border-violet-500/30",
    text: "text-violet-500",
    node: "bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 border-violet-300/60",
    ring: "ring-violet-500/50",
    bar: "bg-gradient-to-r from-indigo-400 via-violet-500 to-fuchsia-500",
    chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dot: "bg-fuchsia-500"
  },
  devops: {
    icon: Server,
    elite: true,
    banner: "from-amber-500 via-yellow-500 to-amber-600",
    soft: "from-amber-500/20 via-yellow-500/8 to-transparent border-amber-500/40",
    text: "text-amber-500",
    node: "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-amber-300/70",
    ring: "ring-amber-400/60",
    bar: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500"
  }
};
