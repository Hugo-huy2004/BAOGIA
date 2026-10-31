// Shared by the portfolio and the static CV. List project evidence, not ratings.
export const profileSkills = [
  {
    id: "web",
    title: { vi: "Dùng trong dự án web", en: "Used in web projects", zh: "Web 项目中使用" },
    note: {
      vi: "Giao diện, API và lưu trữ dữ liệu.",
      en: "Interfaces, APIs and data storage.",
      zh: "界面、API 与数据存储。",
    },
    lines: ["React · JavaScript / TypeScript · HTML / CSS", "Node.js / Express · MongoDB"],
    projects: ["hugo-studio", "hwj"],
  },
  {
    id: "practice",
    title: { vi: "Đã thực hành theo dự án", en: "Project-based practice", zh: "项目实践" },
    note: {
      vi: "Website cộng đồng và bài tập ứng dụng di động.",
      en: "A community website and mobile coursework.",
      zh: "社区网站与移动开发课程作业。",
    },
    lines: ["Next.js · Firestore", "React Native (Expo) · SQLite"],
    projects: ["chanh-toa", "m-hike"],
  },
  {
    id: "tools",
    title: { vi: "Công cụ làm việc", en: "Working tools", zh: "工作工具" },
    note: {
      vi: "Quản lý mã nguồn và triển khai website.",
      en: "Source control and website deployment.",
      zh: "源码管理与网站部署。",
    },
    lines: ["Git / GitHub", "Vercel / Render"],
    projects: ["hugo-studio"],
  },
];

export const skillsCopy = {
  vi: { heading: "Kỹ năng qua dự án", note: "Nhóm theo cách sử dụng, kèm dự án để xem cụ thể.", evidence: "Dự án liên quan" },
  en: { heading: "Skills in practice", note: "Grouped by how I used each technology, with projects to explore.", evidence: "Related projects" },
  zh: { heading: "项目中的技能", note: "按实际用途分类，并附上相关项目。", evidence: "相关项目" },
};
