import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

const APP_VERSION = "1.3.0";

// Animated Ninja Character Component
const AnimatedChaser = ({ x, y, size, rotation, opacity, ability, isClone, vx, vy, onSurface, score }) => {
  const runCycle = Math.sin((score || 0) * 0.3) * 25;
  const armSwing = Math.sin((score || 0) * 0.4) * 30;
  const isRunning = Math.abs(vx || 0) > 1;
  const isJumping = !onSurface && Math.abs(vy || 0) > 2;
  const isOnWall = onSurface === 'left_wall' || onSurface === 'right_wall';

  const bodyColor = isClone ? '#ec4899' : '#dc2626';
  const headColor = '#fbbf24';

  const getLeftArmRotation = () => isJumping ? -60 : (ability === 'DASH' ? -90 : (isRunning ? armSwing : 10));
  const getRightArmRotation = () => isJumping ? 60 : (ability === 'DASH' ? 90 : (isRunning ? -armSwing : -10));
  const getLeftLegRotation = () => isJumping ? -30 : (isRunning || isOnWall ? -runCycle * 1.8 : 5);
  const getRightLegRotation = () => isJumping ? 30 : (isRunning || isOnWall ? runCycle * 1.8 : -5);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x - size * 1.2,
        top: y - size * 1.2,
        width: size * 2.4,
        height: size * 2.4,
        opacity,
        transform: `rotate(${rotation}deg)`,
        transition: 'all 0.1s ease-out'
      }}
    >
      {ability && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${bodyColor}60, transparent 70%)`,
            transform: 'scale(1.5)',
            animation: 'pulse 1s infinite'
          }}
        />
      )}

      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          filter: ability === 'GHOST' ? 'blur(3px) opacity(0.5)' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
          transform: ability === 'VORTEX' ? `rotate(${(score || 0) * 10}deg)` : 'none'
        }}
      >
        <div
          className="relative"
          style={{
            transform: `rotate(-${rotation}deg) scale(${ability === 'GROW' ? 1.3 : 0.85})`,
            transition: 'transform 0.2s',
            width: size,
            height: size
          }}
        >
          {/* Head */}
          <div
            className="absolute rounded-full"
            style={{
              width: size * 0.36,
              height: size * 0.36,
              backgroundColor: headColor,
              borderColor: '#92400e',
              borderWidth: '2px',
              borderStyle: 'solid',
              left: '50%',
              top: '5%',
              transform: `translateX(-50%) ${isRunning ? `translateY(${Math.sin((score || 0) * 0.6) * 1}px)` : ''}`,
              boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
              zIndex: 10
            }}
          >
            {/* Eyes */}
            {[0.28, 0.72].map((leftPos, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  top: '40%',
                  left: `${leftPos * 100}%`,
                  transform: 'translateX(-50%)',
                  width: size * 0.08,
                  height: size * 0.08,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                <div
                  className="absolute bg-black rounded-full"
                  style={{
                    top: ability ? '25%' : '35%',
                    left: '30%',
                    width: '45%',
                    height: '45%'
                  }}
                />
              </div>
            ))}

            {/* Mouth */}
            <div
              style={{
                position: 'absolute',
                bottom: '25%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: size * 0.14,
                height: size * 0.05,
                borderBottom: '2.5px solid #000',
                borderRadius: ability || isRunning ? '0 0 50% 50%' : '50% 50% 0 0'
              }}
            />

            {/* Headband */}
            <div
              style={{
                position: 'absolute',
                top: '30%',
                left: 0,
                right: 0,
                height: size * 0.08,
                backgroundColor: bodyColor,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            />

            {/* Headband knot */}
            <div
              style={{
                position: 'absolute',
                top: '32%',
                right: '-12%',
                width: size * 0.12,
                height: size * 0.05,
                backgroundColor: bodyColor,
                borderRadius: '2px',
                transform: isRunning ? `rotate(${Math.sin((score || 0) * 0.4) * 15}deg)` : 'rotate(0deg)',
                boxShadow: '0 2px 3px rgba(0,0,0,0.3)'
              }}
            />
          </div>

          {/* Body */}
          <div
            style={{
              position: 'absolute',
              width: size * 0.32,
              height: size * 0.42,
              backgroundColor: bodyColor,
              left: '50%',
              top: '35%',
              transform: 'translateX(-50%)',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
              border: '1px solid rgba(0,0,0,0.3)'
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: '30%',
                left: 0,
                right: 0,
                height: size * 0.04,
                backgroundColor: '#1f2937',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            />
          </div>

          {/* Arms */}
          {[
            {side: 'left', x: '28%', rotation: getLeftArmRotation()},
            {side: 'right', x: '72%', rotation: getRightArmRotation()}
          ].map((arm, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: size * 0.12,
                height: size * 0.36,
                left: arm.x,
                transform: `translateX(-50%) rotate(${arm.rotation}deg)`,
                top: '42%',
                transformOrigin: 'top center',
                transition: 'transform 0.1s'
              }}
            >
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundColor: bodyColor,
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
              }} />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-10%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: size * 0.14,
                  height: size * 0.14,
                  backgroundColor: headColor,
                  borderRadius: '50%',
                  boxShadow: '0 2px 3px rgba(0,0,0,0.3)'
                }}
              />
            </div>
          ))}

          {/* Legs */}
          {[
            {side: 'left', x: '38%', rotation: getLeftLegRotation()},
            {side: 'right', x: '62%', rotation: getRightLegRotation()}
          ].map((leg, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: size * 0.14,
                height: size * 0.36,
                left: leg.x,
                transform: `translateX(-50%) rotate(${leg.rotation}deg)`,
                top: '70%',
                transformOrigin: 'top center',
                transition: 'transform 0.1s'
              }}
            >
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backgroundColor: bodyColor,
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
              }} />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: size * 0.18,
                  height: size * 0.12,
                  backgroundColor: '#1f2937',
                  borderRadius: '50%',
                  boxShadow: '0 3px 5px rgba(0,0,0,0.5)',
                  border: '1px solid #000'
                }}
              />
            </div>
          ))}

          {/* Ability effects */}
          {ability === 'DASH' && (
            <div style={{ position: 'absolute', inset: 0 }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `-${i * 12}%`,
                    top: '35%',
                    width: '3px',
                    height: '30%',
                    backgroundColor: '#ef4444',
                    opacity: 0.8 - i * 0.15,
                    borderRadius: '2px'
                  }}
                />
              ))}
            </div>
          )}

          {ability === 'VORTEX' && (
            <>
              <div
                className="absolute border-4 border-cyan-400 rounded-full animate-spin"
                style={{ inset: '-30%', opacity: 0.7 }}
              />
              <div
                className="absolute border-3 border-cyan-300 rounded-full"
                style={{ inset: '-50%', opacity: 0.5, animation: 'spin 0.8s linear infinite reverse' }}
              />
            </>
          )}

          {ability === 'TELEPORT' && (
            <div style={{ position: 'absolute', inset: 0 }}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${50 + Math.cos(i * Math.PI / 4) * 60}%`,
                    top: `${50 + Math.sin(i * Math.PI / 4) * 60}%`,
                    width: '4px',
                    height: '4px',
                    backgroundColor: '#a855f7',
                    borderRadius: '50%',
                    boxShadow: '0 0 6px #a855f7'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
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

  const gameAreaRef = useRef(null);
  const animationRef = useRef(null);
  const connRef = useRef(null);
  const lastTime = useRef(Date.now());
  const lastAbilityTime = useRef(0);

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

  // Full abilities for single player
  const abilitiesFull = {
    SUPER_JUMP: { name: 'Супер-прыжок', cooldown: 2500, duration: 600, color: 'bg-blue-500', emoji: '🚀' },
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

  // Simple abilities for multiplayer
  const abilitiesSimple = {
    SUPER_JUMP: { name: 'Прыжок', emoji: '🚀', cooldown: 3000 },
    DASH: { name: 'Рывок', emoji: '⚡', cooldown: 4000 },
    TELEPORT: { name: 'Телепорт', emoji: '🌀', cooldown: 5000 }
  };

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
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    setPeer(newPeer);

    return () => {
      if (newPeer) newPeer.destroy();
    };
  }, [gameMode]);

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

  // Handle received data (multiplayer)
  const handleReceivedData = (data) => {
    switch (data.type) {
      case 'welcome':
        setOpponentName(data.hostName);
        break;
      case 'join':
        setOpponentName(data.playerName);
        break;
      case 'selectRole':
        setRole(data.role === 'ninja' ? 'cursor' : 'ninja');
        setGameState('playing');
        break;
      case 'startGame':
        setGameState('playing');
        break;
      case 'mouseMove':
        if (role === 'ninja') {
          setMousePos({ x: data.x, y: data.y });
        }
        break;
      case 'ninjaMove':
        if (role === 'cursor') {
          setChaser(data.chaser);
        }
        break;
      case 'gameOver':
        setGameOver(true);
        setScore(data.score);
        break;
      case 'ability':
        setCurrentAbility(data.ability);
        setTimeout(() => setCurrentAbility(null), 2000);
        break;
    }
  };

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
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

  // Start single player game
  const startSinglePlayer = () => {
    setGameMode('single');
    setGameState('singleplayer');
    setRole('cursor');
    setScore(0);
    setGameOver(false);
    setChaser({ x: 450, y: 550, vx: 0, vy: 0, onSurface: 'ground', rotation: 0, scale: 1 });
    setMousePos({ x: 450, y: 300 });
    setClones([]);
    setShockwaves([]);
    setParticles([]);
    setTrails([]);
    setCurrentAbility(null);
    setTimeScale(1);
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

  // Mouse movement
  useEffect(() => {
    if (gameState !== 'singleplayer' && gameState !== 'playing') return;
    if (gameMode === 'multi' && role !== 'cursor') return;

    const handleMouseMove = (e) => {
      if (gameAreaRef.current && !gameOver) {
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
        if (gameMode === 'multi') {
          sendData({ type: 'mouseMove', x: newX, y: newY });
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gameState, gameMode, role, gameOver, timeScale, mousePos]);

  // Keyboard controls (multiplayer ninja)
  useEffect(() => {
    if (gameState !== 'playing' || role !== 'ninja' || gameMode !== 'multi') return;

    const handleKeyPress = (e) => {
      if (gameOver) return;

      let abilityUsed = null;

      if (e.key === ' ') {
        abilityUsed = 'SUPER_JUMP';
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
        abilityUsed = 'DASH';
      } else if (e.key === 'q' || e.key === 'Q' || e.key === 'й' || e.key === 'Й') {
        abilityUsed = 'TELEPORT';
      }

      if (abilityUsed && !currentAbility) {
        setCurrentAbility(abilityUsed);
        sendData({ type: 'ability', ability: abilityUsed });
        setTimeout(() => setCurrentAbility(null), 2000);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, role, gameMode, gameOver, currentAbility]);

  // Single player game loop (AI ninja)
  useEffect(() => {
    if (gameState !== 'singleplayer' || gameOver) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = Math.min((now - lastTime.current) / 16, 2);
      lastTime.current = now;
      const dt = deltaTime * timeScale;

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

          // Jump to wall if cursor is high
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

        if (currentAbility === 'VORTEX') {
          newChaser.rotation = (prev.rotation + 15 * dt) % 360;
        } else {
          newChaser.rotation = (angle * 180 / Math.PI) + 90;
        }

        newChaser.scale = currentAbility === 'GROW' ? 1.8 : 1;

        return newChaser;
      });

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
  }, [gameState, mousePos, currentAbility, gameOver, timeScale, selectRandomAbility, executeAbility, createParticles, createTrail]);

  // Multiplayer ninja game loop
  useEffect(() => {
    if (gameState !== 'playing' || role !== 'ninja' || gameOver || gameMode !== 'multi') return;

    const animate = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTime.current) / 16, 2);
      lastTime.current = now;

      setChaser(prev => {
        let newChaser = { ...prev };
        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const currentSize = CHASER_SIZE;
        if (distance < (currentSize + CURSOR_SIZE) / 2) {
          setGameOver(true);
          sendData({ type: 'gameOver', score: score });
          return prev;
        }

        if (currentAbility) {
          switch(currentAbility) {
            case 'SUPER_JUMP':
              newChaser.vy = -18;
              newChaser.vx = Math.cos(angle) * 8;
              newChaser.onSurface = null;
              break;
            case 'DASH':
              newChaser.vx = Math.cos(angle) * 35;
              newChaser.vy = Math.sin(angle) * 35;
              break;
            case 'TELEPORT':
              const teleportDist = 100;
              const teleportAngle = angle + Math.PI + (Math.random() - 0.5) * 0.8;
              newChaser.x = Math.max(CHASER_SIZE, Math.min(GAME_WIDTH - CHASER_SIZE,
                mousePos.x + Math.cos(teleportAngle) * teleportDist));
              newChaser.y = Math.max(CHASER_SIZE, Math.min(GAME_HEIGHT - CHASER_SIZE,
                mousePos.y + Math.sin(teleportAngle) * teleportDist));
              break;
          }
        }

        const baseSpeed = 0.4;
        newChaser.vx += Math.cos(angle) * baseSpeed * dt;
        newChaser.vy += Math.sin(angle) * baseSpeed * dt;

        if (prev.onSurface !== 'left_wall' && prev.onSurface !== 'right_wall') {
          newChaser.vy += GRAVITY * dt;
        }

        newChaser.x += newChaser.vx * dt;
        newChaser.y += newChaser.vy * dt;

        newChaser.vx *= 0.97;
        newChaser.vy *= 0.99;

        newChaser.onSurface = null;

        if (newChaser.y >= GAME_HEIGHT - currentSize / 2) {
          newChaser.y = GAME_HEIGHT - currentSize / 2;
          newChaser.vy = 0;
          newChaser.onSurface = 'ground';
        }

        if (newChaser.y <= currentSize / 2) {
          newChaser.y = currentSize / 2;
          newChaser.vy = Math.abs(newChaser.vy) * 0.3;
        }

        if (newChaser.x <= currentSize / 2) {
          newChaser.x = currentSize / 2;
          newChaser.onSurface = 'left_wall';
          newChaser.vx = Math.abs(newChaser.vx) * 0.6;
          if (mousePos.y < newChaser.y - 30) {
            newChaser.vy = -4;
          }
        }

        if (newChaser.x >= GAME_WIDTH - currentSize / 2) {
          newChaser.x = GAME_WIDTH - currentSize / 2;
          newChaser.onSurface = 'right_wall';
          newChaser.vx = -Math.abs(newChaser.vx) * 0.6;
          if (mousePos.y < newChaser.y - 30) {
            newChaser.vy = -4;
          }
        }

        newChaser.rotation = (angle * 180 / Math.PI) + 90;

        sendData({ type: 'ninjaMove', chaser: newChaser });

        return newChaser;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, role, gameMode, mousePos, gameOver, currentAbility, score]);

  // Ability timer
  useEffect(() => {
    if (currentAbility && abilityTimer > 0 && gameMode === 'single') {
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
      const timer = setInterval(() => setScore(s => s + 1), 100);
      return () => clearInterval(timer);
    }
  }, [gameState, role, gameOver]);

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

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Код скопирован! Отправь его другу.');
  };

  // ============== RENDER ==============

  // Main menu - mode selection
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl animate-float opacity-20">🌟</div>
          <div className="absolute top-40 right-20 text-4xl animate-float delay-200 opacity-20">⭐</div>
          <div className="absolute bottom-32 left-20 text-5xl animate-float delay-300 opacity-20">✨</div>
          <div className="absolute bottom-20 right-10 text-6xl animate-float delay-100 opacity-20">🌙</div>
        </div>

        <div className="glass rounded-3xl shadow-2xl p-10 max-w-lg w-full border-4 border-purple-500 animate-pulse-glow relative">
          <div className="absolute top-4 right-4 version-badge bg-purple-600 text-white px-3 py-1 rounded-full">
            v{APP_VERSION}
          </div>

          <div className="text-center mb-4">
            <span className="text-8xl inline-block animate-ninja-run">🥷</span>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent mb-2 text-center animate-bounce-in">
            НИНДЗЯ ПОГОНЯ
          </h1>

          <p className="text-purple-300 text-center mb-8 animate-slide-up">
            Выбери режим игры
          </p>

          <div className="space-y-4">
            <button
              onClick={startSinglePlayer}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-5 rounded-xl text-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg btn-glow animate-slide-up delay-100 flex items-center justify-center gap-4"
            >
              <span className="text-3xl">🎮</span>
              <div className="text-left">
                <div>Одиночная игра</div>
                <div className="text-sm opacity-80 font-normal">Убегай от AI-ниндзя</div>
              </div>
            </button>

            <button
              onClick={() => { setGameMode('multi'); setGameState('mode-select'); }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-5 rounded-xl text-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg btn-glow-blue animate-slide-up delay-200 flex items-center justify-center gap-4"
            >
              <span className="text-3xl">👥</span>
              <div className="text-left">
                <div>Мультиплеер</div>
                <div className="text-sm opacity-80 font-normal">Играй с другом онлайн</div>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center animate-slide-up delay-300">
            <div className="inline-flex items-center gap-4 text-gray-400 text-sm bg-slate-700/30 px-6 py-3 rounded-xl">
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">🥷</span>
                <span>Ниндзя</span>
              </div>
              <span className="text-purple-400 text-xl">VS</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">🎯</span>
                <span>Курсор</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiplayer menu
  if (gameState === 'mode-select' && gameMode === 'multi') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl animate-float opacity-20">🌟</div>
          <div className="absolute top-40 right-20 text-4xl animate-float delay-200 opacity-20">⭐</div>
          <div className="absolute bottom-32 left-20 text-5xl animate-float delay-300 opacity-20">✨</div>
          <div className="absolute bottom-20 right-10 text-6xl animate-float delay-100 opacity-20">🌙</div>
        </div>

        <div className="glass rounded-3xl shadow-2xl p-10 max-w-md w-full border-4 border-purple-500 animate-pulse-glow relative">
          <div className="absolute top-4 right-4 version-badge bg-purple-600 text-white px-3 py-1 rounded-full">
            v{APP_VERSION}
          </div>

          <div className="text-center mb-4">
            <span className="text-6xl inline-block animate-float">👥</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2 text-center animate-bounce-in">
            Мультиплеер
          </h1>

          <p className="text-purple-300 text-center mb-6 animate-slide-up">
            Играй с другом онлайн
          </p>

          <div className="mb-6 animate-slide-up delay-100">
            <label className="text-gray-400 text-sm mb-2 block">Твоё имя</label>
            <input
              type="text"
              placeholder="Введи имя..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white border-2 border-purple-500/50 focus:border-purple-400 outline-none text-lg transition-all duration-300"
            />
          </div>

          <button
            onClick={hostGame}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:scale-105 transition-all duration-300 mb-4 shadow-lg btn-glow animate-slide-up delay-200 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🎮</span>
            <span>Создать игру</span>
          </button>

          <div className="relative my-6 animate-slide-up delay-300">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 glass text-purple-400 text-sm rounded-full">или присоединись</span>
            </div>
          </div>

          <div className="mb-4 animate-slide-up delay-300">
            <label className="text-gray-400 text-sm mb-2 block">Код комнаты</label>
            <input
              type="text"
              placeholder="XXXXXX"
              value={inputRoomCode}
              onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white border-2 border-blue-500/50 focus:border-blue-400 outline-none text-lg uppercase tracking-widest text-center font-mono transition-all duration-300"
            />
          </div>

          <button
            onClick={joinGame}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg btn-glow-blue animate-slide-up delay-400 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🚀</span>
            <span>Присоединиться</span>
          </button>

          <button
            onClick={resetToMenu}
            className="w-full mt-4 bg-slate-700/50 text-white px-6 py-3 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 flex items-center justify-center gap-2"
          >
            <span>←</span>
            <span>Назад</span>
          </button>
        </div>
      </div>
    );
  }

  // Waiting room (multiplayer)
  if ((gameState === 'host' || gameState === 'client') && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-200"></div>
        </div>

        <div className="glass rounded-3xl shadow-2xl p-10 max-w-md w-full border-4 border-purple-500 animate-pulse-glow relative">
          <div className="absolute top-4 right-4 version-badge bg-purple-600 text-white px-3 py-1 rounded-full">
            v{APP_VERSION}
          </div>

          <div className="text-center mb-6">
            <span className="text-6xl inline-block animate-float">
              {gameState === 'host' ? '⏳' : '🔌'}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6 text-center animate-bounce-in">
            {gameState === 'host' ? 'Ожидание игрока...' : 'Подключение...'}
          </h2>

          {gameState === 'host' && (
            <>
              <div className="bg-slate-700/50 rounded-2xl p-6 mb-6 border-2 border-purple-400/50 animate-slide-up">
                <p className="text-purple-300 text-sm mb-3 text-center">Код комнаты:</p>
                <p className="text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-widest mb-4 font-mono">
                  {roomCode}
                </p>
                <button
                  onClick={copyRoomCode}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>📋</span>
                  <span>Скопировать код</span>
                </button>
              </div>
              <p className="text-gray-400 text-center text-sm animate-slide-up delay-100">
                Отправь этот код другу!
              </p>
            </>
          )}

          {gameState === 'client' && (
            <div className="flex flex-col items-center gap-4 animate-slide-up">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500/30 border-t-purple-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🥷</span>
                </div>
              </div>
              <p className="text-purple-300">Ищем хоста...</p>
            </div>
          )}

          <button
            onClick={resetToMenu}
            className="w-full mt-6 bg-slate-700/50 text-white px-6 py-3 rounded-xl hover:bg-slate-600/50 transition-all duration-300 border border-slate-600 flex items-center justify-center gap-2"
          >
            <span>←</span>
            <span>Назад</span>
          </button>
        </div>
      </div>
    );
  }

  // Role selection (multiplayer)
  if (isConnected && !role && gameMode === 'multi') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-200"></div>
        </div>

        <div className="glass rounded-3xl shadow-2xl p-10 max-w-2xl w-full border-4 border-purple-500 animate-pulse-glow relative">
          <div className="absolute top-4 right-4 version-badge bg-purple-600 text-white px-3 py-1 rounded-full">
            v{APP_VERSION}
          </div>

          <div className="text-center mb-2">
            <span className="text-6xl inline-block animate-bounce-in">🎭</span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 text-center animate-bounce-in">
            Выбери роль
          </h2>

          <div className="flex items-center justify-center gap-2 mb-8 animate-slide-up">
            <span className="text-gray-400">Играешь с:</span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full font-bold">
              {opponentName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => selectRole('ninja')}
              className="group bg-gradient-to-br from-red-600/80 to-red-900/80 p-8 rounded-2xl hover:scale-105 transition-all duration-300 border-4 border-red-500/50 hover:border-red-400 animate-slide-up relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-7xl mb-4 group-hover:animate-ninja-run">🥷</div>
              <h3 className="text-2xl font-bold text-white mb-3">Ниндзя</h3>
              <div className="text-gray-200 text-sm space-y-1">
                <p className="flex items-center gap-2 justify-center">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">SPACE</span>
                  <span>Прыжок</span>
                </p>
                <p className="flex items-center gap-2 justify-center">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">E</span>
                  <span>Рывок</span>
                </p>
                <p className="flex items-center gap-2 justify-center">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">Q</span>
                  <span>Телепорт</span>
                </p>
              </div>
            </button>

            <button
              onClick={() => selectRole('cursor')}
              className="group bg-gradient-to-br from-blue-600/80 to-blue-900/80 p-8 rounded-2xl hover:scale-105 transition-all duration-300 border-4 border-blue-500/50 hover:border-blue-400 animate-slide-up delay-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-7xl mb-4 group-hover:animate-float">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-3">Курсор</h3>
              <div className="text-gray-200 text-sm">
                <p className="mb-2">Управляй курсором мышкой</p>
                <p className="flex items-center gap-2 justify-center">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">🖱️</span>
                  <span>Убегай!</span>
                </p>
                <p className="mt-2 text-yellow-300/80 text-xs">Продержись как можно дольше!</p>
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
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4">
          <div className="bg-black/80 backdrop-blur-sm border-2 border-yellow-500 px-6 py-2 rounded-full text-white font-bold text-xl">
            ⭐ {score}
          </div>
          {currentAbility && isSinglePlayer && (
            <div className={`${abilitiesFull[currentAbility]?.color || 'bg-red-500'} px-4 py-2 rounded-full text-white font-bold animate-pulse border-2 border-white`}>
              {abilitiesFull[currentAbility]?.emoji} {abilitiesFull[currentAbility]?.name}
            </div>
          )}
          {currentAbility && !isSinglePlayer && (
            <div className="bg-red-600 px-4 py-2 rounded-full text-white font-bold animate-pulse">
              {abilitiesSimple[currentAbility]?.emoji} {abilitiesSimple[currentAbility]?.name}
            </div>
          )}
          {timeScale < 1 && (
            <div className="bg-orange-500 px-4 py-2 rounded-full text-white font-bold animate-pulse">
              ⏱️ ЗАМЕДЛЕНИЕ
            </div>
          )}
          {!isSinglePlayer && (
            <div className="bg-purple-600/80 px-4 py-2 rounded-full text-white">
              vs <span className="font-bold">{opponentName}</span>
            </div>
          )}
        </div>

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

            {/* Cursor - Glowing orb */}
            <div
              className="absolute pointer-events-none z-30"
              style={{
                left: mousePos.x - CURSOR_SIZE,
                top: mousePos.y - CURSOR_SIZE,
                width: CURSOR_SIZE * 2,
                height: CURSOR_SIZE * 2
              }}
            >
              {/* Outer glow rings */}
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
                  animationDuration: '1.5s'
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  inset: '15%',
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
                  boxShadow: '0 0 60px rgba(251, 191, 36, 0.6), 0 0 100px rgba(251, 191, 36, 0.3)'
                }}
              />
              {/* Main orb */}
              <div
                className="absolute rounded-full"
                style={{
                  inset: '30%',
                  background: 'radial-gradient(circle at 30% 30%, #fef3c7 0%, #fbbf24 40%, #f59e0b 100%)',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.5)'
                }}
              />
              {/* Inner highlight */}
              <div
                className="absolute rounded-full bg-white/80"
                style={{
                  top: '35%',
                  left: '35%',
                  width: '15%',
                  height: '15%'
                }}
              />
            </div>

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
                  rotation={cloneAngle + 90}
                  opacity={opacity}
                  ability={null}
                  isClone={true}
                  vx={clone.vx}
                  vy={clone.vy}
                  onSurface={clone.onSurface}
                  score={score}
                />
              );
            })}

            {/* Main Ninja */}
            {isSinglePlayer ? (
              <AnimatedChaser
                x={chaser.x}
                y={chaser.y}
                size={chaserSize}
                rotation={chaser.rotation}
                opacity={chaserOpacity}
                ability={currentAbility}
                isClone={false}
                vx={chaser.vx}
                vy={chaser.vy}
                onSurface={chaser.onSurface}
                score={score}
              />
            ) : (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: chaser.x - CHASER_SIZE,
                  top: chaser.y - CHASER_SIZE,
                  width: CHASER_SIZE * 2,
                  height: CHASER_SIZE * 2,
                  transform: `rotate(${chaser.rotation}deg)`,
                  transition: 'all 0.1s ease-out'
                }}
              >
                <div
                  className="absolute rounded-full border-4 border-red-900"
                  style={{
                    inset: '25%',
                    background: 'radial-gradient(circle, #dc2626 0%, #991b1b 100%)',
                    boxShadow: currentAbility ? '0 0 40px rgba(220, 38, 38, 0.9)' : '0 0 20px rgba(220, 38, 38, 0.6)'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    🥷
                  </div>
                </div>
              </div>
            )}

            {/* Wall indicators */}
            {chaser.onSurface === 'left_wall' && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-48 bg-green-400 opacity-80 animate-pulse shadow-lg"
                   style={{ boxShadow: '0 0 20px rgba(74, 222, 128, 0.8)' }} />
            )}
            {chaser.onSurface === 'right_wall' && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-48 bg-green-400 opacity-80 animate-pulse shadow-lg"
                   style={{ boxShadow: '0 0 20px rgba(74, 222, 128, 0.8)' }} />
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
                    {isSinglePlayer ? '💀' : (role === 'ninja' ? '🎉' : '💀')}
                  </div>
                  <h2 className="text-5xl font-bold text-white mb-4">
                    {isSinglePlayer ? 'ПОЙМАЛИ!' : (role === 'ninja' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ!')}
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
                {Object.entries(abilitiesFull).map(([key, ability]) => (
                  <div
                    key={key}
                    className={`${ability.color} text-white w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all ${
                      currentAbility === key ? 'ring-2 ring-white scale-125 shadow-lg' : 'opacity-40'
                    }`}
                    style={{
                      boxShadow: currentAbility === key ? `0 0 20px ${ability.color === 'bg-blue-500' ? '#3b82f6' : '#ef4444'}` : 'none'
                    }}
                    title={ability.name}
                  >
                    {ability.emoji}
                  </div>
                ))}
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
