import { useEffect } from "react";
import StatusScreen from "../components/system/StatusScreen";
import { reportIncident } from "../lib/incident";

// Trước đây mọi đường dẫn lạ bị đẩy thầm về trang chủ: người dùng không biết
// link hỏng, admin không biết link nào hỏng. Giờ báo rõ, và server ghi lại mỗi
// đường dẫn 404 một lần mỗi giờ.
export default function NotFoundPage() {
  useEffect(() => {
    reportIncident({ type: "route-not-found", name: "NotFound", status: 404, path: window.location.pathname, message: document.referrer ? `from ${document.referrer}` : "" });
  }, []);
  return <StatusScreen kind="notFound" />;
}
