//chessboard.js

;(function($) {
/**************************************************************************************************************/
/**************************** General ****************************************************************/
/**************************************************************************************************************/


/* ChessRules 2009 */

$.chessRules = {
    version: "0.01",
    defaultFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
};

$.chessRules.rowFromSquare = function(square) {return square >> 3;};

$.chessRules.colFromSquare = function(square) {return square & 7;};

$.chessRules.rowColToSquare = function(row, col) {return row * 8 + col;};

$.chessRules.isDiagonal = function(sq1, sq2) {return Math.abs($.chessRules.rowFromSquare(sq1) - 
    $.chessRules.rowFromSquare(sq2)) == Math.abs($.chessRules.colFromSquare(sq1) - 
    $.chessRules.colFromSquare(sq2));};

$.chessRules.isSameRow = function(sq1, sq2) {return $.chessRules.rowFromSquare(sq1) == $.chessRules.rowFromSquare(sq2);};

$.chessRules.isSameCol = function(sq1, sq2) {return $.chessRules.colFromSquare(sq1) == $.chessRules.colFromSquare(sq2);};

$.chessRules.distance = function (sq1, sq2) {
    var file1 = sq1 & 7;
    var file2 = sq2 & 7;
    var rank1 = sq1 >> 3;
    var rank2 = sq2 >> 3;
    return Math.max(Math.abs(file1 - file2), Math.abs(rank1 - rank2));
}

$.chessRules.squareToAlgebraic = function(square) {
    var row = $.chessRules.rowFromSquare(square) + 1;
    var col = $.chessRules.colFromSquare(square);
    return String.fromCharCode(97 + col) + "" + row.toString();
};

$.chessRules.algebraicToSquare = function(pgnSq) {
    var col = pgnSq.charCodeAt(0) - 97;
    var row = parseInt(pgnSq[1]) - 1;
    return $.chessRules.rowColToSquare(row, col);
};

/**************************************************************************************************************/
/**************************************************************************************************************/


/**************************************************************************************************************/
/**************************** FEN related ****************************************************************/
/**************************************************************************************************************/

$.chessRules.defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

$.chessRules.FEN = function(fenString) {
    this.init(fenString);
};

$.chessRules.FEN.WPIECES = ['K','Q','R','B','N','P'];
$.chessRules.FEN.BPIECES = $.map($.chessRules.FEN.WPIECES, String.toLowerCase);

$.chessRules.FEN.SLIDING = ['Q','R','B','q','r', 'b'];

$.chessRules.FEN.DIAGONAL = 9;
$.chessRules.FEN.ANTIDIAGONAL = 7;
$.chessRules.FEN.ROW = 8;
$.chessRules.FEN.COL = 1;

$.chessRules.FEN.KMOVES = [{'r': -1, 'c': -1},
                           {'r': -1, 'c': 0},
                           {'r': -1, 'c': 1},
                           {'r': 0, 'c': -1},
                           {'r': 0, 'c': 1},
                           {'r': 1, 'c': -1},
                           {'r': 1, 'c': 0},
                           {'r': 1, 'c': 1}];
$.chessRules.FEN.NMOVES = [{'r': -2, 'c': -1},
                           {'r': -2, 'c': 1},
                           {'r': -1, 'c': -2},
                           {'r': -1, 'c': 2},
                           {'r': 1, 'c': -2},
                           {'r': 1, 'c': 2},
                           {'r': 2, 'c': -1},
                           {'r': 2, 'c': 1}];
$.chessRules.FEN.WPMOVES = [{'r': 1, 'c': 0}, {'r':2, 'c': 0}];
$.chessRules.FEN.WPATTACKS = [{'r': 1, 'c': -1}, {'r': 1, 'c': 1}];
$.chessRules.FEN.BPMOVES = [{'r': -1, 'c': 0}, {'r': -2, 'c': 0}];
$.chessRules.FEN.BPATTACKS = [{'r': -1, 'c': -1}, {'r': -1, 'c': 1}];

$.chessRules.FEN.prototype.init = function(fenString) {
    if (!fenString)
        this.fenString = $.chessRules.defaultFEN;
    else
        this.fenString = fenString;
        
    var fenArray = this.fenString.split(/\s+/);
        
    this.piecePlacement = fenArray[0];
    this.activeColor = fenArray[1];
    this.castlingAvail = fenArray[2];
    this.enPassant = fenArray[3];
    this.halfMoveClock = parseInt(fenArray[4]);
    this.fullMoveNumber = parseInt(fenArray[5]);
    
    this.boardArray = [];
    this.wIndexes = [];
    this.bIndexes = [];
    this.allIndexes = [];
    this.wkIndex = -1;
    this.bkIndex = -1;
    var tmpBoard = $.chessRules.FEN.ppExpand(this.piecePlacement);
    for (var pos = 0; pos < 64; pos++) {
      this.boardArray[pos ^ 56] = tmpBoard[pos];
      if ($.inArray(tmpBoard[pos], $.chessRules.FEN.WPIECES) !=  -1)
        this.wIndexes.push(pos ^ 56);
      else if ($.inArray(tmpBoard[pos], $.chessRules.FEN.BPIECES) !=  -1)
        this.bIndexes.push(pos ^ 56);
      if (tmpBoard[pos] == 'K')
        this.wkIndex = pos ^ 56;
      if (tmpBoard[pos] == 'k')
        this.bkIndex = pos ^ 56;
    }
    $.merge(this.allIndexes, this.wIndexes);
    $.merge(this.allIndexes, this.bIndexes);
    
    this.cache = {'check': {'w': undefined, 'b': undefined},
                  'checkMate': {'w': undefined, 'b': undefined},
                  'staleMate': {'w': undefined, 'b': undefined},
                  'hasLegalMoves': {'w': undefined, 'b': undefined}};
    this.cache.canMove = {};
    for (i = 0 ; i < 64; i++)
      this.cache.canMove[i] = {};
  
}

$.chessRules.FEN.prototype.attacks = function(attackerSide, attackedSq) {
    var count = 0;
    var attackerArr = attackerSide == 'w' ? this.wIndexes : this.bIndexes;
    for (i in attackerArr)
        if (this.canMove(attackerArr[i], attackedSq))
            count++;
    return count;
    };
    
$.chessRules.FEN.prototype.pseudoLegalMoves = function(sq) {
  var ret = [];
  if (this.boardArray[sq] == '0')
    return ret;
  var friend = this.boardArray[sq] == this.boardArray[sq].toUpperCase() ? 'w' : 'b';
  var foe = friend == 'w' ? 'b' : 'w';
  var row = $.chessRules.rowFromSquare(sq);
  var col = $.chessRules.colFromSquare(sq);
  var rowcol = {'r': row, 'c': col};
  
  switch (this.boardArray[sq]) {
      case 'K':
      case 'k':
        var arr = $.map($.chessRules.FEN.KMOVES, function(val) {
            return {'r': rowcol.r + val.r, 'c': rowcol.c + val.c};
          });
        arr = $.grep(arr, function(val) {
          return !(val.r < 0 || val.r > 7 || val.c < 0 || val.c > 7);
          });
        $.merge(ret, $.map(arr, function(val) {
          return $.chessRules.rowColToSquare(val.r, val.c);
          }));
        var kSq = friend == 'w' ? 4 : 60;
        var shortCastle = friend == 'w' ? 6 : 62;
        var longCastle = friend == 'w' ? 2 : 58;
        var canShortCastle = friend == 'w' ? this.castlingAvail.indexOf('K') != -1 : this.castlingAvail.indexOf('k') != -1; 
        var canLongCastle = friend == 'w' ? this.castlingAvail.indexOf('Q') != -1 : this.castlingAvail.indexOf('q') != -1;
        if (sq == kSq && canShortCastle)
            ret.push(shortCastle);
        if (sq == kSq && canLongCastle)
            ret.push(longCastle);
        return ret;
      case 'N':
      case 'n':
        var arr = $.map($.chessRules.FEN.NMOVES, function(val) {
            return {'r': rowcol.r + val.r, 'c': rowcol.c + val.c};
          });
        arr = $.grep(arr, function(val) {
          return !(val.r < 0 || val.r > 7 || val.c < 0 || val.c > 7);
          });
        $.merge(ret, $.map(arr, function(val) {
          return $.chessRules.rowColToSquare(val.r, val.c);
          }));
        return ret;
      case 'P':
        var arr = $.map($.grep($.chessRules.FEN.WPMOVES, function(val) {
            if (row != 1)
                if (val.r == 2)
                    return false;
                else
                    return true;
            else
                return true;
            }), function(val) {
            return {'r': rowcol.r + val.r, 'c': rowcol.c + val.c};
          });
        $.merge(arr, $.map($.chessRules.FEN.WPATTACKS, function(val) {
            return {'r': rowcol.r + val.r, 'c': rowcol.c + val.c};
            }));
        arr = $.grep(arr, function(val) {
          return !(val.r < 0 || val.r > 7 || val.c < 0 || val.c > 7);
          });
        $.merge(ret, $.map(arr, function(val) {
          return $.chessRules.rowColToSquare(val.r, val.c);
          }));
        return ret;
      case 'p':
        var arr = $.map($.grep($.chessRules.FEN.BPMOVES, function(val) {
            if (row != 6)
                if (val.r == -2)
                    return false;
                else
                    return true;
            else
                return true;
            }), function(val) {
            return {'r': rowcol.r + val.r, 'c': rowcol.c + val.c};
          });
        $.merge(arr, $.map($.chessRules.FEN.BPATTACKS, function(val) {
            return {'r': rowcol.r + val.r, 'c': rowcol.c + val.c};
            }));
        arr = $.grep(arr, function(val) {
          return !(val.r < 0 || val.r > 7 || val.c < 0 || val.c > 7);
          });
        $.merge(ret, $.map(arr, function(val) {
          return $.chessRules.rowColToSquare(val.r, val.c);
          }));
        return ret;
      case 'R':
      case 'r':
        for(i = col - 1; i > -1; i--)
            ret.push($.chessRules.rowColToSquare(row, i));
        for(i = col + 1; i < 8; i++)
            ret.push($.chessRules.rowColToSquare(row, i));
        for(i = row - 1; i > -1; i--)
            ret.push($.chessRules.rowColToSquare(i, col));
        for(i = row + 1; i < 8; i++)
            ret.push($.chessRules.rowColToSquare(i, col));
        return ret;
      case 'B':
      case 'b':
        for(cl = col - 1, rw = row - 1; cl > -1 && rw > -1; cl--, rw--)
            ret.push($.chessRules.rowColToSquare(rw, cl));
        for(cl = col + 1, rw = row - 1; cl < 8 && rw > -1; cl++, rw--)
            ret.push($.chessRules.rowColToSquare(rw, cl));
        for(cl = col - 1, rw = row + 1; cl > -1 && rw < 8; cl--, rw++)
            ret.push($.chessRules.rowColToSquare(rw, cl));
        for(cl = col + 1, rw = row + 1; cl < 8 && rw < 8; cl++, rw++)
            ret.push($.chessRules.rowColToSquare(rw, cl));
        return ret;
      case 'Q':
      case 'q':
        for(i = col - 1; i > -1; i--)
            ret.push($.chessRules.rowColToSquare(row, i));
        for(i = col + 1; i < 8; i++)
            ret.push($.chessRules.rowColToSquare(row, i));
        for(i = row - 1; i > -1; i--)
            ret.push($.chessRules.rowColToSquare(i, col));
        for(i = row + 1; i < 8; i++)
            ret.push($.chessRules.rowColToSquare(i, col));
        for(cl = col - 1, rw = row - 1; cl > -1 && rw > -1; cl--, rw--)
            ret.push($.chessRules.rowColToSquare(rw, cl));
        for(cl = col + 1, rw = row - 1; cl < 8 && rw > -1; cl++, rw--)
            ret.push($.chessRules.rowColToSquare(rw, cl));
        for(cl = col - 1, rw = row + 1; cl > -1 && rw < 8; cl--, rw++)
            ret.push($.chessRules.rowColToSquare(rw, cl));
        for(cl = col + 1, rw = row + 1; cl < 8 && rw < 8; cl++, rw++)
            ret.push($.chessRules.rowColToSquare(rw, cl));
        return ret;
    
      default:
        return ret;
    }
};

$.chessRules.FEN.prototype.toString = function() {
    return this.piecePlacement + " " + this.activeColor + " " + this.castlingAvail + " " + this.enPassant + " "
    + this.halfMoveClock + " " + this.fullMoveNumber;
};

$.chessRules.FEN.prototype.asciiBoard = function() {
    return $.chessRules.FEN.ppExpand(this.piecePlacement).replace(/(\w{8})/g, "$1\n");
};


$.chessRules.FEN.prototype.canMove = function(sqFrom, sqTo) {
  if (this.cache.canMove[sqFrom][sqTo] != undefined)
    return this.cache.canMove[sqFrom][sqTo];

  this.cache.canMove[sqFrom][sqTo] = false;
  
  if (this.boardArray[sqFrom] == '0')
    return false;
  if (($.inArray(this.boardArray[sqFrom], $.chessRules.FEN.WPIECES) != -1 &&
      $.inArray(this.boardArray[sqTo], $.chessRules.FEN.WPIECES) != -1) ||
      ($.inArray(this.boardArray[sqFrom], $.chessRules.FEN.BPIECES) != -1 &&
      $.inArray(this.boardArray[sqTo], $.chessRules.FEN.BPIECES) != -1))
        return false;
  if ($.inArray(sqTo, this.pseudoLegalMoves(sqFrom)) == -1)
      return false;
  
  var piece = this.boardArray[sqFrom];
  var rowFrom = $.chessRules.rowFromSquare(sqFrom);
  var colFrom = $.chessRules.colFromSquare(sqFrom);
  var rowTo = $.chessRules.rowFromSquare(sqTo);
  var colTo = $.chessRules.colFromSquare(sqTo);
  var friend = piece == piece.toUpperCase() ? 'w' : 'b';
  var foe = friend == 'w' ? 'b' : 'w';
  
  if (piece == 'p' || piece == 'P') {
    if (colTo == colFrom && $.inArray(sqTo, this.allIndexes) != -1)
        return false;
    if (colTo != colFrom) {
        if (this.boardArray[sqTo] == '0') {
            if (this.enPassant == '-')
                return false;
            sqEnPassant = $.chessRules.algebraicToSquare(this.enPassant);
            if (sqEnPassant != sqTo)
                return false;
        }
        else {
            if ((friend == 'w' && this.boardArray[sqTo] == this.boardArray[sqTo].toUpperCase()) ||
                (friend == 'b' && this.boardArray[sqTo] == this.boardArray[sqTo].toLowerCase()))
                return false;
        }    
    }
  }
  
  if ((piece == 'k' || piece == 'K') && Math.abs(colFrom - colTo) > 1) {
      var whatCol = colTo < colFrom ? -1 : 1;
      var intermediateSq = sqFrom + whatCol;
      if(this.attacks(foe, intermediateSq) > 0)
        return false;
      if(this.attacks(foe, sqFrom) > 0)
        return false;
      if(this.boardArray[sqTo] != '0' || this.boardArray[intermediateSq] != '0')
        return false;
  }
  
  if ($.inArray(piece, $.chessRules.FEN.SLIDING) != -1) {
    var squares =  $.chessRules.FEN.intermediateSquares(sqFrom, sqTo);
 
    for (i = 0; i < squares.length; i++)
        if (this.boardArray[squares[i]] != '0')
            return false;
  }
  
  this.cache.canMove[sqFrom][sqTo] = true;
  return true;
};

$.chessRules.FEN.intermediateSquares = function(sqFrom, sqTo) {
    var ret = [];
    var incr;
    var min = Math.min(sqFrom, sqTo);
    var max = Math.max(sqFrom, sqTo);
    if ($.chessRules.isDiagonal(min, max))
        incr = $.chessRules.colFromSquare(min) <  $.chessRules.colFromSquare(max) ? $.chessRules.FEN.DIAGONAL : $.chessRules.FEN.ANTIDIAGONAL;    
    else if ($.chessRules.isSameCol(min, max))
        incr = $.chessRules.FEN.ROW;
    else if ($.chessRules.isSameRow(min, max))
        incr = $.chessRules.FEN.COL;
    else
        return ret;

    for (i = min + incr; i < max; i += incr)
        ret.push(i);
    return ret;
};
    
$.chessRules.FEN.prototype._move = function(sqFrom, sqTo, crowning, strict, notPgnMove) {
        if (this.boardArray[sqFrom] == '0')
            return null;
        
        if (strict === undefined)
          strict = true;
        
        if (notPgnMove === undefined)
            notPgnMove = false;
            
        if (strict) {
            if (this.activeColor == 'w' &&  $.inArray(this.boardArray[sqFrom], $.chessRules.FEN.BPIECES) != -1)
                return null;
            if (this.activeColor == 'b' && $.inArray(this.boardArray[sqFrom], $.chessRules.FEN.WPIECES) != -1)
                return null;
        }
        
        if (!this.canMove(sqFrom, sqTo))
            return null;
        
        var newboardArray = $.merge([], this.boardArray);
        if (!crowning)
            newboardArray[sqTo] = this.boardArray[sqFrom];
        else  {
        
              if (this.activeColor == 'b')
                  crowning = crowning.toLowerCase();
              else
                  crowning = crowning.toUpperCase();
              newboardArray[sqTo] = crowning;
        }

        newboardArray[sqFrom] = '0';
        
        if (this.enPassant != '-' && sqTo == $.chessRules.algebraicToSquare(this.enPassant) && $.inArray(this.boardArray[sqFrom], ['p', 'P']) != -1) {
            if (this.activeColor == 'w')
                newboardArray[sqTo - 8] = '0';
            else
                newboardArray[sqTo + 8] = '0';
        }
        
        if (sqFrom == 60 && sqTo == 62)
            if (this.boardArray[sqFrom] == 'k') {
                newboardArray[61] = 'r';
                newboardArray[63] = '0';
            }
        if (sqFrom == 60 && sqTo == 58)
            if (this.boardArray[sqFrom] == 'k') {
                newboardArray[59] = 'r';
                newboardArray[56] = '0';
            }
        if (sqFrom == 4 && sqTo == 6)
            if (this.boardArray[sqFrom] == 'K') {
                newboardArray[5] = 'R';
                newboardArray[7] = '0';
            }
        if (sqFrom == 4 && sqTo == 2)
            if (this.boardArray[sqFrom] == 'K') {
                newboardArray[3] = 'R';
                newboardArray[0] = '0';
            }
        
        var invboardArray = new Array(64);
        for (i = 0; i < 64; i++)
            invboardArray[i ^ 56] = newboardArray[i];
        var pp = invboardArray.join("");
        pp = $.chessRules.FEN.ppCompress(pp);
        var activeColor = this.activeColor == 'w' ? 'b' : 'w';
        var castlingAvail = this.castlingAvail;
        if (sqFrom == 0)
            castlingAvail = castlingAvail.replace("Q", "");
        if (sqFrom == 7)
            castlingAvail = castlingAvail.replace('K', '');
        if (sqFrom == 4) {
            castlingAvail = castlingAvail.replace('K', '');
            castlingAvail = castlingAvail.replace('Q', '');
        }
        if (sqFrom == 56)
            castlingAvail = castlingAvail.replace('q', '');
        if (sqFrom == 63)
            castlingAvail = castlingAvail.replace('k', '');
        if (sqFrom == 60) {
            castlingAvail = castlingAvail.replace('k', '');
            castlingAvail = castlingAvail.replace('q', '');
        }
        if (castlingAvail == "")
            castlingAvail = "-";
            
        var enPassant = "-";
        if (this.boardArray[sqFrom] == 'p' && sqTo == (sqFrom - 16))
            enPassant = $.chessRules.squareToAlgebraic(sqFrom - 8);
        if (this.boardArray[sqFrom] == 'P' && sqTo == (sqFrom + 16))
            enPassant = $.chessRules.squareToAlgebraic(sqFrom + 8);
            
        var halfMoveClock = this.halfMoveClock;
        if ($.inArray(this.boardArray[sqFrom], ['P', 'p']) != -1 || this.boardArray[sqTo] != '0')
            halfMoveClock = '0';
        else
            halfMoveClock = (parseInt(halfMoveClock) + 1).toString();
            
        var fullMoveNumber = this.fullMoveNumber
        if (this.activeColor == 'b')
            fullMoveNumber = (parseInt(this.fullMoveNumber) + 1).toString();
            
        var fs = [pp, activeColor, castlingAvail, enPassant, halfMoveClock, fullMoveNumber].join(" ");
        var f = new $.chessRules.FEN(fs);
//        var pgnmove = "***";
        var pgnmove = this.genPgnMoveString(sqFrom, sqTo, crowning);      

        if (!notPgnMove)
//            pgnmove = this.genPgnMoveString(sqFrom, sqTo, crowning);
            if (f.isCheck(f.activeColor))
                if (f.isCheckMate(f.activeColor))
                    pgnmove += "#";
                else
                    pgnmove += "+";
                
        return {position: f, move: pgnmove};

};

$.chessRules.FEN.prototype.isCheck = function(colour) {
        if (this.cache['check'][colour] != undefined)
            return this.cache['check'][colour];

        this.cache['check'][colour] = this.attacks(colour == 'w' ? 'b' : 'w', colour == 'w' ? this.wkIndex : this.bkIndex);
        return this.cache['check'][colour];
};
    
$.chessRules.FEN.prototype.isCheckMate = function(colour) {
  if (this.cache['checkMate'][colour] != undefined)
      return this.cache['checkMate'][colour];
  
  this.cache['checkMate'][colour] = !!this.isCheck(colour) && !this.hasLegalMoves(colour);
  return this.cache['checkMate'][colour];
};

$.chessRules.FEN.prototype.isStaleMate = function(colour) {
  if (this.cache['staleMate'][colour] != undefined)
      return this.cache['staleMate'][colour];
  
  this.cache['staleMate'][colour] = !this.isCheck(colour) && !this.hasLegalMoves(colour) && this.activeColor == colour;
  return this.cache['staleMate'][colour];
};

$.chessRules.FEN.prototype.isLegal = function() {
    if (this.activeColor == 'w')
        return !this.isCheck('b');
    if (this.activeColor == 'b')
        return !this.isCheck('w');
};




$.chessRules.FEN.prototype.hasLegalMoves = function(colour) {
  if (this.cache['hasLegalMoves'][colour] != undefined)
      return this.cache['hasLegalMoves'][colour];

  this.cache['hasLegalMoves'][colour] = false;

  var kIndex = colour == 'w' ? this.wkIndex : this.bkIndex;
  var kMoves = this.pseudoLegalMoves(kIndex);
  for (var i in kMoves) {
    var resp = this._move(kIndex, kMoves[i], undefined, false, true);
    if (resp)
        if (resp.position.isLegal()) {
            this.cache['hasLegalMoves'][colour] = true;
            return true;
        }
  }
  if (this.isCheck(colour) > 1)
    return this.cache['hasLegalMoves'][colour];

  var arrFriends = $.grep(colour == 'w' ? this.wIndexes : this.bIndexes, function(val) { return val != kIndex;});
  for (var f in arrFriends) {
    var arrCandidates = this.pseudoLegalMoves(arrFriends[f]);
    for (var c in arrCandidates) {
        var resp = this._move(arrFriends[f], arrCandidates[c], undefined, false, true);
        if (resp)
            if (resp.position.isLegal()) {
                this.cache['hasLegalMoves'][colour] = true;
                return true;
            }
    }
  }
  return this.cache['hasLegalMoves'][colour];
  
};

$.chessRules.FEN.prototype.getCoordsFromPgn = function(pgnmove) {
    var resp = {};

        //var patPawn = "(?:(?P<pawn>[a-h])(?:(?P<pawncapture>x[a-h][1-8])|(?P<pawndestrow>[1-8]))(?:=?(?P<crowning>[NBRQ]))?)";
        //var patPiece = "(?:(?P<piece>[NBRQK])(?P<origpiececol>[a-h])?(?P<origpiecerow>[1-8])?x?(?P<piecedestination>[a-h][1-8]))";
        //var patShortCastling = "(?P<shortcastling>[0O]-[0O])";
        //var patLongCastling = "(?P<longcastling>[0O]-[0O]-[0O])";
        //var pat = "^(?:" + patPawn + "|" + patPiece + "|" + patShortCastling + "|" + patLongCastling + ")(?:(?P<check>\+)|(?P<mate>#))?$";
        var patPawn = "(?:([a-h])(?:(x[a-h][1-8])|([1-8]))(?:=?([NBRQ]))?)";
        var patPiece = "(?:([NBRQK])([a-h])?([1-8])?x?([a-h][1-8]))";
        var patShortCastling = "([0O]-[0O])";
        var patLongCastling = "([0O]-[0O]-[0O])";
        var groups = {
          pawn: 1, pawncapture: 2, pawndestrow: 3, crowning: 4, piece: 5, origpiececol: 6,
          origpiecerow: 7, piecedestination: 8, shortcastling: 9, longcastling: 10
        };
        var pat = "^(?:" + patPawn + "|" + patPiece + "|" + patShortCastling + "|" + patLongCastling + ")(?:[+#]?)$";
        var regexp = new RegExp(pat);
        
        var sqFrom = -1;
        var sqTo = -1;
        var m = regexp.exec(pgnmove);
        if (!m)
            return null;
        else {
            //for (i in groups)
            //    print(i + ": " + m[groups[i]]);
            if (m[groups['shortcastling']]) {
                if (this.activeColor == 'w') {
                    resp.sqFrom = 4;
                    resp.sqTo = 6;
                    resp.piece = 'K';
                }
                else {
                    resp.sqFrom = 60;
                    resp.sqTo = 62;
                    resp.piece = 'k';
                }
                resp.crowning = undefined;
                return resp;
            }
            if (m[groups['longcastling']]) {
                if (this.activeColor == 'w') {
                    resp.sqFrom = 4;
                    resp.sqTo = 2;
                    resp.piece = 'K';
                }
                else {
                    resp.sqFrom = 60;
                    resp.sqTo = 58;
                    resp.piece = 'k';
                }
                resp.crowning = undefined;
                return resp;
            }
            var that = this;
            if (m[groups['pawn']]) {
                var thePiece = this.activeColor == 'w' ? 'P' : 'p';
                resp.piece = thePiece;
                var boardPawns = $.grep($.map(this.boardArray, function(val, ind) {
                    if (val == thePiece)
                      return ind;
                    else return -1;
                  }), function(val) {
                  if (val != -1)
                    return true;
                  else
                    return false;
                      });
                var origCol = m[groups['pawn']].charCodeAt(0) - 97;
                //print("Original column: " + m[groups['pawn']] + " : " + origCol);
                var origRow = -1;
                var destRow = -1;
                var destCol = -1;
                if (m[groups['pawndestrow']]) { //pawn move
                    destCol = origCol;
                    destRow = parseInt(m[groups['pawndestrow']]) - 1;
                }
                else { //pawncapture
                    destCol = m[groups['pawncapture']].charCodeAt(1) - 97;
                    destRow = parseInt(m[groups['pawncapture']].charAt(2)) - 1;
                }
                if ((destRow == 7 || destRow == 0) && !m[groups['crowning']])
                    return null;
                if ((destRow != 7 && destRow != 0) && !!m[groups['crowning']])
                    return null;
                if (m[groups['crowning']]) {
                    resp.piece = m[groups['crowning']];
                    if (this.activeColor == 'b')
                        resp.piece = resp.piece.toLowerCase();
                    else
                        resp.piece = resp.piece.toUpperCase();
                }
                for (i = 0; i < boardPawns.length; i++) {
                    if ($.chessRules.colFromSquare(boardPawns[i]) == origCol) {
                        var boardMoves = this.pseudoLegalMoves(boardPawns[i]);
                        boardMoves = $.grep(boardMoves, function(val) {
                          return that.canMove(boardPawns[i], val);
                        });
                        if ($.inArray($.chessRules.rowColToSquare(destRow, destCol), boardMoves) != -1) {
                            sqFrom = boardPawns[i];
                            sqTo = $.chessRules.rowColToSquare(destRow, destCol);
                            break;
                       }
                    }
                }
                if (sqTo != -1 && sqFrom != -1) {
                    resp.sqFrom = sqFrom;
                    resp.sqTo = sqTo;
                    resp.crowning = m[groups['crowning']];
                    return resp;
                }
                else
                    return null;
            }
            
            if (m[groups['piece']]) {
                if (!!m[groups['crowning']])
                    return null;
                var thePiece;  
                if (m[groups['piece']] == 'N') 
                    if (this.activeColor == 'w')
                        thePiece = 'N';
                    else
                        thePiece = 'n';
                else if (m[groups['piece']] == 'B')
                    if (this.activeColor == 'w')
                        thePiece = 'B';
                    else
                        thePiece = 'b';
                else if (m[groups['piece']] == 'R')
                    if (this.activeColor == 'w')
                        thePiece = 'R';
                    else
                        thePiece = 'r';
                else if (m[groups['piece']] == 'Q')
                    if (this.activeColor == 'w')
                        thePiece = 'Q';
                    else
                        thePiece = 'q';
                else if (m[groups['piece']] == 'K')
                    if (this.activeColor == 'w')
                        thePiece = 'K';
                    else
                        thePiece = 'k';
                resp.piece = thePiece;
                
                var boardPieces = $.grep($.map(this.boardArray, function(val, ind) {
                    if (val == thePiece)
                      return ind;
                    else return -1;
                  }), function(val) { return (val != -1); });
                
                sqTo = $.chessRules.algebraicToSquare(m[groups['piecedestination']]);
 
                
 
                var candidates = [];
                for (var i = 0; i < boardPieces.length; i++) {
                    var mySq = boardPieces[i];
                    if (this.canMove(mySq, sqTo))
                        candidates.push(mySq);
                }
                
 
                if (!candidates.length)
                    return null;
                if (candidates.length == 1)
                    sqFrom = candidates[0];
                else {
                    if (m[groups['origpiececol']] && m[groups['origpiecerow']]) {
                        var oRow = parseInt(m[groups['origpiecerow']]) - 1;
                        var oCol = m[groups['origpiececol']].charCodeAt(0) - 97;
                        var oSq = $.chessRules.rowColToSquare(oRow, oCol);
                        for (var i = 0; i < candidates.length; i++) {
                            if (candidates[i] == oSq) {
                                sqFrom = candidates[i];
                                break;
                            }
                        }
                    }
                    else if (m[groups['origpiececol']]) {
                        var oCol = m[groups['origpiececol']].charCodeAt(0) - 97;
                        for (var i = 0; i < candidates.length; i++) {
                            if ($.chessRules.colFromSquare(candidates[i]) == oCol) {
                                sqFrom = candidates[i];
                                break;
                            }
                        }
                    }
                    else if (m[groups['origpiecerow']]) {
                        var oRow = parseInt(m[groups['origpiecerow']]) - 1;
                        for (var i = 0; i < candidates.length; i++) {
                            if ($.chessRules.rowFromSquare(candidates[i]) == oRow) {
                                sqFrom = candidates[i];
                                break;
                            }
                        }
                    }
                    else
                        return null;
                }
                
                if (sqFrom == -1)
                    return null;
                else {
                    resp.crowning = m[groups['crowning']];
                    resp.sqFrom = sqFrom;
                    resp.sqTo = sqTo;
                    return resp;
                }
            }
        }

    return null;
};

$.chessRules.FEN.prototype._pgnMove = function(pgn, strict) {
    if (strict === undefined)
      strict = true;
    
    var resp = this.getCoordsFromPgn(pgn);
    if (!resp)
        return null;
    return this._move(resp.sqFrom, resp.sqTo, resp.crowning, strict);
};            



$.chessRules.FEN.prototype.getBitboardFromSquare = function(sq) {
        switch (this.boardArray[sq]) {
          case '0':
            return new $.chessRules.Bitboard();
          case 'p':
            return this.bbBPawns;
          case 'P':
            return this.bbBPawns;
          case 'n':
            return this.bbBKnights;
          case 'N':
            return this.bbWKnights;
          case 'b':
            return this.bbBBishops;
          case 'B':
            return this.bbWBishops;
          case 'r':
            return this.bbBRooks;
          case 'R':
            return this.bbWRooks;
          case 'q':
            return this.bbBQueens;
          case 'Q':
            return this.bbWQueens;
          case 'k':
            return this.bbBKing;
          case 'K':
            return this.bbWKing;
        }

        return new $.chessRules.Bitboard();
}


$.chessRules.FEN.prototype.genPgnMoveString = function(sqFrom, sqTo, crowning, full) {
        if (crowning == undefined)
          crowning = null;
        if (full == undefined)
          full = false;
          
        var resp = {};
        if (full) {
            resp['prefix'] = this.fullMoveNumber + ".";
            if (this.activeColor == 'b')
                resp['prefix'] += '..';
        }
        else
            resp['prefix'] = '';
            
        resp['piece'] = this.boardArray[sqFrom].toUpperCase();
        if ((sqFrom == 4 && sqTo == 6 && resp['piece'] == 'K') || (sqFrom == 60 && sqTo == 62 && resp['piece'] == 'K'))
            return resp['prefix'] + '0-0';
        if ((sqFrom == 4 && sqTo == 2 && resp['piece'] == 'K') || (sqFrom == 60 && sqTo == 58 && resp['piece'] == 'K'))
            return resp['prefix'] + '0-0-0';
        if (resp['piece'] == 'P')
            resp['piece'] = '';
        resp['disAmbigOrigin'] = '';
        var occupied = [];
        var that = this;
        $.grep(this.boardArray, function(val, ind) {
           if (val == that.boardArray[sqFrom] && ind != sqFrom)
                occupied.push(ind);
           return true;
        });
        
        try {
            if (resp['piece'] != "" && occupied.length > 0) {
                for (sq = 0; sq < occupied.length; sq++) {
                    if (occupied[sq] != sqFrom) {
                        if (this.canMove(occupied[sq], sqTo)) {
                            if ($.chessRules.colFromSquare(sqFrom) != $.chessRules.colFromSquare(occupied[sq]))
                                resp['disAmbigOrigin'] += String.fromCharCode(97 + $.chessRules.colFromSquare(sqFrom));
                            else
                                resp['disAmbigOrigin'] += (($.chessRules.rowFromSquare(sqFrom) + 1) + "");
                            break;
                        }
                    }
                }
            }
        }
        catch(e) {alert(e);}
        
        if (this.boardArray[sqTo] != '0')
            resp['capture'] = 'x';
        else
            resp['capture'] = '';
        if (resp['piece'] == '' && (resp['capture'] == 'x' || $.chessRules.colFromSquare(sqFrom) != $.chessRules.colFromSquare(sqTo))) {
            resp['capture'] = 'x';
            resp['piece'] = String.fromCharCode(97 + $.chessRules.colFromSquare(sqFrom));
            resp['destiny'] = $.chessRules.squareToAlgebraic(sqTo);
        }
        else
            resp['destiny'] = $.chessRules.squareToAlgebraic(sqTo);
        
        if (crowning)
            resp['crowning'] = crowning;
        else
            resp['crowning'] = "";
                
        return resp['prefix'] + resp['piece'] + resp['disAmbigOrigin'] + resp['capture'] + resp['destiny'] + resp['crowning'];
}        




$.chessRules.FEN.prototype.move = function() {

        if (arguments.length ==  0)
          return null;
        
        var strict;
        var crowning;
        var sqFrom;
        var sqTo;
        
        if (typeof arguments[0] === 'number') {
          if (arguments.length == 1)
            return null;
          try {
            sqFrom = parseInt(arguments[0]);
            sqTo = parseInt(arguments[1]);
            if (isNaN(sqFrom) || isNaN(sqTo))
              return null;
            if (arguments.length > 2)
              crowning = arguments[2];
            if (arguments.length > 3)
              strict = !!arguments[3];
            return this._move(sqFrom, sqTo, crowning, strict);
          }
          catch(e) {
            return null;
          }
        }

        if (typeof arguments[0] === 'string') {
          try {
            if (arguments.length > 1)
              strict = !!arguments[1];
//          var pat = '^(?P<sqFrom>[a-h][1-8])-?(?P<sqTo>[a-h][1-8])=?(?P<crowning>[QRBN])?(?:(?P<check>\+)|(?P<mate>#))?$'
            var pat = '^([a-h][1-8])-?([a-h][1-8])=?([QRBN])?[+#]?$';
            var regex = new RegExp(pat);
            var m = regex.exec(arguments[0]);
            if (!m)
                return this._pgnMove(arguments[0], strict);
            else {
                try {
                    sqFrom = $.chessRules.algebraicToSquare(m[1]);
                    sqTo = $.chessRules.algebraicToSquare(m[2]);
                    return this._move(sqFrom, sqTo, m[3], strict);
                }
                catch(e) {
                    return null;
                }
            }
          }
          
          catch(e) {
            return null;
          }
        }
        
        return null;
}


$.chessRules.FEN.getSqColor = function(sq) {
    if (($.chessRules.rowFromSquare(sq) % 2) == 0)
        return ['b', 'w'][sq % 2];
    else
        return ['w', 'b'][sq % 2];
}
            
$.chessRules.FEN.ppExpand = function(compressedPP) {
    if (!compressedPP)
        compressedPP = $.chessRules.defaultFEN.split(/\s+/)[0];
    var expandedPP = compressedPP.replace("/", "", "g");
    expandedPP = expandedPP.replace(/\d/g, (function(matched) {
        var num = parseInt(matched);
        var ret = "";
        for (var i = 0; i < num; i++)
            ret += "0";
        return ret;
     }));      
    return expandedPP;
}; 

$.chessRules.FEN.ppCompress = function(expandedPP) {
    if (!expandedPP)
        expandedPP = $.chessRules.FEN.ppExpand();
    var compressedPP = expandedPP.replace(/(\w{8})(?=\w)/g, "$1/");
    compressedPP = compressedPP.replace(/0{1,8}/g, (function(matched) {
        return matched.length.toString();
     }));
    return compressedPP;
}; 

})(jQuery);

;(function($) {
    $.chessBoard = function(options) {
        var self = this;
        $.chessBoard.numBoards++;
        
        this.currentPosition = undefined;
        this.dragStart = undefined;
        this.draggedPiece = undefined;
        
        this.errors = [];
        this.game = new $.chessGame();
        this.fens = [];
        this.pgnmoves = [];
        
        var opts = $.extend({}, $.chessBoard.defaults, options);

        this.setOptions(opts);

        this.pieces = {};
        
        this.loadPieces();
        
        this.ui = $('<div style="' +
          'background: #fff; ' +
          'border: 0; ' +
//          'width: ' + this.size + 'px; ' +
//          'height: ' + this.size + 'px; ' +
          'margin: 1em;" id="' +
          this.id +
          '" class="chessBoard"></div>');
        this.ui.appendTo($(this.container));
        //.draggable();//.resizable({resize: this.onResize});
        $('<span class="boardspan" style="left; top: 0; margin-right: 1px;">' +
          "<table class='board' width=" + self.size + " style='border-collapse: collapse; table-layout: fixed;'>" +
          "<col width=" + self.size / 8 + ">" + "<col width=" + self.size / 8 + ">" + "<col width=" + self.size / 8 + ">" + "<col width=" + self.size / 8 + ">" + "<col width=" + self.size / 8 + ">" + "<col width=" + self.size / 8 + ">" + "<col width=" + self.size / 8 + ">" + "<col width=" + self.size / 8 + ">" + 
          "<tr><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td></tr>" +
          "<tr><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td></tr>" +
          "<tr><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td></tr>" +
          "<tr><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td></tr>" +
          "<tr><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td></tr>" +
          "<tr><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td></tr>" +
          "<tr><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td></tr>" +
          "<tr><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td><td class='square'></td></tr>" +
          "</table>" +
          "</span>" +
          '<span class="movelistspan" style="float: left; top: 0; margin-left: 1px; max-height: 0em; max-width: 20em; width: 10em; overflow: auto;">' +
          "<table class='moveList' style='border: solid 1px;'>" +
          "<thead style='background-color: #ddd;'><tr><th>&nbsp;</th><th>" + this.game.white + "</th><th>" + this.game.black + "</th></tr></thead>" +
          "<tbody>" +
          "</tbody>" +
          "</table>" +
          "</span>" +
          "").appendTo("#" + this.id);
        
        this.moveListRowPattern ='<tr><td class="movement">0</td><td class="movement pgn" style="cursor: pointer;"></td><td class="movement pgn" style="cursor: pointer;"></td></tr>';
        
        $("td.square").droppable().bind("drop", {parent: this}, function(ev, ui) {
            var sqto = $(ev.target).data("properties").index;
            var sqfrom = ev.data.parent.dragStart;
            var piece = ev.data.parent.draggedPiece;
            resp = ev.data.parent.makeMove(sqfrom, sqto);
            if (!resp)
                ev.data.parent.setPosition(ev.data.parent.currentPosition);
            return resp;
        });

        $("img.piece").live("dragstart", {parent: self}, function(ev, ui) {
            var properties = $(ev.target).parent().data("properties");
            self.dragStart = properties.index;
            self.draggedPiece = properties.piece;
            });
        
        $("#" + this.id + " table.moveList>tbody tr").remove();
        
        this.doPaint();
        this.doResize();
        this.setPosition();

        $("#" + this.id + " span.movelistspan").position({
            my: "left top",
            of: $("#" + this.id + " span.boardspan"),
            at: "right top",
            offset: "5 0"
            })
            .css("max-height", this.size);
            
        $("#" + this.id + " table.moveList tbody td.pgn").live("click", function() {
            try {
                if ($.trim($(this).text()) == "")
                    return;
                var currMov = $("#" + self.id + " table.moveList tbody td.pgn").index(this) + 1;
                self.setPosition(currMov);
                //$("#" + self.id + " table.moveList tbody td.pgn").css({color: "inherit", fontWeight: "normal"});
                //$(this).css({color: "blue", fontWeight: "bold"});
                //self.highLightMoveList(currMov);
            }
            catch(e) {alert("ERROR: " + e);}
        });

    };
    
    $.chessBoard.prototype.setGame = function(pgn) {
        this.game = new $.chessGame(pgn);
        this.fens = this.game.fens;
        this.pgnmoves = this.game.moves;
        return this;
    }
    
    $.chessBoard.prototype.getCrowning = function(colour) {
        if (this.predefinedCrowning)
            return colour == 'b' ? this.crowningPiece.toLowerCase() : this.crowningPiece.toUpperCase();
        var crowned =  prompt("Seleccione una pieza para coronar (Q, R, B, N)", "Q");
        crowned = colour == 'b' ? crowned.toLowerCase() : crowned.toUpperCase();
        return crowned.charAt(0);    
    }
    
    $.chessBoard.prototype.makeMove = function() {
        var sqFrom;
        var sqTo;
        var piece;
        var crowning;
        
        if (!arguments.length)
            return null;
        if (arguments.length == 1) {
            var objResp = this.fens[this.currentPosition].getCoordsFromPgn(arguments[0]);
            if (!objResp)
                return null;
            sqFrom = objResp.sqFrom;
            sqTo = objResp.sqTo;
            piece = objResp.piece;
            crowning = objResp.crowning;
        }

        if (arguments.length == 2) {
            sqFrom = arguments[0];
            sqTo = arguments[1];
            if(this.draggedPiece != undefined)
                piece = this.draggedPiece;
        }
        
        this.dragStart = undefined;
        this.draggedPiece = undefined;
        
        if (piece == undefined || sqFrom == undefined || sqTo == undefined || this.currentPosition != (this.fens.length - 1))
            return null;
        var fen = this.fens[this.currentPosition];
        if (piece.toLowerCase() == 'p' && crowning == undefined) {
            var destRow = $.chessRules.rowFromSquare(sqTo);
            if (piece == 'p' && destRow == 0)
                crowning = this.getCrowning('b');
            else if (piece == 'P' && destRow == 7)
                crowning = this.getCrowning('w');
            if (crowning != undefined)
                piece = crowning;
        }
        
        var resp = fen.move(sqFrom, sqTo, crowning, true);
        if (!resp || !resp.position.isLegal())
            return null;
        this.fens.push(resp.position);
        this.pgnmoves.push(resp.move);
        this.currentPosition++;
        
        var casOrig = (sqFrom ^ (this.flipped ? 7 : 56));
        var casDest = (sqTo ^ (this.flipped ? 7 : 56));
        
        $("#" + this.id + " td.square:nth(" + casDest + ")").data("properties").piece = piece;
        $("#" + this.id + " td.square:nth(" + casDest + ")").children().remove();
        $("#" + this.id + " td.square:nth(" + casDest + ")").append($("#" + this.id + " td.square:nth(" + casOrig + ") img.piece"));
        if(crowning != undefined) {
            $("#" + this.id + " td.square:nth(" + casDest + ") img.piece").attr("src", this.pieces[piece].attr("src"));                
        }
        if (resp.move.match(/[0-O]-[0-O]-[0-O]/)) {
              if (sqFrom == 4) {
                casOrig = (0 ^ (this.flipped ? 7 : 56));
                casDest = (3 ^ (this.flipped ? 7 : 56));
                piece = 'R';
                } 
              else {
                casOrig = (56 ^ (this.flipped ? 7 : 56));
                casDest = (59 ^ (this.flipped ? 7 : 56));
                piece = 'r';
                }  
            $("#" + this.id + " td.square:nth(" + casDest + ")").data("properties").piece = piece;
            $("#" + this.id + " td.square:nth(" + casDest + ")").append($("#" + this.id + " td.square:nth(" + casOrig + ") img.piece"));
        }
        else if (resp.move.match(/[0-O]-[0-O]/)) {
              if (sqFrom == 4) {
                casOrig = (7 ^ (this.flipped ? 7 : 56));
                casDest = (5 ^ (this.flipped ? 7 : 56));
                piece = 'R';
                } 
              else {
                casOrig = (63 ^ (this.flipped ? 7 : 56));
                casDest = (61 ^ (this.flipped ? 7 : 56));
                piece = 'r';
                }  
            $("#" + this.id + " td.square:nth(" + casDest + ")").data("properties").piece = piece;
            $("#" + this.id + " td.square:nth(" + casDest + ")").append($("#" + this.id + " td.square:nth(" + casOrig + ") img.piece"));
        }
        else if (piece.toLowerCase() == 'p' &&
                 $.chessRules.colFromSquare(sqFrom) != $.chessRules.colFromSquare(sqTo) &&
                 this.fens[this.currentPosition - 1].boardArray[sqTo] == '0') {
            var casEnPassant = (piece == 'P' ? sqTo - 8 : sqTo + 8);
            casDest = (casEnPassant ^ (this.flipped ? 7 : 56));
            $("#" + this.id + " td.square:nth(" + casDest + ")").children().remove();
            
        }
        
        this.addToMoveList(resp.move);
        
        var ev = $.Event("moveMade");
        this.ui.trigger(ev, resp.move);
        return this;   
    }
    
    $.chessBoard.prototype.addToMoveList = function(move, colour, fullMoveNumber) {
        try {
            if (colour == undefined)
                colour = this.fens[this.fens.length - 2].activeColor;
            if (fullMoveNumber == undefined)
                fullMoveNumber = this.fens[this.fens.length - 2].fullMoveNumber;
            if (colour == 'w')
                $("#" + this.id + " table.moveList tbody").append(this.moveListRowPattern);
            var moveTds = $("#" + this.id + " table.moveList tbody td.movement");
            var targetTdIndex = (colour == 'w') ? 2 : 1;
            var targetTd = $("#" + this.id + " table.moveList tbody td.movement:eq(" + (moveTds.length - targetTdIndex).toString() + ")");
            targetTd.text(move);
            if (colour == 'w')
                $("#" + this.id + " table.moveList tbody td.movement:eq(" + (moveTds.length - 3).toString() + ")").text(fullMoveNumber);
//            $("#" + this.id + " span.movelistspan").scrollTop(this.fens.length * 8 + 15);
            $("#" + this.id + " span.movelistspan")[0].scrollTop = $("#" + this.id + " span.movelistspan")[0].scrollHeight;
            var lastmove = $("#" + this.id + " table.moveList tbody td.pgn").length;
            if (colour == 'w')
                lastmove--;
            this.highLightMoveList(lastmove);
        }
        catch(e) {this.errors.push(e);}
        return this;
    };
    
    $.chessBoard.prototype.refreshMoveList = function(move) {
        try {
            $("#" + this.id + " table.moveList tbody ").children().remove();
            for (var i in this.pgnmoves)
                this.addToMoveList(this.pgnmoves[i], this.fens[i].activeColor, this.fens[i].fullMoveNumber);
        }
        catch(e) {this.errors.push(e);}
        return this;
    };

    $.chessBoard.prototype.loadPieces = function() {
        if (this.pieces)
            delete(this.pieces);
        
        var imgSize = (Math.floor(this.size / 8) - 5) + "px";
        
        this.pieces = {
            p: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/bp.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            n: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/bn.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            b: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/bb.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            r: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/br.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            q: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/bq.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            k: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/bk.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            P: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/wp.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            N: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/wn.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            B: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/wb.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            R: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/wr.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            Q: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/wq.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />'),
            K: $('<img class="piece" style="cursor: pointer;" src="' + this.piecesDirectory + '/' + this.piecesSet + '/wk.' + this.piecesExt +'" ' +
                 'width="' + imgSize + '" height="' + imgSize + '" />')
        }
        
        return this;
    }
    
    $.chessBoard.prototype.onPaint = function(event, ui) {
      return this.doPaint();  
    };
    
    $.chessBoard.prototype.doPaint = function() {
        $("#" + this.id + " table.board tr:odd td:odd").css("background-color", this.wSqColor);
        $("#" + this.id + " table.board tr:odd td:even").css("background-color", this.bSqColor);
        $("#" + this.id + " table.board tr:even td:odd").css("background-color", this.bSqColor);
        $("#" + this.id + " table.board tr:even td:even").css("background-color", this.wSqColor);
        return this;
    };
    
    $.chessBoard.prototype.onResize = function(event, ui) {
      return this.doResize();  
    };
    
    $.chessBoard.prototype.doResize = function() {
        //this.size = parseInt(this.ui.css("width").replace("px", ""));
        var mysize = this.size;
        var squareSize = mysize / 8;
        try {
            $("#" + this.id).css({width: mysize + "px", height: mysize + "px"});
            $("#" + this.id + " td.square").css({width: squareSize + "px", height: squareSize + "px"});
        }
        catch(e) {this.errors.push(e);}
        return this;
    };
    
    $.chessBoard.prototype.togglePieces = function() {
        $("img.piece").toggle();
        return this;
    };
    
    $.chessBoard.prototype.setOptions = function(options, forceId) {
        if (!this.id || forceId) {
            if(!options.id)
                options.id = $.chessBoard.defaults.id;
            if (options.id == $.chessBoard.defaults.id)
                this.id = options.id + $.chessBoard.numBoards.toString();
            else
                this.id = options.id;
        }
        
        for (o in options) {
            if (o != 'id')
                this[o] = options[o];
        }
        
        if (this.fenString) {
            this.fens.push(new $.chessRules.FEN(this.fenString));
        }
        return this;
    };
    
    $.chessBoard.prototype.flipBoard = function() {
        this.flipped = !this.flipped;
        return this.setPosition(this.currentPosition);
    }
    
    $.chessBoard.prototype.setPosition = function(fenIndex) {
        $("img.piece").remove();
        if (!this.fens.length)
            return this;
        if (fenIndex === undefined)
            if (!this.currentPosition === undefined) {
                if (this.currentPosition > (this.fens.length - 1))
                    this.currentPosition = this.fens.length - 1;
                fenIndex = this.currentPosition;
            }
            else
                fenIndex = this.fens.length - 1;
        this.currentPosition = fenIndex;
        var curFen = this.fens[fenIndex];
        if (!curFen)
            return null;
        var pP = $.chessRules.FEN.ppExpand(curFen.piecePlacement);
        for (var i in pP) {
            var sqInd = this.flipped ? i ^ 63 : i;
            $("#" + this.id + " td.square:nth(" + sqInd + ")")
                .data("properties", {parent: this, index: !this.flipped ? sqInd ^ 56 : sqInd ^ 7, piece: pP[i]});
            if (pP[i] != '0' && !!this.pieces[pP[i]]) {
                var pClone = this.pieces[pP[i]].clone();
                pClone.appendTo($("#" + this.id + " td.square:nth(" + sqInd + ")"))
                    .draggable({ containment: $("#" + this.id + ""),
                               opacity: this.opacity,
                               revert: true,
                               revertDuration: 0});
            }
        }
        this.highLightMoveList(this.currentPosition);
        return this;
    };

    $.chessBoard.prototype.highLightMoveList = function(ind) {
        var mlist = $("#" + this.id + " table.moveList tbody td.pgn");
        mlist.css({color: "inherit", fontWeight: "normal"});
        if (!ind)
            return this;
        //alert($("#" + this.id + " table.moveList tbody td.pgn:nth(" + (ind - 1) + ")").text());
        $("#" + this.id + " table.moveList tbody td.pgn:nth(" + (ind - 1) + ")")
        .css({color: "blue", fontWeight: "bold"});
        return this;
    };
    
    $.chessBoard.prototype.toString = function() {
          var ret = "";
          $("#" + this.id + " td.square").each(function () {
            ret += $(this).data("properties").piece;
            });
          return ret;
    };
        
    $.chessBoard.defaults = {
        id: "jqchessboard",
        container: "body",
        size: 336,
        bSqColor: "#d18b47",
        wSqColor: "#ffce9e",
        flipped: false,
        fenString: $.chessRules.defaultFEN,
        piecesDirectory: '/media/img',
        piecesSet: 'default',
        piecesExt: 'png',
        opacity: 0.75,
        predefinedCrowning: false,
        crowningPiece: 'Q'
    };
    
    $.chessBoard.numBoards = 0;
    
})(jQuery);

;(function($) {
    $.chessGame = function(options) {
        this.moves = [];
        this.fens = [];
        this.mandatoryOptions = ["event", "site", "date", "round", "white", "black", "round"];
        this.additionalOptions = [];
        
        this.loadOptions(options);
        if (!this.pgn === undefined)
            this.readPgn(this.pgn);
        else {
              this.startPos = new $.chessRules.FEN();
              this.fens.push(this.startPos)
              this.pgn = "";
              this.moves.push(this.pgn);
        }
    }

    $.chessGame.prototype.loadOptions = function(options) {
        var newOpts = $.extend({}, options, $.chessGame.defaults);
        for (var i in this.mandatoryOptions)
            this[this.mandatoryOptions[i]] = newOpts[this.mandatoryOptions[i]];

/*      this.event = newOpts.event;
        this.site = newOpts.site;
        this.date = newOpts.date;
        this.round = newOpts.round;
        this.white = newOpts.white;
        this.black = newOpts.black;
        this.result = newOpts.result; */
    
        for (var i in newOpts) {
            if ($.inArray(i, this.mandatoryOptions) == -1) {
                this.additionalOptions.push(i);
                this[i] = newOpts[i];
            }
        }
        this.additionalOptions.push("FEN");
        this.additionalOptions.push("Setup");
        this.FEN = this.fenString;
        this.Setup = "1";
    };
    
    $.chessGame.defaults = {
        //obligatory tags
        event: "Internet game",
        site: "??, ?? ???",
        date: (function() {
            var curDate = new Date();
            var curYear = (curDate.getFullYear()).toString();
            var curMonth = (curDate.getMonth().toString().length) == 1 ? ("0" + curDate.getMonth().toString()) : curDate.getMonth().toString(); 
            var curDay = (curDate.getDate().toString().length) == 1 ? ("0" + curDate.getDate().toString()) : curDate.getDate().toString(); 
            return  curYear + "." + curMonth + "." + curDay;
            })(),
        round: "??",
        white: "White",
        black: "Black",
        result: "*",
        //end obligatory tags
        fenString: $.chessRules.defaultFEN
    };
    
    $.chessGame.prototype.readPgn = function(pgn) {
        this.pgn = pgn;
        return this;
    };
    
    $.chessGame.prototype.completeMoves = function() {
        return Math.ceil(this.moves.length / 2);    
    };
    
    $.chessGame.prototype.tags = function() {
        return "";  
    };
    
    $.chessGame.prototype.moveList = function() {
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
    };

    $.chessGame.prototype.toString = function() {
        return this.tags() + "\n\n" + this.moveList() + "\n\n";    
    };
    
}) (jQuery);

greatGames = [
    {white: 'Greco', black: 'NN', wins: 'w', moves: 'e4 b6 d4 Bb7 Bd3 f5 exf5 Bxg2 Qh5+ g6 fxg6 Nf6 gxh7+ Nxh5 Bg6#'},
    {white: 'Anderssen', black: 'Kieseritsky', wins: 'w', moves: 'e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 c6 Nf5 Qg5 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6 Nxg7+ Kd8 Qf6+ Nxf6 Be7#'},
    {white: 'Anderssen', black: 'Dufresne', wins: 'w', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 0-0 d3 Qb3 Qf6 e5 Qg6 Re1 Nge7 Ba3 b5 Qxb5 Rb8 Qa4 Bb6 Nbd2 Bb7 Ne4 Qf5 Bxd3 Qh5 Nf6+ gxf6 exf6 Rg8 Rad1 Qxf3 Rxe7+ Nxe7 Qxd7+ Kxd7 Bf5+ Ke8 Bd7+ Kf8 Bxf8#'},
    {white: 'Lasker', black: 'Thomas', wins: 'w', moves: 'd4  e6  Nf3  f5  Nc3  Nf6  Bg5  Be7  Bxf6  Bxf6  e4  fxe4  Nxe4  b6  Ne5  0-0  Bd3  Bb7  Qh5  Qe7  Qxh7+  Kxh7  Nxf6+  Kh6  Neg4+  Kg5  h4+  Kf4  g3+  Kf3  Be2+  Kg2  Rh2+  Kg1  Kd2#'},
    {white: 'Glinksberg', black: 'Najdorf', wins: 'b', moves: 'd4 f5 c4 Nf6 Nc3 e6 Nf3 d5 e3 c6 Bd3 Bd6 0-0 0-0 Ne2 Nbd7 Ng5 Bxh2+ Kh1 Ng4 f4 Qe8 g3 Qh5 Kg2 Bg1 Nxg1 Qh2+ Kf3 e5 dxe5 Ndxe5+ fxe5 Nxe5+ Kf4 Ng6+ Kf3 f4 exf4 Bg4+ Kxg4 Ne5+ fxe5 h5'},
    {white: 'Parr', black: 'Wheatcroft', wins: 'w', moves: 'd4 Nf6 c4 g6 g3 Bg7 Bg2 d5 cxd5 Nxd5 Nc3 Nxc3 bxc3 c5 e3 O-O Ne2 Nc6 O-O cxd4 cxd4 e5 d5 Ne7 Ba3 Re8 Nc3 Qa5 Qb3 e4 Nxe4 Nxd5 Rac1 Be6 Rc5 Qb6 Rb5 Qa6 Nc5 Nxe3 Nxe6 Nxf1 Ng5 Nd2 Qxf7+ Kh8 Bd5 h6 Bb2 Rg8 Qd7 Qa4 Bb3 Nxb3 Nf7+ Kh7 Rh5 Qa5 Rxh6+'},
    {white: 'Mangiaterra', black: 'Savoretti', wins: 'b', moves: 'e4  c5  Nf3  d6  d4  cxd4  Nxd4  Nf6  Nc3  g6  Be3  Bg7  f3  0-0  Qd2  Nc6  Bc4  Bd7  0-0-0  Rc8  Bb3  Ne5  h4  h5  Kb1  Nc4  Bxc4  Rxc4  g4  hxg4  h5  Nxh5  Qe2  Rxc3  bxc3  Qa5  fxg4  Nf6  Nb3  Nxe4  Nxa5  Nxc3+  Kc1  Nxa2+  Kd2  Bc3+  Kd3  Bb5+  Nc4  d5  Rh8+  Bxh8'},
    {white: 'NN', black: 'NN', wins: 'w', moves: 'h4 d5 h5 Nd7 h6 N7f6 hxg7 Kd7 Rh6 Ne8 gxf8=N'}
    ];

// Anderssen - Kieseritsky (Immnortal): 
// Lasker - Thomas: d4  e6  Nf3  f5  Nc3  Nf6  Bg5  Be7  Bxf6  Bxf6  e4  fxe4  Nxe4  b6  Ne5  0-0  Bd3  Bb7  Qh5  Qe7  Qxh7+  Kxh7  Nxf6+  Kh6  Neg4+  Kg5  h4+  Kf4  g3+  Kf3  Be2+  Kg2  Rh2+  Kg1  Kd2#

/*
Trovato V - Tiralongo V - Vidal H - Ferreyra O - Montero B - Domínguez V - Soria C - Bracamonte - Pulpeiro

Quarticelli - Fiatti - Gómez
*/