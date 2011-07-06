/**************************************************************************************************************/
/**************************** General ****************************************************************/
/**************************************************************************************************************/

/* Functions replaced because of interference with global namespace //
Object.prototype.isEmpty = function() {
  var o = this;
  for(var p in o) {
    if (o[p] != o.constructor.prototype[p])
      return false;
  }
  return true;
}


Array.prototype.clone = function () {
  var a = new Array();
  for (var property in this) {
    a[property] = typeof (this[property]) == 'object' ? this[property].clone() : this[property];
    }
    return a;
};



Array.prototype.has = function(value) {
  for (i = 0; i < this.length; i++)
    if (this[i] === value)
      return true;
  return false;
}

End of replacement */

/* New utilities functions in place of the previous ones */

chessUtils = {};

chessUtils.isEmpty = function(o) {
  // var o = this;
  for(var p in o) {
    if (o[p] != o.constructor.prototype[p])
      return false;
  }
  return true;
}


chessUtils.clone = function (arr) {
  var a = new Array();
  //for (var property in arr) {
  //  a[property] = typeof (arr[property]) == 'object' ? chessUtils.clone(arr[property]) : arr[property];
  //  }
  for (i = 0; i < arr.length; i++)
    a.push(arr[i]);
  return a;
};



chessUtils.has = function(arr, value) {
  for (i = 0; i < arr.length; i++)
    if (arr[i] === value)
      return true;
  return false;
}

/* End of new utilities functions */

/* ChessRules 2009 */

chessRules = {
    version: "0.01",
    bbAttacks: {},
    defaultFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
};

chessRules.rowFromSquare = function(square) {return square >> 3;};

chessRules.colFromSquare = function(square) {return square & 7;};

chessRules.rowColToSquare = function(row, col) {return row * 8 + col;};

chessRules.isDiagonal = function(sq1, sq2) {return Math.abs(chessRules.rowFromSquare(sq1) - 
    chessRules.rowFromSquare(sq2)) == Math.abs(chessRules.colFromSquare(sq1) - 
    chessRules.colFromSquare(sq2));};

chessRules.isSameRow = function(sq1, sq2) {return chessRules.rowFromSquare(sq1) == chessRules.rowFromSquare(sq2);};

chessRules.isSameCol = function(sq1, sq2) {return chessRules.colFromSquare(sq1) == chessRules.colFromSquare(sq2);};

chessRules.distance = function (sq1, sq2) {
    var file1 = sq1 & 7;
    var file2 = sq2 & 7;
    var rank1 = sq1 >> 3;
    var rank2 = sq2 >> 3;
    return Math.max(Math.abs(file1 - file2), Math.abs(rank1 - rank2));
}

chessRules.squareToAlgebraic = function(square) {
    var row = chessRules.rowFromSquare(square) + 1;
    var col = chessRules.colFromSquare(square);
    return String.fromCharCode(97 + col) + "" + row.toString();
};

chessRules.algebraicToSquare = function(pgnSq) {
    var col = pgnSq.charCodeAt(0) - 97;
    var row = parseInt(pgnSq[1]) - 1;
    return chessRules.rowColToSquare(row, col);
};

/**************************************************************************************************************/
/**************************************************************************************************************/


/**************************************************************************************************************/
/**************************** Bitboard related ****************************************************************/
/**************************************************************************************************************/


chessRules.bbAttacks = {};
chessRules.bbAttacksInitialized = false;

chessRules.Bitboard = function(rows) {
    ////if (chessUtils.isEmpty(chessRules.bbAttacks))
    //if (!chessRules.bbAttacksInitialized) {
    //  chessRules.bbAttacksInitialized = true;
    //  chessRules.Bitboard.fillAttacks();
    //}
      
    if (!rows)
        this._rows = [0,0,0,0,0,0,0,0];
    else
        this._rows = rows;
    
    };

chessRules.Bitboard.universalBoard = 18446744073709551615;

chessRules.Bitboard.fillAttacks = function() {
    chessRules.bbAttacks['rankAttacks'] = {};
    chessRules.bbAttacks['fileAttacks'] = {};
    chessRules.bbAttacks['diagAttacks'] = {};
    chessRules.bbAttacks['antiDiagAttacks'] = {};
    chessRules.bbAttacks['bpAttacks'] = {};
    chessRules.bbAttacks['wpAttacks'] = {};
    chessRules.bbAttacks['bpMoves'] = {};
    chessRules.bbAttacks['wpMoves'] = {};
    chessRules.bbAttacks['kMoves'] = {};
    chessRules.bbAttacks['nMoves'] = {};
    
    for (var i = 0; i < 64; i++) {
        var row = chessRules.rowFromSquare(i);
        var col = chessRules.colFromSquare(i);
        
        if (row < 7 && row > 0) {
            var bb = new chessRules.Bitboard();
            if (col > 0)
                bb.set(i - 9);
            if (col < 7)
                bb.set(i - 7);
            chessRules.bbAttacks['bpAttacks'][i] = bb;
            
            var bb = new chessRules.Bitboard();
            bb.set(i - 8);
            if (row == 6)
                bb.set(i - 16);
            chessRules.bbAttacks['bpMoves'][i] = bb;
            
            var bb = new chessRules.Bitboard();
            if (col > 0)
                bb.set(i + 7);
            if (col < 7);
                bb.set(i + 9);
            chessRules.bbAttacks['wpAttacks'][i] = bb;
            
            var bb = new chessRules.Bitboard();
            bb.set(i + 8);
            if (row == 1)
                bb.set(i + 16);
            chessRules.bbAttacks['wpMoves'][i] = bb;
        }
        
        var bb = new chessRules.Bitboard();
        for (y = row -1; y < (row + 2); y++) {
            for (x = col - 1; x < (col + 2); x++) {
                if (y >= 0 && y < 8 && x >= 0 && x < 8)
                    bb.set(chessRules.rowColToSquare(y, x));
            }
        }
        bb.unset(i);
        chessRules.bbAttacks['kMoves'][i] = bb;
            
        var bb = new chessRules.Bitboard();
        for (y = row -2; y < (row + 3); y++) {
            for (x = col - 2; x < (col + 3); x++) {
                if (y >= 0 && y < 8 && x >= 0 && x < 8)
                    if ((Math.abs(y - row) == 2 && Math.abs(x - col) == 1) || (Math.abs(y - row) == 1 && Math.abs(x - col) == 2)) 
                        bb.set(chessRules.rowColToSquare(y, x));
            }
        }
        chessRules.bbAttacks['nMoves'][i] = bb;
            
        var bb = new chessRules.Bitboard();
        bb.setRow(row);
        bb.unset(i);
        chessRules.bbAttacks['rankAttacks'][i] = bb;
        
        var bb = new chessRules.Bitboard();
        bb.setCol(col);
        bb.unset(i);
        chessRules.bbAttacks['fileAttacks'][i] = bb;
        
        var bb = new chessRules.Bitboard();
        bb.setDiag(i);
        bb.unset(i);
        chessRules.bbAttacks['diagAttacks'][i] = bb;
        
        var bb = new chessRules.Bitboard();
        bb.setAntiDiag(i);
        bb.unset(i);
        chessRules.bbAttacks['antiDiagAttacks'][i] = bb;
    }
  };

 
chessRules.Bitboard.getFirstSetBit = function(bitboard) {
    for (var i = 0; i < 64; i++) {
        if (bitboard.get(i))
          return i;
      }
    return -1
  };
    
chessRules.Bitboard.getLastSetBit = function(bitboard) {
    for (var i = 63; i > -1; i--) {
        if (bitboard.get(i))
          return i;
      }
    return -1
  };

chessRules.Bitboard.freeSqRank = function(bitboard, origSq) {
    var retbb = new chessRules.Bitboard();
    var rank = chessRules.rowFromSquare(origSq);
    var file = chessRules.colFromSquare(origSq);
    
    if (file > 0) {
        for (var i =  file - 1; i > -1; i--) {
            if (!(bitboard._rows[rank] & (1 << i)))
                retbb._rows[rank] |= (1 << i);
            else
                break;
        }
    }
    if (file < 7) {
        for (var i = file + 1; i < 8; i++) {
            if (!(bitboard._rows[rank] & (1 << i)))
                retbb._rows[rank] |= (1 << i);
            else
                break;
        }
    }
    retbb.set(origSq);
    return retbb;
  };


chessRules.Bitboard.freeSqFile = function(bitboard, origSq) {
    var retbb = new chessRules.Bitboard();
    var rank = chessRules.rowFromSquare(origSq);
    var file = chessRules.colFromSquare(origSq);

    if (rank > 0) {
        for (var i = rank - 1; i > -1; i--) {
            if (!(bitboard._rows[i] & (1 << file)))
//                retbb.set(origSq + i);
                retbb._rows[i] |= (1 << file);
            else
                break;
        }
    }
    if (rank < 7) {
        for (var i = rank + 1; i < 8; i++) {
            if (!(bitboard._rows[i] & (1 << file))) {
                retbb._rows[i] |=  (1 << file);
            }
            else
                break;
        }
    }
    
    retbb.set(origSq);
    return retbb;
  };

chessRules.Bitboard.freeSqDiag = function(bitboard, origSq) {
    var retbb = new chessRules.Bitboard();
    for (var i = (origSq - 9); i > -1; i -= 9) {
        if (chessRules.isDiagonal(origSq, i)) {
            if (!(bitboard.get(i))) 
                retbb.set(i);
            else
                break;
        }
        else
            break;
    }
    
    for (var i = (origSq + 9); i < 64; i += 9) {
        if (chessRules.isDiagonal(origSq, i)) {
            if (!(bitboard.get(i)))
                retbb.set(i);
            else
                break;
        }
        else
            break;
    }
          
    retbb.set(origSq);
    return retbb;
  };
  
chessRules.Bitboard.freeSqAntiDiag = function(bitboard, origSq) {
    var retbb = new chessRules.Bitboard();
    for (var i = (origSq - 7); i > -1; i -= 7) {
        if (chessRules.isDiagonal(origSq, i)) {
            if (!(bitboard.get(i)))
                retbb.set(i);
            else
                break;
        }
        else
            break;
    }
    
    for (var i = (origSq + 7); i < 64; i += 7) {
        if (chessRules.isDiagonal(origSq, i)) {
            if (!(bitboard.get(i)))
                retbb.set(i);
            else
                break;
        }
        else
            break;
    }
    
    retbb.set(origSq);
    return retbb;
  };
  
chessRules.Bitboard.prototype.toString = function() {
    var ret = "";
    for (var y = this._rows.length - 1; y > -1; y--) {
        for (var x = 0; x < 8; x++)    
            ret += (this._rows[y] & (1 << x)) ? "1" : "0";
        ret += "\n";
        }
    return ret;
    };

chessRules.Bitboard.prototype.__cmp__ = function(other) {
  for(var i = 0; i < this._rows.length; i++) {
    if (this._rows[i] != other._rows[i])
      return -1;
    }
    return 0;
  };

chessRules.Bitboard.prototype.__nonzero__ = function() {
  return this.any();
  };
  
chessRules.Bitboard.prototype.__invert__ = function() {
        var newRows = [];
        for (var i = 0; i < this._rows.length; i++)
          newRows.push(~this._rows[i]);
        return new chessRules.Bitboard(newRows);
  };

chessRules.Bitboard.prototype.__and__ = function(other) {
    var newRows = [];
    for (var i = 0; i < this._rows.length; i++)
      newRows.push(this._rows[i] & other._rows[i]);
    return new chessRules.Bitboard(newRows);
  };
  
chessRules.Bitboard.prototype.__or__ = function(other) {
    var newRows = [];
    for (var i = 0; i < this._rows.length; i++)
      newRows.push(this._rows[i] | other._rows[i]);
    return new chessRules.Bitboard(newRows);
  };
  
chessRules.Bitboard.prototype.__xor__ = function(other) {
    var newRows = [];
    for (var i = 0; i < this._rows.length; i++)
      newRows.push(this._rows[i] ^ other._rows[i]);
    return new chessRules.Bitboard(newRows);
  };
  
chessRules.Bitboard.prototype.set = function(square) {
    var curRow = square >> 3;
    this._rows[curRow] |= (1 << (square & 7));
    };
    
chessRules.Bitboard.prototype.setAll = function() {
    for (curRow = 0; curRow < 8; curRow++)
      this._rows[curRow] = 255;
    };
    
chessRules.Bitboard.prototype.unset = function(square) {
    var curRow = square >> 3;
//    this.rows[curRow] &= ~(square & 7);
    this._rows[curRow] -= (1 << (square & 7));
    };

chessRules.Bitboard.prototype.unsetAll = function() {
    for (curRow = 0; curRow < 8; curRow++)
      this._rows[curRow] = 0;
    };
    
chessRules.Bitboard.prototype.any = function() {
    for (var i = 0; i < this._rows.length; i++)
        if (this._rows[i])
            return true;
    return false;
    };

chessRules.Bitboard.prototype.all = function() {
    for (var i = 0; i < this._rows.length; i++)
        if (this._rows[i] != 255)
            return false;
    return true;
    };

chessRules.Bitboard.prototype.get = function(square) {
    var curRow = square >> 3;
    return this._rows[curRow] & (1 << (square & 7)) ? 1 : 0;
    };

chessRules.Bitboard.prototype.getRows = function() {
    return this._rows;
  };

chessRules.Bitboard.prototype.setRow = function(row){
    this._rows[row] = 255;
  };

chessRules.Bitboard.prototype.unsetRow = function(row) {
    this._rows[row] = 0;
  };

chessRules.Bitboard.prototype.setCol = function(col){
    for (var i = 0;  i < 8; i++)
        this._rows[i] |= (1 << col);
  };

chessRules.Bitboard.prototype.unsetCol = function(col) {
    for (var i = 0;  i < 8; i++)
        this._rows[i] &= ~(1 << col);
  };

chessRules.Bitboard.prototype.setDiag = function(square) {
    for (var i = square; i < 64; i += 9) 
        if (chessRules.isDiagonal(i, square))
            this.set(i);
    for (var i = square - 9; i > -1; i -= 9)
        if (chessRules.isDiagonal(i, square))
            this.set(i);
  };
  
chessRules.Bitboard.prototype.unsetDiag = function(square) {
    for (var i = square; i < 64; i += 9) 
        if (chessRules.isDiagonal(i, square))
            this.unset(i);
    for (var i = square - 9; i > -1; i -= 9)
        if (chessRules.isDiagonal(i, square))
            this.unset(i);
  };
        
chessRules.Bitboard.prototype.setAntiDiag = function(square) {
    for (var i = square; i < 64; i += 7) 
        if (chessRules.isDiagonal(i, square))
            this.set(i);
    for (var i = square - 7; i > -1; i -= 7)
        if (chessRules.isDiagonal(i, square))
            this.set(i);
  };
        
chessRules.Bitboard.prototype.unsetAntiDiag = function(square) {
    for (var i = square; i < 64; i += 7) 
        if (chessRules.isDiagonal(i, square))
            this.unset(i);
    for (var i = square - 9; i > -1; i -= 7)
        if (chessRules.isDiagonal(i, square))
            this.unset(i);
  };

chessRules.Bitboard.prototype.count = function() {
    var cnt = 0;
    for (var i = 0; i < 64; i++)
      if (this.get(i))
        cnt++;
    return cnt;
  };


chessRules.Bitboard.prototype.bitsSet = function() {
    var retval = [];
    for (var i = 0; i < 64; i++) {
        if (this.get(i))
            retval.push(i);
    }
    return retval;
  };
  


/**************************************************************************************************************/
/**************************************************************************************************************/

/**************************************************************************************************************/
/**************************** FEN related ****************************************************************/
/**************************************************************************************************************/

chessRules.defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

chessRules.FEN = function(fenString) {
    if (!fenString)
        this.fenString = chessRules.defaultFEN;
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
    var tmpBoard = chessRules.FEN.ppExpand(this.piecePlacement);
    for (var pos = 0; pos < 64; pos++) {
      this.boardArray[pos ^ 56] = tmpBoard[pos];
    }

        this.bbBPawns = new chessRules.Bitboard();
        this.bbBKnights = new chessRules.Bitboard();
        this.bbBBishops = new chessRules.Bitboard();
        this.bbBRooks = new chessRules.Bitboard();
        this.bbBQueens = new chessRules.Bitboard();
        this.bbBKing = new chessRules.Bitboard();
        this.bbWPawns = new chessRules.Bitboard();
        this.bbWKnights = new chessRules.Bitboard();
        this.bbWBishops = new chessRules.Bitboard();
        this.bbWRooks = new chessRules.Bitboard();
        this.bbWQueens = new chessRules.Bitboard();
        this.bbWKing = new chessRules.Bitboard();

        this.bbBlack = null;
        this.bbWhite = null;
        this.bbAll = null;

        this.bbPseudoLegalMoves = {};

        this.bbBAttacks = new chessRules.Bitboard();
        this.bbBPawnMoves = new chessRules.Bitboard();
        this.bbWAttacks = new chessRules.Bitboard();
        this.bbWPawnMoves = new chessRules.Bitboard();

        this.flags = {'check': {'w': -1, 'b': -1}, 'checkMate': {'w': -1, 'b': -1},
            'staleMate': {'w': -1, 'b': -1}, 'hasLegalMoves': {'w': -1, 'b': -1}};
        
        this.initBitboards();
    
};

chessRules.FEN.prototype.initBitboards = function() {
        for (var i = 0; i < this.boardArray.length; i++) {
            if (this.boardArray[i] == 'p')
                this.bbBPawns.set(i);
            else if (this.boardArray[i] == 'P')
                this.bbWPawns.set(i);
            else if (this.boardArray[i] == 'n')
                this.bbBKnights.set(i);
            else if (this.boardArray[i] == 'N')
                this.bbWKnights.set(i);
            else if (this.boardArray[i] == 'b')
                this.bbBBishops.set(i);
            else if (this.boardArray[i] == 'B')
                this.bbWBishops.set(i);
            else if (this.boardArray[i] == 'r')
                this.bbBRooks.set(i);
            else if (this.boardArray[i] == 'R')
                this.bbWRooks.set(i);
            else if (this.boardArray[i] == 'q')
                this.bbBQueens.set(i);
            else if (this.boardArray[i] == 'Q')
                this.bbWQueens.set(i);
            else if (this.boardArray[i] == 'k')
                this.bbBKing.set(i);
            else if (this.boardArray[i] == 'K')
                this.bbWKing.set(i);
        }
        
        this.bbBlack = this.bbBPawns.__or__(this.bbBKnights.__or__(
                      this.bbBBishops.__or__(this.bbBRooks.__or__(
                      this.bbBQueens.__or__(this.bbBKing)))));        
        
        this.bbWhite = this.bbWPawns.__or__(this.bbWKnights.__or__(
                      this.bbWBishops.__or__(this.bbWRooks.__or__(
                      this.bbWQueens.__or__(this.bbWKing)))));

        this.bbAll = this.bbBlack.__or__(this.bbWhite);
               
        for (var i = 0; i < this.boardArray.length; i ++) {
            if (this.boardArray[i] == 'p') {
                var bbMoves = (chessRules.bbAttacks['bpMoves'][i].__xor__(this.bbAll)).__and__(chessRules.bbAttacks['bpMoves'][i]);
                if (chessRules.rowFromSquare(i) == 6) {
                    if (!bbMoves.get(i - 8))
                        bbMoves.unset(i - 16);
		}
                this.bbPseudoLegalMoves[i] = bbMoves;
                this.bbBPawnMoves = this.bbBPawnMoves.__or__(bbMoves);
                var bbAtts = chessRules.bbAttacks['bpAttacks'][i].__and__(this.bbWhite);
                if (this.enPassant != "-") {
                    var epSquare = chessRules.algebraicToSquare(this.enPassant);
                    if (chessRules.colFromSquare(i) > 0)
                       if (epSquare == (i - 9))
                        bbAtts.set(epSquare);
                    if (chessRules.colFromSquare(i) < 7)
                       if (epSquare == (i - 7))
                        bbAtts.set(epSquare);
		}
                this.bbBAttacks = this.bbBAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = this.bbPseudoLegalMoves[i].__or__(bbAtts);
	    }
		
            else if (this.boardArray[i] == 'P') {
                var bbMoves = (chessRules.bbAttacks['wpMoves'][i].__xor__(this.bbAll)).__and__(chessRules.bbAttacks['wpMoves'][i]);
                if (chessRules.rowFromSquare(i) == 1) {
                    if (!bbMoves.get(i + 8))
                        bbMoves.unset(i + 16);
                }
                this.bbPseudoLegalMoves[i] = bbMoves;
                this.bbWPawnMoves = this.bbWPawnMoves.__or__(bbMoves);
                var bbAtts = chessRules.bbAttacks['wpAttacks'][i].__and__(this.bbBlack);
                if (this.enPassant != "-") {
                    epSquare = chessRules.algebraicToSquare(this.enPassant);
                    if (chessRules.colFromSquare(i) > 0)
                       if (epSquare == (i + 7))
                        bbAtts.set(epSquare);
                    if (chessRules.colFromSquare(i) < 7)
                       if (epSquare == (i + 9))
                        bbAtts.set(epSquare);
                }
                this.bbWAttacks = this.bbWAttacks.__or__(bbAtts)
                this.bbPseudoLegalMoves[i] = this.bbPseudoLegalMoves[i].__or__(bbAtts);
            }
            
            else if (this.boardArray[i] == 'n') {
                var bbAtts = (chessRules.bbAttacks['nMoves'][i].__xor__(this.bbBlack)).__and__(chessRules.bbAttacks['nMoves'][i]);
                this.bbBAttacks = this.bbBAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }
            
            else if (this.boardArray[i] == 'N') {
                var bbAtts = (chessRules.bbAttacks['nMoves'][i].__xor__(this.bbWhite)).__and__(chessRules.bbAttacks['nMoves'][i]);
                this.bbWAttacks = this.bbWAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }
                
            else if (this.boardArray[i] == 'k') {
                var bbAtts = (chessRules.bbAttacks['kMoves'][i].__xor__(this.bbBlack)).__and__(chessRules.bbAttacks['kMoves'][i]);
                this.bbBAttacks = this.bbBAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }

            else if (this.boardArray[i] == 'K') {
                var bbAtts = (chessRules.bbAttacks['kMoves'][i].__xor__(this.bbWhite)).__and__(chessRules.bbAttacks['kMoves'][i]);
                this.bbWAttacks = this.bbWAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }

            else if (this.boardArray[i] == 'b') {
                var bbD = chessRules.Bitboard.freeSqDiag(this.bbAll, i);
                var fD = chessRules.Bitboard.getFirstSetBit(bbD);
                if (chessRules.rowFromSquare(fD) > 0 && chessRules.colFromSquare(fD) > 0 && chessRules.isDiagonal(fD, fD - 9)) {
                    if ("PNBRQK".indexOf(this.boardArray[fD - 9]) != -1)
                        bbD.set(fD - 9);
                }
                
                var lD = chessRules.Bitboard.getLastSetBit(bbD);
                if (chessRules.rowFromSquare(lD) < 7 && chessRules.colFromSquare(lD) < 7 && chessRules.isDiagonal(lD, lD + 9)) {
                    if ("PNBRQK".indexOf(this.boardArray[lD + 9]) != -1)
                        bbD.set(lD + 9);
                }
                
                var bbAd = chessRules.Bitboard.freeSqAntiDiag(this.bbAll, i);
                var fD = chessRules.Bitboard.getFirstSetBit(bbAd);
                if (chessRules.rowFromSquare(fD) > 0 && chessRules.colFromSquare(fD) < 7 && chessRules.isDiagonal(fD, fD - 7)) {
                    if ("PNBRQK".indexOf(this.boardArray[fD - 7]) != -1)
                        bbAd.set(fD - 7);
                }
                
                var lD = chessRules.Bitboard.getLastSetBit(bbAd)
                if (chessRules.rowFromSquare(lD) < 7 && chessRules.colFromSquare(lD) > 0 && chessRules.isDiagonal(lD, lD + 7)) {
                    if ("PNBRQK".indexOf(this.boardArray[lD + 7]) != -1) 
                        bbAd.set(lD + 7);
                }
                
                bbD.unset(i);
                bbAd.unset(i);
                bbAtts = bbD.__or__(bbAd);
                this.bbBAttacks = this.bbBAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }
            
            else if (this.boardArray[i] == 'B') {
                var bbD = chessRules.Bitboard.freeSqDiag(this.bbAll, i);
                var fD = chessRules.Bitboard.getFirstSetBit(bbD);
                if (chessRules.rowFromSquare(fD) > 0 && chessRules.colFromSquare(fD) > 0 && chessRules.isDiagonal(fD, fD - 9)) {
                    if ("pnbrqk".indexOf(this.boardArray[fD - 9]) != -1)
                        bbD.set(fD - 9);
                }
                
                var lD = chessRules.Bitboard.getLastSetBit(bbD)
                if (chessRules.rowFromSquare(lD) < 7 && chessRules.colFromSquare(lD) < 7 && chessRules.isDiagonal(lD, lD + 9)) {
                    if ("pnbrqk".indexOf(this.boardArray[lD + 9]) != -1)
                        bbD.set(lD + 9);
                }
                
                var bbAd = chessRules.Bitboard.freeSqAntiDiag(this.bbAll, i);
                fD = chessRules.Bitboard.getFirstSetBit(bbAd);
                if (chessRules.rowFromSquare(fD) > 0 && chessRules.colFromSquare(fD) < 7 && chessRules.isDiagonal(fD, fD - 7)) {
                    if ("pnbrqk".indexOf(this.boardArray[fD - 7]) != -1)
                        bbAd.set(fD - 7);
                }
                
                var lD = chessRules.Bitboard.getLastSetBit(bbAd);
                if (chessRules.rowFromSquare(lD) < 7 && chessRules.colFromSquare(lD) > 0 && chessRules.isDiagonal(lD, lD +7)) {
                    if ("pnbrqk".indexOf(this.boardArray[lD + 7]) != -1)
                        bbAd.set(lD + 7);
                }
                
                bbD.unset(i);
                bbAd.unset(i);
                bbAtts = bbD.__or__(bbAd);
                this.bbWAttacks = this.bbWAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }
            
            else if (this.boardArray[i] == 'r') {
                var bbR = chessRules.Bitboard.freeSqRank(this.bbAll, i);
                var fR = chessRules.Bitboard.getFirstSetBit(bbR);
                if (chessRules.colFromSquare(fR) > 0 && chessRules.isSameRow(fR, fR -1)) {
                    if ("PNBRQK".indexOf(this.boardArray[fR - 1]) != -1)
                        bbR.set(fR - 1);
                }
                
                var lR = chessRules.Bitboard.getLastSetBit(bbR);
                if (chessRules.colFromSquare(lR) < 7 && chessRules.isSameRow(lR, lR + 1)) {
                    if ("PNBRQK".indexOf(this.boardArray[lR + 1]) != -1)
                        bbR.set(lR + 1);
                }
                
                var bbF = chessRules.Bitboard.freeSqFile(this.bbAll, i);
                var fF = chessRules.Bitboard.getFirstSetBit(bbF);
                if (fF > 7 && chessRules.isSameCol(fF, fF - 8)) {
                    if ("PNBRQK".indexOf(this.boardArray[fF - 8]) != -1)
                        bbF.set(fF - 8);
                }
                
                var lF = chessRules.Bitboard.getLastSetBit(bbF);
                if (lF < 56 && chessRules.isSameCol(lF, lF + 8)) {
                    if ("PNBRQK".indexOf(this.boardArray[lF + 8]) != -1)
                        bbF.set(lF + 8);
                }
                
                bbR.unset(i);
                bbF.unset(i);
                bbAtts = bbF.__or__(bbR);
                this.bbBAttacks = this.bbBAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }
            
            else if (this.boardArray[i] == 'R') {
                var bbR = chessRules.Bitboard.freeSqRank(this.bbAll, i);
                var fR = chessRules.Bitboard.getFirstSetBit(bbR);
                if (chessRules.colFromSquare(fR) > 0 && chessRules.isSameRow(fR, fR -1)) {
                    if ("pnbrqk".indexOf(this.boardArray[fR - 1]) != -1)
                        bbR.set(fR - 1);
                }
                
                var lR = chessRules.Bitboard.getLastSetBit(bbR);
                if (chessRules.colFromSquare(lR) < 7 && chessRules.isSameRow(lR, lR + 1)) {
                    if ("pnbrqk".indexOf(this.boardArray[lR + 1]) != -1)
                        bbR.set(lR + 1);
                }

                var bbF = chessRules.Bitboard.freeSqFile(this.bbAll, i);
                var fF = chessRules.Bitboard.getFirstSetBit(bbF);
                if (fF > 7 && chessRules.isSameCol(fF, fF - 8)) {
                    if ("pnbrqk".indexOf(this.boardArray[fF - 8]) != -1)
                        bbF.set(fF - 8);
                }
                
                var lF = chessRules.Bitboard.getLastSetBit(bbF);
                if (lF < 56 && chessRules.isSameCol(lF, lF + 8)) {
                    if ("pnbrqk".indexOf(this.boardArray[lF + 8]) != -1)
                        bbF.set(lF + 8);
                }
                
                bbR.unset(i);
                bbF.unset(i);
                bbAtts = bbF.__or__(bbR);
                this.bbWAttacks = this.bbWAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }
            
            else if (this.boardArray[i] == 'q') {
                var bbD = chessRules.Bitboard.freeSqDiag(this.bbAll, i);
                var fD = chessRules.Bitboard.getFirstSetBit(bbD);
                if (chessRules.rowFromSquare(fD) > 0 && chessRules.colFromSquare(fD) > 0 && chessRules.isDiagonal(fD, fD - 9)) {
                    if ("PNBRQK".indexOf(this.boardArray[fD - 9]) != -1)
                        bbD.set(fD - 9);
                }
                
                var lD = chessRules.Bitboard.getLastSetBit(bbD)
                if (chessRules.rowFromSquare(lD) < 7 && chessRules.colFromSquare(lD) < 7 && chessRules.isDiagonal(lD, lD + 9)) {
                    if ("PNBRQK".indexOf(this.boardArray[lD + 9]) != -1)
                        bbD.set(lD + 9);
                }
                
                var bbAd = chessRules.Bitboard.freeSqAntiDiag(this.bbAll, i);
                var fD = chessRules.Bitboard.getFirstSetBit(bbAd);
                if (chessRules.rowFromSquare(fD) > 0 && chessRules.colFromSquare(fD) < 7 && chessRules.isDiagonal(fD, fD - 7)) {
                    if ("PNBRQK".indexOf(this.boardArray[fD - 7]) != -1)
                        bbAd.set(fD - 7);
                }
                
                var lD = chessRules.Bitboard.getLastSetBit(bbAd);
                if (chessRules.rowFromSquare(lD) < 7 && chessRules.colFromSquare(lD) > 0 && chessRules.isDiagonal(lD, lD + 7)) {
                    if ("PNBRQK".indexOf(this.boardArray[lD + 7]) != -1)
                        bbAd.set(lD + 7);
                }
                
                var bbR = chessRules.Bitboard.freeSqRank(this.bbAll, i);
                var fR = chessRules.Bitboard.getFirstSetBit(bbR);
                if (chessRules.colFromSquare(fR) > 0 && chessRules.isSameRow(fR, fR -1)) {
                    if ("PNBRQK".indexOf(this.boardArray[fR - 1]) != -1)
                        bbR.set(fR - 1);
                }
                
                var lR = chessRules.Bitboard.getLastSetBit(bbR);
                if (chessRules.colFromSquare(lR) < 7 && chessRules.isSameRow(lR, lR + 1)) {
                    if ("PNBRQK".indexOf(this.boardArray[lR + 1]) != -1)
                        bbR.set(lR + 1);
                }
                
                var bbF = chessRules.Bitboard.freeSqFile(this.bbAll, i);
                var fF = chessRules.Bitboard.getFirstSetBit(bbF);
                if (fF > 7 && chessRules.isSameCol(fF, fF - 8)) {
                    if ("PNBRQK".indexOf(this.boardArray[fF - 8]) != -1)
                        bbF.set(fF - 8);
                }
                
                var lF = chessRules.Bitboard.getLastSetBit(bbF);
                if (lF < 56 && chessRules.isSameCol(lF, lF + 8)) {
                    if ("PNBRQK".indexOf(this.boardArray[lF + 8]) != -1)
                        bbF.set(lF + 8);
                }
                
                bbD.unset(i);
                bbAd.unset(i);
                bbR.unset(i);
                bbF.unset(i);
                bbAtts = bbD.__or__(bbAd.__or__(bbR.__or__(bbF)));
                this.bbBAttacks = this.bbBAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }
            
            else if (this.boardArray[i] == 'Q') {
                var bbD = chessRules.Bitboard.freeSqDiag(this.bbAll, i);
                var fD = chessRules.Bitboard.getFirstSetBit(bbD);
                if (chessRules.rowFromSquare(fD) > 0 && chessRules.colFromSquare(fD) > 0 && chessRules.isDiagonal(fD, fD - 9)) {
                    if ("pnbrqk".indexOf(this.boardArray[fD - 9]) != -1)
                        bbD.set(fD - 9);
                }
                
                var lD = chessRules.Bitboard.getLastSetBit(bbD)
                if (chessRules.rowFromSquare(lD) < 7 && chessRules.colFromSquare(lD) < 7 && chessRules.isDiagonal(lD, lD + 9)) {
                    if ("pnbrqk".indexOf(this.boardArray[lD + 9]) != -1)
                        bbD.set(lD + 9);
                }
                
                var bbAd = chessRules.Bitboard.freeSqAntiDiag(this.bbAll, i);
                var fD = chessRules.Bitboard.getFirstSetBit(bbAd);
                if (chessRules.rowFromSquare(fD) > 0 && chessRules.colFromSquare(fD) < 7 && chessRules.isDiagonal(fD, fD - 7)) {
                    if ("pnbrqk".indexOf(this.boardArray[fD - 7]) != -1)
                        bbAd.set(fD - 7);
                }
                
                var lD = chessRules.Bitboard.getLastSetBit(bbAd);
                if (chessRules.rowFromSquare(lD) < 7 && chessRules.colFromSquare(lD) > 0 && chessRules.isDiagonal(lD, lD + 7)) {
                    if ("pnbrqk".indexOf(this.boardArray[lD + 7]) != -1)
                        bbAd.set(lD + 7);
                }
                
                var bbR = chessRules.Bitboard.freeSqRank(this.bbAll, i);
                var fR = chessRules.Bitboard.getFirstSetBit(bbR);
                if (chessRules.colFromSquare(fR) > 0 && chessRules.isSameRow(fR, fR -1)) {
                    if ("pnbrqk".indexOf(this.boardArray[fR - 1]) != -1)
                        bbR.set(fR - 1);
                }
                
                var lR = chessRules.Bitboard.getLastSetBit(bbR);
                if (chessRules.colFromSquare(lR) < 7 && chessRules.isSameRow(lR, lR + 1)) {
                    if ("pnbrqk".indexOf(this.boardArray[lR + 1]) != -1)
                        bbR.set(lR + 1);
                }
                
                var bbF = chessRules.Bitboard.freeSqFile(this.bbAll, i);
                var fF = chessRules.Bitboard.getFirstSetBit(bbF);
                if (fF > 7 && chessRules.isSameCol(fF, fF - 8)) {
                    if ("pnbrqk".indexOf(this.boardArray[fF - 8]) != -1)
                        bbF.set(fF - 8);
                }
                
                var lF = chessRules.Bitboard.getLastSetBit(bbF);
                if (lF < 56 && chessRules.isSameCol(lF, lF + 8)) {
                    if ("pnbrqk".indexOf(this.boardArray[lF + 8]) != -1)
                        bbF.set(lF + 8);
                }
                
                bbD.unset(i);
                bbAd.unset(i);
                bbR.unset(i);
                bbF.unset(i);
                bbAtts = bbD.__or__(bbAd.__or__(bbR.__or__(bbF)));
                this.bbWAttacks = this.bbWAttacks.__or__(bbAtts);
                this.bbPseudoLegalMoves[i] = bbAtts;
            }
        }
        
        if (this.bbBKing.get(60)) {
            if (this.castlingAvail.indexOf('k') != -1) {
                if (!this.bbAll.get(61) && !this.bbAll.get(62)) {
                    var bb = new chessRules.Bitboard();
                    bb.set(60);
                    bb.set(61);
                    bb.set(62);
                    if (!bb.__and__(this.bbWAttacks).any()) {
                        this.bbPseudoLegalMoves[60].set(62);
                        this.bbBAttacks.set(62);
                    }
                }
            }
        
            if (this.castlingAvail.indexOf('q') != -1) {
                if (!this.bbAll.get(58) && !this.bbAll.get(59)) {
                    var bb = new chessRules.Bitboard();
                    bb.set(60);
                    bb.set(59);
                    bb.set(58);
                    if (!bb.__and__(this.bbWAttacks).any()) {
                        this.bbPseudoLegalMoves[60].set(58);
                        this.bbBAttacks.set(58);
                    }
                }
            }
        }
        
        if (this.bbWKing.get(4)) {
            if (this.castlingAvail.indexOf('K') != -1) {
                if (!this.bbAll.get(5) && !this.bbAll.get(6)) {
                    var bb = new chessRules.Bitboard();
                    bb.set(4);
                    bb.set(5);
                    bb.set(6);
                    if (!bb.__and__(this.bbBAttacks).any()) {
                        this.bbPseudoLegalMoves[4].set(6);
                        this.bbWAttacks.set(6);
                    }
                }
            }
        
            if (this.castlingAvail.indexOf('Q') != -1) {
                if (!this.bbAll.get(3) && !this.bbAll.get(2)) {
                    var bb = new chessRules.Bitboard();
                    bb.set(4);
                    bb.set(3);
                    bb.set(2);
                    if (!bb.__and__(this.bbBAttacks).any()) {
                        this.bbPseudoLegalMoves[4].set(2);
                        this.bbWAttacks.set(2);
                    }
                }
            }
        }
        
};

chessRules.FEN.prototype.toString = function() {
    return this.piecePlacement + " " + this.activeColor + " " + this.castlingAvail + " " + this.enPassant + " "
    + this.halfMoveClock + " " + this.fullMoveNumber;
};

chessRules.FEN.prototype.asciiBoard = function() {
    return chessRules.FEN.ppExpand(this.piecePlacement).replace(/(\w{8})/g, "$1\n");
};


chessRules.FEN.prototype.canMove = function(sqFrom, sqTo) {
    return this.bbPseudoLegalMoves[sqFrom].get(sqTo) ? true : false;
};


chessRules.FEN.prototype._move = function(sqFrom, sqTo, crowning, strict) {
        if (this.boardArray[sqFrom] == '0')
            return null;
        
        if (strict === undefined)
          strict = true;

        if (strict) {
            if (this.activeColor == 'w' &&  chessUtils.has(['p', 'n', 'b', 'r', 'q', 'k'], this.boardArray[sqFrom]))
                return null;
            if (this.activeColor == 'b' && chessUtils.has(['P', 'N', 'B', 'R', 'Q', 'K'], this.boardArray[sqFrom]))
                return null;
        }
        
        if (!this.canMove(sqFrom, sqTo))
            return null;
    
        var newboardArray = chessUtils.clone(this.boardArray);
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
        
        if (this.enPassant != '-' && sqTo == chessRules.algebraicToSquare(this.enPassant) && chessUtils.has(['p', 'P'], this.boardArray[sqFrom])) {
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
        pp = chessRules.FEN.ppCompress(pp);
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
            enPassant = chessRules.squareToAlgebraic(sqFrom - 8);
        if (this.boardArray[sqFrom] == 'P' && sqTo == (sqFrom + 16))
            enPassant = chessRules.squareToAlgebraic(sqFrom + 8);
            
        var halfMoveClock = this.halfMoveClock;
        if (chessUtils.has(['P', 'p'], this.boardArray[sqFrom]) || this.boardArray[sqTo] != '0')
            halfMoveClock = '0';
        else
            halfMoveClock = (parseInt(halfMoveClock) + 1).toString();
            
        var fullMoveNumber = this.fullMoveNumber
        if (this.activeColor == 'b')
            fullMoveNumber = (parseInt(this.fullMoveNumber) + 1).toString();
            
        var fs = [pp, activeColor, castlingAvail, enPassant, halfMoveClock, fullMoveNumber].join(" ");
        var f = new chessRules.FEN(fs);
        var pgnmove = this.genPgnMoveString(sqFrom, sqTo, crowning);
        if (f.isCheck(f.activeColor))
            if (f.isCheckMate(f.activeColor))
                pgnmove += "#";
            else
                pgnmove += "+";
                
        return {position: f, move: pgnmove};

};

chessRules.FEN.prototype.isCheck = function(colour) {
        if (this.flags['check'][colour] != -1)
            return this.flags['check'][colour];

        var bbFoes;
        var bbKing;
        
        if (colour == 'w') {
            bbFoes = this.bbBAttacks;
            bbKing = this.bbWKing;
        }
        else if (colour == 'b') {
            bbFoes = this.bbWAttacks;
            bbKing = this.bbBKing;
        }
        else
            return false;
        this.flags['check'][colour] = bbKing.__and__(bbFoes).any();
        return this.flags['check'][colour];
};
    
chessRules.FEN.prototype.isCheckMate = function(colour) {
  if (this.flags['checkMate'][colour] != -1)
      return this.flags['checkMate'][colour];
  
  this.flags['checkMate'][colour] = this.isCheck(colour) && !this.hasLegalMoves(colour);
  return this.flags['checkMate'][colour];
};

chessRules.FEN.prototype.isStaleMate = function(colour) {
  if (this.flags['staleMate'][colour] != -1)
      return this.flags['staleMate'][colour];
  
  this.flags['staleMate'][colour] = !this.isCheck(colour) && !this.hasLegalMoves(colour) && this.activeColor == colour;
  return this.flags['staleMate'][colour];
};

chessRules.FEN.prototype.isLegal = function() {
    if (this.activeColor == 'w')
        return !this.isCheck('b');
    if (this.activeColor == 'b')
        return !this.isCheck('w');
};




chessRules.FEN.prototype.hasLegalMoves = function(colour) {
  if (this.flags['hasLegalMoves'][colour] != -1)
      return this.flags['hasLegalMoves'][colour];
  
  var resp;
  var fenDest;
  var fromSq;
  var bitsSeteados;
  
  //for (fromSq in this.bbPseudoLegalMoves)  {
  //    if (this.bbPseudoLegalMoves[fromSq].bitsSet == undefined)
  //      continue;
  //    bitsSeteados = this.bbPseudoLegalMoves[fromSq].bitsSet();
  //    for (i = 0; i < bitsSeteados.length; i++) {
  //      resp = this._move(fromSq, bitsSeteados[i], null, false);
  //      if (resp) {
  //        fenDest = resp['position'];
  //        if (fenDest.isLegal()) {
  //          this.flags['hasLegalMoves'][colour] = true;
  //          return true;
  //        }
  //      }
  //    }
  //}
  
  var bbKing = colour == 'w' ? this.bbWKing : this.bbBKing;
  var fromSq = bbKing.bitsSet()[0];
  var bbTo = this.bbPseudoLegalMoves[fromSq];
  if (bbTo.any()) {
      var bitsSet = bbTo.bitsSet();
      for (i = 0; i < bitsSet.length; i++) {
          var fenDest = this._move(fromSq, bitsSet[i], null, false)
          if (fenDest) {
              fenDest = fenDest['position'];
              if (fenDest.isLegal()) {
                  delete(fenDest);
                  this.flags['hasLegalMoves'][colour] = true;
                  return true;
              }
              delete(fenDest);
          }
      }
  }
  
  var bbOthers = colour == 'w' ? this.bbWQueens : this.bbBQueens;
  if (bbOthers.any()) {
      var bitsSet = bbOthers.bitsSet();
      for (x = 0; x < bitsSet.length; x++) {
              var fromSq = bitsSet[x];
              var bbTo = this.bbPseudoLegalMoves[fromSq];
              if (bbTo.any()) {
                  var bitsSet2 = bbTo.bitsSet(); 
                  for (i = 0; i < bitsSet2.length; i++) {
                      var fenDest = this._move(fromSq, i, null, false);
                      if (fenDest) {
                          fenDest = fenDest['position'];
                          if (fenDest.isLegal()) {
                              delete(fenDest);
                              this.flags['hasLegalMoves'][colour] = True
                              return true;
                          }
                          delete(fenDest);
                      }
                  }
              }
      }
  }
  
  var bbOthers = colour == 'w' ? this.bbWRooks : this.bbBRooks;
  if (bbOthers.any()) {
      var bitsSet = bbOthers.bitsSet();
      for (x = 0; x < bitsSet.length; x++) {
              var fromSq = bitsSet[x];
              var bbTo = this.bbPseudoLegalMoves[fromSq];
              if (bbTo.any()) {
                  var bitsSet2 = bbTo.bitsSet(); 
                  for (i = 0; i < bitsSet2.length; i++) {
                      var fenDest = this._move(fromSq, i, null, false);
                      if (fenDest) {
                          fenDest = fenDest['position'];
                          if (fenDest.isLegal()) {
                              delete(fenDest);
                              this.flags['hasLegalMoves'][colour] = True
                              return true;
                          }
                          delete(fenDest);
                      }
                  }
              }
      }
  }
  
  var bbOthers = colour == 'w' ? this.bbWBishops : this.bbBBishops;
  if (bbOthers.any()) {
      var bitsSet = bbOthers.bitsSet();
      for (x = 0; x < bitsSet.length; x++) {
              var fromSq = bitsSet[x];
              var bbTo = this.bbPseudoLegalMoves[fromSq];
              if (bbTo.any()) {
                  var bitsSet2 = bbTo.bitsSet(); 
                  for (i = 0; i < bitsSet2.length; i++) {
                      var fenDest = this._move(fromSq, i, null, false);
                      if (fenDest) {
                          fenDest = fenDest['position'];
                          if (fenDest.isLegal()) {
                              delete(fenDest);
                              this.flags['hasLegalMoves'][colour] = True
                              return true;
                          }
                          delete(fenDest);
                      }
                  }
              }
      }
  }
  
  var bbOthers = colour == 'w' ? this.bbWKnights : this.bbBKnights;
  if (bbOthers.any()) {
      var bitsSet = bbOthers.bitsSet();
      for (x = 0; x < bitsSet.length; x++) {
              var fromSq = bitsSet[x];
              var bbTo = this.bbPseudoLegalMoves[fromSq];
              if (bbTo.any()) {
                  var bitsSet2 = bbTo.bitsSet(); 
                  for (i = 0; i < bitsSet2.length; i++) {
                      var fenDest = this._move(fromSq, i, null, false);
                      if (fenDest) {
                          fenDest = fenDest['position'];
                          if (fenDest.isLegal()) {
                              delete(fenDest);
                              this.flags['hasLegalMoves'][colour] = True
                              return true;
                          }
                          delete(fenDest);
                      }
                  }
              }
      }
  }
  
  var bbOthers = colour == 'w' ? this.bbWPawns : this.bbBPawns;
  if (bbOthers.any()) {
      var bitsSet = bbOthers.bitsSet();
      for (x = 0; x < bitsSet.length; x++) {
              var fromSq = bitsSet[x];
              var bbTo = this.bbPseudoLegalMoves[fromSq];
              if (bbTo.any()) {
                  var bitsSet2 = bbTo.bitsSet(); 
                  for (i = 0; i < bitsSet2.length; i++) {
                      var fenDest = this._move(fromSq, i, null, false);
                      if (fenDest) {
                          fenDest = fenDest['position'];
                          if (fenDest.isLegal()) {
                              delete(fenDest);
                              this.flags['hasLegalMoves'][colour] = True
                              return true;
                          }
                          delete(fenDest);
                      }
                  }
              }
      }
  }

  this.flags['hasLegalMoves'][colour] = false;
  return false;
};






chessRules.FEN.prototype._pgnMove = function(pgn, strict) {
        if (strict === undefined)
          strict = true;
          
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
        var m = regexp.exec(pgn);
        if (!m)
            return null;
        else {
            //for (i in groups)
            //    print(i + ": " + m[groups[i]]);
            if (m[groups['shortcastling']]) {
                if (this.activeColor == 'w') {
                    sqFrom = 4;
                    sqTo = 6;
                }
                else {
                    sqFrom = 60;
                    sqTo = 62;
                }
                return this._move(sqFrom, sqTo, null, strict);
            }
            if (m[groups['longcastling']]) {
                if (this.activeColor == 'w') {
                    sqFrom = 4;
                    sqTo = 2;
                }
                else {
                    sqFrom = 60;
                    sqTo = 58;
                }
                return this._move(sqFrom, sqTo, null, strict);
            }
            if (m[groups['pawn']]) {
                if (this.activeColor == 'w')
                    var bbPawns = this.bbWPawns;
                else
                    var bbPawns = this.bbBPawns;
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
                var bitsSet = bbPawns.bitsSet();
                for (i = 0; i < bitsSet.length; i++) {
                    if (chessRules.colFromSquare(bitsSet[i]) == origCol) {
                        var bbMoves = this.bbPseudoLegalMoves[bitsSet[i]];
                        if (bbMoves.get(chessRules.rowColToSquare(destRow, destCol))) {
                            sqFrom = bitsSet[i];
                            sqTo = chessRules.rowColToSquare(destRow, destCol);
                            break;
                        }
                    }
                }
                if (sqTo != -1 && sqFrom != -1)
                    return this._move(sqFrom, sqTo, m[groups['crowning']], strict);
                else
                    return null;
            }
            
            if (m[groups['piece']]) {
                if (!!m[groups['crowning']])
                    return null;
                if (m[groups['piece']] == 'N') 
                    if (this.activeColor == 'w')
                        var bbPieces = this.bbWKnights;
                    else
                        var bbPieces = this.bbBKnights;
                        
                else if (m[groups['piece']] == 'B')
                    if (this.activeColor == 'w')
                        var bbPieces = this.bbWBishops;
                    else
                        var bbPieces = this.bbBBishops;
                        
                else if (m[groups['piece']] == 'R')
                    if (this.activeColor == 'w')
                        var bbPieces = this.bbWRooks;
                    else
                        var bbPieces = this.bbBRooks;
                else if (m[groups['piece']] == 'Q')
                    if (this.activeColor == 'w')
                        var bbPieces = this.bbWQueens;
                    else
                        var bbPieces = this.bbBQueens;
                else if (m[groups['piece']] == 'K')
                    if (this.activeColor == 'w')
                        var bbPieces = this.bbWKing;
                    else
                        var bbPieces = this.bbBKing;
                
                sqTo = chessRules.algebraicToSquare(m[groups['piecedestination']]);
                
                var candidates = [];
                
                var bitsSet = bbPieces.bitsSet();
                
                for (i = 0; i < bitsSet.length; i++) 
                    if (this.bbPseudoLegalMoves[bitsSet[i]].get(sqTo))
                        candidates.push(bitsSet[i]);
                
                if (!candidates.length)
                    return null;
                if (candidates.length == 1)
                    sqFrom = candidates[0];
                else {
                    if (m[groups['origpiececol']] && m[groups['origpiecerow']]) {
                        var oRow = parseInt(m[groups['origpiecerow']]) - 1;
                        var oCol = m[groups['origpiececol']].charCodeAt(0) - 97;
                        var oSq = chessRules.rowColToSquare(oRow, oCol);
                        for (i = 0; i < candidates.length; i++) {
                            if (candidates[i] == oSq) {
                                sqFrom = candidates[i];
                                break;
                            }
                        }
                    }
                    else if (m[groups['origpiececol']]) {
                        var oCol = m[groups['origpiececol']].charCodeAt(0) - 97;
                        for (i = 0; i < candidates.length; i++) {
                            if (chessRules.colFromSquare(candidates[i]) == oCol) {
                                sqFrom = candidates[i];
                                break;
                            }
                        }
                    }
                    else if (m[groups['origpiecerow']]) {
                        var oRow = parseInt(m[groups['origpiecerow']]) - 1;
                        for (i = 0; i < candidates.length; i++) {
                            if (chessRules.rowFromSquare(candidates[i]) == oRow) {
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
                else
                    return this._move(sqFrom, sqTo, m[groups['crowning']], strict);
            }
        }
        return null;
}            



chessRules.FEN.prototype.getBitboardFromSquare = function(sq) {
        switch (this.boardArray[sq]) {
          case '0':
            return new chessRules.Bitboard();
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

        return new chessRules.Bitboard();
}


chessRules.FEN.prototype.genPgnMoveString = function(sqFrom, sqTo, crowning, full) {
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
        var bb = this.getBitboardFromSquare(sqFrom);
        if (resp['piece'] != "" && bb.count() > 1) {
            var occupied = bb.bitsSet();
            for (sq = 0; sq < occupied.length; sq++) {
                if (occupied[sq] != sqFrom) {
                    var bbSqTo = new chessRules.Bitboard();
                    bbSqTo.set(sqTo);
                    if (this.bbPseudoLegalMoves[occupied[sq]].__and__(bbSqTo).any()) {
                        if (chessRules.colFromSquare(sqFrom) != chessRules.colFromSquare(occupied[sq]))
                            resp['disAmbigOrigin'] += String.fromCharCode(97 + chessRules.colFromSquare(sqFrom));
                        else
                            resp['disAmbigOrigin'] += ((chessRules.rowFromSquare(sqFrom) + 1) + "");
                        break;
                    }
                }
            }
        }
        if (this.boardArray[sqTo] != '0')
            resp['capture'] = 'x';
        else
            resp['capture'] = '';
        if (resp['piece'] == '' && (resp['capture'] == 'x' || chessRules.colFromSquare(sqFrom) != chessRules.colFromSquare(sqTo))) {
            resp['capture'] = 'x';
            resp['piece'] = String.fromCharCode(97 + chessRules.colFromSquare(sqFrom));
            resp['destiny'] = chessRules.squareToAlgebraic(sqTo);
        }
        else
            resp['destiny'] = chessRules.squareToAlgebraic(sqTo);
        
        if (crowning)
            resp['crowning'] = crowning;
        else
            resp['crowning'] = "";
                
        return resp['prefix'] + resp['piece'] + resp['disAmbigOrigin'] + resp['capture'] + resp['destiny'] + resp['crowning'];
}        




chessRules.FEN.prototype.move = function() {

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
                    sqFrom = chessRules.algebraicToSquare(m[1]);
                    sqTo = chessRules.algebraicToSquare(m[2]);
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


chessRules.FEN.getSqColor = function(sq) {
    if ((chessRules.rowFromSquare(sq) % 2) == 0)
        return ['b', 'w'][sq % 2];
    else
        return ['w', 'b'][sq % 2];
}
            
chessRules.FEN.ppExpand = function(compressedPP) {
    if (!compressedPP)
        compressedPP = chessRules.defaultFEN.split(/\s+/)[0];
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

chessRules.FEN.ppCompress = function(expandedPP) {
    if (!expandedPP)
        expandedPP = chessRules.FEN.ppExpand();
    var compressedPP = expandedPP.replace(/(\w{8})(?=\w)/g, "$1/");
//    compressedPP = compressedPP.substr(0, compressedPP.length - 1);
    compressedPP = compressedPP.replace(/0{1,8}/g, (function(matched) {
        return matched.length.toString();
     }));
    return compressedPP;
}; 

/**************************************************************************************************************/
/**************************************************************************************************************/

/* Init function */

;(function() {
    if (!chessRules.bbAttacksInitialized) {
      // alert("Se inicializaran los bitboards...");
      chessRules.bbAttacksInitialized = true;
      chessRules.Bitboard.fillAttacks();
    }
  })()

/* End Init function */

/**************************************************************************************************************/
/**************************************************************************************************************/
