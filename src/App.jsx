import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

export default function MultiplayerNinjaGame() {
  const [gameState, setGameState] = useState('menu'); // menu, host, client, playing
  const [role, setRole] = useState(null); // 'ninja' or 'cursor'
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
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [particles, setParticles] = useState([]);
  const [currentAbility, setCurrentAbility] = useState(null);

  const gameAreaRef = useRef(null);
  const animationRef = useRef(null);
  const connRef = useRef(null);
  const lastTime = useRef(Date.now());

  const GAME_WIDTH = 900;
  const GAME_HEIGHT = 600;
  const GRAVITY = 0.6;
  const CHASER_SIZE = 45;
  const CURSOR_SIZE = 24;

  const abilities = {
    SUPER_JUMP: { name: 'Прыжок', emoji: '🚀', cooldown: 3000 },
    DASH: { name: 'Рывок', emoji: '⚡', cooldown: 4000 },
    TELEPORT: { name: 'Телепорт', emoji: '🌀', cooldown: 5000 }
  };

  // Generate random room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Initialize PeerJS
  useEffect(() => {
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
  }, []);

  // Host game
  const hostGame = () => {
    if (!playerName.trim()) {
      alert('Введи своё имя!');
      return;
    }

    const code = generateRoomCode();
    setRoomCode(code);
    setGameState('host');

    peer.on('connection', (conn) => {
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

  // Join game
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
      setGameState('menu');
    });

    setConnection(conn);
  };

  // Handle received data
  const handleReceivedData = (data) => {
    switch (data.type) {
      case 'welcome':
        setOpponentName(data.hostName);
        break;
      case 'join':
        setOpponentName(data.playerName);
        break;
      case 'selectRole':
        // Opponent selected role, we get the other one
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

  // Select role
  const selectRole = (selectedRole) => {
    setRole(selectedRole);
    if (connRef.current) {
      connRef.current.send({ type: 'selectRole', role: selectedRole });
    }
    setGameState('playing');
  };

  // Send game data
  const sendData = (data) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send(data);
    }
  };

  // Mouse movement handler
  useEffect(() => {
    if (gameState !== 'playing' || role !== 'cursor') return;

    const handleMouseMove = (e) => {
      if (gameAreaRef.current && !gameOver) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        const newX = Math.max(0, Math.min(GAME_WIDTH, e.clientX - rect.left));
        const newY = Math.max(0, Math.min(GAME_HEIGHT, e.clientY - rect.top));
        setMousePos({ x: newX, y: newY });
        sendData({ type: 'mouseMove', x: newX, y: newY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gameState, role, gameOver]);

  // Keyboard controls for ninja
  useEffect(() => {
    if (gameState !== 'playing' || role !== 'ninja') return;

    const handleKeyPress = (e) => {
      if (gameOver) return;

      let abilityUsed = null;
      const now = Date.now();

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
  }, [gameState, role, gameOver, currentAbility]);

  // Game loop for ninja player
  useEffect(() => {
    if (gameState !== 'playing' || role !== 'ninja' || gameOver) return;

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

        // Execute ability
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

        // Basic AI movement
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

        // Floor
        if (newChaser.y >= GAME_HEIGHT - currentSize / 2) {
          newChaser.y = GAME_HEIGHT - currentSize / 2;
          newChaser.vy = 0;
          newChaser.onSurface = 'ground';
        }

        // Ceiling
        if (newChaser.y <= currentSize / 2) {
          newChaser.y = currentSize / 2;
          newChaser.vy = Math.abs(newChaser.vy) * 0.3;
        }

        // Walls
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

        // Send updated position
        sendData({ type: 'ninjaMove', chaser: newChaser });

        return newChaser;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, role, mousePos, gameOver, currentAbility, score]);

  // Score counter
  useEffect(() => {
    if (gameState === 'playing' && role === 'ninja' && !gameOver) {
      const timer = setInterval(() => setScore(s => s + 1), 100);
      return () => clearInterval(timer);
    }
  }, [gameState, role, gameOver]);

  const resetToMenu = () => {
    setGameState('menu');
    setRole(null);
    setIsConnected(false);
    setGameOver(false);
    setScore(0);
    setChaser({ x: 450, y: 550, vx: 0, vy: 0, onSurface: 'ground', rotation: 0, scale: 1 });
    setMousePos({ x: 450, y: 300 });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Код скопирован! Отправь его другу.');
  };

  // Render menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl shadow-2xl p-10 max-w-md w-full border-4 border-purple-500">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent mb-6 text-center">
            🥷 Онлайн Ниндзя
          </h1>
          
          <div className="mb-6">
            <input
              type="text"
              placeholder="Твоё имя"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border-2 border-slate-600 focus:border-purple-500 outline-none text-lg"
            />
          </div>

          <button
            onClick={hostGame}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:scale-105 transition-transform mb-4 shadow-lg"
          >
            🎮 Создать игру
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800 text-gray-400">или</span>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Код комнаты"
              value={inputRoomCode}
              onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border-2 border-slate-600 focus:border-blue-500 outline-none text-lg uppercase"
            />
          </div>

          <button
            onClick={joinGame}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:scale-105 transition-transform shadow-lg"
          >
            🚀 Присоединиться
          </button>

          <div className="mt-6 text-gray-400 text-sm text-center">
            Один игрок управляет ниндзя,<br />другой — курсором! 🎯
          </div>
        </div>
      </div>
    );
  }

  // Render waiting room
  if ((gameState === 'host' || gameState === 'client') && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl shadow-2xl p-10 max-w-md w-full border-4 border-purple-500">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            {gameState === 'host' ? '⏳ Ожидание игрока...' : '🔌 Подключение...'}
          </h2>
          
          {gameState === 'host' && (
            <>
              <div className="bg-slate-700 rounded-xl p-6 mb-6 border-2 border-purple-400">
                <p className="text-gray-300 text-sm mb-2 text-center">Код комнаты:</p>
                <p className="text-4xl font-bold text-center text-purple-400 tracking-widest mb-4">
                  {roomCode}
                </p>
                <button
                  onClick={copyRoomCode}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  📋 Скопировать код
                </button>
              </div>
              <p className="text-gray-400 text-center text-sm">
                Отправь этот код другу, чтобы он мог присоединиться!
              </p>
            </>
          )}

          {gameState === 'client' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
            </div>
          )}

          <button
            onClick={resetToMenu}
            className="w-full mt-6 bg-slate-700 text-white px-6 py-3 rounded-xl hover:bg-slate-600 transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  // Render role selection
  if (isConnected && !role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl shadow-2xl p-10 max-w-2xl w-full border-4 border-purple-500">
          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            🎭 Выбери роль
          </h2>
          <p className="text-gray-300 text-center mb-8">
            Играешь с: <span className="text-purple-400 font-bold">{opponentName}</span>
          </p>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => selectRole('ninja')}
              className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-2xl hover:scale-105 transition-transform border-4 border-red-400"
            >
              <div className="text-6xl mb-4">🥷</div>
              <h3 className="text-2xl font-bold text-white mb-2">Ниндзя</h3>
              <p className="text-gray-200 text-sm">
                Управляй ниндзя клавишами:<br/>
                SPACE - прыжок<br/>
                E - рывок<br/>
                Q - телепорт
              </p>
            </button>

            <button
              onClick={() => selectRole('cursor')}
              className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-2xl hover:scale-105 transition-transform border-4 border-blue-400"
            >
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-2">Курсор</h3>
              <p className="text-gray-200 text-sm">
                Управляй курсором мышкой и убегай от ниндзя!<br/><br/>
                Продержись как можно дольше!
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render game
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-6xl w-full">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white mb-3">
            {role === 'ninja' ? '🥷 Ты - Ниндзя' : '🎯 Ты - Курсор'}
          </h1>
          <div className="flex justify-center gap-3 text-lg flex-wrap items-center">
            <div className="bg-purple-600 px-4 py-2 rounded-xl text-white">
              Противник: <span className="font-bold">{opponentName}</span>
            </div>
            {role === 'ninja' && (
              <div className="bg-blue-600 px-4 py-2 rounded-xl text-white font-bold">
                ⭐ Счёт: {score}
              </div>
            )}
            {currentAbility && (
              <div className="bg-red-600 px-4 py-2 rounded-xl text-white font-bold animate-pulse">
                {abilities[currentAbility].emoji} {abilities[currentAbility].name}
              </div>
            )}
          </div>
        </div>

        <div 
          ref={gameAreaRef}
          className="relative bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 rounded-2xl overflow-hidden cursor-none border-4 border-slate-700 shadow-2xl"
          style={{ 
            width: '100%', 
            maxWidth: `${GAME_WIDTH}px`, 
            height: `${GAME_HEIGHT}px`, 
            margin: '0 auto'
          }}
        >
          {/* Cursor */}
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: mousePos.x - CURSOR_SIZE / 2,
              top: mousePos.y - CURSOR_SIZE / 2,
              width: CURSOR_SIZE,
              height: CURSOR_SIZE
            }}
          >
            <div
              className="absolute rounded-full border-4 border-yellow-600"
              style={{
                inset: 0,
                background: 'radial-gradient(circle, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 0 30px rgba(251, 191, 36, 0.9)'
              }}
            >
              <div className="absolute w-3 h-3 bg-yellow-50 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Ninja */}
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

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-green-900 to-green-700" />

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-85 flex items-center justify-center z-40">
              <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-3xl p-10 text-center border-4 border-red-600">
                <div className="text-8xl mb-6">
                  {role === 'ninja' ? '🎉' : '💀'}
                </div>
                <h2 className="text-5xl font-bold text-white mb-4">
                  {role === 'ninja' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ!'}
                </h2>
                <p className="text-3xl text-red-200 mb-3">Счёт: {score}</p>
                <button
                  onClick={resetToMenu}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-2xl text-2xl font-bold hover:scale-110 transition-transform mt-4"
                >
                  🔄 В меню
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!gameOver && score < 50 && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-95 px-8 py-4 rounded-2xl z-20">
              <p className="text-gray-800 font-bold text-lg">
                {role === 'ninja' 
                  ? '⌨️ SPACE/E/Q для способностей!' 
                  : '🖱️ Убегай от ниндзя!'}
              </p>
            </div>
          )}
        </div>

        {role === 'ninja' && (
          <div className="mt-4 text-center text-gray-300 text-sm">
            ⌨️ SPACE - Прыжок | E - Рывок | Q - Телепорт
          </div>
        )}
      </div>
    </div>
  );
}
