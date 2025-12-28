"use client";
import { useState, useEffect, TouchEvent, MouseEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { socket } from "../../../lib/socket";
import { THEMES } from "../../../lib/gameData";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// TYPES
type Player = { 
    id: string; 
    name: string; 
    avatar: string; 
    role: string; 
    greenChecks: number; 
    redCrosses: number; 
    eliminated: boolean;
    usedWords: string[]; 
};
type GameState = { 
  players: Player[]; 
  currentPlayerIndex: number; 
  secrets: Record<string, { green: string; red: string }>; 
  themeId: string; // NOUVEAU
};
type GameOverData = {
    winner: Player;
    players: Player[];
};

export default function Game() {
  const { roomCode } = useParams();
  const router = useRouter();
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<string>("");

  // Etats locaux
  const [wordNotes, setWordNotes] = useState<Record<string, "green" | "red" | null>>({});
  const [currentCatIndex, setCurrentCatIndex] = useState(0);
  const [viewedPlayerIndex, setViewedPlayerIndex] = useState<number>(0);

  // Ecrans et données
  const [showTransition, setShowTransition] = useState(false);
  const [transitionPlayer, setTransitionPlayer] = useState<Player | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [victoryData, setVictoryData] = useState<GameOverData | null>(null);

  // Douanier
  const [showGreenFlags, setShowGreenFlags] = useState(true);
  const [showRedFlags, setShowRedFlags] = useState(true);

  // Swipes
  const [catTouchStart, setCatTouchStart] = useState<number | null>(null);
  const [catTouchEnd, setCatTouchEnd] = useState<number | null>(null);
  const [playerTouchStart, setPlayerTouchStart] = useState<number | null>(null);
  const [playerTouchEnd, setPlayerTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const storedId = localStorage.getItem("userId");
    if (storedId) setMyId(storedId);

    socket.emit("get_game_state", roomCode);

    socket.on("game_state_update", (state: GameState) => {
      setGameState((prevState) => {
        if (victoryData || eliminatedPlayer) return state;

        const isNewTurn = prevState && prevState.currentPlayerIndex !== state.currentPlayerIndex;
        if (isNewTurn || (isFirstLoad && state.players.length > 0)) {
            const newPlayer = state.players[state.currentPlayerIndex];
            setTransitionPlayer(newPlayer);
            setShowTransition(true);
            setViewedPlayerIndex(state.currentPlayerIndex);
            setTimeout(() => setShowTransition(false), 3000);
            if(isFirstLoad) setIsFirstLoad(false);
        }
        return state;
      });

      if (state.players.length > 0 && state.players[0].id === storedId) {
        setIsHost(true);
      }
    });

    socket.on("player_eliminated", (player: Player) => {
        setEliminatedPlayer(player);
        setTimeout(() => { setEliminatedPlayer(null); }, 4000);
    });

    socket.on("game_won", (data: GameOverData) => {
        setVictoryData(data);
        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#57EA92', '#ffffff'] });
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#57EA92', '#ffffff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    });

    return () => {
      socket.off("game_state_update");
      socket.off("player_eliminated");
      socket.off("game_won");
    };
  }, [roomCode, router, isFirstLoad, victoryData, eliminatedPlayer]);

  if (!gameState) return <div className="min-h-screen bg-[#03040D] flex items-center justify-center text-white">Chargement...</div>;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) return <div className="min-h-screen bg-[#03040D] text-white">Attente...</div>;

  const isMyTurn = currentPlayer.id === myId;
  
  // DYNAMIQUE : On récupère le bon thème
  const currentTheme = THEMES.find(t => t.id === gameState.themeId) || THEMES[0];

  // Actions
  const handleAction = (action: "validate" | "refuse" | "pass") => socket.emit("douanier_action", { roomCode, action });
  const toggleUsedWord = (word: string) => { if(isHost) socket.emit("toggle_word", { roomCode, word, playerId: currentPlayer.id }); };
  const toggleWordNote = (word: string) => setWordNotes(prev => {
      const c = prev[word];
      return { ...prev, [word]: c === "green" ? "red" : c === "red" ? null : "green" };
  });

  // Nav & Swipe (Code compressé pour lisibilité, inchangé sur la logique)
  const nextCategory = () => setCurrentCatIndex((p) => (p + 1) % currentTheme.categories.length);
  const prevCategory = () => setCurrentCatIndex((p) => (p - 1 + currentTheme.categories.length) % currentTheme.categories.length);
  const nextViewedPlayer = () => setViewedPlayerIndex(p => { let n = p + 1; if (n >= gameState.players.length) n = 1; return n; });
  const prevViewedPlayer = () => setViewedPlayerIndex(p => { let n = p - 1; if (n < 1) n = gameState.players.length - 1; return n; });

  const onCatTouchStart = (e: TouchEvent) => { setCatTouchEnd(null); setCatTouchStart(e.targetTouches[0].clientX); };
  const onCatTouchMove = (e: TouchEvent) => setCatTouchEnd(e.targetTouches[0].clientX);
  const onCatTouchEnd = () => { if (!catTouchStart || !catTouchEnd) return; if (catTouchStart - catTouchEnd > 50) nextCategory(); if (catTouchStart - catTouchEnd < -50) prevCategory(); };

  const onPlayerTouchStart = (e: TouchEvent) => { setPlayerTouchEnd(null); setPlayerTouchStart(e.targetTouches[0].clientX); };
  const onPlayerTouchMove = (e: TouchEvent) => setPlayerTouchEnd(e.targetTouches[0].clientX);
  const onPlayerTouchEnd = () => { if (!playerTouchStart || !playerTouchEnd) return; if (playerTouchStart - playerTouchEnd > 50) nextViewedPlayer(); if (playerTouchStart - playerTouchEnd < -50) prevViewedPlayer(); };

  const renderScore = (player: Player) => (
    <div className="flex gap-4 bg-[#0E1224] border border-white/10 p-2 rounded-xl justify-center">
        <div className="flex gap-1">{[...Array(3)].map((_, i) => (<div key={`c-${i}`} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 shrink-0">{i < player.greenChecks && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Image src="/icons/check_green.svg" width={24} height={24} alt="V" /></motion.div>}</div>))}</div>
        <div className="flex gap-1 border-l border-white/10 pl-4">{[...Array(3)].map((_, i) => (<div key={`x-${i}`} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 shrink-0">{i < player.redCrosses && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Image src="/icons/cross_red.svg" width={24} height={24} alt="X" /></motion.div>}</div>))}</div>
    </div>
  );

  // --- ECRANS DE FIN DYNAMIQUES ---

  // 1. ÉCRAN DÉFAITE (OQTF / ENFER / ETC)
  if (eliminatedPlayer) return (
    <AnimatePresence>
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            <motion.div className="absolute inset-0 bg-danger/20 z-0" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 0.8, repeat: Infinity }} />
            <motion.div className="z-10 flex flex-col items-center gap-6 text-center" initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ x: 0 }} whileInView={{ x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5 } }}>
                {/* TITRE DYNAMIQUE */}
                <h1 className="text-[70px] font-black text-danger italic leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(234,87,90,0.8)] uppercase">
                    {currentTheme.endGame.loseTitle}
                </h1>
                <h2 className="text-white font-bold uppercase tracking-widest text-lg">
                    {eliminatedPlayer.name.toUpperCase()} {currentTheme.endGame.loseMsg}
                </h2>
                <div className="relative w-48 h-48 rounded-3xl overflow-hidden border-4 border-danger shadow-[0_0_30px_rgba(234,87,90,0.4)]">
                    <Image src={eliminatedPlayer.avatar} alt="Player" fill className="object-cover" />
                </div>
                <div className="scale-125">{renderScore(eliminatedPlayer)}</div>
            </motion.div>
        </motion.main>
    </AnimatePresence>
  );

  // 2. ÉCRAN VICTOIRE DYNAMIQUE
  if (victoryData) return (
    <main className="min-h-screen bg-[#050B14] flex flex-col p-6 font-sans overflow-y-auto animate-in zoom-in duration-500 relative">
        <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-success rounded-full opacity-30 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] bg-success rounded-full opacity-30 blur-[100px] pointer-events-none" />

        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="z-10">
            {/* TITRE DYNAMIQUE */}
            <h1 className="text-white text-center font-black uppercase text-xl mb-2 mt-4 drop-shadow-[0_0_15px_rgba(87,234,146,0.6)]">
                {currentTheme.endGame.winTitle}
            </h1>
            <p className="text-success text-center font-bold text-sm mb-6">{currentTheme.endGame.winMsg}</p>
        </motion.div>

        <motion.div className="flex flex-col items-center mb-10 z-10" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}>
            <div className="relative w-48 h-48 rounded-3xl overflow-hidden border-4 border-success shadow-[0_0_50px_rgba(87,234,146,0.4)] mb-4">
                <Image src={victoryData.winner.avatar} alt="Winner" fill className="object-cover" />
            </div>
            <h2 className="text-white font-black text-2xl mb-2">{victoryData.winner.name}</h2>
            {renderScore(victoryData.winner)}
        </motion.div>

        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto z-10">
            {victoryData.players.map((p, i) => {
                if (p.id === victoryData.winner.id || p.role === 'douanier') return null;
                const isEliminated = p.eliminated;
                return (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (i * 0.1) }} className={`flex items-center gap-3 p-3 rounded-2xl border ${isEliminated ? 'bg-danger/20 border-danger/30' : 'bg-[#0E1224] border-white/10'}`}>
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0"><Image src={p.avatar} alt={p.name} fill className="object-cover" /></div>
                        <div className="flex flex-col"><span className="text-white font-bold text-lg">{p.name}</span><span className="text-white/50 text-xs">{isEliminated ? "Éliminé" : "En attente"}</span></div>
                        <div className="ml-auto">
                            {isEliminated ? <span className="text-danger font-black italic text-lg pr-2">{currentTheme.endGame.loseStatus}</span> : <span className="text-white/70 font-bold text-xs text-right block leading-tight">En<br/>jeu</span>}
                        </div>
                    </motion.div>
                )
            })}
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push("/")} className="mt-auto w-full bg-secondary text-white font-bold uppercase py-4 rounded-xl shadow-lg mb-4 z-10">Retour à l'accueil</motion.button>
    </main>
  );

  if (showTransition && transitionPlayer) return (
    <AnimatePresence>
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#03040D] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#577AEA] rounded-full opacity-40 blur-[120px]" />
            <div className="flex flex-col items-center gap-6 z-10">
                <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#EA575A] text-white font-serif font-bold text-xl px-8 py-3 rounded-full shadow-xl mb-4 uppercase tracking-widest">TOUR DE {transitionPlayer.name}</motion.div>
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }} className="relative w-40 h-40 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl"><Image src={transitionPlayer.avatar} alt="Player" fill className="object-cover" /></motion.div>
                <div className="scale-125 mt-4">{renderScore(transitionPlayer)}</div>
            </div>
        </motion.main>
    </AnimatePresence>
  );

  return (
    <main className="min-h-screen bg-[#03040D] flex flex-col items-center p-4 relative overflow-hidden font-sans">
       <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-[#577AEA] rounded-full opacity-30 blur-[100px] pointer-events-none" />
       <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] bg-[#9C57EA] rounded-full opacity-30 blur-[100px] pointer-events-none" />

       <div className="w-full max-w-[380px] flex flex-col gap-4 z-10 relative mt-2 h-[90vh]">
          {!isHost && isMyTurn && !showTransition && (
               <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-center mb-2">
                   <div className="bg-[#577AEA] text-white font-black uppercase tracking-widest py-3 px-8 rounded-full shadow-lg text-sm animate-pulse">C'EST TON TOUR</div>
               </motion.div>
          )}

          {isHost ? (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 min-h-0">
                    <div className="bg-[#0E1224]/80 border border-white/10 rounded-2xl p-3">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-success font-black text-xs uppercase tracking-widest">GREEN FLAG</h3>
                             <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowGreenFlags(!showGreenFlags)} className="opacity-70 hover:opacity-100 p-1"><Image src={showGreenFlags ? "/icons/eye.svg" : "/icons/eye close.svg"} width={20} height={20} alt="Toggle" /></motion.button>
                        </div>
                        {showGreenFlags && (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(gameState.secrets).map((s, i) => {
                                    const isUsed = currentPlayer.usedWords?.includes(s.green);
                                    return (<motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => toggleUsedWord(s.green)} className={`font-bold text-center py-2 px-1 rounded-lg text-xs truncate transition-all ${isUsed ? 'bg-success/20 text-white/30 line-through border border-success/20' : 'bg-success text-[#03040D] hover:bg-success/90'}`}>{s.green}</motion.button>)
                                })}
                            </div>
                        )}
                    </div>
                    <div className="bg-[#0E1224]/80 border border-white/10 rounded-2xl p-3">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-danger font-black text-xs uppercase tracking-widest">RED FLAG</h3>
                             <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowRedFlags(!showRedFlags)} className="opacity-70 hover:opacity-100 p-1"><Image src={showRedFlags ? "/icons/eye.svg" : "/icons/eye close.svg"} width={20} height={20} alt="Toggle" /></motion.button>
                        </div>
                        {showRedFlags && (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(gameState.secrets).map((s, i) => {
                                    const isUsed = currentPlayer.usedWords?.includes(s.red);
                                    return (<motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => toggleUsedWord(s.red)} className={`font-bold text-center py-2 px-1 rounded-lg text-xs truncate transition-all ${isUsed ? 'bg-danger/20 text-white/30 line-through border border-danger/20' : 'bg-danger text-[#03040D] hover:bg-danger/90'}`}>{s.red}</motion.button>)
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-[#0E1224] border border-white/10 rounded-3xl p-4 shrink-0 shadow-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-3 justify-center border-b border-white/5 pb-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0"><Image src={currentPlayer.avatar} alt="Avatar" fill className="object-cover" /></div>
                        <span className="text-white font-bold text-lg truncate">{currentPlayer.name}</span>
                    </div>
                    {renderScore(currentPlayer)}
                    <div className="flex flex-col gap-2 mt-1">
                        <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleAction('validate')} className="w-full bg-success hover:bg-success/90 text-[#03040D] font-bold py-3 rounded-xl uppercase">Validé</motion.button>
                        <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleAction('refuse')} className="w-full bg-danger hover:bg-danger/90 text-[#03040D] font-bold py-3 rounded-xl uppercase">Refuser</motion.button>
                        <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleAction('pass')} className="w-full bg-transparent border border-white/10 text-white/50 hover:bg-white/5 font-bold py-2 rounded-xl uppercase text-xs">Passer (Neutre)</motion.button>
                    </div>
                </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
                {gameState.players[viewedPlayerIndex] && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0E1224] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shrink-0 relative" onTouchStart={onPlayerTouchStart} onTouchMove={onPlayerTouchMove} onTouchEnd={onPlayerTouchEnd}>
                        <div className="flex items-center gap-3 justify-center">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0"><Image src={gameState.players[viewedPlayerIndex].avatar} alt="Avatar" fill className="object-cover" /></div>
                            <span className="text-white font-bold">{gameState.players[viewedPlayerIndex].id === myId ? "Vous" : gameState.players[viewedPlayerIndex].name}</span>
                        </div>
                        {renderScore(gameState.players[viewedPlayerIndex])}
                        <div className="flex justify-center gap-1 mt-1">{gameState.players.slice(1).map((_, i) => (<div key={i} className={`w-1 h-1 rounded-full ${i + 1 === viewedPlayerIndex ? 'bg-white' : 'bg-white/20'}`} />))}</div>
                    </motion.div>
                )}
                <div className="bg-[#0E1224] border border-white/10 rounded-3xl p-4 flex-1 flex flex-col shadow-2xl min-h-0" onTouchStart={onCatTouchStart} onTouchMove={onCatTouchMove} onTouchEnd={onCatTouchEnd}>
                    <div className="text-center mb-2"><span className="text-white/50 text-[10px] font-bold uppercase tracking-widest block mb-1">{currentCatIndex + 1}. {currentTheme.categories[currentCatIndex].title.toUpperCase()}</span></div>
                    <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
                        {currentTheme.categories[currentCatIndex].words.map((word) => {
                            const note = wordNotes[word];
                            let styleClass = "bg-white/5 text-white border-2 border-transparent";
                            if (note === "green") styleClass = "bg-white text-[#03040D] border-2 border-success border-dashed shadow-[0_0_15px_rgba(87,234,146,0.3)]";
                            if (note === "red") styleClass = "bg-white text-[#03040D] border-2 border-danger border-dashed shadow-[0_0_15px_rgba(234,87,90,0.3)]";
                            return (<motion.button whileTap={{ scale: 0.98 }} key={word} onClick={() => toggleWordNote(word)} className={`w-full py-4 rounded-xl font-bold font-serif text-lg transition-all ${styleClass}`}>{word}</motion.button>)
                        })}
                    </div>
                    <p className="text-center text-white/30 text-[10px] mt-4 shrink-0 font-serif italic">Swipe pour changer de catégorie</p>
                </div>
            </div>
          )}
       </div>
    </main>
  );
}