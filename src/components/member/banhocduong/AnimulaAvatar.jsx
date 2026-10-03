import React, { useState, useEffect } from 'react';
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
      aria-label="Hugo Animula AI Companion"
      title="Hugo Animula • Người bạn đồng hành tinh thần"
    >
      <BotAvatar
        type={type}
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

export default AnimulaAvatar;
