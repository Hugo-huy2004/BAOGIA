// Display names for the in-game header.
//
// The per-game *colours* used to live here as a second, divergent palette
// (dark neon gradients) while the intro screens used their own. They are now
// declared once as CSS custom properties on `.arcade-game--<id>` in
// game-intro.css, so the intro, chrome, board, pause and result screens all
// read a single source. Only the name is still JS.

const GAME_THEMES = {
  chess:     { name: "HugoChess Table 3D" },
  survivor:  { name: "Space Survivor" },
  "2048":    { name: "2048 Mega Fusion" },
  caro:      { name: "Caro 5 Arena" },
  snake:     { name: "Snake 3D Pro" },
};

export default GAME_THEMES;
