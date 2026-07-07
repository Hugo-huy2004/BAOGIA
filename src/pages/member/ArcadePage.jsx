import React, { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMemberSession } from "../../services/authSession";
import memberService from "../../services/classes/MemberService";

const HugoArcadeTab = lazy(() => import("../../components/member/arcade/HugoArcadeTab"));

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
    <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-background">
      <Suspense fallback={<div className="flex items-center justify-center h-full w-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <HugoArcadeTab bio={bio} onBioUpdate={(patch) => setBio(prev => prev ? { ...prev, ...patch } : prev)} onBack={() => navigate("/member/utilities")} />
      </Suspense>
    </div>
  );
}
