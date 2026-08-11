import React from "react";
import { C } from "../data/theme";

function Button({ children, variant = "secondary", onClick, icon: Icon }) {
  const styles = {
    primary: {
      background: C.accent,
      color: "#0E1420",
      border: `1px solid ${C.accent}`,
    },
    secondary: {
      background: "transparent",
      color: C.text,
      border: `1px solid ${C.border}`,
    },
  };

  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant],
        borderRadius: 8,
        padding: "9px 16px",
        fontSize: 13.5,
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 7,
      }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

export default Button;