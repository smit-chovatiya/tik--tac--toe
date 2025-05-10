const { sign } = require('jsonwebtoken');
const mongoose=require('mongoose');

const gameschema=new mongoose.Schema({
    playerInfo:{
        type:Array
    },
    index:{
        type:Array,
        default:Array(9).fill({sign:"",socketId:""})
    },
    WinningId:{
        type:String,
        default:""
    }
    ,
    status:{
        type:String
    },
    maxPlayerLength:{
        type:Number
    },

    ActivePlayerLength:{
        type:Number
    },
    currentPlayerIndex:{
        type:Number
    }
})

const Game=mongoose.model('Game',gameschema);

module.exports=Game;