import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import HugoArcadeTab from "../../components/member/arcade/HugoArcadeTab";
import { getMemberSession } from "../../services/authSession";

export default function ArcadePage() {
  const navigate = useNavigate();
  const session = getMemberSession();
  const player = useMemo(() => session ? ({
    email: session.email,
    displayName: session.displayName || session.name || session.email?.split("@")[0] || "Người chơi",
    avatarUrl: session.avatarUrl || "",
    avatar: session.avatarUrl || "",
  }) : null, [session?.email, session?.displayName, session?.avatarUrl]);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-background dark:bg-background">
      <HugoArcadeTab bio={player} onBack={() => navigate("/member/utilities")} />
    </div>
  );
}
