/**
 * Split point for framer-motion's animation features.
 *
 * `<LazyMotion features={domAnimation}>` with a direct import defeats its own
 * purpose: the feature bundle lands in whatever chunk names it, and App.jsx is
 * the entry, so every visitor parsed it before first paint. Passing a loader
 * function instead moves it to its own chunk, fetched right after mount.
 *
 * The `m` components render immediately either way — they just hold their
 * initial style until the features arrive, which is what LazyMotion is for.
 */
export { domAnimation as default } from "framer-motion";
