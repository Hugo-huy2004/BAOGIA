import { useState } from "react";

/**
 * Sơ đồ Cơ sở Dữ liệu & Mối quan hệ Thực thể (Database Entity Relationship Diagram - ERD)
 * Chuẩn phong cách Apple Technical Whitepaper & Harvard Engineering Report:
 * - Thể hiện các Collections / Bảng cốt lõi trong MongoDB của Hugo Studio.
 * - Hiển thị chi tiết kiểu dữ liệu, khóa chính (PK), khóa ngoại (FK), chỉ mục (Index).
 * - Phân tích tính toàn vẹn dữ liệu, kiểm tra mối quan hệ (1:1, 1:N, N:M) và cơ chế Append-Only.
 * - Toàn bộ dữ liệu nội dung được truyền từ Data Layer (i18n) qua prop `data`.
 */
export default function DatabaseDiagram({ data }) {
  const entities = data?.entities || [];
  const relationships = data?.relationships || [];
  const [selectedEntity, setSelectedEntity] = useState(entities[0]?.id || "");
  const activeEntityId = selectedEntity || entities[0]?.id;
  const activeData = entities.find((e) => e.id === activeEntityId) || entities[0];

  if (!data || !entities.length || !activeData) return null;

  const {
    headerBadge = "Relational Schema & Architecture Model",
    headerTitle = "Sơ đồ Cơ sở Dữ liệu & Mối quan hệ Thực thể (ERD)",
    headerDesc = "",
    engineLabel = "MongoDB 7.x Engine",
    footerNote = "",
    uiLabels = {},
  } = data;

  const {
    fieldName = "Tên trường (Field)",
    dataType = "Kiểu dữ liệu (Type)",
    keyIndex = "Khóa & Chỉ mục (Key/Index)",
    businessMeaning = "Ý nghĩa nghiệp vụ",
    directRelations = "Mối quan hệ trực tiếp:",
    integrityTitle = "Ma trận Toàn vẹn Dữ liệu & Ràng buộc Quan hệ (Integrity Constraints):",
    collectionLabel = "Collection:",
  } = uiLabels;

  return (
    <div className="my-6 overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/10 bg-card/90 shadow-lg backdrop-blur-md">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/20 px-5 py-4">
        <div>
          {headerBadge && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400">
              <span className="material-symbols-outlined text-sm">schema</span>
              <span>{headerBadge}</span>
            </div>
          )}
          <h3 className="mt-2 text-base font-bold tracking-tight sm:text-lg text-foreground">
            {headerTitle}
          </h3>
          {headerDesc && (
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
              {headerDesc}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            {engineLabel}
          </span>
        </div>
      </div>

      {/* Entity Selector Pills */}
      <div className="flex flex-wrap gap-1.5 border-b border-border/60 bg-muted/10 p-3 sm:px-5">
        {entities.map((ent) => {
          const isSelected = activeEntityId === ent.id;
          return (
            <button
              key={ent.id}
              type="button"
              onClick={() => setSelectedEntity(ent.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-sky-500 text-white shadow-xs scale-[1.02]"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {ent.id === "UserProfile"
                  ? "person"
                  : ent.id === "JoyLedger"
                    ? "wallet"
                    : ent.id === "WebAuthnCredential"
                      ? "fingerprint"
                      : "table_chart"}
              </span>
              <span>{ent.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Entity Detail Card */}
      <div className="p-4 sm:p-6 space-y-6">
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.03] p-4.5 dark:bg-sky-500/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-500/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">database</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground font-mono">
                  db.{activeData.collection}
                </h4>
                <p className="text-xs text-muted-foreground">{activeData.role}</p>
              </div>
            </div>
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {collectionLabel} {activeData.collection}
            </span>
          </div>
          <p className="mt-2.5 text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
            {activeData.desc}
          </p>

          {/* Fields Table */}
          {activeData.fields?.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/80 bg-card shadow-xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-bold text-foreground">
                    <th className="px-3.5 py-2.5">{fieldName}</th>
                    <th className="px-3.5 py-2.5">{dataType}</th>
                    <th className="px-3.5 py-2.5">{keyIndex}</th>
                    <th className="px-3.5 py-2.5">{businessMeaning}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {activeData.fields.map((f) => (
                    <tr key={f.name} className="hover:bg-muted/20">
                      <td className="px-3.5 py-2 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {f.name}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-muted-foreground">{f.type}</td>
                      <td className="px-3.5 py-2">
                        {f.key ? (
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold font-mono ${
                              f.key.includes("PK")
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                                : f.key.includes("Unique")
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                                  : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25"
                            }`}
                          >
                            {f.key}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2 text-muted-foreground">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Relations belonging to this entity */}
          {activeData.relations?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-bold text-foreground self-center">
                {directRelations}
              </span>
              {activeData.relations.map((rel) => (
                <span
                  key={rel.target}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-2xs"
                >
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {rel.type}
                  </span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  <span className="font-semibold text-foreground">{rel.target}</span>
                  <span className="text-[11px] text-muted-foreground/80">({rel.desc})</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Global Relationship Matrix */}
        {relationships.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-sky-500">hub</span>
              <span>{integrityTitle}</span>
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {relationships.map((rel) => (
                <div
                  key={rel.from + rel.to}
                  className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-card/70 p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 text-xs font-mono">
                    <span className="font-bold text-foreground">{rel.from}</span>
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      {rel.cardinality}
                    </span>
                    <span className="font-bold text-foreground">{rel.to}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{rel.rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Guarantee */}
      {footerNote && (
        <div className="border-t border-border/80 bg-muted/20 px-5 py-3.5 text-xs text-muted-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-sky-500 text-base shrink-0">
            verified
          </span>
          <span>{footerNote}</span>
        </div>
      )}
    </div>
  );
}
