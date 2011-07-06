#include "chessrules.hpp"

const char* version = "0.01";

const char* greet() {
    return "Hi, C++ Chess rules...";
    }

const char* getVersion() {
    return version;
    };
    
int main() {
    std::cout << greet() << std::endl << "Version is " << version << std::endl;
    Bitboard bb((U64)1 << 28);
    std::cout << extract<const char*>(bb.toString()) << std::endl;
    return EXIT_SUCCESS;
    }


#/**************************************************************************************************************/
#/**************************** General functions ****************************************************************/
#/**************************************************************************************************************/

UINT rowFromSquare(UINT square) {return square >> 3; }

UINT colFromSquare(UINT square) {return square & 7;}

UINT rowColToSquare(UINT row, UINT col) {return row * 8 + col;}

bool isDiagonal(UINT sq1, UINT sq2) {
    return abs(rowFromSquare(sq1) - rowFromSquare(sq2)) == abs(colFromSquare(sq1) - colFromSquare(sq2)) ? true : false;
    }

bool isSameRow(UINT sq1, UINT sq2) {
    return rowFromSquare(sq1) == rowFromSquare(sq2);
    }   

bool isSameCol(UINT sq1, UINT sq2) {return colFromSquare(sq1) == colFromSquare(sq2);}

int distance(int sq1, int sq2) {
    int file1 = sq1 & 7;
    int file2 = sq2 & 7;
    int rank1 = sq1 >> 3;
    int rank2 = sq2 >> 3;
    return max(abs(file1 - file2), abs(rank1 - rank2));
    }

str squareToAlgebraic(UINT square) {
    UINT row = rowFromSquare(square) + 1;
    UINT col = colFromSquare(square);
    return str("%s%s" % make_tuple(char(97 + col), str(row)));
    }

UINT algebraicToSquare(const str& pgnSq) {
    UINT col = extract<char>(pgnSq[0]) - 97;
    UINT row = extract<char>(pgnSq[1]) - 49;
    return rowColToSquare(row, col);
    }
    
#/**************************************************************************************************************/
#/**************************************************************************************************************/

#/**************************************************************************************************************/
#/**************************** Bitboard related ****************************************************************/
#/**************************************************************************************************************/

dict bbAttacks;

U64 Bitboard::universalBoard = (U64(2) << 63) - 1;
dict getBbAttacks() {return bbAttacks;}

Bitboard::Bitboard() : _rows(0) {__init();}
Bitboard::Bitboard(U64 init) : _rows(init) {__init();}

void Bitboard::__init() {
    list keys = bbAttacks.keys();
    int x = extract<int>(keys.attr("__len__")());
    if (x == 0)
        Bitboard::fillAttacks();
    }

void Bitboard::fillAttacks() {
    bbAttacks["rankAttacks"] = dict();
    bbAttacks["fileAttacks"] = dict();
    bbAttacks["diagAttacks"] = dict();
    bbAttacks["antiDiagAttacks"] = dict();
    bbAttacks["bpAttacks"] = dict();
    bbAttacks["wpAttacks"] = dict();
    bbAttacks["bpMoves"] = dict();
    bbAttacks["wpMoves"] = dict();
    bbAttacks["kMoves"] = dict();
    bbAttacks["nMoves"] = dict();

    Bitboard* bb;

    for (UINT i = 0; i < 64; i++) {
        int row = rowFromSquare(i);
        int col = colFromSquare(i);
        
        if (row < 7 and row > 0) {
            bb = new Bitboard;
            if (col > 0)
                bb->set(i - 9);
            if (col < 7)
                bb->set(i - 7);
            bbAttacks["bpAttacks"][i] = bb;
            
            bb = new Bitboard;
            bb->set(i - 8);
            if (row == 6)
                bb->set(i - 16);
            bbAttacks["bpMoves"][i] = bb;

            bb = new Bitboard;
            if (col > 0)
                bb->set(i + 7);
            if (col < 7)
                bb->set(i + 9);
            bbAttacks["wpAttacks"][i] = bb;
            
            bb = new Bitboard;
            bb->set(i + 8);
            if (row == 1)
                bb->set(i + 16);
            bbAttacks["wpMoves"][i] = bb;
        }
        
        bb = new Bitboard;
        for (int y = (row - 1); y < (row + 2); y++)
            for (int x = (col - 1); x < (col + 2); x++)
                if ((y > -1) && (y < 8) && (x > -1) && (x < 8))
                    bb->set(rowColToSquare(y, x));
        bb->unset(i);
        bbAttacks["kMoves"][i] = bb;
        
        bb = new Bitboard;
        for (int y = (row - 2); y < (row + 3); y++)
            for (int x = (col - 2); x < (col + 3); x++)
                if ((y > -1) && (y < 8) && (x > -1) && (x < 8))
                    if((abs(y - row) == 2 && abs(x - col) == 1) || (abs(y - row) == 1 && abs(x - col) == 2))
                        bb->set(rowColToSquare(y, x));
        bbAttacks["nMoves"][i] = bb;
        
        bb = new Bitboard;
        bb->setRow(row);
        bb->unset(i);
        bbAttacks["rankAttacks"][i] = bb;
        
        bb = new Bitboard;
        bb->setCol(col);
        bb->unset(i);
        bbAttacks["fileAttacks"][i] = bb;
        
        bb = new Bitboard;
        bb->setDiag(i);
        bb->unset(i);
        bbAttacks["diagAttacks"][i] = bb;
        
        bb = new Bitboard;
        bb->setAntiDiag(i);
        bb->unset(i);
        bbAttacks["antiDiagAttacks"][i] = bb;
    }
}
    
const str Bitboard::toString() const {
    str ret = "";
    for (int y = 7; y >= 0; y--) {
        int num = this->_rows >> (y * 8);
        for (int x = 0; x < 8; x++) {
            if (num & (1 << x))
                ret += "1";
            else
                ret += "0";
            }
        ret += "\n";
        }
    return ret;    
    }

/*
Bitboard& operator|(const Bitboard& self, const Bitboard& other) {
    return *(new Bitboard(self._rows | other._rows));
    }
*/

Bitboard Bitboard::freeSqRank(Bitboard& bb, int origSq) {
    Bitboard retbb;
    if ((origSq & 7) > 0)
        for (int i = origSq - 1; i > (origSq - (origSq & 7) -1); i--)
            if (!(bb._rows & ((U64)1 << i)))
                retbb._rows |= ((U64)1 << i);
            else
                break;
    if ((origSq & 7) < 7)
        for (int i = origSq + 1; i < origSq + 8 - (origSq & 7); i++)
            if (!(bb._rows & ((U64)1 << i)))
                retbb._rows |= ((U64)1 << i);
            else
                break;
    retbb._rows |= ((U64)1 << origSq);
    return retbb;
    }

Bitboard Bitboard::freeSqFile(Bitboard& bb, int origSq) {
    Bitboard retbb;
    int i;
    if ((origSq >> 3) > 0)
        for (i = origSq - 8; i > 0; i -= 8)
            if (!(bb._rows & ((U64)1 << i)))
                retbb._rows |= ((U64)1 << i);
            else
                break;
    if ((origSq >> 3) < 7)
        for (i = origSq + 8; i < 64; i += 8)
            if (!(bb._rows & ((U64)1 << i)))
                retbb._rows |= ((U64)1 << i);
            else
                break;
    retbb._rows |= ((U64)1 << origSq);
    return retbb;
    }

    Bitboard Bitboard::freeSqDiag(Bitboard& bb, int origSq) {
        Bitboard retbb;
        for (int i = origSq - 9; i > -1; i -= 9)
            if (isDiagonal(origSq, i))
                if (!(bb._rows & ((U64)1 << i)))
                    retbb._rows |= ((U64)1 << i);
                else
                    break;
            else
                break;
        for (int i = origSq + 9; i < 64; i += 9)
            if (isDiagonal(origSq, i))
                if (!(bb._rows & ((U64)1 << i)))
                    retbb._rows |= ((U64)1 << i);
                else
                    break;
            else
                break;
        retbb._rows |= ((U64)1 << origSq);
        return retbb;
        
        }


    Bitboard Bitboard::freeSqAntiDiag(Bitboard& bb, int origSq) {
        Bitboard retbb;
        for (int i = origSq - 7; i > -1; i -= 7)
            if (isDiagonal(origSq, i))
                if (!(bb._rows & ((U64)1 << i)))
                    retbb._rows |= ((U64)1 << i);
                else
                    break;
            else
                break;
        for (int i = origSq + 7; i < 64; i += 7)
            if (isDiagonal(origSq, i))
                if (!(bb._rows & ((U64)1 << i)))
                    retbb._rows |= ((U64)1 << i);
                else
                    break;
            else
                break;
        retbb._rows |= ((U64)1 << origSq);
        return retbb;
        }


#/**************************************************************************************************************/
#/**************************************************************************************************************/


#/**************************************************************************************************************/
#/**************************** FEN related ****************************************************************/
#/**************************************************************************************************************/

const char* defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const char* defaultPP = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const char* defaultExpPP = "rnbqkbnrpppppppp00000000000000000000000000000000PPPPPPPPRNBQKBNR";

FEN::FEN(const char* fenStr) : fenString(fenStr) {

    boost::regex re("\\s+");
    boost::sregex_token_iterator i(fenString.begin(), fenString.end(), re, -1);
    boost::sregex_token_iterator j;
    if (i != j)
        piecePlacement = *i++;
    if (i != j)
        activeColor = *i++;
    if (i != j)
        castlingAvail = *i++;
    if (i != j)
        enPassant = *i++;
    if (i != j)
        halfMoveClock = *i++;
    if (i != j)
        fullMoveNumber = *i;

    const char* expandedPP = FEN::ppExpand(this->piecePlacement.c_str());
    boardArrayPtr = boardArray;
    boardArray[64] = '\0';
    for (unsigned i = 0; i < 64; i++)
        boardArray[i ^ 56] = expandedPP[i];
    
    this->flags["check"] = dict();
    this->flags["check"]['w'] = -1;
    this->flags["check"]['b'] = -1;
    this->flags["checkMate"] = dict();
    this->flags["checkMate"]['w'] = -1;
    this->flags["checkMate"]['b'] = -1;
    this->flags["staleMate"] = dict();
    this->flags["staleMate"]['w'] = -1;
    this->flags["staleMate"]['b'] = -1;
    this->flags["hasLegalMoves"] = dict();
    this->flags["hasLegalMoves"]['w'] = -1;
    this->flags["hasLegalMoves"]['b'] = -1;
        
    initBitboards();
    
}

void FEN::initBitboards() {
    for (UINT i = 0; i < strlen(this->boardArray); i++) {
    switch (this->boardArray[i]) {
        case 'p':
            this->bbBPawns.set(i);
            break;
        case 'P':
            this->bbWPawns.set(i);
            break;
        case 'n':
            this->bbBKnights.set(i);
            break;
        case 'N':
            this->bbWKnights.set(i);
            break;
        case 'b':
            this->bbBBishops.set(i);
            break;
        case 'B':
            this->bbWBishops.set(i);
            break;
        case 'r':
            this->bbBRooks.set(i);
            break;
        case 'R':
            this->bbWRooks.set(i);
            break;
        case 'q':
            this->bbBQueens.set(i);
            break;
        case 'Q':
            this->bbWQueens.set(i);
            break;
        case 'k':
            this->bbBKing.set(i);
            break;
        case 'K':
            this->bbWKing.set(i);
            break;
        default:
            break;
        }    
    }
    
    this->bbBlack = this->bbBPawns | this->bbBKnights | this->bbBBishops | this->bbBRooks
    | this->bbBQueens | this->bbBKing;
    this->bbWhite = this->bbWPawns | this->bbWKnights | this->bbWBishops | this->bbWRooks
    | this->bbWQueens | this->bbWKing;
    this->bbAll = this->bbBlack | this->bbWhite;
    
    for (UINT i = 0; i < strlen(this->boardArray); i++) {
    switch (this->boardArray[i]) {
        case 'p': {
            Bitboard bbMoves;
            Bitboard bpMoves = extract<Bitboard&>(bbAttacks["bpMoves"][i]);
            bbMoves = (bpMoves ^ this->bbAll) & bpMoves;
            if (rowFromSquare(i) == 6) {
                if (!bbMoves.get(i - 8))
                    bbMoves.unset(i - 16);
            }
            this->bbPseudoLegalMoves[i] = bbMoves;
            this->bbBPawnMoves = this->bbBPawnMoves | bbMoves;
            Bitboard bbAtts = extract<Bitboard&>(bbAttacks["bpAttacks"][i]);
            bbAtts = bbAtts & this->bbWhite;
            if (this->enPassant != "-") {
                UINT epSquare = algebraicToSquare(str(this->enPassant));
                if (colFromSquare(i) > 0) {
                    if (epSquare == (i - 9))
                        bbAtts.set(epSquare);
                }
                if (colFromSquare(i) < 7) {
                    if (epSquare == (i - 7))
                        bbAtts.set(epSquare);
                }
            }
            this->bbBAttacks = this->bbBAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = this->bbPseudoLegalMoves[i] | bbAtts;            
            break; }
        case 'P': {
            Bitboard bbMoves;
            Bitboard wpMoves = extract<Bitboard&>(bbAttacks["wpMoves"][i]);
            bbMoves = (wpMoves ^ this->bbAll) & wpMoves;
            if (rowFromSquare(i) == 1) {
                if (!bbMoves.get(i + 8))
                    bbMoves.unset(i + 16);
            }
            this->bbPseudoLegalMoves[i] = bbMoves;
            this->bbWPawnMoves = this->bbWPawnMoves | bbMoves;
            Bitboard bbAtts = extract<Bitboard&>(bbAttacks["wpAttacks"][i]);
            bbAtts = bbAtts & this->bbBlack;
            if (this->enPassant != "-") {
                UINT epSquare = algebraicToSquare(str(this->enPassant));
                if (colFromSquare(i) > 0) {
                    if (epSquare == (i + 7))
                        bbAtts.set(epSquare);
                }
                if (colFromSquare(i) < 7) {
                    if (epSquare == (i + 9))
                        bbAtts.set(epSquare);
                }
            }
            this->bbWAttacks = this->bbWAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = this->bbPseudoLegalMoves[i] | bbAtts;            
            break; }
        case 'n': {
            Bitboard bbAtts = extract<Bitboard&>(bbAttacks["nMoves"][i]);
            bbAtts = (bbAtts ^ this->bbBlack) & bbAtts;
            this->bbBAttacks = this->bbBAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        case 'N': {
            Bitboard bbAtts = extract<Bitboard&>(bbAttacks["nMoves"][i]);
            bbAtts = (bbAtts ^ this->bbWhite) & bbAtts;
            this->bbWAttacks = this->bbWAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        case 'k': {
            Bitboard bbAtts = extract<Bitboard&>(bbAttacks["kMoves"][i]);
            bbAtts = (bbAtts ^ this->bbBlack) & bbAtts;
            this->bbBAttacks = this->bbBAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        case 'K': {
            Bitboard bbAtts = extract<Bitboard&>(bbAttacks["kMoves"][i]);
            bbAtts = (bbAtts ^ this->bbWhite) & bbAtts;
            this->bbWAttacks = this->bbWAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        case 'b': {
            Bitboard bbD = Bitboard::freeSqDiag(this->bbAll, i);
            int fD = Bitboard::getFirstSetBit(bbD);
            if (rowFromSquare(fD) > 0 && colFromSquare(fD) > 0 && isDiagonal(fD, fD - 9)) {
                char piece = this->boardArray[fD-9];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbD.set(fD - 9);
            }
            int lD = Bitboard::getLastSetBit(bbD);
            if (rowFromSquare(lD) < 7 && colFromSquare(lD) < 7 && isDiagonal(lD, lD + 9)) {
                char piece = this->boardArray[lD + 9];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbD.set(lD + 9);
            }

            Bitboard bbAd = Bitboard::freeSqAntiDiag(this->bbAll, i);
            fD = Bitboard::getFirstSetBit(bbAd);
            if (rowFromSquare(fD) > 0 && colFromSquare(fD) < 7 && isDiagonal(fD, fD - 7)) {
                char piece = this->boardArray[fD - 7];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbAd.set(fD - 7);
            }
            lD = Bitboard::getLastSetBit(bbAd);
            if (rowFromSquare(lD) < 7 && colFromSquare(lD) > 0 && isDiagonal(lD, lD + 7)) {
                char piece = this->boardArray[lD + 7];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbAd.set(lD + 7);
            }
            bbD.unset(i);
            bbAd.unset(i);
            Bitboard bbAtts = bbD | bbAd;
            this->bbBAttacks = this->bbBAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        case 'B': {
            Bitboard bbD = Bitboard::freeSqDiag(this->bbAll, i);
            int fD = Bitboard::getFirstSetBit(bbD);
            if (rowFromSquare(fD) > 0 && colFromSquare(fD) > 0 && isDiagonal(fD, fD - 9)) {
                char piece = this->boardArray[fD-9];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbD.set(fD - 9);
            }
            int lD = Bitboard::getLastSetBit(bbD);
            if (rowFromSquare(lD) < 7 && colFromSquare(lD) < 7 && isDiagonal(lD, lD + 9)) {
                char piece = this->boardArray[lD + 9];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbD.set(lD + 9);
            }

            Bitboard bbAd = Bitboard::freeSqAntiDiag(this->bbAll, i);
            fD = Bitboard::getFirstSetBit(bbAd);
            if (rowFromSquare(fD) > 0 && colFromSquare(fD) < 7 && isDiagonal(fD, fD - 7)) {
                char piece = this->boardArray[fD - 7];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbAd.set(fD - 7);
            }
            lD = Bitboard::getLastSetBit(bbAd);
            if (rowFromSquare(lD) < 7 && colFromSquare(lD) > 0 && isDiagonal(lD, lD + 7)) {
                char piece = this->boardArray[lD + 7];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbAd.set(lD + 7);
            }
            bbD.unset(i);
            bbAd.unset(i);
            Bitboard bbAtts = bbD | bbAd;
            this->bbWAttacks = this->bbWAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        case 'r': {
            Bitboard bbR = Bitboard::freeSqRank(this->bbAll, i);
            int fR = Bitboard::getFirstSetBit(bbR);
            if (colFromSquare(fR) > 0 && isSameRow(fR, fR -1)) {
                char piece = this->boardArray[fR - 1];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbR.set(fR - 1);
            }
            int lR = Bitboard::getLastSetBit(bbR);
            if (colFromSquare(lR) < 7 && isSameRow(lR, lR + 1)) {
                char piece = this->boardArray[lR - 1];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbR.set(lR + 1);
            }
            Bitboard bbF = Bitboard::freeSqFile(this->bbAll, i);
            int fF = Bitboard::getFirstSetBit(bbF);
            if (fF > 7 and isSameCol(fF, fF - 8)) {
                char piece = this->boardArray[fF - 8];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbF.set(fF - 8);
            }
            int lF = Bitboard::getLastSetBit(bbF);
            if (lF < 56 && isSameCol(lF, lF + 8)) {
                char piece = this->boardArray[lF + 8];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbF.set(lF + 8);
            }
            bbR.unset(i);
            bbF.unset(i);
            Bitboard bbAtts = bbF | bbR;
            this->bbBAttacks = this->bbBAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        case 'R': {
            Bitboard bbR = Bitboard::freeSqRank(this->bbAll, i);
            int fR = Bitboard::getFirstSetBit(bbR);
            if (colFromSquare(fR) > 0 && isSameRow(fR, fR -1)) {
                char piece = this->boardArray[fR - 1];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbR.set(fR - 1);
            }
            int lR = Bitboard::getLastSetBit(bbR);
            if (colFromSquare(lR) < 7 && isSameRow(lR, lR + 1)) {
                char piece = this->boardArray[lR - 1];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbR.set(lR + 1);
            }
            Bitboard bbF = Bitboard::freeSqFile(this->bbAll, i);
            int fF = Bitboard::getFirstSetBit(bbF);
            if (fF > 7 and isSameCol(fF, fF - 8)) {
                char piece = this->boardArray[fF - 8];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbF.set(fF - 8);
            }
            int lF = Bitboard::getLastSetBit(bbF);
            if (lF < 56 && isSameCol(lF, lF + 8)) {
                char piece = this->boardArray[lF + 8];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbF.set(lF + 8);
            }
            bbR.unset(i);
            bbF.unset(i);
            Bitboard bbAtts = bbF | bbR;
            this->bbWAttacks = this->bbWAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        case 'q': {
            Bitboard bbD = Bitboard::freeSqDiag(this->bbAll, i);
            int fD = Bitboard::getFirstSetBit(bbD);
            if (rowFromSquare(fD) > 0 && colFromSquare(fD) > 0 && isDiagonal(fD, fD - 9)) {
                char piece = this->boardArray[fD-9];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbD.set(fD - 9);
            }
            int lD = Bitboard::getLastSetBit(bbD);
            if (rowFromSquare(lD) < 7 && colFromSquare(lD) < 7 && isDiagonal(lD, lD + 9)) {
                char piece = this->boardArray[lD + 9];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbD.set(lD + 9);
            }

            Bitboard bbAd = Bitboard::freeSqAntiDiag(this->bbAll, i);
            fD = Bitboard::getFirstSetBit(bbAd);
            if (rowFromSquare(fD) > 0 && colFromSquare(fD) < 7 && isDiagonal(fD, fD - 7)) {
                char piece = this->boardArray[fD - 7];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbAd.set(fD - 7);
            }
            lD = Bitboard::getLastSetBit(bbAd);
            if (rowFromSquare(lD) < 7 && colFromSquare(lD) > 0 && isDiagonal(lD, lD + 7)) {
                char piece = this->boardArray[lD + 7];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbAd.set(lD + 7);
            }
            Bitboard bbR = Bitboard::freeSqRank(this->bbAll, i);
            int fR = Bitboard::getFirstSetBit(bbR);
            if (colFromSquare(fR) > 0 && isSameRow(fR, fR -1)) {
                char piece = this->boardArray[fR - 1];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbR.set(fR - 1);
            }
            int lR = Bitboard::getLastSetBit(bbR);
            if (colFromSquare(lR) < 7 && isSameRow(lR, lR + 1)) {
                char piece = this->boardArray[lR - 1];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbR.set(lR + 1);
            }
            Bitboard bbF = Bitboard::freeSqFile(this->bbAll, i);
            int fF = Bitboard::getFirstSetBit(bbF);
            if (fF > 7 and isSameCol(fF, fF - 8)) {
                char piece = this->boardArray[fF - 8];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbF.set(fF - 8);
            }
            int lF = Bitboard::getLastSetBit(bbF);
            if (lF < 56 && isSameCol(lF, lF + 8)) {
                char piece = this->boardArray[lF + 8];
                if (piece == 'P' || piece == 'N' || piece == 'B' || piece == 'R' || piece == 'Q' || piece == 'K')
                    bbF.set(lF + 8);
            }
            bbD.unset(i);
            bbAd.unset(i);
            bbR.unset(i);
            bbF.unset(i);
            Bitboard bbAtts = bbD | bbAd | bbF | bbR;
            this->bbBAttacks = this->bbBAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        case 'Q': {
            Bitboard bbD = Bitboard::freeSqDiag(this->bbAll, i);
            int fD = Bitboard::getFirstSetBit(bbD);
            if (rowFromSquare(fD) > 0 && colFromSquare(fD) > 0 && isDiagonal(fD, fD - 9)) {
                char piece = this->boardArray[fD-9];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbD.set(fD - 9);
            }
            int lD = Bitboard::getLastSetBit(bbD);
            if (rowFromSquare(lD) < 7 && colFromSquare(lD) < 7 && isDiagonal(lD, lD + 9)) {
                char piece = this->boardArray[lD + 9];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbD.set(lD + 9);
            }

            Bitboard bbAd = Bitboard::freeSqAntiDiag(this->bbAll, i);
            fD = Bitboard::getFirstSetBit(bbAd);
            if (rowFromSquare(fD) > 0 && colFromSquare(fD) < 7 && isDiagonal(fD, fD - 7)) {
                char piece = this->boardArray[fD - 7];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbAd.set(fD - 7);
            }
            lD = Bitboard::getLastSetBit(bbAd);
            if (rowFromSquare(lD) < 7 && colFromSquare(lD) > 0 && isDiagonal(lD, lD + 7)) {
                char piece = this->boardArray[lD + 7];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbAd.set(lD + 7);
            }
            Bitboard bbR = Bitboard::freeSqRank(this->bbAll, i);
            int fR = Bitboard::getFirstSetBit(bbR);
            if (colFromSquare(fR) > 0 && isSameRow(fR, fR -1)) {
                char piece = this->boardArray[fR - 1];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbR.set(fR - 1);
            }
            int lR = Bitboard::getLastSetBit(bbR);
            if (colFromSquare(lR) < 7 && isSameRow(lR, lR + 1)) {
                char piece = this->boardArray[lR - 1];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbR.set(lR + 1);
            }
            Bitboard bbF = Bitboard::freeSqFile(this->bbAll, i);
            int fF = Bitboard::getFirstSetBit(bbF);
            if (fF > 7 and isSameCol(fF, fF - 8)) {
                char piece = this->boardArray[fF - 8];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbF.set(fF - 8);
            }
            int lF = Bitboard::getLastSetBit(bbF);
            if (lF < 56 && isSameCol(lF, lF + 8)) {
                char piece = this->boardArray[lF + 8];
                if (piece == 'p' || piece == 'n' || piece == 'b' || piece == 'r' || piece == 'q' || piece == 'k')
                    bbF.set(lF + 8);
            }
            bbD.unset(i);
            bbAd.unset(i);
            bbR.unset(i);
            bbF.unset(i);
            Bitboard bbAtts = bbD | bbAd | bbR | bbF;
            this->bbWAttacks = this->bbWAttacks | bbAtts;
            this->bbPseudoLegalMoves[i] = bbAtts;
            break; }
        default:
            break;
        }    
    }
    
    if (this->bbBKing.get(60)) {
        if (this->castlingAvail.find("k") != std::string::npos) {
            if (!bbAll.get(61) && !bbAll.get(62)) {
                Bitboard bb;
                bb.set(60);
                bb.set(61);
                bb.set(62);
                if (!(bb & bbWAttacks)) {
                    Bitboard& bbPseudo = extract<Bitboard&>(this->bbPseudoLegalMoves[60]);
                    bbPseudo.set(62);
                    this->bbBAttacks.set(62);
                }
            }
        }
        if (this->castlingAvail.find("q") != std::string::npos) {
            if (!bbAll.get(59) && !bbAll.get(58)) {
                Bitboard bb;
                bb.set(60);
                bb.set(59);
                bb.set(58);
                if (!(bb & bbWAttacks)) {
                    Bitboard& bbPseudo = extract<Bitboard&>(this->bbPseudoLegalMoves[60]);
                    bbPseudo.set(58);
                    this->bbBAttacks.set(58);
                }
            }
        }
    }    
    if (this->bbWKing.get(4)) {
        if (this->castlingAvail.find("K") != std::string::npos) {
            if (!bbAll.get(5) && !bbAll.get(6)) {
                Bitboard bb;
                bb.set(4);
                bb.set(5);
                bb.set(6);
                if (!(bb & bbBAttacks)) {
                    Bitboard& bbPseudo = extract<Bitboard&>(this->bbPseudoLegalMoves[4]);
                    bbPseudo.set(6);
                    this->bbWAttacks.set(6);
                }
            }
        }
        if (this->castlingAvail.find("Q") != std::string::npos) {
            if (!bbAll.get(3) && !bbAll.get(2)) {
                Bitboard bb;
                bb.set(4);
                bb.set(3);
                bb.set(2);
                if (!(bb & bbBAttacks)) {
                    Bitboard& bbPseudo = extract<Bitboard&>(this->bbPseudoLegalMoves[4]);
                    bbPseudo.set(2);
                    this->bbWAttacks.set(2);
                }
            }
        }
    }
}

bool FEN::hasLegalMoves(char colour) {
    if (this->flags["hasLegalMoves"][colour] != -1)
        return this->flags["hasLegalMoves"][colour];
        
    int fromSq = -1;
    
    Bitboard bbKing = colour == 'w' ? this->bbWKing : this->bbBKing;
    fromSq = extract<int>(bbKing.bitsSet()[0]);
    Bitboard bbTo = extract<Bitboard>(this->bbPseudoLegalMoves[fromSq]);
    if (bbTo.any()) {
        list liTo = bbTo.bitsSet();
        for (int i = 0; i < len(liTo); i++) {
            object objResp = this->_move(fromSq, extract<int>(liTo[i]), '\0', false);
            if (objResp != object()) {
                FEN fenDest = extract<FEN>(objResp["position"]);
                if (fenDest.isLegal()) {
                    this->flags["hasLegalMoves"][colour] = true;
                    return true;
                }
            }
        }
    }
    
    Bitboard bbOthers = colour =='w' ? this->bbWQueens : this->bbBQueens;
    if (bbOthers.any()) {
        list liOthers = bbOthers.bitsSet();
        for (int ii = 0; ii < len(liOthers); ii++) {
            fromSq = extract<int>(liOthers[ii]);
            bbTo = extract<Bitboard>(this->bbPseudoLegalMoves[fromSq]);
            if (bbTo.any()) {
                list liTo = bbTo.bitsSet();
                for (int i = 0; i < len(liTo); i++) {
                    object objResp = this->_move(fromSq, extract<int>(liTo[i]), '\0', false);
                    if (objResp != object()) {
                        FEN fenDest = extract<FEN>(objResp["position"]);
                        if (fenDest.isLegal()) {
                            this->flags["hasLegalMoves"][colour] = true;
                            return true;
                        }
                    }
                }
            }
        }
    }
    
    bbOthers = colour =='w' ? this->bbWRooks : this->bbBRooks;
    if (bbOthers.any()) {
        list liOthers = bbOthers.bitsSet();
        for (int ii = 0; ii < len(liOthers); ii++) {
            fromSq = extract<int>(liOthers[ii]);
            bbTo = extract<Bitboard>(this->bbPseudoLegalMoves[fromSq]);
            if (bbTo.any()) {
                list liTo = bbTo.bitsSet();
                for (int i = 0; i < len(liTo); i++) {
                    object objResp = this->_move(fromSq, extract<int>(liTo[i]), '\0', false);
                    if (objResp != object()) {
                        FEN fenDest = extract<FEN>(objResp["position"]);
                        if (fenDest.isLegal()) {
                            this->flags["hasLegalMoves"][colour] = true;
                            return true;
                        }
                    }
                }
            }
        }
    }
    
    bbOthers = colour =='w' ? this->bbWBishops : this->bbBBishops;
    if (bbOthers.any()) {
        list liOthers = bbOthers.bitsSet();
        for (int ii = 0; ii < len(liOthers); ii++) {
            fromSq = extract<int>(liOthers[ii]);
            bbTo = extract<Bitboard>(this->bbPseudoLegalMoves[fromSq]);
            if (bbTo.any()) {
                list liTo = bbTo.bitsSet();
                for (int i = 0; i < len(liTo); i++) {
                    object objResp = this->_move(fromSq, extract<int>(liTo[i]), '\0', false);
                    if (objResp != object()) {
                        FEN fenDest = extract<FEN>(objResp["position"]);
                        if (fenDest.isLegal()) {
                            this->flags["hasLegalMoves"][colour] = true;
                            return true;
                        }
                    }
                }
            }
        }
    }
    
    bbOthers = colour =='w' ? this->bbWKnights : this->bbBKnights;
    if (bbOthers.any()) {
        list liOthers = bbOthers.bitsSet();
        for (int ii = 0; ii < len(liOthers); ii++) {
            fromSq = extract<int>(liOthers[ii]);
            bbTo = extract<Bitboard>(this->bbPseudoLegalMoves[fromSq]);
            if (bbTo.any()) {
                list liTo = bbTo.bitsSet();
                for (int i = 0; i < len(liTo); i++) {
                    object objResp = this->_move(fromSq, extract<int>(liTo[i]), '\0', false);
                    if (objResp != object()) {
                        FEN fenDest = extract<FEN>(objResp["position"]);
                        if (fenDest.isLegal()) {
                            this->flags["hasLegalMoves"][colour] = true;
                            return true;
                        }
                    }
                }
            }
        }
    }
    
    bbOthers = colour =='w' ? this->bbWPawns : this->bbBPawns;
    if (bbOthers.any()) {
        list liOthers = bbOthers.bitsSet();
        for (int ii = 0; ii < len(liOthers); ii++) {
            fromSq = extract<int>(liOthers[ii]);
            bbTo = extract<Bitboard>(this->bbPseudoLegalMoves[fromSq]);
            if (bbTo.any()) {
                list liTo = bbTo.bitsSet();
                for (int i = 0; i < len(liTo); i++) {
                    object objResp = this->_move(fromSq, extract<int>(liTo[i]), '\0', false);
                    if (objResp != object()) {
                        FEN fenDest = extract<FEN>(objResp["position"]);
                        if (fenDest.isLegal()) {
                            this->flags["hasLegalMoves"][colour] = true;
                            return true;
                        }
                    }
                }
            }
        }
    }
    
    this->flags["hasLegalMoves"][colour] = false;
    return false;
}

bool FEN::isLegal() {
    if (this->activeColor == "w")
        return !this->isCheck('b');
    else
        return !this->isCheck('w');
}

bool FEN::isCheck(char colour) {
    if (this->flags["check"][colour] != -1)
        return this->flags["check"][colour];
    
    Bitboard bbFoes;
    Bitboard bbKing;
    
    if (colour == 'w') {
        bbFoes = this->bbBAttacks;
        bbKing = this->bbWKing;
    }
    else if (colour == 'b') {
        bbFoes = this->bbWAttacks;
        bbKing = this->bbBKing;
    }
    else
        return false;
    
    this->flags["check"][colour] = bool(bbKing & bbFoes);
    return bool(bbKing & bbFoes);    
}

bool FEN::isCheckMate(char colour) {
    if (this->flags["checkMate"][colour] != -1)
        return this->flags["checkMate"][colour];
    
    this->flags["checkMate"][colour] = this->isCheck(colour) && !this->hasLegalMoves(colour);
    return extract<bool>(this->flags["checkMate"][colour]);
}

bool FEN::isStaleMate(char colour) {
    if (this->flags["staleMate"][colour] != -1)
        return this->flags["staleMate"][colour];
    
    std::string strcolour("");
    strcolour += colour;
    this->flags["staleMate"][colour] = !this->isCheck(colour) && !this->hasLegalMoves(colour) && this->activeColor == strcolour;
    return extract<bool>(this->flags["staleMate"][colour]);
}


bool FEN::canMove(int sqFrom, int sqTo) {
    Bitboard bb = extract<Bitboard>(this->bbPseudoLegalMoves[sqFrom]);
    return bb.get(sqTo);
}

object FEN::_move(int sqFrom, int sqTo, char crowning, bool strict) {
    if (this->boardArray[sqFrom] == '0')
        return object();
    if (strict) {
        char p = this->boardArray[sqFrom];
        if (this->activeColor == "w" && (p == 'p' || p == 'n' || p == 'b' || p == 'r' || p == 'q' || p == 'k'))
            return object();
        if (this->activeColor == "b" && (p == 'P' || p == 'N' || p == 'B' || p == 'R' || p == 'Q' || p == 'K'))
            return object();
    }
    if (!this->canMove(sqFrom, sqTo))
        return object();
    
    char newboardArray[65];
    memcpy(newboardArray, this->boardArray, 65 * sizeof(char));

    if (!crowning)
        newboardArray[sqTo] = this->boardArray[sqFrom];
    else {
        if (activeColor == "b")
            crowning = tolower(crowning);
        else
            crowning = toupper(crowning);
        newboardArray[sqTo] = crowning;
    }
    newboardArray[sqFrom] = '0';
    
    if (enPassant != "-" && sqTo == algebraicToSquare(str(enPassant)) && (boardArray[sqFrom] == 'p' || boardArray[sqFrom] == 'P')) {
        if (activeColor == "w")
            newboardArray[sqTo - 8] = '0';
        else
            newboardArray[sqTo + 8] = '0';
    }
    
    if (sqFrom == 60 and sqTo == 62) {
        if (boardArray[sqFrom] == 'k') {
            newboardArray[61] = 'r';
            newboardArray[63] = '0';
        }
    }
    if (sqFrom == 60 and sqTo == 58) {
        if (boardArray[sqFrom] == 'k') {
            newboardArray[59] = 'r';
            newboardArray[56] = '0';
        }
    }
    if (sqFrom == 4 and sqTo == 6) {
        if (boardArray[sqFrom] == 'K') {
            newboardArray[5] = 'R';
            newboardArray[7] = '0';
        }
    }
    if (sqFrom == 4 and sqTo == 2) {
        if (boardArray[sqFrom] == 'K') {
            newboardArray[3] = 'R';
            newboardArray[0] = '0';
        }
    }
    
    char invboardArray[65] = {'\0'};
    for (int index = 0; index < 64; index++)
        invboardArray[index ^ 56] = newboardArray[index];
    std::string pp(FEN::ppCompress(invboardArray));
    
    std::string newActiveColor = activeColor == "w" ? "b" : "w"; 
    std::string newCastlingAvail = castlingAvail;
    if (sqFrom == 0)
        newCastlingAvail = boost::regex_replace(newCastlingAvail, boost::regex("Q"), std::string(""));
    if (sqFrom == 7)
        newCastlingAvail = boost::regex_replace(newCastlingAvail, boost::regex("K"), std::string(""));
    if (sqFrom == 4) {
        newCastlingAvail = boost::regex_replace(newCastlingAvail, boost::regex("Q"), std::string(""));
        newCastlingAvail = boost::regex_replace(newCastlingAvail, boost::regex("K"), std::string(""));
    }
    if (sqFrom == 56)
        newCastlingAvail = boost::regex_replace(newCastlingAvail, boost::regex("q"), std::string(""));
    if (sqFrom == 63)
        newCastlingAvail = boost::regex_replace(newCastlingAvail, boost::regex("k"), std::string(""));
    if (sqFrom == 60) {
        newCastlingAvail = boost::regex_replace(newCastlingAvail, boost::regex("q"), std::string(""));
        newCastlingAvail = boost::regex_replace(newCastlingAvail, boost::regex("k"), std::string(""));
    }
    if (newCastlingAvail == "")
        newCastlingAvail = "-";

    std::string newEnPassant = "-";
    if (boardArray[sqFrom] == 'p' && sqTo == (sqFrom - 16))
        newEnPassant = extract<const char*>(squareToAlgebraic(sqFrom - 8));
    if (boardArray[sqFrom] == 'P' && sqTo == (sqFrom + 16))
        newEnPassant = extract<const char*>(squareToAlgebraic(sqFrom + 8));
        
    std::string newHalfMoveClock = halfMoveClock;
    if (boardArray[sqFrom] == 'p' || boardArray[sqFrom] == 'P' || boardArray[sqTo] != '0')
        newHalfMoveClock = "0";
    else {
        int i = atoi(newHalfMoveClock.c_str()) + 1;
        newHalfMoveClock = extract<const char*>(str(i));
    }

    std::string newFullMoveNumber = fullMoveNumber;
    if (activeColor == "b") {
        int i = atoi(newFullMoveNumber.c_str()) + 1;
        newFullMoveNumber = extract<const char*>(str(i));
    }
        
    std::string fs = pp + " " + newActiveColor + " " + newCastlingAvail + " " + newEnPassant + \
                     " " + newHalfMoveClock + " " + newFullMoveNumber;
    FEN f(fs.c_str());
    
    std::string pgnmove = this->genPgnMoveString(sqFrom, sqTo, crowning);
    if (f.isCheck(f.activeColor[0]))
        if (f.isCheckMate(f.activeColor[0]))
            pgnmove += "#";
        else
            pgnmove += "+";
    
    dict retval;
    retval["position"] = f;
    retval["move"] = pgnmove;
    return retval;
}

std::string FEN::genPgnMoveString(int sqFrom, int sqTo, char crowning, bool full) {
    std::string prefix;
    if (full) {
        prefix = std::string(fullMoveNumber + ".");
        if (activeColor == "b")
            prefix += "..";
    }
    else
        prefix = std::string("");
    
    std::string piece("");
    piece += toupper(boardArray[sqFrom]);
    if ((sqFrom == 4 && sqTo && 6 && piece == "K") || (sqFrom == 60 && sqTo == 62 && piece == "K"))
        return std::string(prefix + "0-0");
    if ((sqFrom == 4 && sqTo == 2 && piece == "K") || (sqFrom == 60 && sqTo == 58 && piece == "K"))
        return std::string(prefix + "0-0-0");
    if (piece == "P")
        piece = "";
    std::string disAmbigOrigin = "";
    Bitboard bb = getBitboardFromSquare(sqFrom);
    if (piece != "" && bb.count() > 1) {
        list occupied = bb.bitsSet();
        for (int sq = 0; sq < len(occupied); sq++) {
            if (occupied[sq] != sqFrom) {
                if (this->bbPseudoLegalMoves[occupied[sq]] & Bitboard(U64(1) << sqTo)) {
                    if (colFromSquare(sqFrom) != colFromSquare(extract<UINT>(occupied[sq])))
                        disAmbigOrigin += char(97 + colFromSquare(sqFrom));
                    else
                        disAmbigOrigin += extract<const char*>(str(rowFromSquare(sqFrom) + 1));
                    break;
                }
            }
        }
    }
    
    std::string capture;
    std::string destiny;
    
    if (this->boardArray[sqTo] != '0')
        capture = "x";
    else
        capture = "";
    if (piece == "" && (capture == "x" || colFromSquare(sqFrom) != colFromSquare(sqTo))) {
        capture = "x";
        piece = std::string("");
        piece += char(97 + colFromSquare(sqFrom));
        destiny = std::string(extract<const char*>(squareToAlgebraic(sqTo)));
    }
    else
        destiny = std::string(extract<const char*>(squareToAlgebraic(sqTo)));
    
    std::string strCrowning("");
    
    if (crowning)
        strCrowning += crowning;
//    else
//        strCrowning = "";
    
    std::string retval("");
    retval += prefix;
    retval += piece;
    retval += disAmbigOrigin;
    retval += capture;
    retval += destiny;
    retval += strCrowning;
    
    return retval;
}

boost::python::object FEN::move(int arg1, int arg2, char crowning, bool strict) {
        try {
            return _move(arg1, arg2, crowning, strict);
        }
        catch(...) {
            return object();
        }
}

boost::python::object FEN::move(std::string arg1, bool strict) {
    
    boost::regex pat("^([a-h][1-8])[\\s\\-]?([a-h][1-8])[=\\s]?([NBRQ])?([+#])?$");
    boost::smatch matches;
    bool m = false;
    try {
        m = boost::regex_match(arg1, matches, pat);
    }
    catch(...) {m = false;}
    if (!m) {
        return _pgnMove(arg1, strict);
    }
    else {
        try {
            int sqFrom = algebraicToSquare(str(matches.str(1).c_str()));
            int sqTo = algebraicToSquare(str(matches.str(2).c_str()));
            std::string crown = matches.str(3);
            char ccrown = '\0';
            if (crown.length())
                ccrown = crown[0];
            return _move(sqFrom, sqTo, ccrown, strict);
        }
        catch(...) {
            return object();
        }
    }
}    

boost::python::object FEN::_pgnMove(std::string pgn, bool strict) {

    int sqFrom = -1;
    int sqTo = -1;
    
    //patPawn = r"(?:(?P<pawn>[a-h])(?:(?P<pawncapture>x[a-h][1-8])|(?P<pawndestrow>[1-8]))(?:=?(?P<crowning>[NBRQ]))?)"
    std::string patPawn("(?:([a-h])(?:(x[a-h][1-8])|([1-8]))(?:=?([NBRQ]))?)");
    //patPiece = r"(?:(?P<piece>[NBRQK])(?P<origpiececol>[a-h])?(?P<origpiecerow>[1-8])?x?(?P<piecedestination>[a-h][1-8]))"
    std::string patPiece = "(?:([NBRQK])([a-h])?([1-8])?x?([a-h][1-8]))";
    //patShortCastling = r"(?P<shortcastling>[0O]-[0O])"
    std::string patShortCastling = "([0O]-[0O])";
    //patLongCastling = r"(?P<longcastling>[0O]-[0O]-[0O])"
    std::string patLongCastling = "([0O]-[0O]-[0O])";
    
    //pat = r"^(?:" + patPawn + "|" + patPiece + "|" + patShortCastling + "|" + patLongCastling + \
    //")(?:(?P<check>\+)|(?P<mate>#))?$"
    std::string patAll = "^(?:" + patPawn + "|" + patPiece + "|" + patShortCastling + "|" + patLongCastling +  \
                         ")(?:(\\+)|(#))?$";
    
    boost::regex pat(patAll);
//    std::cout << "(_pgnMove) Mark count: " << pat.mark_count() << std::endl;

    boost::smatch matches;
    bool m = boost::regex_match(pgn, matches, pat);
    if (!m)
        return object();
    else {
//        for(int i = 0; i < pat.mark_count(); i++)
//            if (matches.str(i).size())
//                std::cout << "Matches[" << i << "]: " << matches[i] << std::endl;
        if (matches.str(9).size()) {
            if (activeColor == "w") {
                sqFrom = 4;
                sqTo = 6;
            }
            else {
                sqFrom = 60;
                sqTo = 62;
            }
            return _move(sqFrom, sqTo, '\0', strict);
        }
        if (matches.str(10).size()) {
            if (activeColor == "w") {
                sqFrom = 4;
                sqTo = 2;
            }
            else {
                sqFrom = 60;
                sqTo = 58;
            }
            return _move(sqFrom, sqTo, '\0', strict);
        }
        
        if (matches.str(1).size()) {
            Bitboard bbPawns;
            if (activeColor == "w")
                bbPawns = this->bbWPawns;
            else
                bbPawns = this->bbBPawns;
            int origCol = matches.str(1)[0] - 97;
            int origRow = -1;
            int destRow = -1;
            int destCol = -1;
            if (matches.str(3).size()) {//pawn move
                destCol = origCol;
                destRow = atoi(matches.str(3).c_str()) - 1;
            }
            else {//pawncapture
                destCol = matches.str(2)[1] - 97;
                destRow = matches.str(2)[2] - 49;
            }
            if ((destRow == 7 || destRow == 0) && !matches.str(4).size())
                return object();
            if ((destRow != 7 && destRow != 0) & matches.str(4).size())
                return object();
            list bbPlist = bbPawns.bitsSet();    
            for ( int i = 0; i < len(bbPlist); i++) {
                int sq = extract<int>(bbPlist[i]);
                if (colFromSquare(sq) == origCol) {
                    Bitboard bbMoves = extract<Bitboard>(bbPseudoLegalMoves[sq]);
                    if (bbMoves.get(rowColToSquare(destRow, destCol))) {
                        sqFrom = sq;
                        sqTo = rowColToSquare(destRow, destCol);
                        break;
                    }
                }
            }
            if (sqTo != -1 && sqFrom != -1) {
                if (matches.str(4).size())
                    return _move(sqFrom, sqTo, matches.str(4)[0], strict);
                else
                    return _move(sqFrom, sqTo, '\0', strict);
            }
            else
                return object();
        }

        if (matches.str(5).size()) { 
            if (matches.str(4).size()) {
                return object();
            }
            
            Bitboard bbPieces;
            
            if (matches.str(5) == "N") {
                if (this->activeColor == "w") {
                    bbPieces = this->bbWKnights;
                }
                else {
                    bbPieces = this->bbBKnights;
                }
            }
            else if (matches.str(5) == "B") {
                if (this->activeColor == "w") {
                    bbPieces = this->bbWBishops;
                }
                else {
                    bbPieces = this->bbBBishops;
                }
            }
            else if (matches.str(5) == "R") {
                if (this->activeColor == "w") {
                    bbPieces = this->bbWRooks;
                }
                else {
                    bbPieces = this->bbBRooks;
                }
            }
            else if (matches.str(5) == "Q") {
                if (this->activeColor == "w") {
                    bbPieces = this->bbWQueens;
                }
                else {
                    bbPieces = this->bbBQueens;
                }
            }
            else if (matches.str(5) == "K") {
                if (this->activeColor == "w") {
                    bbPieces = this->bbWKing;
                }
                else {
                    bbPieces = this->bbBKing;
                }
            }
            
            sqTo = algebraicToSquare(str(matches.str(8).c_str()));
            list candidates;
            list bitsSet = bbPieces.bitsSet();
            
            for (int i = 0; i < len(bitsSet); i++) {
                int sq = extract<int>(bitsSet[i]);
                Bitboard bbFrom = extract<Bitboard>(this->bbPseudoLegalMoves[sq]);
                if (bbFrom.get(sqTo)) {
                    candidates.append(sq);
                }
            }
            if (!len(candidates)) {
                return object();
            }
            if (len(candidates) == 1) {
                sqFrom = extract<int>(candidates[0]);
            }
            else {
                if (matches.str(6).size() && matches.str(7).size()) {
                    int oRow = matches.str(7)[0] - 49;
                    int oCol = matches.str(6)[0] - 97;
                    int oSq = rowColToSquare(oRow, oCol);
                    for (int i = 0; i < len(candidates); i++) {
                        int sq = extract<int>(candidates[i]);
                        if (sq == oSq) {
                            sqFrom = sq;
                            break;
                        }
                    }
                }
                else if (matches.str(6).size() && !matches.str(7).size()) {
                    int oCol = matches.str(6)[0] - 97;
                    for (int i = 0; i < len(candidates); i++) {
                        int sq = extract<int>(candidates[i]);
                        if (colFromSquare(sq) == oCol) {
                            sqFrom = sq;
                            break;
                        }
                    }
                }
                else if (!matches.str(6).size() && matches.str(7).size()) {
                    int oRow = matches.str(7)[0] - 49;
                    for (int i = 0; i < len(candidates); i++) {
                        int sq = extract<int>(candidates[i]);
                        if (rowFromSquare(sq) == oRow) {
                            sqFrom = sq;
                            break;
                        }
                    }
                }
                else {
                    return object();
                }
            }
            
            if (sqFrom == -1) {
                return object();
            }
            else {
                return this->_move(sqFrom, sqTo, '\0', strict);
            }
        }  
    } 
    return object();
}

Bitboard FEN::getBitboardFromSquare(int sq) {
    if (boardArray[sq] == '0')
        return Bitboard();
    if (boardArray[sq] == 'p')
        return bbBPawns;
    if (boardArray[sq] == 'P')
        return bbWPawns;
    if (boardArray[sq] == 'n')
        return bbBKnights;
    if (boardArray[sq] == 'N')
        return bbWKnights;
    if (boardArray[sq] == 'k')
        return bbBKing;
    if (boardArray[sq] == 'K')
        return bbWKing;
    if (boardArray[sq] == 'b')
        return bbBBishops;
    if (boardArray[sq] == 'B')
        return bbWBishops;
    if (boardArray[sq] == 'r')
        return bbBRooks;
    if (boardArray[sq] == 'R')
        return bbWRooks;
    if (boardArray[sq] == 'q')
        return bbBQueens;
    if (boardArray[sq] == 'Q')
        return bbWQueens;

    return Bitboard();
}

std::string FEN::asciiBoard() {
// return re.sub(r'(\w{8})', r'\1\n', FEN.ppExpand(self.piecePlacement))    
    boost::regex pat("(\\w{8})");
    std::string repl("\\1\n");
    return boost::regex_replace(std::string(FEN::ppExpand(this->piecePlacement.c_str())), pat, repl);
}

/*
std::string expand_digits(boost::xpressive::smatch what) {
    std::string* ptr = new std::string("*" + what[1].str() + "@");
    return *ptr;
    }
 */  


char FEN::getSqColor(int sq) {
    if (!rowFromSquare(sq)) {
    char cColours[2] = {'b','w'};
    return cColours[sq % 2];
    }
    else {
    char cColours[2] = {'w','b'};
    return cColours[sq % 2];
    }
}


std::string& expand_digits(char x) {
    int dig = int(x) - 48;
    std::string* retval = new std::string("");
    for (int i = 0; i < dig; i++)
        *retval += "0";
    return *retval;
    }
    
//const char* FEN::ppExpand(/*const char* compressedPP*/) {
const char* FEN::ppExpand(const char* compressedPP) {
//    return re.sub(r"\d", lambda matched : "0" * int(matched.group()), compressedPP.replace("/", ""))

    boost::regex pat("(\\w+)/");
    std::string repl("\\1");
    std::string pre_outp = boost::regex_replace(std::string(compressedPP), pat, repl);
    
//    boost::xpressive::sregex pat2 = boost::xpressive::sregex::compile("(\\d)");
//    outp = boost::xpressive::regex_replace(outp, pat2, std::string("#$1-$1-$1#"));
//    std::string outp = boost::xpressive::regex_replace(pre_outp, pat2, expand_digits);

    std::string* outp = new std::string("");

    for(int i = 0; i < pre_outp.length(); i++) {
        if (!isdigit(pre_outp[i]))
            *outp += pre_outp[i];
        else
            *outp += expand_digits(pre_outp[i]);
        }    
    
    return outp->c_str();
}

const char* FEN::ppCompress(const char* expandedPP) {

    boost::regex pat("(\\w{8})(?=\\w)");
    std::string repl("\\1/");
    std::string pre_outp = boost::regex_replace(std::string(expandedPP), pat, repl);
    
    std::string *outp = new std::string("");
    
    UINT zeroCounter = 0;
    for (int i = 0; i < pre_outp.length(); i++) {
        if (pre_outp[i] != '0') {
            *outp += pre_outp[i];    
        }
        else {
            while (pre_outp[i + zeroCounter] == '0')
                zeroCounter++;
            *outp += char(48 + zeroCounter);
            i += zeroCounter - 1;
            zeroCounter = 0;
        }
    }
    return outp->c_str();
}


#/**************************************************************************************************************/
#/**************************************************************************************************************/
