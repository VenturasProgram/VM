import React from 'react';


export const WindowControls = () => {
  const handleMinimize = () => window.electronAPI.minimize();
  const handleClose = () => window.electronAPI.close();

  return (
    <div className="titleBar">

      <div className="buttonGroup_windowControls">
        <button onClick={handleMinimize} className="window-button">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect fill="white" width="10" height="1" x="1" y="6"/></svg>
        </button>
        
        <button onClick={handleClose} className="closeButton">
          <svg width="12" height="12" viewBox="0 0 12 12"><path fill="white" d="M10.5,1.5 l-9,9 M1.5,1.5 l9,9" stroke="white" strokeWidth="1.2"/></svg>
        </button>
      </div>
    </div>
  );
};



