import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TREE_STAGES, TREE_BONUS_JOY, treeStage } from "../../../../shared/joyPrices.js";

// Cây nhiệm vụ mỗi ngày: làm xong càng nhiều nhiệm vụ, cây càng lớn.
// mầm → chồi → cây con → cây trẻ → cây lớn → cổ thụ, xong hết thì được thưởng.
//
// Vẽ bằng SVG + CSS, KHÔNG dùng video hay ảnh động nặng: một cái cây động
// bằng video là vài trăm KB tải mỗi lần mở ví, còn SVG thì vài KB và nét ở mọi
// mật độ điểm ảnh. Chuyển động do CSS lo nên máy yếu vẫn mượt, và tự tắt khi
// người dùng bật "giảm chuyển động".
export default function JoyTree({ claimed = 0, total = 0, bonusClaimed = false, busy = false, onClaimBonus }) {
  const { t } = useTranslation();
  const stage = treeStage(claimed, total);
  const complete = total > 0 && claimed >= total;
  const stageName = TREE_STAGES[stage];

  // Tán lá mọc dần: mỗi giai đoạn thêm một lớp, lớp mới nảy lên bằng animation.
  const canopy = useMemo(() => [
    { cx: 60, cy: 62, r: 15, from: 2 },
    { cx: 44, cy: 70, r: 13, from: 3 },
    { cx: 76, cy: 70, r: 13, from: 3 },
    { cx: 52, cy: 50, r: 12, from: 4 },
    { cx: 70, cy: 50, r: 12, from: 4 },
    { cx: 60, cy: 38, r: 13, from: 5 },
  ], []);

  return (
    <section className={`joy-tree is-${stageName}${complete ? " is-complete" : ""}`}>
      <div className="joy-tree__art" aria-hidden="true">
        <svg viewBox="0 0 120 120" role="img">
          {/* đất */}
          <ellipse className="joy-tree__soil" cx="60" cy="108" rx="34" ry="6" />

          {/* hạt: chỉ có ở giai đoạn 0 */}
          {stage === 0 && <ellipse className="joy-tree__seed" cx="60" cy="100" rx="7" ry="5.5" />}

          {/* thân cây cao dần theo giai đoạn */}
          {stage >= 1 && (
            <rect
              className="joy-tree__trunk"
              x="57" width="6" rx="3"
              y={104 - stage * 11}
              height={stage * 11}
            />
          )}

          {/* hai lá mầm ở giai đoạn 1 */}
          {stage === 1 && (
            <>
              <ellipse className="joy-tree__leaf" cx="50" cy="92" rx="9" ry="5" transform="rotate(-18 50 92)" />
              <ellipse className="joy-tree__leaf" cx="70" cy="92" rx="9" ry="5" transform="rotate(18 70 92)" />
            </>
          )}

          {/* tán lá */}
          {canopy.filter((leaf) => stage >= leaf.from).map((leaf, index) => (
            <circle
              key={`${leaf.cx}-${leaf.cy}`}
              className="joy-tree__canopy"
              cx={leaf.cx} cy={leaf.cy + (5 - stage) * 4} r={leaf.r}
              style={{ animationDelay: `${index * 70}ms` }}
            />
          ))}

          {/* cổ thụ: thêm quả JOY */}
          {complete && [
            { cx: 46, cy: 60 }, { cx: 74, cy: 58 }, { cx: 60, cy: 44 },
          ].map((fruit, index) => (
            <circle
              key={`${fruit.cx}`}
              className="joy-tree__fruit"
              cx={fruit.cx} cy={fruit.cy} r="4"
              style={{ animationDelay: `${240 + index * 120}ms` }}
            />
          ))}
        </svg>
      </div>

      <div className="joy-tree__body">
        <p className="joy-tree__stage">{t(`memberPortal.walletApp.tree.${stageName}`)}</p>
        <p className="joy-tree__progress">
          {t("memberPortal.walletApp.tree.progress", { claimed, total })}
        </p>

        {/* Mỗi nhiệm vụ là một đốt trên thân — thấy ngay còn thiếu mấy cái */}
        <div className="joy-tree__pips" aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <i key={index} className={index < claimed ? "is-on" : ""} />
          ))}
        </div>

        {complete ? (
          bonusClaimed ? (
            <p className="joy-tree__done">{t("memberPortal.walletApp.tree.bonusTaken", { amount: TREE_BONUS_JOY })}</p>
          ) : (
            <button type="button" className="joy-tree__cta" disabled={busy} onClick={onClaimBonus}>
              {t("memberPortal.walletApp.tree.claimBonus", { amount: TREE_BONUS_JOY })}
            </button>
          )
        ) : (
          <p className="joy-tree__hint">
            {t("memberPortal.walletApp.tree.keepGoing", { count: total - claimed, amount: TREE_BONUS_JOY })}
          </p>
        )}
      </div>
    </section>
  );
}
