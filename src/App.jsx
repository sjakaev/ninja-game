import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

const APP_VERSION = "1.7.11";

// Get join code from URL if present
const getJoinCodeFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('join');
};

// Generate invite link
const getInviteLink = (code) => {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?join=${code}`;
};

// Simplified Ninja Character - smoother animations
const AnimatedChaser = ({ x, y, size, opacity, ability, isClone, vx, vy, onSurface, animTime, isCrouching, cursorX, cursorY }) => {
  // Use animTime for smooth animation (passed from game loop)
  const speed = Math.sqrt((vx || 0) ** 2 + (vy || 0) ** 2);
  const isMoving = speed > 0.5;
  const isInAir = !onSurface;

  // Animation cycles based on smooth time
  const t = animTime * 0.01;
  const runPhase = Math.sin(t * 8) * (isMoving ? 1 : 0);

  const bodyColor = isClone ? '#ec4899' : '#dc2626';
  const headColor = '#fbbf24';

  // Calculate facing direction from velocity
  const facingRight = (vx || 0) >= 0;

  // Calculate eye direction to cursor
  const eyeOffsetX = cursorX !== undefined ? Math.max(-2, Math.min(2, (cursorX - x) / 50)) : 0;
  const eyeOffsetY = cursorY !== undefined ? Math.max(-1.5, Math.min(1.5, (cursorY - y) / 50)) : 0;

  // Crouching animation - squished body, wide eyes
  if (isCrouching && onSurface) {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: x,
          top: y,
          transform: `translate(-50%, -50%)`,
          opacity,
          width: size * 2,
          height: size * 2,
        }}
      >
        <svg viewBox="0 0 100 100" width={size * 2} height={size * 2}>
          {/* Shadow - wider when crouching */}
          <ellipse cx="50" cy="88" rx="22" ry="5" fill="rgba(0,0,0,0.4)" />

          {/* Squished legs - spread out */}
          <ellipse cx="35" cy="82" rx="10" ry="6" fill={bodyColor} />
          <ellipse cx="65" cy="82" rx="10" ry="6" fill={bodyColor} />
          <ellipse cx="35" cy="85" rx="7" ry="4" fill="#1f2937" />
          <ellipse cx="65" cy="85" rx="7" ry="4" fill="#1f2937" />

          {/* Squished body - very wide and short */}
          <ellipse cx="50" cy="72" rx="22" ry="12" fill={bodyColor} />
          <rect x="30" y="72" width="40" height="4" rx="2" fill="#1f2937" />

          {/* Arms sticking out to sides */}
          <ellipse cx="22" cy="70" rx="8" ry="6" fill={bodyColor} />
          <circle cx="16" cy="72" r="5" fill={headColor} />
          <ellipse cx="78" cy="70" rx="8" ry="6" fill={bodyColor} />
          <circle cx="84" cy="72" r="5" fill={headColor} />

          {/* Big squished head */}
          <ellipse cx="50" cy="52" rx="20" ry="14" fill={headColor} stroke="#92400e" strokeWidth="2" />

          {/* Headband - same as standing */}
          <rect x="30" y="48" width="40" height="6" fill={bodyColor} />
          <rect x="70" y="47" width="10" height="4" rx="2" fill={bodyColor} />

          {/* Big worried eyes that follow cursor */}
          <ellipse cx="42" cy="48" rx="6" ry="7" fill="white" />
          <ellipse cx="58" cy="48" rx="6" ry="7" fill="white" />
          {/* Pupils following cursor */}
          <circle cx={42 + eyeOffsetX * 1.5} cy={49 + eyeOffsetY} r="3" fill="black" />
          <circle cx={58 + eyeOffsetX * 1.5} cy={49 + eyeOffsetY} r="3" fill="black" />
          {/* Eye shine */}
          <circle cx={40 + eyeOffsetX} cy={46 + eyeOffsetY * 0.5} r="1.5" fill="white" />
          <circle cx={56 + eyeOffsetX} cy={46 + eyeOffsetY * 0.5} r="1.5" fill="white" />

          {/* Mouth */}
          <path d="M 45 61 Q 50 59 55 61" stroke="black" strokeWidth="2" fill="none" />
        </svg>
      </div>
    );
  }

  // Wall slide animation
  const isOnWall = onSurface === 'left_wall' || onSurface === 'right_wall';
  const wallSide = onSurface === 'left_wall' ? 1 : -1; // 1 = facing right (on left wall), -1 = facing left

  if (isOnWall) {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scaleX(${wallSide})`,
          opacity,
          width: size * 2,
          height: size * 2,
        }}
      >
        <svg viewBox="0 0 100 100" width={size * 2} height={size * 2}>
          {/* Body pressed against wall */}
          <rect x="38" y="35" width="24" height="30" rx="6" fill={bodyColor} />
          <rect x="38" y="50" width="24" height="4" fill="#1f2937" />

          {/* Legs bent - ready to push off */}
          <rect x="40" y="62" width="8" height="18" rx="4" fill={bodyColor} transform="rotate(-20, 44, 62)" />
          <rect x="52" y="62" width="8" height="18" rx="4" fill={bodyColor} transform="rotate(10, 56, 62)" />
          <ellipse cx="38" cy="78" rx="6" ry="4" fill="#1f2937" />
          <ellipse cx="58" cy="80" rx="6" ry="4" fill="#1f2937" />

          {/* Arms grabbing wall */}
          <rect x="28" y="38" width="8" height="14" rx="4" fill={bodyColor} transform="rotate(-30, 32, 38)" />
          <circle cx="26" cy="36" r="5" fill={headColor} />
          <rect x="28" y="52" width="8" height="14" rx="4" fill={bodyColor} transform="rotate(-20, 32, 52)" />
          <circle cx="26" cy="64" r="5" fill={headColor} />

          {/* Head looking outward */}
          <circle cx="50" cy="24" r="14" fill={headColor} stroke="#92400e" strokeWidth="2" />

          {/* Headband */}
          <rect x="36" y="20" width="28" height="6" fill={bodyColor} />
          <rect x="64" y="19" width="12" height="4" rx="2" fill={bodyColor} transform="rotate(15, 64, 21)" />

          {/* Eyes looking out */}
          <circle cx="52" cy="22" r="4" fill="white" />
          <circle cx="62" cy="22" r="4" fill="white" />
          <circle cx="54" cy="23" r="2" fill="black" />
          <circle cx="64" cy="23" r="2" fill="black" />

          {/* Mouth */}
          <path d="M 52 30 Q 57 28 62 30" stroke="black" strokeWidth="2" fill="none" />
        </svg>
      </div>
    );
  }

  // Leg animation
  const leftLegAngle = isInAir ? -20 : runPhase * 35;
  const rightLegAngle = isInAir ? 20 : -runPhase * 35;

  // Arm animation
  const leftArmAngle = isInAir ? -45 : -runPhase * 25;
  const rightArmAngle = isInAir ? 45 : runPhase * 25;

  // Body bob when running
  const bodyBob = isMoving && !isInAir ? Math.abs(Math.sin(t * 16)) * 2 : 0;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scaleX(${facingRight ? 1 : -1})`,
        opacity,
        width: size * 2,
        height: size * 2,
      }}
    >
      <svg viewBox="0 0 100 100" width={size * 2} height={size * 2}>
        {/* Shadow */}
        <ellipse cx="50" cy="92" rx={isInAir ? 8 : 15} ry="4" fill="rgba(0,0,0,0.3)" />

        {/* Left Leg */}
        <g transform={`rotate(${leftLegAngle}, 42, 60)`}>
          <rect x="38" y="60" width="8" height="22" rx="4" fill={bodyColor} />
          <ellipse cx="42" cy="84" rx="6" ry="4" fill="#1f2937" />
        </g>

        {/* Right Leg */}
        <g transform={`rotate(${rightLegAngle}, 58, 60)`}>
          <rect x="54" y="60" width="8" height="22" rx="4" fill={bodyColor} />
          <ellipse cx="58" cy="84" rx="6" ry="4" fill="#1f2937" />
        </g>

        {/* Body */}
        <rect x="35" y={38 - bodyBob} width="30" height="28" rx="6" fill={bodyColor} />
        <rect x="35" y={52 - bodyBob} width="30" height="4" fill="#1f2937" />

        {/* Left Arm */}
        <g transform={`rotate(${leftArmAngle}, 35, 42)`}>
          <rect x="25" y={40 - bodyBob} width="8" height="18" rx="4" fill={bodyColor} />
          <circle cx="29" cy={60 - bodyBob} r="5" fill={headColor} />
        </g>

        {/* Right Arm */}
        <g transform={`rotate(${rightArmAngle}, 65, 42)`}>
          <rect x="67" y={40 - bodyBob} width="8" height="18" rx="4" fill={bodyColor} />
          <circle cx="71" cy={60 - bodyBob} r="5" fill={headColor} />
        </g>

        {/* Head */}
        <circle cx="50" cy={28 - bodyBob} r="16" fill={headColor} stroke="#92400e" strokeWidth="2" />

        {/* Headband */}
        <rect x="34" y={24 - bodyBob} width="32" height="6" fill={bodyColor} />
        <rect x="66" y={23 - bodyBob} width="10" height="4" rx="2" fill={bodyColor}
          transform={`rotate(${isMoving ? Math.sin(t * 6) * 20 : 0}, 66, ${25 - bodyBob})`} />

        {/* Eyes */}
        <circle cx="44" cy={26 - bodyBob} r="4" fill="white" />
        <circle cx="56" cy={26 - bodyBob} r="4" fill="white" />
        <circle cx={45 + (isMoving ? 1 : 0)} cy={27 - bodyBob} r="2" fill="black" />
        <circle cx={57 + (isMoving ? 1 : 0)} cy={27 - bodyBob} r="2" fill="black" />

        {/* Mouth */}
        <path d={`M 45 ${34 - bodyBob} Q 50 ${ability ? 38 : 32 - bodyBob} 55 ${34 - bodyBob}`}
          stroke="black" strokeWidth="2" fill="none" />

        {/* Ability glow */}
        {ability && (
          <circle cx="50" cy="50" r="45" fill="none" stroke={bodyColor} strokeWidth="3" opacity="0.5">
            <animate attributeName="r" values="40;50;40" dur="0.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="0.5s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
};

export default function NinjaGame() {
  // Game mode: 'menu', 'mode-select', 'singleplayer', 'host', 'client', 'playing'
  const [gameState, setGameState] = useState('menu');
  const [gameMode, setGameMode] = useState(null); // 'single' or 'multi'
  const [role, setRole] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [peer, setPeer] = useState(null);
  const [isPeerReady, setIsPeerReady] = useState(false);
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [playerName, setPlayerName] = useState('');

  // Game state
  const [mousePos, setMousePos] = useState({ x: 450, y: 300 });
  const [chaser, setChaser] = useState({
    x: 450, y: 550, vx: 0, vy: 0,
    onSurface: 'ground', rotation: 0, scale: 1
  });
  const [clones, setClones] = useState([]);
  const [shockwaves, setShockwaves] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [particles, setParticles] = useState([]);
  const [trails, setTrails] = useState([]);
  const [currentAbility, setCurrentAbility] = useState(null);
  const [abilityTimer, setAbilityTimer] = useState(0);
  const [timeScale, setTimeScale] = useState(1);
  const [animTime, setAnimTime] = useState(0);
  const [abilityCooldowns, setAbilityCooldowns] = useState({});
  const [keysPressed, setKeysPressed] = useState({});
  const [isCrouching, setIsCrouching] = useState(false); // Is ninja crouching (down key)
  const [cursorLines, setCursorLines] = useState([]); // Physical lines drawn by cursor
  const [isDrawing, setIsDrawing] = useState(false); // Is mouse button pressed
  const [linkCopied, setLinkCopied] = useState(false); // Show "link copied" message

  const gameAreaRef = useRef(null);
  const animationRef = useRef(null);
  const connRef = useRef(null);
  const lastTime = useRef(Date.now());
  const lastAbilityTime = useRef(0);
  const mousePosRef = useRef({ x: 450, y: 300 });
  const chaserRef = useRef({ x: 450, y: 550, vx: 0, vy: 0, onSurface: 'ground', rotation: 0, scale: 1 });
  const keysPressedRef = useRef({});
  const lastDrawPos = useRef(null); // Last position where line segment was added
  const isDrawingRef = useRef(false);
  const currentAbilityRef = useRef(null);
  const abilityTimerRef = useRef(0);
  const scoreRef = useRef(0);
  const cursorLinesRef = useRef([]);
  const roleRef = useRef(null);
  const gameOverRef = useRef(false);
  const bunnyHopRef = useRef({ streak: 0, lastLandTime: 0 }); // Bunny hop momentum

  // Dynamic game size for fullscreen
  const [gameSize, setGameSize] = useState({ width: 900, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      setGameSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const GAME_WIDTH = gameSize.width;
  const GAME_HEIGHT = gameSize.height;
  const GRAVITY = 0.6;
  const CHASER_SIZE = 45;
  const CURSOR_SIZE = 24;
  const LINE_THICKNESS = 8; // Thickness of cursor lines for collision

  // Check collision between circle and line segment
  const checkLineCollision = useCallback((cx, cy, radius, line) => {
    const { x1, y1, x2, y2 } = line;

    // Vector from line start to end
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) return null; // Zero length line

    // Project circle center onto line
    const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lenSq));

    // Closest point on line segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    // Distance from circle center to closest point
    const distX = cx - closestX;
    const distY = cy - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);

    // Check if collision
    if (dist < radius + LINE_THICKNESS / 2) {
      // Calculate line normal (perpendicular to line)
      const lineLen = Math.sqrt(lenSq);
      const normalX = -dy / lineLen;
      const normalY = dx / lineLen;

      // Make sure normal points away from circle
      const dotProduct = normalX * distX + normalY * distY;
      const finalNormalX = dotProduct > 0 ? normalX : -normalX;
      const finalNormalY = dotProduct > 0 ? normalY : -normalY;

      return {
        normalX: finalNormalX,
        normalY: finalNormalY,
        penetration: radius + LINE_THICKNESS / 2 - dist,
        closestX,
        closestY
      };
    }

    return null;
  }, []);

  // Full abilities for single player
  const abilitiesFull = {
    SUPER_JUMP: { name: 'Супер-прыжок', cooldown: 1250, duration: 600, color: 'bg-blue-500', emoji: '🚀' },
    DASH: { name: 'Рывок', cooldown: 3000, duration: 400, color: 'bg-red-500', emoji: '⚡' },
    TELEPORT: { name: 'Телепорт', cooldown: 4500, duration: 200, color: 'bg-purple-600', emoji: '🌀' },
    GROW: { name: 'Гигант', cooldown: 5000, duration: 2500, color: 'bg-yellow-500', emoji: '💪' },
    CLONE: { name: 'Клоны', cooldown: 6000, duration: 4000, color: 'bg-pink-500', emoji: '👥' },
    VORTEX: { name: 'Вихрь', cooldown: 4000, duration: 2000, color: 'bg-cyan-500', emoji: '🌪️' },
    GHOST: { name: 'Призрак', cooldown: 5500, duration: 3000, color: 'bg-gray-400', emoji: '👻' },
    SHOCKWAVE: { name: 'Волна', cooldown: 3500, duration: 800, color: 'bg-indigo-600', emoji: '💥' },
    TIME_SLOW: { name: 'Хронос', cooldown: 7000, duration: 2000, color: 'bg-orange-500', emoji: '⏱️' },
    MAGNET: { name: 'Магнит', cooldown: 4000, duration: 2500, color: 'bg-emerald-500', emoji: '🧲' }
  };

  // Ability keys mapping (1-9 on keyboard) - no TELEPORT
  const abilityKeys = ['SUPER_JUMP', 'DASH', 'GROW', 'CLONE', 'VORTEX', 'GHOST', 'SHOCKWAVE', 'TIME_SLOW', 'MAGNET'];

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Initialize PeerJS for multiplayer
  useEffect(() => {
    if (gameMode !== 'multi') return;

    const newPeer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    newPeer.on('open', (id) => {
      console.log('Peer ID:', id);
      setIsPeerReady(true);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      setIsPeerReady(false);
    });

    setPeer(newPeer);

    return () => {
      if (newPeer) newPeer.destroy();
      setIsPeerReady(false);
    };
  }, [gameMode]);

  // Auto-join from URL
  useEffect(() => {
    const joinCode = getJoinCodeFromURL();
    if (joinCode && gameState === 'menu') {
      setInputRoomCode(joinCode);
      setGameMode('multi');
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [gameState]);

  // Auto-connect when we have peer ready and join code from URL
  useEffect(() => {
    if (isPeerReady && peer && inputRoomCode && gameMode === 'multi' && gameState === 'menu') {
      if (!playerName.trim()) {
        setPlayerName('Игрок');
      }
      setGameState('client');

      console.log('Connecting to host:', inputRoomCode);
      const conn = peer.connect(inputRoomCode);
      let connected = false;

      // Timeout for connection - 10 seconds
      const timeout = setTimeout(() => {
        if (!connected) {
          console.error('Connection timeout');
          alert('Не удалось подключиться! Время ожидания истекло. Возможно, хост закрыл комнату.');
          conn.close();
          setGameState('menu');
          setInputRoomCode('');
        }
      }, 10000);

      conn.on('open', () => {
        connected = true;
        clearTimeout(timeout);
        console.log('Connected to host');
        setIsConnected(true);
        setConnection(conn);
        connRef.current = conn;

        conn.send({ type: 'join', playerName: playerName || 'Игрок' });

        conn.on('data', (data) => {
          handleReceivedData(data);
        });

        conn.on('close', () => {
          setIsConnected(false);
          alert('Соединение потеряно!');
          resetToMenu();
        });
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        console.error('Connection error:', err);
        alert('Не удалось подключиться! Комната не найдена.');
        setGameState('menu');
        setInputRoomCode('');
      });

      setConnection(conn);

      return () => clearTimeout(timeout);
    }
  }, [isPeerReady, peer, inputRoomCode, gameMode, gameState, playerName]);

  // Particles
  const createParticles = useCallback((x, y, color, count = 15) => {
    const newParticles = Array.from({ length: count }, () => ({
      id: Math.random(),
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1,
      color,
      size: 2 + Math.random() * 4
    }));
    setParticles(prev => [...prev.slice(-100), ...newParticles]);
  }, []);

  const createTrail = useCallback((x, y, size) => {
    setTrails(prev => [...prev.slice(-20), {
      id: Math.random(),
      x, y, size,
      life: 1,
      createdAt: Date.now()
    }]);
  }, []);

  const selectRandomAbility = useCallback(() => {
    const now = Date.now();
    if (now - lastAbilityTime.current < 2000) return null;

    const abilityKeys = Object.keys(abilitiesFull);
    const selected = abilityKeys[Math.floor(Math.random() * abilityKeys.length)];

    lastAbilityTime.current = now;
    return selected;
  }, []);

  // Host game (multiplayer)
  const hostGame = () => {
    if (!playerName.trim()) {
      alert('Введи своё имя!');
      return;
    }

    const code = generateRoomCode();
    setRoomCode(code);
    setGameState('host');

    if (peer) {
      peer.destroy();
    }

    const hostPeer = new Peer(code, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    hostPeer.on('open', (id) => {
      console.log('Host Peer ID:', id);
    });

    hostPeer.on('error', (err) => {
      console.error('Host peer error:', err);
      if (err.type === 'unavailable-id') {
        alert('Этот код уже занят, попробуй ещё раз!');
        resetToMenu();
      }
    });

    setPeer(hostPeer);

    hostPeer.on('connection', (conn) => {
      console.log('Player connected');
      conn.on('open', () => {
        setIsConnected(true);
        setConnection(conn);
        connRef.current = conn;

        conn.send({ type: 'welcome', hostName: playerName });

        conn.on('data', (data) => {
          handleReceivedData(data);
        });

        conn.on('close', () => {
          setIsConnected(false);
          alert('Соперник отключился!');
          resetToMenu();
        });
      });
    });
  };

  // Join game (multiplayer)
  const joinGame = () => {
    if (!playerName.trim()) {
      alert('Введи своё имя!');
      return;
    }

    if (!inputRoomCode.trim()) {
      alert('Введи код комнаты!');
      return;
    }

    setGameState('client');

    const conn = peer.connect(inputRoomCode);

    conn.on('open', () => {
      console.log('Connected to host');
      setIsConnected(true);
      setConnection(conn);
      connRef.current = conn;

      conn.send({ type: 'join', playerName });

      conn.on('data', (data) => {
        handleReceivedData(data);
      });

      conn.on('close', () => {
        setIsConnected(false);
        alert('Соединение потеряно!');
        resetToMenu();
      });
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      alert('Не удалось подключиться! Проверь код комнаты.');
      setGameState('mode-select');
    });

    setConnection(conn);
  };

  // Handle received data (multiplayer) - uses roleRef to avoid stale closures
  const handleReceivedData = (data) => {
    const currentRole = roleRef.current;
    switch (data.type) {
      case 'welcome':
        setOpponentName(data.hostName);
        break;
      case 'join':
        setOpponentName(data.playerName);
        break;
      case 'selectRole':
        const newRole = data.role === 'ninja' ? 'cursor' : 'ninja';
        roleRef.current = newRole;
        setRole(newRole);
        setGameState('playing');
        break;
      case 'startGame':
        setGameState('playing');
        break;
      case 'mouseMove':
        if (currentRole === 'ninja') {
          mousePosRef.current = { x: data.x, y: data.y };
          setMousePos({ x: data.x, y: data.y });
        }
        break;
      case 'ninjaMove':
        if (currentRole === 'cursor') {
          setChaser(data.chaser);
          chaserRef.current = data.chaser;
          if (data.ability) {
            setCurrentAbility(data.ability);
            currentAbilityRef.current = data.ability;
          }
        }
        break;
      case 'gameOver':
        setGameOver(true);
        setScore(data.score);
        break;
      case 'ability':
        setCurrentAbility(data.ability);
        if (abilitiesFull[data.ability]) {
          setAbilityTimer(abilitiesFull[data.ability].duration);
        }
        break;
      case 'pullCursor':
        // Vortex/Magnet pulling the cursor
        if (currentRole === 'cursor') {
          setMousePos(m => {
            const newPos = {
              x: Math.max(CURSOR_SIZE, Math.min(GAME_WIDTH - CURSOR_SIZE, m.x + data.pullX)),
              y: Math.max(CURSOR_SIZE, Math.min(GAME_HEIGHT - CURSOR_SIZE, m.y + data.pullY))
            };
            mousePosRef.current = newPos;
            return newPos;
          });
        }
        break;
      case 'timeSlow':
        setTimeScale(data.scale);
        break;
      case 'cursorLine':
        // Receive line drawn by cursor player
        if (currentRole === 'ninja') {
          setCursorLines(prev => {
            const newLines = [...prev.slice(-50), data.line];
            cursorLinesRef.current = newLines;
            return newLines;
          });
        }
        break;
    }
  };

  const selectRole = (selectedRole) => {
    roleRef.current = selectedRole;
    setRole(selectedRole);
    setScore(0);
    setGameOver(false);
    setAnimTime(0);
    setAbilityCooldowns({});
    setCurrentAbility(null);
    setTimeScale(1);
    setClones([]);
    setShockwaves([]);
    setParticles([]);
    setTrails([]);
    setCursorLines([]);
    // Reset positions
    const initialChaser = { x: 450, y: 550, vx: 0, vy: 0, onSurface: 'ground', rotation: 0, scale: 1 };
    const initialMouse = { x: 450, y: 300 };
    setChaser(initialChaser);
    setMousePos(initialMouse);
    chaserRef.current = initialChaser;
    mousePosRef.current = initialMouse;
    keysPressedRef.current = {};
    lastTime.current = Date.now();
    if (connRef.current) {
      connRef.current.send({ type: 'selectRole', role: selectedRole });
    }
    setGameState('playing');
  };

  const sendData = (data) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send(data);
    }
  };

  // Show single player role selection
  const startSinglePlayer = () => {
    setGameMode('single');
    setGameState('singleplayer-select');
  };

  // Actually start single player with selected role
  const startSinglePlayerWithRole = (selectedRole) => {
    setRole(selectedRole);
    setGameState('singleplayer');
    setScore(0);
    setGameOver(false);
    const initialChaser = { x: 450, y: 550, vx: 0, vy: 0, onSurface: 'ground', rotation: 0, scale: 1 };
    const initialMouse = { x: 450, y: 300 };
    setChaser(initialChaser);
    setMousePos(initialMouse);
    chaserRef.current = initialChaser;
    mousePosRef.current = initialMouse;
    keysPressedRef.current = {};
    setClones([]);
    setShockwaves([]);
    setParticles([]);
    setTrails([]);
    setCurrentAbility(null);
    setAbilityCooldowns({});
    setTimeScale(1);
    setAnimTime(0);
    lastAbilityTime.current = 0;
    lastTime.current = Date.now();
  };

  // Execute ability (single player)
  const executeAbility = useCallback((ability, chaserPos) => {
    const dx = mousePos.x - chaserPos.x;
    const dy = mousePos.y - chaserPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    createParticles(chaserPos.x, chaserPos.y, '#ef4444', 25);

    switch(ability) {
      case 'SUPER_JUMP':
        return { ...chaserPos, vy: -18, vx: Math.cos(angle) * 8, onSurface: null };

      case 'DASH':
        return { ...chaserPos, vx: Math.cos(angle) * 35, vy: Math.sin(angle) * 35 };

      case 'TELEPORT': {
        const teleportDist = 100 + Math.random() * 80;
        const teleportAngle = angle + Math.PI + (Math.random() - 0.5) * 0.8;
        return {
          ...chaserPos,
          x: Math.max(CHASER_SIZE, Math.min(GAME_WIDTH - CHASER_SIZE, mousePos.x + Math.cos(teleportAngle) * teleportDist)),
          y: Math.max(CHASER_SIZE, Math.min(GAME_HEIGHT - CHASER_SIZE, mousePos.y + Math.sin(teleportAngle) * teleportDist)),
          vx: Math.cos(angle) * 5,
          vy: Math.sin(angle) * 5,
          onSurface: null
        };
      }

      case 'CLONE': {
        const newClones = Array.from({ length: 4 }, (_, i) => {
          const cloneAngle = (Math.PI * 2 / 4) * i;
          return {
            id: Math.random(),
            x: chaserPos.x + Math.cos(cloneAngle) * 80,
            y: chaserPos.y + Math.sin(cloneAngle) * 80,
            vx: Math.cos(cloneAngle) * 3,
            vy: Math.sin(cloneAngle) * 3,
            life: 4000,
            createdAt: Date.now(),
            onSurface: null
          };
        });
        setClones(prev => [...prev, ...newClones]);
        return chaserPos;
      }

      case 'SHOCKWAVE': {
        const newWaves = Array.from({ length: 3 }, (_, i) => ({
          id: Math.random(),
          x: chaserPos.x,
          y: chaserPos.y,
          radius: 20 + i * 40,
          maxRadius: 250,
          speed: 10,
          createdAt: Date.now()
        }));
        setShockwaves(prev => [...prev, ...newWaves]);
        return { ...chaserPos, vx: 0, vy: 0 };
      }

      case 'TIME_SLOW':
        setTimeScale(0.4);
        setTimeout(() => setTimeScale(1), abilitiesFull.TIME_SLOW.duration);
        return chaserPos;

      default:
        return chaserPos;
    }
  }, [mousePos, createParticles]);

  // Mouse movement and drawing
  useEffect(() => {
    if (gameState !== 'singleplayer' && gameState !== 'playing') return;
    if (gameMode === 'multi' && role !== 'cursor') return;

    const handleMouseMove = (e) => {
      // Don't update cursor position after game over
      if (gameAreaRef.current && !gameOverRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        let newX = Math.max(0, Math.min(GAME_WIDTH, e.clientX - rect.left));
        let newY = Math.max(0, Math.min(GAME_HEIGHT, e.clientY - rect.top));

        // Apply time scale for single player
        if (gameMode === 'single' && timeScale < 1) {
          const currentPos = mousePos;
          newX = currentPos.x + (newX - currentPos.x) * timeScale;
          newY = currentPos.y + (newY - currentPos.y) * timeScale;
        }

        setMousePos({ x: newX, y: newY });
        mousePosRef.current = { x: newX, y: newY };
        if (gameMode === 'multi') {
          sendData({ type: 'mouseMove', x: newX, y: newY });
        }

        // Draw lines when mouse is pressed
        if (isDrawingRef.current && lastDrawPos.current) {
          const dx = newX - lastDrawPos.current.x;
          const dy = newY - lastDrawPos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Add line segment if moved enough distance
          if (dist > 10) {
            const newLine = {
              id: Math.random(),
              x1: lastDrawPos.current.x,
              y1: lastDrawPos.current.y,
              x2: newX,
              y2: newY,
              createdAt: Date.now()
            };
            setCursorLines(prev => [...prev.slice(-50), newLine]); // Max 50 segments
            if (gameMode === 'multi') {
              sendData({ type: 'cursorLine', line: newLine });
            }
            lastDrawPos.current = { x: newX, y: newY };
          }
        }
      }
    };

    const handleMouseDown = (e) => {
      // Only cursor can draw lines, not ninja
      if (gameAreaRef.current && !gameOver && role !== 'ninja') {
        const rect = gameAreaRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x >= 0 && x <= GAME_WIDTH && y >= 0 && y <= GAME_HEIGHT) {
          isDrawingRef.current = true;
          setIsDrawing(true);
          lastDrawPos.current = { x, y };
        }
      }
    };

    const handleMouseUp = () => {
      isDrawingRef.current = false;
      setIsDrawing(false);
      lastDrawPos.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, gameMode, role, gameOver, timeScale, mousePos]);

  // Keyboard controls (single player ninja - movement + abilities)
  useEffect(() => {
    if (gameState !== 'singleplayer' || role !== 'ninja') return;

    const handleKeyDown = (e) => {
      // Movement keys - update ref directly for instant response
      if (['w', 'W', 'ц', 'Ц', 'ArrowUp'].includes(e.key)) {
        keysPressedRef.current.up = true;
      }
      if (['s', 'S', 'ы', 'Ы', 'ArrowDown'].includes(e.key)) {
        keysPressedRef.current.down = true;
        setIsCrouching(true);
      }
      if (['a', 'A', 'ф', 'Ф', 'ArrowLeft'].includes(e.key)) {
        keysPressedRef.current.left = true;
      }
      if (['d', 'D', 'в', 'В', 'ArrowRight'].includes(e.key)) {
        keysPressedRef.current.right = true;
      }
      if (e.key === ' ') {
        keysPressedRef.current.jump = true;
        e.preventDefault();
      }

      // Abilities (1-9)
      if (!gameOver && !currentAbility) {
        const keyNum = parseInt(e.key) - 1;
        if (keyNum >= 0 && keyNum < abilityKeys.length) {
          const abilityName = abilityKeys[keyNum];
          const ability = abilitiesFull[abilityName];
          const cooldownEnd = abilityCooldowns[abilityName] || 0;
          if (Date.now() >= cooldownEnd) {
            setCurrentAbility(abilityName);
            setAbilityTimer(ability.duration);
            setAbilityCooldowns(prev => ({
              ...prev,
              [abilityName]: Date.now() + ability.cooldown
            }));
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (['w', 'W', 'ц', 'Ц', 'ArrowUp'].includes(e.key)) {
        keysPressedRef.current.up = false;
      }
      if (['s', 'S', 'ы', 'Ы', 'ArrowDown'].includes(e.key)) {
        keysPressedRef.current.down = false;
        setIsCrouching(false);
      }
      if (['a', 'A', 'ф', 'Ф', 'ArrowLeft'].includes(e.key)) {
        keysPressedRef.current.left = false;
      }
      if (['d', 'D', 'в', 'В', 'ArrowRight'].includes(e.key)) {
        keysPressedRef.current.right = false;
      }
      if (e.key === ' ') {
        keysPressedRef.current.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, role, gameOver, currentAbility, abilityCooldowns]);

  // Keyboard controls (multiplayer ninja - movement + abilities)
  useEffect(() => {
    if (gameState !== 'playing' || role !== 'ninja' || gameMode !== 'multi') return;

    const handleKeyDown = (e) => {
      // Movement keys - update ref directly for instant response
      if (['w', 'W', 'ц', 'Ц', 'ArrowUp'].includes(e.key)) {
        keysPressedRef.current.up = true;
      }
      if (['s', 'S', 'ы', 'Ы', 'ArrowDown'].includes(e.key)) {
        keysPressedRef.current.down = true;
        setIsCrouching(true);
      }
      if (['a', 'A', 'ф', 'Ф', 'ArrowLeft'].includes(e.key)) {
        keysPressedRef.current.left = true;
      }
      if (['d', 'D', 'в', 'В', 'ArrowRight'].includes(e.key)) {
        keysPressedRef.current.right = true;
      }
      if (e.key === ' ') {
        keysPressedRef.current.jump = true;
        e.preventDefault();
      }

      // Number keys 1-9 for abilities
      if (!gameOver && !currentAbilityRef.current) {
        const keyNum = parseInt(e.key) - 1;
        if (keyNum >= 0 && keyNum < abilityKeys.length) {
          const abilityName = abilityKeys[keyNum];
          const ability = abilitiesFull[abilityName];
          const cooldownEnd = abilityCooldowns[abilityName] || 0;
          if (Date.now() >= cooldownEnd) {
            currentAbilityRef.current = abilityName;
            abilityTimerRef.current = ability.duration;
            setCurrentAbility(abilityName);
            setAbilityTimer(ability.duration);
            setAbilityCooldowns(prev => ({
              ...prev,
              [abilityName]: Date.now() + ability.cooldown
            }));
            sendData({ type: 'ability', ability: abilityName });
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (['w', 'W', 'ц', 'Ц', 'ArrowUp'].includes(e.key)) {
        keysPressedRef.current.up = false;
      }
      if (['s', 'S', 'ы', 'Ы', 'ArrowDown'].includes(e.key)) {
        keysPressedRef.current.down = false;
        setIsCrouching(false);
      }
      if (['a', 'A', 'ф', 'Ф', 'ArrowLeft'].includes(e.key)) {
        keysPressedRef.current.left = false;
      }
      if (['d', 'D', 'в', 'В', 'ArrowRight'].includes(e.key)) {
        keysPressedRef.current.right = false;
      }
      if (e.key === ' ') {
        keysPressedRef.current.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, role, gameMode, gameOver, abilityCooldowns]);

  // Single player game loop
  useEffect(() => {
    if (gameState !== 'singleplayer' || gameOver) return;

    // Store current ability info in refs for the animation loop
    const abilityRef = { current: currentAbility, timer: abilityTimer };

    const animate = () => {
      const now = Date.now();
      const deltaTime = Math.min((now - lastTime.current) / 16, 2);
      lastTime.current = now;
      const dt = deltaTime * timeScale;

      // Update animation time smoothly
      setAnimTime(prev => prev + deltaTime * 16);

      // Player is NINJA - keyboard controls ninja, AI controls cursor
      if (role === 'ninja') {
        // Get current positions from refs
        const currentChaser = chaserRef.current;
        const currentMouse = mousePosRef.current;
        const keys = keysPressedRef.current;

        // AI cursor runs away from ninja
        const cdx = currentChaser.x - currentMouse.x;
        const cdy = currentChaser.y - currentMouse.y;
        const cursorDist = Math.sqrt(cdx * cdx + cdy * cdy);

        let newMouseX = currentMouse.x;
        let newMouseY = currentMouse.y;

        if (cursorDist < 200) {
          const escapeAngle = Math.atan2(-cdy, -cdx);
          const speed = 5 * (1 - cursorDist / 200);
          newMouseX += Math.cos(escapeAngle) * speed * dt;
          newMouseY += Math.sin(escapeAngle) * speed * dt;
          newMouseX += (Math.random() - 0.5) * 2;
          newMouseY += (Math.random() - 0.5) * 2;
        } else if (Math.random() < 0.02) {
          newMouseX += (Math.random() - 0.5) * 50;
          newMouseY += (Math.random() - 0.5) * 50;
        }

        newMouseX = Math.max(CURSOR_SIZE, Math.min(GAME_WIDTH - CURSOR_SIZE, newMouseX));
        newMouseY = Math.max(CURSOR_SIZE, Math.min(GAME_HEIGHT - CURSOR_SIZE, newMouseY));
        mousePosRef.current = { x: newMouseX, y: newMouseY };
        setMousePos({ x: newMouseX, y: newMouseY });

        // Player controls ninja
        let newChaser = { ...currentChaser };
        const dx = newMouseX - currentChaser.x;
        const dy = newMouseY - currentChaser.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const currentSize = abilityRef.current === 'GROW' ? CHASER_SIZE * 1.8 : CHASER_SIZE;

        // Check collision - player wins!
        if (distance < (currentSize + CURSOR_SIZE) / 2) {
          setGameOver(true);
          createParticles(newMouseX, newMouseY, '#22c55e', 40);
          return;
        }

        // Handle abilities
        if (abilityRef.current && abilityRef.timer > 0) {
          const angle = Math.atan2(dy, dx);
          switch(abilityRef.current) {
            case 'SUPER_JUMP':
              if (abilityRef.timer === abilitiesFull.SUPER_JUMP.duration) {
                newChaser.vy = -18;
                newChaser.onSurface = null;
                createParticles(newChaser.x, newChaser.y, '#3b82f6', 15);
              }
              break;
            case 'DASH':
              if (abilityRef.timer === abilitiesFull.DASH.duration) {
                newChaser.vx = Math.cos(angle) * 35;
                newChaser.vy = Math.sin(angle) * 35;
                createParticles(newChaser.x, newChaser.y, '#ef4444', 20);
              }
              break;
            case 'CLONE':
              if (abilityRef.timer === abilitiesFull.CLONE.duration) {
                const newClones = Array.from({ length: 4 }, (_, i) => {
                  const cloneAngle = (Math.PI * 2 / 4) * i;
                  return {
                    id: Math.random(),
                    x: currentChaser.x + Math.cos(cloneAngle) * 80,
                    y: currentChaser.y + Math.sin(cloneAngle) * 80,
                    vx: Math.cos(cloneAngle) * 3,
                    vy: Math.sin(cloneAngle) * 3,
                    life: 4000,
                    createdAt: Date.now(),
                    onSurface: null
                  };
                });
                setClones(c => [...c, ...newClones]);
              }
              break;
            case 'SHOCKWAVE':
              if (abilityRef.timer === abilitiesFull.SHOCKWAVE.duration) {
                const newWaves = Array.from({ length: 3 }, (_, i) => ({
                  id: Math.random(),
                  x: currentChaser.x,
                  y: currentChaser.y,
                  radius: 20 + i * 40,
                  maxRadius: 250,
                  speed: 10,
                  createdAt: Date.now()
                }));
                setShockwaves(s => [...s, ...newWaves]);
              }
              break;
            case 'TIME_SLOW':
              if (abilityRef.timer === abilitiesFull.TIME_SLOW.duration) {
                setTimeScale(0.4);
              }
              break;
          }
        }

        // Reset time scale when ability ends
        if (!abilityRef.current && timeScale < 1) {
          setTimeScale(1);
        }

        // Keyboard movement - use ref for instant response
        const moveSpeed = 0.8;
        const isRunning = keys.left || keys.right;
        if (keys.left) newChaser.vx -= moveSpeed * dt;
        if (keys.right) newChaser.vx += moveSpeed * dt;

        // Bunny hop logic - consecutive jumps without running build momentum
        if ((keys.jump || keys.up) && currentChaser.onSurface === 'ground') {
          const now = Date.now();
          const timeSinceLand = now - bunnyHopRef.current.lastLandTime;

          // If jumped quickly after landing (within 300ms) and not running, increase streak
          if (timeSinceLand < 300 && !isRunning) {
            bunnyHopRef.current.streak = Math.min(bunnyHopRef.current.streak + 1, 5);
          } else if (isRunning) {
            bunnyHopRef.current.streak = 0; // Reset if running
          }

          // Base jump + bonus from streak (each streak adds 1.5 to jump power)
          const jumpBonus = bunnyHopRef.current.streak * 1.5;
          newChaser.vy = -14 - jumpBonus;

          // Also add horizontal momentum from streak
          const hBonus = bunnyHopRef.current.streak * 2;
          if (newChaser.vx > 0) newChaser.vx += hBonus;
          else if (newChaser.vx < 0) newChaser.vx -= hBonus;

          newChaser.onSurface = null;
        } else if ((keys.jump || keys.up) && currentChaser.onSurface) {
          // Wall/other surface jump - no bunny hop
          newChaser.vy = -14;
          newChaser.onSurface = null;
        }

        // Wall climb
        if (currentChaser.onSurface === 'left_wall' || currentChaser.onSurface === 'right_wall') {
          if (keys.up) newChaser.vy = -6;
          if (keys.jump || keys.up) {
            newChaser.vy = -12;
            newChaser.vx = currentChaser.onSurface === 'left_wall' ? 10 : -10;
            newChaser.onSurface = null;
            bunnyHopRef.current.streak = 0; // Reset streak on wall jump
          }
        }

        // Apply gravity
        if (currentChaser.onSurface !== 'left_wall' && currentChaser.onSurface !== 'right_wall') {
          newChaser.vy += GRAVITY * dt;
        } else {
          newChaser.vy += GRAVITY * 0.2 * dt;
        }

        // Apply velocity
        newChaser.x += newChaser.vx * dt;
        newChaser.y += newChaser.vy * dt;

        // Friction
        newChaser.vx *= 0.92;
        newChaser.vy *= 0.99;

        // Collisions
        const wasInAir = !currentChaser.onSurface || currentChaser.onSurface === null;
        newChaser.onSurface = null;
        if (newChaser.y >= GAME_HEIGHT - currentSize / 2) {
          newChaser.y = GAME_HEIGHT - currentSize / 2;
          newChaser.vy = 0;
          newChaser.onSurface = 'ground';
          // Track landing time for bunny hop
          if (wasInAir) {
            bunnyHopRef.current.lastLandTime = Date.now();
          }
        }
        if (newChaser.y <= currentSize / 2) {
          newChaser.y = currentSize / 2;
          newChaser.vy = Math.abs(newChaser.vy) * 0.3;
        }
        if (newChaser.x <= currentSize / 2) {
          newChaser.x = currentSize / 2;
          newChaser.onSurface = 'left_wall';
          newChaser.vx = 0;
        }
        if (newChaser.x >= GAME_WIDTH - currentSize / 2) {
          newChaser.x = GAME_WIDTH - currentSize / 2;
          newChaser.onSurface = 'right_wall';
          newChaser.vx = 0;
        }

        // Collision with cursor lines
        for (const line of cursorLines) {
          const collision = checkLineCollision(newChaser.x, newChaser.y, currentSize / 2, line);
          if (collision) {
            // Push ninja out of line
            newChaser.x += collision.normalX * collision.penetration;
            newChaser.y += collision.normalY * collision.penetration;

            // Check if line is mostly horizontal (can stand on it)
            const isHorizontal = Math.abs(collision.normalY) > 0.7;
            if (isHorizontal && collision.normalY < 0 && newChaser.vy > 0) {
              // Standing on line from above
              newChaser.vy = 0;
              newChaser.onSurface = 'line';
            } else {
              // Bounce off line
              const dotProduct = newChaser.vx * collision.normalX + newChaser.vy * collision.normalY;
              newChaser.vx -= 1.5 * dotProduct * collision.normalX;
              newChaser.vy -= 1.5 * dotProduct * collision.normalY;
            }
          }
        }

        chaserRef.current = newChaser;
        setChaser(newChaser);
      }

      // Player is CURSOR - AI controls ninja (original behavior)
      if (role === 'cursor') {
        setChaser(prev => {
          let newChaser = { ...prev };
          const dx = mousePos.x - prev.x;
          const dy = mousePos.y - prev.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          const currentSize = currentAbility === 'GROW' ? CHASER_SIZE * 1.8 : CHASER_SIZE;
          if (distance < (currentSize + CURSOR_SIZE) / 2) {
            setGameOver(true);
            createParticles(prev.x, prev.y, '#dc2626', 40);
            return prev;
          }

          if (Math.random() < 0.3) createTrail(prev.x, prev.y, currentSize);

          // AI selects random ability
          if (!currentAbility && Math.random() < 0.015 && distance > 100) {
            const newAbility = selectRandomAbility();
            if (newAbility) {
              setCurrentAbility(newAbility);
              setAbilityTimer(abilitiesFull[newAbility].duration);
              newChaser = executeAbility(newAbility, prev);
              return newChaser;
            }
          }

          let baseSpeed = 0.4;

          if (currentAbility === 'DASH') {
            baseSpeed = 0;
          } else if (currentAbility === 'VORTEX' || currentAbility === 'MAGNET') {
            baseSpeed = 0.6;
            const pullForce = currentAbility === 'VORTEX' ? 3 : 2;
            const pullX = (prev.x - mousePos.x) / distance * pullForce * dt;
            const pullY = (prev.y - mousePos.y) / distance * pullForce * dt;
            setMousePos(m => ({
              x: Math.max(CURSOR_SIZE, Math.min(GAME_WIDTH - CURSOR_SIZE, m.x + pullX)),
              y: Math.max(CURSOR_SIZE, Math.min(GAME_HEIGHT - CURSOR_SIZE, m.y + pullY))
            }));
          }

          newChaser.vx += Math.cos(angle) * baseSpeed * dt;
          newChaser.vy += Math.sin(angle) * baseSpeed * dt;

          if (prev.onSurface !== 'left_wall' && prev.onSurface !== 'right_wall') {
            newChaser.vy += GRAVITY * dt;
          }

          newChaser.x += newChaser.vx * dt;
          newChaser.y += newChaser.vy * dt;

          const friction = prev.onSurface ? 0.85 : 0.97;
          newChaser.vx *= friction;
          newChaser.vy *= (prev.onSurface ? 0.85 : 0.99);

          newChaser.onSurface = null;

          // Floor
          if (newChaser.y >= GAME_HEIGHT - currentSize / 2) {
            newChaser.y = GAME_HEIGHT - currentSize / 2;
            newChaser.vy = 0;
            newChaser.onSurface = 'ground';

            if (Math.abs(dy) > 50 && Math.random() < 0.01) {
              newChaser.vy = -12;
              newChaser.vx += Math.cos(angle) * 4;
            }

            if (mousePos.y < newChaser.y - 100 && Math.random() < 0.025) {
              if (mousePos.x < GAME_WIDTH / 2) {
                newChaser.vx = -12;
                newChaser.vy = -16;
                createParticles(newChaser.x, newChaser.y, '#10b981', 12);
              } else {
                newChaser.vx = 12;
                newChaser.vy = -16;
                createParticles(newChaser.x, newChaser.y, '#10b981', 12);
              }
            }
          }

          // Ceiling
          if (newChaser.y <= currentSize / 2) {
            newChaser.y = currentSize / 2;
            newChaser.vy = Math.abs(newChaser.vy) * 0.3;
            newChaser.onSurface = 'ceiling';
          }

          // Left wall
          if (newChaser.x <= currentSize / 2) {
            newChaser.x = currentSize / 2;
            newChaser.onSurface = 'left_wall';

            if (Math.abs(newChaser.vx) > 1 || Math.abs(newChaser.vy) < -1) {
              newChaser.vx = Math.abs(newChaser.vx) * 0.6;
              if (mousePos.y < newChaser.y - 30) {
                newChaser.vy = -4;
              }
            } else {
              newChaser.vy += GRAVITY * 0.2 * dt;
            }

            if (Math.random() < 0.03 && mousePos.x > newChaser.x + 80) {
              const jumpPower = 16;
              const jumpAngle = Math.atan2(mousePos.y - newChaser.y, mousePos.x - newChaser.x);
              newChaser.vx = Math.cos(jumpAngle) * jumpPower;
              newChaser.vy = Math.sin(jumpAngle) * jumpPower - 3;
              createParticles(newChaser.x, newChaser.y, '#10b981', 15);
            }
          }

          // Right wall
          if (newChaser.x >= GAME_WIDTH - currentSize / 2) {
            newChaser.x = GAME_WIDTH - currentSize / 2;
            newChaser.onSurface = 'right_wall';

            if (Math.abs(newChaser.vx) > 1 || Math.abs(newChaser.vy) < -1) {
              newChaser.vx = -Math.abs(newChaser.vx) * 0.6;
              if (mousePos.y < newChaser.y - 30) {
                newChaser.vy = -4;
              }
            } else {
              newChaser.vy += GRAVITY * 0.2 * dt;
            }

            if (Math.random() < 0.03 && mousePos.x < newChaser.x - 80) {
              const jumpPower = 16;
              const jumpAngle = Math.atan2(mousePos.y - newChaser.y, mousePos.x - newChaser.x);
              newChaser.vx = Math.cos(jumpAngle) * jumpPower;
              newChaser.vy = Math.sin(jumpAngle) * jumpPower - 3;
              createParticles(newChaser.x, newChaser.y, '#10b981', 15);
            }
          }

          // Collision with cursor lines
          for (const line of cursorLines) {
            const collision = checkLineCollision(newChaser.x, newChaser.y, currentSize / 2, line);
            if (collision) {
              // Push ninja out of line
              newChaser.x += collision.normalX * collision.penetration;
              newChaser.y += collision.normalY * collision.penetration;

              // Check if line is mostly horizontal (can stand on it)
              const isHorizontal = Math.abs(collision.normalY) > 0.7;
              if (isHorizontal && collision.normalY < 0 && newChaser.vy > 0) {
                // Standing on line from above
                newChaser.vy = 0;
                newChaser.onSurface = 'line';
              } else {
                // Bounce off line
                const dotProduct = newChaser.vx * collision.normalX + newChaser.vy * collision.normalY;
                newChaser.vx -= 1.5 * dotProduct * collision.normalX;
                newChaser.vy -= 1.5 * dotProduct * collision.normalY;
              }
            }
          }

          if (currentAbility === 'VORTEX') {
            newChaser.rotation = (prev.rotation + 15 * dt) % 360;
          } else {
            newChaser.rotation = (angle * 180 / Math.PI) + 90;
          }

          newChaser.scale = currentAbility === 'GROW' ? 1.8 : 1;

          return newChaser;
        });
      }

      // Update clones
      setClones(prev => prev.map(clone => {
        const age = Date.now() - clone.createdAt;
        if (age > clone.life) return null;

        const dx = mousePos.x - clone.x;
        const dy = mousePos.y - clone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        if (distance < CHASER_SIZE) {
          setGameOver(true);
          createParticles(clone.x, clone.y, '#ec4899', 30);
        }

        let newClone = {
          ...clone,
          vx: clone.vx + Math.cos(angle) * 0.3 * dt,
          vy: clone.vy + GRAVITY * dt
        };

        newClone.x += newClone.vx * dt;
        newClone.y += newClone.vy * dt;

        if (newClone.y >= GAME_HEIGHT - CHASER_SIZE / 2) {
          newClone.y = GAME_HEIGHT - CHASER_SIZE / 2;
          newClone.vy = -Math.abs(newClone.vy) * 0.6;
        }
        if (newClone.x <= CHASER_SIZE / 2 || newClone.x >= GAME_WIDTH - CHASER_SIZE / 2) {
          newClone.vx *= -0.8;
          newClone.x = Math.max(CHASER_SIZE / 2, Math.min(GAME_WIDTH - CHASER_SIZE / 2, newClone.x));
        }

        newClone.vx *= 0.98;

        return newClone;
      }).filter(Boolean));

      // Update shockwaves
      setShockwaves(prev => prev.map(wave => {
        const newRadius = wave.radius + wave.speed * dt;
        if (newRadius > wave.maxRadius) return null;

        const dx = mousePos.x - wave.x;
        const dy = mousePos.y - wave.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        if (Math.abs(distToMouse - wave.radius) < 30) {
          const pushAngle = Math.atan2(dy, dx);
          const pushForce = 20;
          setMousePos(prev => ({
            x: Math.max(CURSOR_SIZE, Math.min(GAME_WIDTH - CURSOR_SIZE, prev.x + Math.cos(pushAngle) * pushForce)),
            y: Math.max(CURSOR_SIZE, Math.min(GAME_HEIGHT - CURSOR_SIZE, prev.y + Math.sin(pushAngle) * pushForce))
          }));
        }

        return { ...wave, radius: newRadius };
      }).filter(Boolean));

      // Update particles
      setParticles(prev => prev.map(p => {
        const newLife = p.life - 0.015 * dt;
        if (newLife <= 0) return null;

        return {
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt + GRAVITY * 0.2 * dt,
          vx: p.vx * 0.98,
          vy: p.vy * 0.98,
          life: newLife
        };
      }).filter(Boolean));

      // Update trails
      setTrails(prev => prev.map(t => {
        const age = Date.now() - t.createdAt;
        if (age > 500) return null;
        return { ...t, life: 1 - age / 500 };
      }).filter(Boolean));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, role, currentAbility, abilityTimer, gameOver, timeScale, selectRandomAbility, executeAbility, createParticles, createTrail]);

  // Multiplayer ninja game loop - uses refs to avoid re-creating animation on state changes
  useEffect(() => {
    if (gameState !== 'playing' || role !== 'ninja' || gameOver || gameMode !== 'multi') return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = Math.min((now - lastTime.current) / 16, 2);
      lastTime.current = now;
      const dt = deltaTime;

      // Update animation time
      setAnimTime(prev => prev + deltaTime * 16);

      // Use refs for all values to avoid stale closures
      const currentMouse = mousePosRef.current;
      const ability = currentAbilityRef.current;
      const abilityTime = abilityTimerRef.current;
      const lines = cursorLinesRef.current;
      const keys = keysPressedRef.current;

      setChaser(prev => {
        let newChaser = { ...prev };
        const dx = currentMouse.x - prev.x;
        const dy = currentMouse.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const currentSize = ability === 'GROW' ? CHASER_SIZE * 1.8 : CHASER_SIZE;
        if (distance < (currentSize + CURSOR_SIZE) / 2) {
          setGameOver(true);
          createParticles(prev.x, prev.y, '#dc2626', 40);
          sendData({ type: 'gameOver', score: scoreRef.current });
          return prev;
        }

        // Handle abilities
        if (ability && abilityTime > 0) {
          switch(ability) {
            case 'SUPER_JUMP':
              if (abilityTime === abilitiesFull.SUPER_JUMP.duration) {
                newChaser.vy = -18;
                newChaser.vx = Math.cos(angle) * 8;
                newChaser.onSurface = null;
              }
              break;
            case 'DASH':
              if (abilityTime === abilitiesFull.DASH.duration) {
                newChaser.vx = Math.cos(angle) * 35;
                newChaser.vy = Math.sin(angle) * 35;
              }
              break;
            case 'CLONE':
              if (abilityTime === abilitiesFull.CLONE.duration) {
                const newClones = Array.from({ length: 4 }, (_, i) => {
                  const cloneAngle = (Math.PI * 2 / 4) * i;
                  return {
                    id: Math.random(),
                    x: prev.x + Math.cos(cloneAngle) * 80,
                    y: prev.y + Math.sin(cloneAngle) * 80,
                    vx: Math.cos(cloneAngle) * 3,
                    vy: Math.sin(cloneAngle) * 3,
                    life: 4000,
                    createdAt: Date.now(),
                    onSurface: null
                  };
                });
                setClones(c => [...c, ...newClones]);
              }
              break;
            case 'SHOCKWAVE':
              if (abilityTime === abilitiesFull.SHOCKWAVE.duration) {
                const newWaves = Array.from({ length: 3 }, (_, i) => ({
                  id: Math.random(),
                  x: prev.x,
                  y: prev.y,
                  radius: 20 + i * 40,
                  maxRadius: 250,
                  speed: 10,
                  createdAt: Date.now()
                }));
                setShockwaves(s => [...s, ...newWaves]);
              }
              break;
            case 'VORTEX':
            case 'MAGNET':
              const pullForce = ability === 'VORTEX' ? 3 : 2;
              const pullX = (prev.x - currentMouse.x) / Math.max(distance, 1) * pullForce * dt;
              const pullY = (prev.y - currentMouse.y) / Math.max(distance, 1) * pullForce * dt;
              mousePosRef.current = {
                x: Math.max(CURSOR_SIZE, Math.min(GAME_WIDTH - CURSOR_SIZE, currentMouse.x + pullX)),
                y: Math.max(CURSOR_SIZE, Math.min(GAME_HEIGHT - CURSOR_SIZE, currentMouse.y + pullY))
              };
              setMousePos(mousePosRef.current);
              sendData({ type: 'pullCursor', pullX, pullY });
              break;
            case 'TIME_SLOW':
              if (abilityTime === abilitiesFull.TIME_SLOW.duration) {
                setTimeScale(0.4);
                sendData({ type: 'timeSlow', scale: 0.4 });
              }
              break;
            // GROW and GHOST are handled by chaserSize and chaserOpacity
          }
        }

        // Keyboard movement - use ref for instant response
        const moveSpeed = 0.8;
        const isRunning = keys.left || keys.right;
        if (keys.left) newChaser.vx -= moveSpeed * dt;
        if (keys.right) newChaser.vx += moveSpeed * dt;

        // Bunny hop logic - consecutive jumps without running build momentum
        if ((keys.jump || keys.up) && prev.onSurface === 'ground') {
          const now = Date.now();
          const timeSinceLand = now - bunnyHopRef.current.lastLandTime;

          // If jumped quickly after landing (within 300ms) and not running, increase streak
          if (timeSinceLand < 300 && !isRunning) {
            bunnyHopRef.current.streak = Math.min(bunnyHopRef.current.streak + 1, 5);
          } else if (isRunning) {
            bunnyHopRef.current.streak = 0; // Reset if running
          }

          // Base jump + bonus from streak (each streak adds 1.5 to jump power)
          const jumpBonus = bunnyHopRef.current.streak * 1.5;
          newChaser.vy = -14 - jumpBonus;

          // Also add horizontal momentum from streak
          const hBonus = bunnyHopRef.current.streak * 2;
          if (newChaser.vx > 0) newChaser.vx += hBonus;
          else if (newChaser.vx < 0) newChaser.vx -= hBonus;

          newChaser.onSurface = null;
        } else if ((keys.jump || keys.up) && prev.onSurface) {
          // Non-ground surfaces (walls, lines) - normal jump, reset streak
          bunnyHopRef.current.streak = 0;
          newChaser.vy = -14;
          newChaser.onSurface = null;
        }

        // Wall climb
        if (prev.onSurface === 'left_wall' || prev.onSurface === 'right_wall') {
          if (keys.up) newChaser.vy = -6;
          if (keys.jump || keys.up) {
            newChaser.vy = -12;
            newChaser.vx = prev.onSurface === 'left_wall' ? 10 : -10;
            newChaser.onSurface = null;
          }
        }

        // Apply gravity
        if (prev.onSurface !== 'left_wall' && prev.onSurface !== 'right_wall') {
          newChaser.vy += GRAVITY * dt;
        } else {
          newChaser.vy += GRAVITY * 0.2 * dt;
        }

        newChaser.x += newChaser.vx * dt;
        newChaser.y += newChaser.vy * dt;

        newChaser.vx *= 0.97;
        newChaser.vy *= 0.99;

        // Track if was in air for landing detection
        const wasInAir = !prev.onSurface || prev.onSurface === null;
        newChaser.onSurface = null;

        if (newChaser.y >= GAME_HEIGHT - currentSize / 2) {
          newChaser.y = GAME_HEIGHT - currentSize / 2;
          newChaser.vy = 0;
          newChaser.onSurface = 'ground';
          // Track landing time for bunny hop
          if (wasInAir) {
            bunnyHopRef.current.lastLandTime = Date.now();
          }
        }

        if (newChaser.y <= currentSize / 2) {
          newChaser.y = currentSize / 2;
          newChaser.vy = Math.abs(newChaser.vy) * 0.3;
        }

        if (newChaser.x <= currentSize / 2) {
          newChaser.x = currentSize / 2;
          newChaser.onSurface = 'left_wall';
          newChaser.vx = Math.abs(newChaser.vx) * 0.6;
        }

        if (newChaser.x >= GAME_WIDTH - currentSize / 2) {
          newChaser.x = GAME_WIDTH - currentSize / 2;
          newChaser.onSurface = 'right_wall';
          newChaser.vx = -Math.abs(newChaser.vx) * 0.6;
        }

        // Collision with cursor lines (multiplayer)
        for (const line of lines) {
          const collision = checkLineCollision(newChaser.x, newChaser.y, currentSize / 2, line);
          if (collision) {
            // Push ninja out of line
            newChaser.x += collision.normalX * collision.penetration;
            newChaser.y += collision.normalY * collision.penetration;

            // Check if line is mostly horizontal (can stand on it)
            const isHorizontal = Math.abs(collision.normalY) > 0.7;
            if (isHorizontal && collision.normalY < 0 && newChaser.vy > 0) {
              // Standing on line from above
              newChaser.vy = 0;
              newChaser.onSurface = 'line';
            } else {
              // Bounce off line
              const dotProduct = newChaser.vx * collision.normalX + newChaser.vy * collision.normalY;
              newChaser.vx -= 1.5 * dotProduct * collision.normalX;
              newChaser.vy -= 1.5 * dotProduct * collision.normalY;
            }
          }
        }

        sendData({ type: 'ninjaMove', chaser: newChaser, ability: ability });

        return newChaser;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, role, gameMode, gameOver]); // Minimal dependencies - use refs for everything else

  // Clean up old cursor lines (5 second lifetime)
  useEffect(() => {
    if (cursorLines.length === 0) return;

    const cleanup = setInterval(() => {
      const now = Date.now();
      setCursorLines(prev => prev.filter(line => now - line.createdAt < 5000));
    }, 100);

    return () => clearInterval(cleanup);
  }, [cursorLines.length]);

  // Ability timer (works for both single and multiplayer)
  useEffect(() => {
    if (currentAbility && abilityTimer > 0) {
      const timer = setTimeout(() => {
        const newTimer = abilityTimer - 50;
        if (newTimer <= 0) {
          setCurrentAbility(null);
          setAbilityTimer(0);
        } else {
          setAbilityTimer(newTimer);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentAbility, abilityTimer, gameMode]);

  // Score counter
  useEffect(() => {
    if ((gameState === 'singleplayer' || (gameState === 'playing' && role === 'ninja')) && !gameOver) {
      const timer = setInterval(() => {
        setScore(s => {
          scoreRef.current = s + 1;
          return s + 1;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [gameState, role, gameOver]);

  // Sync refs with state for multiplayer game loop
  useEffect(() => {
    currentAbilityRef.current = currentAbility;
  }, [currentAbility]);

  useEffect(() => {
    abilityTimerRef.current = abilityTimer;
  }, [abilityTimer]);

  useEffect(() => {
    cursorLinesRef.current = cursorLines;
  }, [cursorLines]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  const resetToMenu = () => {
    setGameState('menu');
    setGameMode(null);
    setRole(null);
    setIsConnected(false);
    setGameOver(false);
    setScore(0);
    setChaser({ x: 450, y: 550, vx: 0, vy: 0, onSurface: 'ground', rotation: 0, scale: 1 });
    setMousePos({ x: 450, y: 300 });
    setClones([]);
    setShockwaves([]);
    setParticles([]);
    setTrails([]);
    setCurrentAbility(null);
    setTimeScale(1);
  };

  const copyInviteLink = () => {
    const link = getInviteLink(roomCode);
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  // ============== RENDER ==============

  // Main menu - mode selection
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="bg-slate-800/90 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-purple-500/50 relative">
          <div className="absolute top-3 right-3 text-xs bg-purple-600 text-white px-2 py-1 rounded">
            v{APP_VERSION}
          </div>

          <div className="text-center mb-6">
            <span className="text-7xl">🥷</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            НИНДЗЯ ПОГОНЯ
          </h1>

          <p className="text-gray-400 text-center mb-6">
            Выбери режим игры
          </p>

          <div className="space-y-3">
            <button
              onClick={startSinglePlayer}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🎮</span>
              <div className="text-left">
                <div>Одиночная игра</div>
                <div className="text-xs opacity-80 font-normal">Играй за ниндзя или курсор</div>
              </div>
            </button>

            <button
              onClick={() => { setGameMode('multi'); setGameState('mode-select'); }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
            >
              <span className="text-2xl">👥</span>
              <div className="text-left">
                <div>Мультиплеер</div>
                <div className="text-xs opacity-80 font-normal">Играй с другом онлайн</div>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 text-gray-500 text-sm">
              <span>🥷 Ниндзя</span>
              <span className="text-purple-400">VS</span>
              <span>🎯 Курсор</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single player role selection
  if (gameState === 'singleplayer-select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="bg-slate-800/90 rounded-2xl shadow-2xl p-8 max-w-xl w-full border border-purple-500/50 relative">
          <div className="absolute top-3 right-3 text-xs bg-purple-600 text-white px-2 py-1 rounded">
            v{APP_VERSION}
          </div>

          <div className="text-center mb-4">
            <span className="text-5xl">🎮</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1 text-center">Одиночная игра</h1>
          <p className="text-gray-400 text-center mb-5 text-sm">Выбери за кого играть</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => startSinglePlayerWithRole('ninja')}
              className="bg-gradient-to-b from-red-600 to-red-800 p-5 rounded-xl hover:opacity-90 transition-opacity border border-red-500/50"
            >
              <div className="text-5xl mb-2">🥷</div>
              <h3 className="text-lg font-bold text-white mb-2">Ниндзя</h3>
              <div className="text-gray-200 text-xs">
                <p className="mb-1">Лови курсор!</p>
                <p><span className="bg-white/20 px-1.5 py-0.5 rounded">WASD</span> Движение</p>
                <p><span className="bg-white/20 px-1.5 py-0.5 rounded">SPACE</span> Прыжок</p>
                <p><span className="bg-white/20 px-1.5 py-0.5 rounded">1-9</span> Способности</p>
              </div>
            </button>

            <button
              onClick={() => startSinglePlayerWithRole('cursor')}
              className="bg-gradient-to-b from-blue-600 to-blue-800 p-5 rounded-xl hover:opacity-90 transition-opacity border border-blue-500/50"
            >
              <div className="text-5xl mb-2">🎯</div>
              <h3 className="text-lg font-bold text-white mb-2">Курсор</h3>
              <div className="text-gray-200 text-xs">
                <p className="mb-1">Убегай от AI!</p>
                <p><span className="bg-white/20 px-1.5 py-0.5 rounded">🖱️</span> Движение мышкой</p>
                <p className="mt-1 text-yellow-300/80">Продержись дольше!</p>
              </div>
            </button>
          </div>

          <button
            onClick={resetToMenu}
            className="w-full mt-4 bg-slate-700 text-gray-300 px-5 py-2.5 rounded-lg hover:bg-slate-600 transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  // Multiplayer menu
  if (gameState === 'mode-select' && gameMode === 'multi') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="bg-slate-800/90 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-purple-500/50 relative">
          <div className="absolute top-3 right-3 text-xs bg-purple-600 text-white px-2 py-1 rounded">
            v{APP_VERSION}
          </div>

          <div className="text-center mb-4">
            <span className="text-5xl">👥</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1 text-center">Мультиплеер</h1>
          <p className="text-gray-400 text-center mb-5 text-sm">Играй с другом онлайн</p>

          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-1 block">Твоё имя</label>
            <input
              type="text"
              placeholder="Введи имя..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-purple-400 outline-none"
            />
          </div>

          <button
            onClick={hostGame}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-lg text-lg font-bold hover:opacity-90 transition-opacity mb-3 flex items-center justify-center gap-2"
          >
            🎮 Создать игру
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-slate-800 text-gray-500 text-sm">или</span>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-gray-400 text-sm mb-1 block">Код комнаты</label>
            <input
              type="text"
              placeholder="XXXXXX"
              value={inputRoomCode}
              onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-blue-400 outline-none uppercase tracking-widest text-center font-mono"
            />
          </div>

          <button
            onClick={joinGame}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-3 rounded-lg text-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            🚀 Присоединиться
          </button>

          <button
            onClick={resetToMenu}
            className="w-full mt-3 bg-slate-700 text-gray-300 px-5 py-2.5 rounded-lg hover:bg-slate-600 transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  // Waiting room (multiplayer)
  if ((gameState === 'host' || gameState === 'client') && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="bg-slate-800/90 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-purple-500/50 relative">
          <div className="absolute top-3 right-3 text-xs bg-purple-600 text-white px-2 py-1 rounded">
            v{APP_VERSION}
          </div>

          <div className="text-center mb-4">
            <span className="text-5xl">{gameState === 'host' ? '⏳' : '🔌'}</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-5 text-center">
            {gameState === 'host' ? 'Ожидание игрока...' : 'Подключение...'}
          </h2>

          {gameState === 'host' && (
            <>
              <div className="bg-slate-700 rounded-xl p-5 mb-4">
                <p className="text-gray-400 text-sm mb-2 text-center">Ссылка для друга:</p>
                <p className="text-sm text-center text-purple-400 mb-3 font-mono break-all px-2">
                  {getInviteLink(roomCode)}
                </p>
                <button
                  onClick={copyInviteLink}
                  className={`w-full px-4 py-2.5 rounded-lg transition-colors ${
                    linkCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  {linkCopied ? '✓ Ссылка скопирована!' : '📋 Скопировать ссылку'}
                </button>
              </div>
              <p className="text-gray-500 text-center text-sm">Отправь эту ссылку другу!</p>
            </>
          )}

          {gameState === 'client' && (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500"></div>
              <p className="text-gray-400">Ищем хоста...</p>
            </div>
          )}

          <button
            onClick={resetToMenu}
            className="w-full mt-5 bg-slate-700 text-gray-300 px-5 py-2.5 rounded-lg hover:bg-slate-600 transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  // Role selection (multiplayer)
  if (isConnected && !role && gameMode === 'multi') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="bg-slate-800/90 rounded-2xl shadow-2xl p-8 max-w-xl w-full border border-purple-500/50 relative">
          <div className="absolute top-3 right-3 text-xs bg-purple-600 text-white px-2 py-1 rounded">
            v{APP_VERSION}
          </div>

          <div className="text-center mb-2">
            <span className="text-5xl">🎭</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">Выбери роль</h2>

          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-gray-400 text-sm">Играешь с:</span>
            <span className="bg-purple-600 text-white px-3 py-0.5 rounded text-sm font-bold">
              {opponentName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => selectRole('ninja')}
              className="bg-gradient-to-b from-red-600 to-red-800 p-5 rounded-xl hover:opacity-90 transition-opacity border border-red-500/50"
            >
              <div className="text-5xl mb-2">🥷</div>
              <h3 className="text-lg font-bold text-white mb-2">Ниндзя</h3>
              <div className="text-gray-200 text-xs">
                <p className="mb-1">9 способностей!</p>
                <p><span className="bg-white/20 px-1.5 py-0.5 rounded">1-9</span> Ультимейты</p>
              </div>
            </button>

            <button
              onClick={() => selectRole('cursor')}
              className="bg-gradient-to-b from-blue-600 to-blue-800 p-5 rounded-xl hover:opacity-90 transition-opacity border border-blue-500/50"
            >
              <div className="text-5xl mb-2">🎯</div>
              <h3 className="text-lg font-bold text-white mb-2">Курсор</h3>
              <div className="text-gray-200 text-xs">
                <p className="mb-1">Управляй мышкой</p>
                <p><span className="bg-white/20 px-1.5 py-0.5 rounded">🖱️</span> Убегай!</p>
                <p className="mt-1 text-yellow-300/80">Продержись дольше!</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME RENDER (single player or multiplayer playing)
  if (gameState === 'singleplayer' || gameState === 'playing') {
    const chaserSize = (currentAbility === 'GROW' ? 1.8 : 1) * CHASER_SIZE;
    const chaserOpacity = currentAbility === 'GHOST' ? 0.25 : 1;
    const isSinglePlayer = gameState === 'singleplayer';

    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        {/* HUD - Top */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3">
          <div className="bg-black/80 border border-yellow-500 px-4 py-1.5 rounded-full text-white font-bold text-lg">
            ⭐ {score}
          </div>
          {currentAbility && (
            <div className={`${abilitiesFull[currentAbility]?.color || 'bg-red-500'} px-3 py-1.5 rounded-full text-white font-bold text-sm`}>
              {abilitiesFull[currentAbility]?.emoji} {abilitiesFull[currentAbility]?.name}
            </div>
          )}
          {timeScale < 1 && (
            <div className="bg-orange-500 px-3 py-1.5 rounded-full text-white font-bold text-sm">
              ⏱️ ЗАМЕДЛЕНИЕ
            </div>
          )}
          {!isSinglePlayer && (
            <div className="bg-purple-600/80 px-3 py-1.5 rounded-full text-white text-sm">
              vs <span className="font-bold">{opponentName}</span>
            </div>
          )}
        </div>

        {/* Ability bar for ninja (multiplayer only) */}
        {role === 'ninja' && !isSinglePlayer && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-1">
            {abilityKeys.map((abilityName, i) => {
              const ability = abilitiesFull[abilityName];
              const cooldownEnd = abilityCooldowns[abilityName] || 0;
              const isOnCooldown = Date.now() < cooldownEnd;
              const cooldownPercent = isOnCooldown
                ? ((cooldownEnd - Date.now()) / ability.cooldown) * 100
                : 0;
              const isActive = currentAbility === abilityName;

              return (
                <div
                  key={abilityName}
                  className={`relative w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white text-xs ${
                    isActive ? 'bg-yellow-500 ring-2 ring-white' :
                    isOnCooldown ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
                  } transition-all`}
                >
                  <span className="text-lg">{ability.emoji}</span>
                  <span className="text-xs opacity-70">{i + 1}</span>
                  {isOnCooldown && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-red-500/50 rounded-b-lg"
                      style={{ height: `${cooldownPercent}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Back button */}
        <button
          onClick={resetToMenu}
          className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm border border-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          ← Меню
        </button>

        {/* Game Area - Fullscreen */}
        <div
          ref={gameAreaRef}
          className="relative w-full h-full overflow-hidden cursor-none"
          style={{
            background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            filter: timeScale < 1 ? 'hue-rotate(30deg) saturate(1.5)' : 'none'
          }}
        >
            {/* Trails with glow */}
            {trails.map(trail => (
              <div
                key={trail.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: trail.x - trail.size / 3,
                  top: trail.y - trail.size / 3,
                  width: trail.size / 1.5,
                  height: trail.size / 1.5,
                  background: `radial-gradient(circle, rgba(239, 68, 68, ${trail.life * 0.6}) 0%, transparent 70%)`,
                  boxShadow: `0 0 ${trail.size}px rgba(239, 68, 68, ${trail.life * 0.4})`
                }}
              />
            ))}

            {/* Particles with glow */}
            {particles.map(p => (
              <div
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: p.x - p.size / 2,
                  top: p.y - p.size / 2,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity: p.life * 0.9,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`
                }}
              />
            ))}

            {/* Shockwaves - neon rings */}
            {shockwaves.map(wave => (
              <div
                key={wave.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: wave.x - wave.radius,
                  top: wave.y - wave.radius,
                  width: wave.radius * 2,
                  height: wave.radius * 2,
                  border: '3px solid rgba(139, 92, 246, 0.8)',
                  opacity: (1 - wave.radius / wave.maxRadius) * 0.9,
                  boxShadow: `
                    0 0 20px rgba(139, 92, 246, 0.6),
                    0 0 40px rgba(139, 92, 246, 0.4),
                    inset 0 0 20px rgba(139, 92, 246, 0.3)
                  `
                }}
              />
            ))}

            {/* Cursor Lines - physical platforms */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {cursorLines.map(line => {
                const age = Date.now() - line.createdAt;
                const opacity = Math.max(0, 1 - age / 5000); // Fade out over 5 seconds
                return (
                  <line
                    key={line.id}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={`rgba(34, 211, 238, ${opacity})`}
                    strokeWidth={LINE_THICKNESS}
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 ${8 * opacity}px rgba(34, 211, 238, 0.8))`
                    }}
                  />
                );
              })}
            </svg>

            {/* Cursor - hide when game over */}
            {!gameOver && (
              <div
                className="absolute pointer-events-none z-30 rounded-full bg-yellow-400"
                style={{
                  left: mousePos.x - CURSOR_SIZE / 2,
                  top: mousePos.y - CURSOR_SIZE / 2,
                  width: CURSOR_SIZE,
                  height: CURSOR_SIZE,
                  boxShadow: '0 0 15px rgba(251, 191, 36, 0.8)'
                }}
              />
            )}

            {/* Clones */}
            {clones.map(clone => {
              const age = Date.now() - clone.createdAt;
              const opacity = Math.max(0, 1 - age / clone.life);
              const cloneAngle = Math.atan2(mousePos.y - clone.y, mousePos.x - clone.x) * 180 / Math.PI;

              return (
                <AnimatedChaser
                  key={clone.id}
                  x={clone.x}
                  y={clone.y}
                  size={CHASER_SIZE}
                  opacity={opacity}
                  ability={null}
                  isClone={true}
                  vx={clone.vx}
                  vy={clone.vy}
                  onSurface={clone.onSurface}
                  animTime={animTime}
                />
              );
            })}

            {/* Main Ninja */}
            <AnimatedChaser
              x={chaser.x}
              y={chaser.y}
              size={chaserSize}
              opacity={chaserOpacity}
              ability={currentAbility}
              isClone={false}
              vx={chaser.vx}
              vy={chaser.vy}
              onSurface={chaser.onSurface}
              animTime={animTime}
              isCrouching={isCrouching}
              cursorX={mousePos.x}
              cursorY={mousePos.y}
            />

            {/* Wall indicators */}
            {chaser.onSurface === 'left_wall' && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-32 bg-green-400 opacity-70" />
            )}
            {chaser.onSurface === 'right_wall' && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-32 bg-green-400 opacity-70" />
            )}

            {/* Ground with glow */}
            <div
              className="absolute bottom-0 left-0 right-0 h-2"
              style={{
                background: 'linear-gradient(to top, #10b981, #059669)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)'
              }}
            />

            {/* Side walls glow */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{
                background: 'linear-gradient(to right, rgba(139, 92, 246, 0.3), transparent)',
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-1"
              style={{
                background: 'linear-gradient(to left, rgba(139, 92, 246, 0.3), transparent)',
              }}
            />

            {/* Grid overlay for cyberpunk feel */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />

            {/* Game Over */}
            {gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-85 flex items-center justify-center z-40">
                <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-3xl p-10 text-center border-4 border-red-600">
                  <div className="text-8xl mb-6">
                    {isSinglePlayer ? '🥷' : (role === 'ninja' ? '🎉' : '💀')}
                  </div>
                  <h2 className="text-5xl font-bold text-white mb-4">
                    {isSinglePlayer ? 'ПОБЕДА!' : (role === 'ninja' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ!')}
                  </h2>
                  <p className="text-3xl text-red-200 mb-3">
                    {isSinglePlayer ? 'Ты продержался:' : 'Счёт:'}
                  </p>
                  <p className="text-6xl font-bold text-yellow-400 mb-6">{score} очков</p>
                  <button
                    onClick={isSinglePlayer ? startSinglePlayer : resetToMenu}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-2xl text-2xl font-bold hover:scale-110 transition-transform"
                  >
                    🔄 {isSinglePlayer ? 'Ещё раз!' : 'В меню'}
                  </button>
                  {isSinglePlayer && (
                    <button
                      onClick={resetToMenu}
                      className="block w-full mt-4 bg-slate-700 text-white px-8 py-3 rounded-xl text-lg hover:bg-slate-600 transition-colors"
                    >
                      ← Главное меню
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Instructions - top center */}
            {!gameOver && score < 30 && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-500/50 text-white">
                  <p className="font-medium">
                    {isSinglePlayer
                      ? '🎯 Двигай мышкой чтобы убежать!'
                      : (role === 'ninja' ? '⌨️ SPACE/E/Q для способностей!' : '🖱️ Убегай от ниндзя!')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Abilities panel - bottom */}
          {isSinglePlayer && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
              <div className="flex gap-2">
                {abilityKeys.map((key, i) => {
                  const ability = abilitiesFull[key];
                  const cooldownEnd = abilityCooldowns[key] || 0;
                  const isOnCooldown = Date.now() < cooldownEnd;
                  const cooldownPercent = isOnCooldown
                    ? ((cooldownEnd - Date.now()) / ability.cooldown) * 100
                    : 0;
                  return (
                    <div
                      key={key}
                      className={`relative ${ability.color} text-white w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all ${
                        currentAbility === key ? 'ring-2 ring-white scale-125 shadow-lg' : isOnCooldown ? 'opacity-40' : 'opacity-70'
                      }`}
                      style={{
                        boxShadow: currentAbility === key ? `0 0 20px ${ability.color === 'bg-blue-500' ? '#3b82f6' : '#ef4444'}` : 'none'
                      }}
                      title={ability.name}
                    >
                      <span className="text-lg">{ability.emoji}</span>
                      <span className="text-xs opacity-80">{i + 1}</span>
                      {isOnCooldown && (
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-black/50 rounded-b-lg"
                          style={{ height: `${cooldownPercent}%` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Multiplayer controls hint */}
          {!isSinglePlayer && role === 'ninja' && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 backdrop-blur-sm px-6 py-2 rounded-full text-white text-sm">
              ⌨️ SPACE - Прыжок | E - Рывок | Q - Телепорт
            </div>
          )}
      </div>
    );
  }

  // Fallback
  return null;
}
