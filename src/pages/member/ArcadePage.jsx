import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HugoArcadeTab from "../../components/member/arcade/HugoArcadeTab";
import { getMemberSession } from "../../services/authSession";
import memberService from "../../services/classes/MemberService";

// Standalone deep-link route (bypasses MemberPortalPage entirely) — must fetch
// the real Bio document itself. It used to hand HugoArcadeTab a synthetic
// {email, displayName, avatarUrl} object with no featureSubscriptions at all,
// so paid HugoArcade subscriptions could never show as unlocked here no
// matter what the database said.
export default function ArcadePage() {
  const navigate = useNavigate();
  const session = getMemberSession();
  const [bio, setBio] = useState(null);

  useEffect(() => {
    if (!session?.email) return;
    memberService.getMemberBio(session.email, session.displayName || session.name, session.avatarUrl)
      .then((res) => { if (res?.bio) setBio(res.bio); })
      .catch(console.error);
  }, [session?.email]);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-background dark:bg-background">
      <HugoArcadeTab bio={bio} onBioUpdate={(patch) => setBio(prev => prev ? { ...prev, ...patch } : prev)} onBack={() => navigate("/member/utilities")} />
    </div>
  );
}
