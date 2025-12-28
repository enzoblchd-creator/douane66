export type Category = {
  id: string;
  title: string;
  words: string[];
};

export type Theme = {
  id: string;
  title: string;
  endGame: {
    winTitle: string;
    winMsg: string;
    loseTitle: string;
    loseMsg: string;
    loseStatus: string;
  };
  categories: Category[];
};

export const THEMES: Theme[] = [
  // 1. VOYAGE (Classique)
  {
    id: "voyage",
    title: "🛂 Frontière",
    endGame: {
      winTitle: "VISA OBTENU !",
      winMsg: "L'immigration accepte votre dossier.",
      loseTitle: "OQTF",
      loseMsg: "Vous sortez avec une obligation de quitter le territoire.",
      loseStatus: "OQTF"
    },
    categories: [
      { 
        id: "origine", 
        title: "Pays d'origine", 
        words: ["France", "Syrie", "Ukraine", "Colombie", "Japon", "Wakanda", "Atlantide"] 
      },
      { 
        id: "transport", 
        title: "Transport", 
        words: ["À pied", "Bateau", "Avion", "Tapis volant", "Dos de dragon", "Fusée", "Trottinette"] 
      },
      { 
        id: "motif", 
        title: "Motif", 
        words: ["Tourisme", "Travail", "Espionnage", "Amour", "Fuite", "Guerre", "Pari perdu"] 
      },
      { 
        id: "valise", 
        title: "Dans la valise", 
        words: ["Drogue", "Nounours", "Bombe", "Billets", "Saucisson", "Plan secret", "Tête humaine"] 
      },
      { 
        id: "compagnon", 
        title: "Accompagnant", 
        words: ["Seul", "Belle-mère", "Otage", "Chien", "Tigre", "Fantôme", "Jumeau maléfique"] 
      },
      { 
        id: "metier", 
        title: "Métier", 
        words: ["Boulanger", "Tueur", "Influenceur", "Médecin", "Dealer", "Chômeur", "Astronaute"] 
      }
    ]
  },

  // 2. PARADIS (Saint-Pierre)
  {
    id: "paradis",
    title: "☁️ Paradis",
    endGame: {
      winTitle: "ACCÈS PARADIS !",
      winMsg: "Saint-Pierre vous ouvre les portes des cieux.",
      loseTitle: "ENFER",
      loseMsg: "Vous descendez direct en bas. Il fait chaud.",
      loseStatus: "Damné"
    },
    categories: [
      { 
        id: "mort", 
        title: "Cause du décès", 
        words: ["Vieillesse", "Trottinette", "Crise cardiaque", "Poison", "Duel", "Trop mangé", "Rire"] 
      },
      { 
        id: "peche", 
        title: "Péché mignon", 
        words: ["Gourmandise", "Colère", "Adultère", "Mensonge", "Vol", "Paresse", "Jalousie"] 
      },
      { 
        id: "action", 
        title: "Bonne action", 
        words: ["Don du sang", "Sauver un chat", "Rien", "Aider une mamie", "Recycler", "Adopter", "Être poli"] 
      },
      { 
        id: "objet", 
        title: "Objet emporté", 
        words: ["Alliance", "Smartphone", "Doudou", "Secrets", "Nudes", "Dentier", "Pelle"] 
      },
      { 
        id: "souhait", 
        title: "Réincarnation", 
        words: ["Aigle", "Caillou", "Beyoncé", "Chat", "Président", "Arbre", "Moustique"] 
      },
      { 
        id: "requete", 
        title: "Dernier mot", 
        words: ["Voir Dieu", "Une bière", "Wi-Fi", "Retourner", "Loto", "Pardon", "Autographe"] 
      }
    ]
  },

  // 3. CLUB (Videur)
  {
    id: "club",
    title: "🪩 Boîte de Nuit",
    endGame: {
      winTitle: "ENTRÉE VIP !",
      winMsg: "Le videur vous laisse passer. Bonne soirée !",
      loseTitle: "RECALÉ",
      loseMsg: "Ça va pas être possible ce soir. Rentrez chez vous.",
      loseStatus: "Recalé"
    },
    categories: [
      { 
        id: "style", 
        title: "Style", 
        words: ["Costume", "Jogging", "Robe", "Pyjama", "Déguisement", "Torse nu", "Maillot foot"] 
      },
      { 
        id: "etat", 
        title: "État", 
        words: ["Sobre", "Pompette", "Bourré", "Défoncé", "Sous l'eau", "Hyperactif", "Dormant"] 
      },
      { 
        id: "avec", 
        title: "Accompagné de", 
        words: ["Potes", "Maman", "Personne", "Une star", "Mon ex", "Une chèvre", "La police"] 
      },
      { 
        id: "raison", 
        title: "Pourquoi ?", 
        words: ["Anniv", "Draguer", "Oublier", "Danser", "Bagarre", "Boire", "EVG/EVJF"] 
      },
      { 
        id: "shoes", 
        title: "Chaussures", 
        words: ["Baskets", "Talons", "Tongs", "Bottes", "Pieds nus", "Mocassins", "Rollers"] 
      },
      { 
        id: "phrase", 
        title: "Phrase du videur", 
        words: ["Je suis le DJ", "Ami du patron", "Oublié CNI", "Allez stp", "T'es beau", "C'est mon anniv", "Sur la liste"] 
      }
    ]
  },

  // 4. GALAXIE (Science-Fiction)
  {
    id: "espace",
    title: "👽 Galaxie",
    endGame: {
      winTitle: "CITOYEN MARSIEN",
      winMsg: "Bienvenue dans la colonie intergalactique.",
      loseTitle: "EXPULSÉ",
      loseMsg: "Retournez dans le vide spatial.",
      loseStatus: "Expulsé"
    },
    categories: [
      { 
        id: "planete", 
        title: "Planète", 
        words: ["Terre", "Mars", "Tatooine", "Krypton", "Soleil", "Trou Noir", "Namek"] 
      },
      { 
        id: "espece", 
        title: "Espèce", 
        words: ["Humain", "Robot", "Wookie", "Xénomorphe", "Martien", "Jedi", "Cyborg"] 
      },
      { 
        id: "vaisseau", 
        title: "Vaisseau", 
        words: ["Faucon Millenium", "Soucoupe", "Météorite", "TARDIS", "Vélo", "Portail", "Tesla"] 
      },
      { 
        id: "cargo", 
        title: "Cargaison", 
        words: ["Lasers", "Cristaux", "Epice", "Bébés Yoda", "Uranium", "Vaches", "Déchets"] 
      },
      { 
        id: "mission", 
        title: "Mission", 
        words: ["Invasion", "Exploration", "Diplomatie", "Commerce", "Vacances", "Fuite", "Colonisation"] 
      },
      { 
        id: "pouvoir", 
        title: "Pouvoir", 
        words: ["Voler", "Télépathe", "Invisible", "Super force", "Acide", "Temps", "Immortel"] 
      }
    ]
  }
];