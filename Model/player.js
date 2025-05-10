const mongoose=require('mongoose');


const playerSchema=new mongoose.Schema({
    name:{
        type:String
    },
    sign:{
        type:String
    },
    socketId:{
        type:String
    }
});

const Player=mongoose.model('Player',playerSchema);

module.exports=Player;