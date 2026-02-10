import React from 'react';

const Navbar = ({ onNavigate, currentPage }) => {
  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '75px',
    background: 'rgba(0, 0, 0, 0.98)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '2px solid #FFD700',
    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 50px',
    zIndex: 1000,
    margin: 0,
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '45px',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  };

  const getLinkStyle = (page) => ({
    color: currentPage === page ? '#FFD700' : '#999',
    textDecoration: 'none',
    fontSize: '1.05rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    padding: '12px 20px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    borderRadius: '6px',
    background: currentPage === page 
      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 200, 0, 0.15))' 
      : 'transparent',
    position: 'relative',
    overflow: 'hidden',
    border: currentPage === page ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
    fontFamily: '"Orbitron", "Rajdhani", sans-serif',
    textShadow: currentPage === page ? '0 0 10px rgba(255, 215, 0, 0.6)' : 'none',
  });

  const handleNavClick = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const logoContainerStyle = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
    paddingRight: '10px',
  };

  const logoTextStyle = {
    fontSize: '1.4rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    textAlign: 'right',
    filter: 'drop-shadow(0 2px 12px rgba(255, 215, 0, 0.6))',
    fontFamily: '"Orbitron", sans-serif',
  };

  const subTextStyle = {
    fontSize: '0.65rem',
    color: '#555',
    fontWeight: '500',
    letterSpacing: '2px',
    fontFamily: '"Rajdhani", sans-serif',
  };

  const yellowAccentStyle = {
    position: 'absolute',
    right: 0,
    bottom: '-10px',
    width: '180px',
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #FFD700, #FFA500)',
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
    zIndex: 1001,
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
    animation: 'glow 2s ease-in-out infinite',
  };

  return (
    <>
      <style>
        {`
          @keyframes glow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          nav a::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          nav a:hover::before {
            opacity: 1;
          }
        `}
      </style>
      <nav style={navStyle}>
        <ul style={navLinksStyle}>
          <li>
            <a
              style={getLinkStyle('home')}
              onClick={() => handleNavClick('home')}
              onMouseEnter={(e) => {
                e.target.style.color = '#FFD700';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = currentPage === 'home' ? '#FFD700' : '#e0e0e0';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Home
            </a>
          </li>
          <li>
            <a
              style={getLinkStyle('about')}
              onClick={() => handleNavClick('about')}
              onMouseEnter={(e) => {
                e.target.style.color = '#FFD700';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = currentPage === 'about' ? '#FFD700' : '#e0e0e0';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              About
            </a>
          </li>
          <li>
            <a
              style={getLinkStyle('exit-game')}
              onClick={() => handleNavClick('exit-game')}
              onMouseEnter={(e) => {
                e.target.style.color = '#FFD700';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = currentPage === 'exit-game' ? '#FFD700' : '#e0e0e0';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Exit Game
            </a>
          </li>
        </ul>

        <div style={logoContainerStyle}>
          <div style={logoTextStyle}>
            ⚽ GOAL COUNTER <br />
            <span style={subTextStyle}>LIVE SCORING SYSTEM</span>
          </div>
          <div style={yellowAccentStyle}></div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
