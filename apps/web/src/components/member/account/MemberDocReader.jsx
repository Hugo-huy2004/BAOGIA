import LegalDoc from "../../legal/LegalDoc";

/** Văn bản pháp lý trong Cài đặt — cùng nội dung với /terms, /privacy-policy. */
export default function MemberDocReader({ docId }) {
  return <LegalDoc kind={docId === "privacy" ? "privacy" : "terms"} headingLevel={2} />;
}
