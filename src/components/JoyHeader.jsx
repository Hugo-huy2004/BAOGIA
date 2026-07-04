import React from "react";

export default function JoyHeader() {
  return (
    <header className="joy-header">
      <div className="joy-header-inner">
        <div className="joy-brand">
          <div className="joy-logo">JOY</div>
          <div className="joy-title">Ví JOY</div>
        </div>
        <button aria-label="menu" className="joy-menu">☰</button>
      </div>
    </header>
  );
}
