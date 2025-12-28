"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { socket } from "../../../lib/socket";
import { THEMES } from "../../../lib/gameData";

export default function Setup() {
  const { roomCode } = useParams();
  const router = useRouter();
  
  // ÉTATS
  const [step, setStep] = useState(0); 
  const [catIndex, setCatIndex] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, { green: string | null, red: string | null }>>({});

  const currentTheme = THEMES.find(t => t.id === selectedThemeId);
  const currentCategory = currentTheme ? currentTheme.categories[catIndex] : THEMES[0].categories[0];

  // --- LOGIQUE ---
  const handleWordClick = (word: string) => {
    const catId = currentCategory.id;
    const currentSel = selections[catId] || { green: null, red: null };

    if (currentSel.green === word) {
      setSelections({ ...selections, [catId]: { ...currentSel, green: null } });
    } else if (currentSel.red === word) {
      setSelections({ ...selections, [catId]: { ...currentSel, red: null } });
    } else if (!currentSel.green) {
      setSelections({ ...selections, [catId]: { ...currentSel, green: word } });
    } else if (!currentSel.red) {
      setSelections({ ...selections, [catId]: { ...currentSel, red: word } });
    }
  };

  const handleNextCategory = () => {
    if (!currentTheme) return;
    if (catIndex < currentTheme.categories.length - 1) {
      setCatIndex(catIndex + 1);
    } else {
      setStep(2); 
    }
  };

  const handleRandom = () => {
    if (!currentTheme) return;
    const newSelections = { ...selections };
    currentTheme.categories.forEach((cat) => {
       if (!newSelections[cat.id] || !newSelections[cat.id].green || !newSelections[cat.id].red) {
          const shuffled = [...cat.words].sort(() => 0.5 - Math.random());
          newSelections[cat.id] = { green: shuffled[0], red: shuffled[1] };
       }
    });
    setSelections(newSelections);
    setStep(2);
  };

  const handleCreateLobby = () => {
    // ICI : On envoie bien themeId au serveur
    socket.emit("confirm_secrets", { 
        roomCode, 
        secretConfig: selections, 
        themeId: selectedThemeId 
    });
    router.push(`/lobby/${roomCode}`);
  };

  // --- CONTENU DES ÉTAPES ---
  let stepContent;

  if (step === 0) {
    stepContent = (
      <>
         <h2 className="text-white font-bold uppercase tracking-widest text-sm text-center mb-4 shrink-0">Choisir le Thème</h2>
         <div className="flex flex-col gap-3 w-full flex-1 overflow-y-auto font-serif">
            {THEMES.map(t => (
              <button 
                key={t.id}
                onClick={() => setSelectedThemeId(t.id)}
                className={`p-4 rounded-xl font-bold text-lg transition-all border-2 ${selectedThemeId === t.id ? 'bg-primary text-white border-primary' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
              >
                {t.title}
              </button>
            ))}
            <button className="p-4 rounded-xl font-bold font-serif text-lg bg-black/20 text-white/30 border-2 border-white/5 cursor-not-allowed">
                Projet Futur
            </button>
         </div>
         <div className="mt-auto w-full shrink-0 pt-2">
            <button 
                onClick={() => setStep(1)} 
                disabled={!selectedThemeId}
                className={`w-full font-bold py-4 rounded-xl transition-all font-serif text-lg tracking-wide uppercase ${!selectedThemeId ? 'bg-white/10 text-white/30' : 'bg-secondary hover:bg-secondary/90 text-white active:scale-[0.98]'}`}
            >
                Suivant
            </button>
         </div>
      </>
    );
  }

  else if (step === 1 && currentTheme) {
    const sel = selections[currentCategory.id] || { green: null, red: null };
    const isValid = sel.green && sel.red;

    stepContent = (
      <>
        <h2 className="text-white font-bold uppercase tracking-widest text-sm text-center">
            Config ({catIndex + 1}/{currentTheme.categories.length})
        </h2>
        <p className="text-accent text-xs text-center -mt-4 mb-2 font-sans">
            Sélectionnez 1 Green Flag et 1 Red Flag
        </p>
        
        <h3 className="text-primary font-black uppercase tracking-widest text-xl text-center mb-2 font-serif">
            {currentCategory.title}
        </h3>

        <div className="grid grid-cols-2 gap-3 w-full flex-1 overflow-y-auto pr-1">
           {currentCategory.words.map((word) => {
             let statusClass = "bg-white/10 text-white border-white/10 hover:bg-white/20";
             if (sel.green === word) statusClass = "bg-success text-[#03040D] border-success font-black";
             if (sel.red === word) statusClass = "bg-danger text-[#03040D] border-danger font-black";

             return (
               <button
                 key={word}
                 onClick={() => handleWordClick(word)}
                 className={`py-4 px-2 rounded-xl font-bold font-serif border-2 transition-all active:scale-95 text-sm break-words ${statusClass}`}
               >
                 {word}
               </button>
             )
           })}
        </div>

        <div className="mt-4 w-full flex flex-col gap-3 shrink-0">
            <button 
                onClick={handleNextCategory}
                disabled={!isValid}
                className={`w-full font-bold py-4 rounded-xl transition-all font-serif text-lg tracking-wide uppercase ${!isValid ? 'bg-white/10 text-white/30' : 'bg-secondary hover:bg-secondary/90 text-white active:scale-[0.98]'}`}
            >
                {catIndex === currentTheme.categories.length - 1 ? "Terminer" : "Suivant"}
            </button>
            <button onClick={handleRandom} className="w-full bg-transparent border-2 border-primary text-primary hover:bg-primary/10 font-bold py-4 rounded-xl active:scale-[0.98] transition-all font-serif text-lg tracking-wide uppercase">
                Aléatoire (Tout finir)
            </button>
        </div>
      </>
    );
  }

  else if (step === 2 && currentTheme) {
    const greenFlags = currentTheme.categories.map(cat => selections[cat.id]?.green).filter(Boolean);
    const redFlags = currentTheme.categories.map(cat => selections[cat.id]?.red).filter(Boolean);

    stepContent = (
      <>
        <h2 className="text-white font-bold uppercase tracking-widest text-sm text-center mb-2 shrink-0">Récapitulatif Secret</h2>
        <p className="text-danger text-xs font-bold text-center -mt-4 mb-6 font-sans bg-danger/10 p-2 rounded-lg border border-danger/30">
            ⚠️ Ne montrez pas cet écran aux autres joueurs !
        </p>

        <div className="flex flex-col gap-4 w-full flex-1 overflow-y-auto pr-1 font-serif">
           <div className="flex flex-col gap-2">
              <h3 className="text-success font-black text-xs uppercase tracking-widest ml-1">GREEN FLAG</h3>
              <div className="grid grid-cols-2 gap-2">
                 {greenFlags.map((word, i) => (
                    <div key={i} className="bg-success text-[#03040D] font-bold text-center py-3 px-1 rounded-lg text-sm truncate">
                        {word}
                    </div>
                 ))}
              </div>
           </div>
           <div className="flex flex-col gap-2">
              <h3 className="text-danger font-black text-xs uppercase tracking-widest ml-1">RED FLAG</h3>
              <div className="grid grid-cols-2 gap-2">
                 {redFlags.map((word, i) => (
                    <div key={i} className="bg-danger text-[#03040D] font-bold text-center py-3 px-1 rounded-lg text-sm truncate">
                        {word}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="mt-auto w-full pt-4">
            <button onClick={handleCreateLobby} className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-all font-serif text-lg tracking-wide uppercase">
                Créer le salon
            </button>
        </div>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#03040D] flex flex-col items-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#577AEA] rounded-full opacity-40 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#9C57EA] rounded-full opacity-40 blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-[380px] flex flex-col gap-6 z-10 relative mt-4 h-[85vh]">
        
        {/* BOUTON RETOUR AJOUTÉ */}
        <div className="flex justify-between items-center mb-2 shrink-0 relative">
            <button onClick={() => router.push("/")} className="absolute left-0 p-2 bg-white/10 rounded-full hover:bg-white/20 transition text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div className="w-full flex justify-center pointer-events-none">
                <Image src="/logo/logo.svg" width={200} height={60} alt="DOUANE 66" priority className="object-contain drop-shadow-lg" />
            </div>
        </div>

        <div className="bg-black/20 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex flex-col gap-6 flex-1 overflow-hidden">
            {stepContent}
        </div>
      </div>
    </main>
  );
}