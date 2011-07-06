/* Chess Game Functions */
/* Includes PGN parser */

/* Auxiliary functions */

function extend() {
        var retVal = {};
        for (arg in arguments) {
                for (prop in arguments[arg])
                        retVal[prop] = arguments[arg][prop]; 
        }
        return retVal;
}

/*End Auxiliary functions */

chessGame = function(options) {
        this.moves = [];
        this.fens = [];
        
        this.loadOptions(options);
        if (!this.pgn === undefined)
            this.readPgn(this.pgn);
        else {
              //this.startPos = new $.chessRules.FEN();
              this.startPos = chessGame.defaults.fenString;
              this.fens.push(this.startPos)
              this.pgn = "";
              this.moves.push(this.pgn);
        }
    }

chessGame.mandatoryOptions = ["Event", "Site", "Date", "Round", "White", "Black", "Round"];
chessGame.additionalOptions = ["FEN", "Setup"];
chessGame.defaults = {
        //mandatory tags
        Event: "Internet game",
        Site: "??, ?? ???",
        Date: (function() {
            var curDate = new Date();
            var curYear = (curDate.getFullYear()).toString();
            var curMonth = (curDate.getMonth().toString().length) == 1 ? ("0" + curDate.getMonth().toString()) : curDate.getMonth().toString(); 
            var curDay = (curDate.getDate().toString().length) == 1 ? ("0" + curDate.getDate().toString()) : curDate.getDate().toString(); 
            return  curYear + "." + curMonth + "." + curDay;
            })(),
        Round: "??",
        White: "White",
        Black: "Black",
        Result: "*",
        //end mandatory tags
        FenString: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    }

chessGame.prototype.loadOptions = function(options) {
        var newOpts = extend({}, options, chessGame.defaults);
        for (var i in chessGame.mandatoryOptions)
            this[chessGame.mandatoryOptions[i]] = newOpts[chessGame.mandatoryOptions[i]];

/*      this.Event = newOpts.Event;
        this.Site = newOpts.Site;
        this.Date = newOpts.Date;
        this.Round = newOpts.Round;
        this.White = newOpts.White;
        this.Black = newOpts.Black;
        this.Result = newOpts.Result; */
    
        for (var i in newOpts) {
            //if ($.inArray(i, this.mandatoryOptions) == -1) {
            //    this.additionalOptions.push(i);
            //    this[i] = newOpts[i];
            //}
        }
        //this.additionalOptions.push("FEN");
        //this.additionalOptions.push("Setup");
        this.FEN = this.FenString;
        this.Setup = "1";
    }
    
chessGame.prototype.readPgn = function(pgn) {
        this.pgn = pgn;
        return this;
    }
    
chessGame.prototype.completeMoves = function() {
        return Math.ceil(this.moves.length / 2);    
    }
    
chessGame.prototype.tags = function() {
        return "";  
    }
    
chessGame.prototype.moveList = function() {
        var ret = "";
        var partialCounter = 0;
        var currentMove = 0;
        
        for (m in this.moves) {
            if (!(m % 2)) {
                currentMove++;
                ret += currentMove + ".";
                partialCounter++;
            }
            ret += this.moves[m] + " "
            if (partialCounter > 5) {
                ret += "\n";
                partialCounter = 0;
            }
        }
        
        return ret;
    }

chessGame.prototype.toString = function() {
        return this.tags() + "\n\n" + this.moveList() + "\n\n";    
    }

exports.chessGame = chessGame;    

exports.tagRe =  tagRe = /\[(?:\s)*(\w+)(?:\s)+\"(.+?)\"(?:\s)*\]/;        
exports.tagsRe =  tagsRe = /\[(?:\s)*(\w+)(?:\s)+\"(.+?)\"(?:\s)*\]/g;        

function parsePgn(pgnStr) {
        var game = new chessGame();
        var tagList = pgnStr.match(tagsRe);
        for (tag in tagList) {
                var thisTag = tagList[tag].match(tagRe);
                game[thisTag[1]] = thisTag[2];
        }
        return game;
}

exports.parsePgn = parsePgn;

var fs = require('fs');
exports.gameData = gameData= fs.readFileSync('./test-game.pgn', 'utf8').replace(/\n/g, " ");
exports.testGame = testGame = parsePgn(gameData);