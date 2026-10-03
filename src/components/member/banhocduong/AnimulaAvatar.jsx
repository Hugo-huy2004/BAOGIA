import { useState, useEffect } from "react";
import { BotAvatar } from 'bot-avatars';
import { sensory } from '../../../lib/sensory';

/**
 * AnimulaAvatar: Latin Mind & Soul AI Companion Avatar
 * "Animula" (Latin: little gentle soul).
 * Built with bot-avatars 2D canvas 3D-lit plush faux-fur rig.
 */
export function AnimulaAvatar({
  size = 40,
  type = 'clover',
  state = 'default',
  face = 'mouth',
  shading = 'fabric',
  interactive = true,
  className = '',
  hat = 'none',
  glasses = 'none',
  onClick,
  color,
  ...motionProps
}) {
  const [internalState, setInternalState] = useState(state);

  useEffect(() => {
    setInternalState(state);
  }, [state]);

  const handleClick = (e) => {
    try {
      sensory.pop();
      sensory.vibrate('light');
    } catch {
      // Ignore
    }
    if (onClick) onClick(e);
  };

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center justify-center shrink-0 select-none cursor-pointer transition-transform active:scale-90 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-hidden="true"
    >
      <BotAvatar
        type={type}
        color={color}
        {...motionProps}
        size={size}
        state={internalState}
        face={face}
        shading={shading}
        hat={hat}
        glasses={glasses}
        interactive={interactive}
        furLength={1.1}
        furFuzz={0.8}
        furCurl={0.6}
        jumpHeight={22}
      />
    </div>
  );
}

/**
 * Avatar của một nhân vật đồng hành: hình dáng, màu, mũ, kính lấy từ hồ sơ
 * (constants/companions.js); `motion` (brain/companionMind.avatarMotion) cho nó
 * nhún/chậm/nhạt màu theo cảm xúc vì bot-avatars không có nét mặt biểu cảm.
 */
export function CompanionAvatar({ companion, size = 32, motion = null, ...rest }) {
  return (
    <AnimulaAvatar
      size={size}
      type={companion.type}
      color={companion.color}
      hat={companion.hat || "none"}
      glasses={companion.glasses || "none"}
      {...(motion || {})}
      {...rest}
    />
  );
}

export default AnimulaAvatar;
