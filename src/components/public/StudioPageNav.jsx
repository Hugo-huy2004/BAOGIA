import { Link } from "react-router-dom";

export default function StudioPageNav({
  active,
  portfolioLabel,
  servicesLabel,
  className = "",
}) {
  const links = [
    { id: "portfolio", to: "/introduction", label: portfolioLabel },
    { id: "services", to: "/services", label: servicesLabel },
  ];

  return (
    <div className={`relative z-30 md:hidden ${className}`}>
      <nav
        aria-label="Hugo Studio pages"
        className="mx-auto grid w-full max-w-[290px] grid-cols-2 rounded-full border border-border/70 bg-background/80 p-1 shadow-md shadow-black/5 backdrop-blur-xl"
      >
        {links.map((item) => {
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={`min-h-10 rounded-full px-4 py-2.5 text-center text-xs font-extrabold transition-colors ${
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground active:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
