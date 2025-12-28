const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log(`Joueur connecté : ${socket.id}`);

  // 1. CRÉATION
  socket.on("create_game", ({ playerName, avatar }) => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    rooms[roomCode] = {
      roomCode,
      hostId: socket.id,
      players: [{
        id: socket.id,
        name: playerName,
        avatar,
        role: "douanier",
        greenChecks: 0,
        redCrosses: 0,
        eliminated: false,
        usedWords: []
      }],
      secrets: {},
      themeId: "voyage", // Valeur par défaut
      gameStarted: false,
      currentPlayerIndex: 1 
    };

    socket.join(roomCode);
    socket.emit("game_created", { roomCode, player: rooms[roomCode].players[0] });
  });

  // 2. REJOINDRE
  socket.on("join_game", ({ roomCode, playerName, avatar }) => {
    const room = rooms[roomCode];
    if (room) {
      const newPlayer = {
        id: socket.id,
        name: playerName,
        avatar,
        role: "migrant",
        greenChecks: 0,
        redCrosses: 0,
        eliminated: false,
        usedWords: []
      };
      room.players.push(newPlayer);
      socket.join(roomCode);
      
      socket.emit("game_joined", { roomCode, player: newPlayer });
      // IMPORTANT : On envoie bien le themeId ici aussi
      io.to(roomCode).emit("update_lobby", { players: room.players, themeId: room.themeId });
    } else {
      socket.emit("error_msg", "Code introuvable !");
    }
  });

  // 3. SETUP (C'est ici que le thème est sauvegardé)
  socket.on("confirm_secrets", ({ roomCode, secretConfig, themeId }) => {
    const room = rooms[roomCode];
    if (room) {
      room.secrets = secretConfig;
      room.themeId = themeId; // Sauvegarde du thème
      io.to(roomCode).emit("update_lobby", { players: room.players, themeId: room.themeId });
    }
  });

  // 4. LANCEMENT
  socket.on("launch_game_request", (roomCode) => {
     const room = rooms[roomCode];
     if (room) {
        room.gameStarted = true;
        room.players.forEach(p => {
            p.greenChecks = 0;
            p.redCrosses = 0;
            p.eliminated = false;
            p.usedWords = [];
        });
        io.to(roomCode).emit("force_redirect_game"); 
     }
  });

  // 5. ÉTAT DU JEU
  socket.on("get_game_state", (roomCode) => {
    const room = rooms[roomCode];
    if (room) {
      io.to(roomCode).emit("game_state_update", {
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        secrets: room.secrets,
        themeId: room.themeId // On renvoie le thème à tout le monde
      });
    }
  });

  // 6. ACTION DU DOUANIER
  socket.on("douanier_action", ({ roomCode, action }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const currentPlayer = room.players[room.currentPlayerIndex];

    if (action === "validate") {
      currentPlayer.greenChecks += 1;
      if (currentPlayer.greenChecks >= 3) {
        io.to(roomCode).emit("game_won", { winner: currentPlayer, players: room.players });
        return;
      }
    } 
    else if (action === "refuse") {
      currentPlayer.redCrosses += 1;
      if (currentPlayer.redCrosses >= 3) {
        currentPlayer.eliminated = true;
        io.to(roomCode).emit("player_eliminated", currentPlayer);
        nextTurn(room);
      } else {
        nextTurn(room);
      }
    } 
    else if (action === "pass") {
      nextTurn(room);
    }

    // Mise à jour globale (avec themeId)
    io.to(roomCode).emit("game_state_update", {
      players: room.players,
      currentPlayerIndex: room.currentPlayerIndex,
      secrets: room.secrets,
      themeId: room.themeId
    });
  });

  // 7. TOGGLE MOT
  socket.on("toggle_word", ({ roomCode, word, playerId }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const targetPlayer = room.players.find(p => p.id === playerId);
    if (targetPlayer) {
        if (targetPlayer.usedWords.includes(word)) {
            targetPlayer.usedWords = targetPlayer.usedWords.filter(w => w !== word);
        } else {
            targetPlayer.usedWords.push(word);
        }
        io.to(roomCode).emit("game_state_update", {
            players: room.players,
            currentPlayerIndex: room.currentPlayerIndex,
            secrets: room.secrets,
            themeId: room.themeId
        });
    }
  });

  function nextTurn(room) {
    let attempts = 0;
    do {
        room.currentPlayerIndex += 1;
        if (room.currentPlayerIndex >= room.players.length) {
            room.currentPlayerIndex = 1; 
        }
        attempts++;
    } while (room.players[room.currentPlayerIndex].eliminated && attempts < room.players.length);
  }

  socket.on("disconnect", () => {
    console.log("Un joueur est parti");
  });
});