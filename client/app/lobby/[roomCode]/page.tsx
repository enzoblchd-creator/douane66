"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { socket } from "../../../lib/socket";
import { THEMES } from "../../../lib/gameData";

type Player = { id: string; name: string; avatar: string; role: string; };

export default function Lobby() {
  const { roomCode } = useParams();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [themeName, setThemeName] = useState("Chargement...");

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const myId = localStorage.getItem("userId");

    // --- CORRECTION DU BUG ---
    socket.on("update_lobby", (data: any) => {
      // Le serveur envoie maintenant { players: [], themeId: "" }
      // On vérifie le format pour éviter le crash .map()
      const updatedPlayers = Array.isArray(data) ? data : data.players;
      const themeId = !Array.isArray(data) ? data.themeId : "voyage";

      if (updatedPlayers) {
          setPlayers(updatedPlayers);
          // Si je suis le premier de la liste, je suis l'hôte
          if (updatedPlayers.length > 0 && updatedPlayers[0].id === myId) {
              setIsHost(true);
          }
      }

      // Mise à jour du nom du thème affiché
      if (themeId) {
          const themeObj = THEMES.find(t => t.id === themeId);
          if (themeObj) {
              setThemeName(themeObj.title);
          }
      }
    });

    socket.on("force_redirect_game", () => {
       router.push(`/game/${roomCode}`);
    });

    return () => {
      socket.off("update_lobby");
      socket.off("force_redirect_game");
    };
  }, [router, roomCode]);

  const copyToClipboard = () => {
    if (roomCode) navigator.clipboard.writeText(roomCode as string);
  };

  const handleLaunchGame = () => {
    socket.emit("launch_game_request", roomCode);
  };

  return (
    <main className="min-h-screen bg-[#03040D] flex flex-col items-center p-4 relative overflow-hidden font-sans">
      
      <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#577AEA] rounded-full opacity-40 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#9C57EA] rounded-full opacity-40 blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-[380px] flex flex-col gap-6 z-10 relative mt-4 h-[85vh]">
        
        <div className="flex justify-center mb-2 shrink-0">
          <Image src="/logo/logo.svg" width={200} height={60} alt="DOUANE 66" priority className="object-contain drop-shadow-lg" />
        </div>

        <div className="bg-black/20 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex flex-col gap-6 flex-1 overflow-hidden">

            <div className="flex gap-3 w-full shrink-0">
                <div className="flex-[2] bg-[#0E1224] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-danger font-black text-sm tracking-wider font-serif">
                    Code : {roomCode}
                    </span>
                    <button onClick={copyToClipboard} className="opacity-70 hover:opacity-100 p-1 active:scale-90 transition">
                       <Image src="/icons/copy.svg" width={18} height={18} alt="Copy" />
                    </button>
                </div>
                <button className="flex-1 bg-[#0E1224] border border-white/10 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-white/5 active:scale-[0.98] transition text-white">
                    <span className="font-serif font-bold text-sm">Règles</span>
                    <Image src="/icons/rules.svg" width={18} height={18} alt="?" />
                </button>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
                <h2 className="text-white font-bold uppercase tracking-widest text-xs ml-1 font-sans">THÈME</h2>
                <div className="w-full bg-primary rounded-xl py-4 text-center">
                    <span className="text-white font-serif font-black text-xl uppercase tracking-wide">
                        {themeName.replace(/^[^\s]+\s/, '')}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2 flex-1 min-h-0">
                <h2 className="text-white font-bold uppercase tracking-widest text-xs ml-1 font-sans">PARTICIPANTS ({players.length})</h2>
                <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                {players.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl p-2 flex items-center gap-3 border-b-2 border-black/10">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-black/10 bg-black/10">
                            <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                        </div>
                        <span className="text-[#03040D] font-serif font-black text-base truncate">{p.name}</span>
                        {p.id === players[0]?.id && <span className="ml-auto text-[10px] bg-black/80 text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider">Hôte</span>}
                    </div>
                ))}
                {players.length === 0 && (
                    <div className="text-white/30 text-center text-sm italic mt-8 font-serif">En attente de joueurs...</div>
                )}
                </div>
            </div>

            <div className="mt-auto pt-4 shrink-0">
                {isHost ? (
                    <button 
                        onClick={handleLaunchGame}
                        className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-all font-serif text-lg tracking-wide uppercase"
                    >
                        Lancer la partie
                    </button>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-white/60 font-serif italic text-sm animate-pulse">En attente de l’hôte...</p>
                    </div>
                )}
            </div>

        </div>
      </div>
    </main>
  );
}