
import React, { useEffect, useState } from "react";
import "./Loader.css";

function Loader() {
  return (
    <div className="loader">
      <div
        className="logo-container"
        style={{ backgroundImage: `url(/logo.webp)` }}
      >
        {/* <img src="/assets/logo.webp"/> */}
        <div className="logo-text">
          <h1>Maua.</h1>
        </div>
      </div>
    </div>
  );
}

export default Loader;
