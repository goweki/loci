export const main = {
  backgroundColor: "#f6f9fc",
  padding: "10px 0",
};

export const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  padding: "45px",
};

export const text = {
  fontSize: "1rem", // 16px
  fontFamily: "'Open Sans', Helvetica, Arial, sans-serif",
  fontWeight: 300,
  color: "#2E2E2E", // slightly deeper for better readability
  lineHeight: 1.625, // ~26px
  letterSpacing: "0.01em",
};

export const highlight = {
  fontSize: "1rem",
  fontFamily: "'Merriweather', 'Georgia', serif", // serif for quote-like emphasis
  fontWeight: 400, // slightly bolder for emphasis
  lineHeight: 1.625,
  fontStyle: "italic",
  color: "#4A4A4A", // softer, but distinct
  backgroundColor: "rgba(240, 240, 240, 0.6)", // subtle background to set it apart
  padding: "0.25rem 0.5rem",
  borderLeft: "3px solid #d0d0d0", // optional quote bar
};

export const button = {
  backgroundColor: "#007ee6",
  borderRadius: "4px",
  color: "#fff",
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "210px",
  padding: "14px 7px",
};

export const anchor = {
  textDecoration: "underline",
};
