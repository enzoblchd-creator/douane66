"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { socket } from "../lib/socket";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(1);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState("");

  const totalAvatars = 6;

  useEffect(() => {
    if (socket.connected) socket.disconnect();
  }, []);

  const changeAvatar = (direction: "next" | "prev") => {
    if (direction === "next") {
      setAvatarIndex((prev) => (prev === totalAvatars ? 1 : prev + 1));
    } else {
      setAvatarIndex((prev) => (prev === 1 ? totalAvatars : prev - 1));
    }
  };

  const handleCreateGame = () => {
    if (!name.trim()) return alert("Il faut un pseudo !");
    socket.connect();
    socket.emit("create_game", { 
      playerName: name, 
      avatar: `/avatar/avatar_${avatarIndex}.jpg` 
    });
    
    socket.once("game_created", ({ roomCode, player }) => {
      localStorage.setItem("userId", player.id);
      localStorage.setItem("roomCode", roomCode);
      
      // --- CHANGEMENT ICI ---
      // Avant c'était : router.push(`/lobby/${roomCode}`);
      // Maintenant c'est :
      router.push(`/setup/${roomCode}`); 
    });
  };

  const handleJoinClick = () => {
    if (!showJoinInput) {
      setShowJoinInput(true);
    } else {
      if (!name.trim() || !roomCode.trim()) return alert("Pseudo et Code requis !");
      socket.connect();
      socket.emit("join_game", { 
        roomCode: roomCode.toUpperCase(), 
        playerName: name, 
        avatar: `/avatar/avatar_${avatarIndex}.jpg` 
      });
      socket.on("error_msg", (msg) => alert(msg));
      socket.once("game_joined", ({ roomCode, player }) => {
        localStorage.setItem("userId", player.id);
        router.push(`/lobby/${roomCode}`);
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#03040D] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* --- LES EFFETS DE FOND (BLOBS) --- */}
      {/* Z-0 pour être sûr qu'ils sont DERRIÈRE */}
      <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#577AEA] rounded-full opacity-60 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#9C57EA] rounded-full opacity-60 blur-[120px] pointer-events-none z-0" />

      {/* Conteneur Mobile (Z-10 pour passer DEVANT le flou) */}
      <div className="w-full max-w-[380px] flex flex-col gap-6 z-10 relative">
        
        {/* LOGO */}
        <div className="flex justify-center mb-2">
          <Image 
            src="/logo/logo.svg" 
            width={280} 
            height={80} 
            alt="DOUANE 66" 
            priority
            className="object-contain drop-shadow-lg"
          />
        </div>

        {/* --- LA GLASS CARD --- */}
        {/* backdrop-blur-xl pour l'effet verre dépoli + bg-opacity ajusté */}
        <div className="bg-[#0E1224]/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col gap-6">

          {/* INPUT NOM */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-widest text-accent uppercase ml-1 font-sans">
              Votre Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-black/60 transition-all font-bold font-serif"
              placeholder="Entrez votre pseudo..."
            />
          </div>

          {/* SÉLECTEUR AVATAR */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-widest text-accent uppercase ml-1 font-sans">
              Votre Photo
            </label>
            
            <div className="flex items-center justify-between gap-4">
              {/* CERCLES PARFAITS : h-12 w-12 + flex center */}
              <button 
                onClick={() => changeAvatar("prev")} 
                className="h-12 w-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 active:scale-90 transition border border-white/5"
              >
                <Image src="/icons/arrow-left.svg" width={20} height={20} alt="<" />
              </button>

              <div className="relative w-32 h-32 border-2 border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-black/40">
                <Image
                  src={`/avatar/avatar_${avatarIndex}.jpg`}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              </div>

              <button 
                onClick={() => changeAvatar("next")} 
                className="h-12 w-12 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 active:scale-90 transition border border-white/5"
              >
                <Image src="/icons/arrow-right.svg" width={20} height={20} alt=">" />
              </button>
            </div>
          </div>

          {/* INPUT CODE */}
          {showJoinInput && (
             <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
             <label className="text-xs font-bold tracking-widest text-accent uppercase ml-1 font-sans">
               Code de la session
             </label>
             <input
               type="text"
               value={roomCode}
               onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
               className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-primary transition-all font-serif font-bold text-center tracking-[0.2em] text-xl uppercase"
               placeholder="ABCD"
               maxLength={5}
             />
           </div>
          )}

          {/* BOUTONS D'ACTION */}
          <div className="flex flex-col gap-3 mt-2">
            {!showJoinInput && (
              <button 
                onClick={handleCreateGame}
                className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform font-serif text-lg tracking-wide"
              >
                Créer une partie
              </button>
            )}
            
            <button 
              onClick={handleJoinClick}
              className={`w-full font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform font-serif text-lg tracking-wide ${
                showJoinInput 
                  ? 'bg-primary hover:bg-primary/90 text-white' 
                  : 'bg-primary hover:bg-primary/90 text-white' // REJOINDRE EN BLEU PLEIN
              }`}
            >
              {showJoinInput ? "Valider et Rejoindre" : "Rejoindre une partie"}
            </button>

            {showJoinInput && (
               <button 
               onClick={() => setShowJoinInput(false)}
               className="text-xs text-white/40 hover:text-white mt-1 underline decoration-white/30"
             >
               Annuler
             </button>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}