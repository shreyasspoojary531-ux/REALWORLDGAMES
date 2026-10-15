
export const ChessPiece = ({ type, color, className = '' }) => {
  const isWhite = color === 'w' || color === 'white';
  const fill = isWhite ? '#ffffff' : '#1e293b';
  const stroke = isWhite ? '#0f172a' : '#94a3b8';
  const accent = isWhite ? '#e2e8f0' : '#0f172a';

  switch (type.toLowerCase()) {
    case 'k':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.5 11.63V6M20 8h5" stroke={stroke} strokeLinejoin="miter" />
            <path
              d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
              fill={fill}
              stroke={stroke}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
            <path
              d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"
              fill={fill}
              stroke={stroke}
            />
            <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke={stroke} />
          </g>
        </svg>
      );
    case 'q':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm17 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            <path
              d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12z"
              strokeLinecap="butt"
            />
            <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 18 1 23 0 0 0 1.5-1 0-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" strokeLinecap="butt" />
            <path d="M11 38.5a35 35 0 0 0 23 0" fill="none" stroke={stroke} />
            <circle cx="6" cy="12" r="2" fill={accent} />
            <circle cx="14" cy="9" r="2" fill={accent} />
            <circle cx="22.5" cy="8" r="2" fill={accent} />
            <circle cx="31" cy="9" r="2" fill={accent} />
            <circle cx="39" cy="12" r="2" fill={accent} />
          </g>
        </svg>
      );
    case 'r':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5c0-4 1-5.5 1.5-8.5h14c.5 3 1.5 4.5 1.5 8.5H14zM11 20l3-3h17l3 3H11zM12 17V9h4v4h4V9h5v4h4V9h4v8H12z"
              strokeLinecap="butt"
            />
            <path d="M14 29.5a20 20 0 0 0 17 0" fill="none" stroke={stroke} strokeLinejoin="miter" />
          </g>
        </svg>
      );
    case 'b':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <g fill={fill}>
              <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z" />
              <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
              <circle cx="22.5" cy="8.5" r="2.5" fill={accent} stroke={stroke} />
            </g>
            <path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-2.5-2.5h5" stroke={stroke} strokeLinejoin="miter" />
          </g>
        </svg>
      );
    case 'n':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
              fill={fill}
              stroke={stroke}
            />
            <path
              d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.06 1.2-1 1-1 0-2-.5-2-2.5 0-.5 1-1.5 1.5-1.5-1-1.5-2.5-2.5-1.5-4 1-1.5 2.5-.5 3.5-2 1.5-2 2-3 2.5-5 1-4 4.5-5.5 10-6 0 0 3.5 1.5 5 4 1 2 2 3.5 1 6.5-.5 1.5-3 2-3 2.5z"
              fill={fill}
              stroke={stroke}
            />
            <circle cx="9.5" cy="25.5" r="1" fill={accent} stroke={stroke} />
            <path d="M15 15.5c4.5 1.5 6.5 3.5 5.5 7.5" stroke={stroke} />
          </g>
        </svg>
      );
    case 'p':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
};
