const mongoose=require('mongoose');
const http=require('http');
const express=require('express');
const path=require('path');
const{Server}=require('socket.io');
const Player=require('./Model/player');
const Game=require('./Model/game');
const { sign } = require('crypto');


const app=express();
const server=http.createServer(app);
const io=new Server(server);
// Database are cretaed...
mongoose.connect('mongodb://127.0.0.1:27017/Tic-Tac-Toe').then(()=>console.log('DB Connected Successfully...'));

app.use(express.static(path.resolve('./public')));



// socket are created..
io.on('connection',(socket)=>{
    console.log('A USer Connected...',socket.id);

    socket.on('find',async(data)=>{
        const player=await Player.findOne({name:data.name});
        if(!player){
            const player=new Player({
                name:data.name,
                sign:'X',
                socketId:socket.id
            });

            await player.save();
            // console.log(player);
        }
        else{
            await Player.updateOne({name:data.name},{$set:{socketId:socket.id}});
        }

        let game=await Game.findOne({ActivePlayerLength:{$lt:2}});
        if(!game){
            const  gameData=new Game({
                playerInfo:{name:data.name,sign:'X',socketId:socket.id},
                status:"is-Progrees",
                maxPlayerLength:2,
                ActivePlayerLength:1,
                currentPlayerIndex:0
            });
            
            await gameData.save();
            socket.join(`${gameData._id}`);
            io.to(`${gameData._id}`).emit('gameStart',{roomId: gameData._id, player: player});
           
        }
        else{
            const gameData=await Game.updateOne(
                {_id:game._id},
                {
                    $push:{ playerInfo:{name:data.name,sign:'O',socketId:socket.id},},
                    $set:{ActivePlayerLength:2}
                }
            );
            game = await Game.findById(game._id);
            socket.join(`${game._id}`);
            io.to(`${game._id}`).emit('gameStart',{roomId: game._id, players: game.playerInfo});
            
        }
       


    });


    socket.on('playing',async(e)=>{
        // console.log('Playing Data are:',e);
        const {id,value,name}=e;
        const game=await Game.findOne({playerInfo:{$elemMatch:{name:name}}});
        // console.log('game Data:',game);

        if(game && game.status==='is-Progrees'){

            const playerIndex=game.playerInfo.findIndex(player=>player.name==name);
            // console.log('Player Index Are:',playerIndex);
            if(game.currentPlayerIndex===playerIndex){
                const xsocketID=game.playerInfo[0].socketId;
                const osocketID=game.playerInfo[1].socketId;
                const buttonIndex=parseInt(id.replace('btn',''));

                if(game.index[buttonIndex].sign===''){
                    game.index[buttonIndex]={sign:value,socketId:socket.id};
                }

                game.currentPlayerIndex=game.currentPlayerIndex === 0 ? 1 : 0; // change turn
                // console.log(game.currentPlayerIndex);

                const winner=checkWinner(game.index);

                if(winner){
                    game.status=winner==='X' ? 'X-wins' : 'O-Wins';
                    game.WinningId = winner === 'X' ? xsocketID : osocketID; 
                    socket.to(`${game._id}`).emit('gameOver',{data:'Winner',winner, winningPlayer: winner === 'X' ? game.playerInfo[0].name : game.playerInfo[1].name});
                }
                else if(game.index.every(btn => btn.sign!='')){
                    game.status='Draw';
                    socket.to(`${game._id}`).emit('gameOver',{data:'Draw'});
                 }

                await game.save();
                io.emit('updateBoard',{board:game.index,playerIndex:game.currentPlayerIndex});

            }

        }
    })
  
});





// Utility function to check for a winner
function checkWinner(board) {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (const [a, b, c] of winningCombinations) {
        if (board[a].sign && board[a].sign === board[b].sign && board[a].sign === board[c].sign) {
            return board[a].sign; // Return the winning symbol ('X' or 'O')
        }
    }
    return null;
}



app.get('/',(req,res)=>{
    res.render('./public/index');

})


server.listen(2000,()=>{
    console.log('Server are created...');
})