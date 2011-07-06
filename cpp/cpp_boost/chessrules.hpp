#ifndef CPP_CHESSRULES

#define CPP_CHESSRULES

#include <cstdlib>
#include <cctype>
#include <iostream>
#include <string>
#include <stdexcept>
#include <boost/python.hpp>
#include <boost/regex.hpp>
//#include <boost/xpressive/xpressive.hpp>



#ifndef max
	#define max( a, b ) ( ((a) > (b)) ? (a) : (b) )
#endif

/*
#ifndef abs
	#define abs( a ) ( ((a) >= (0)) ? (a) : (-(a)) )
#endif
*/

using namespace boost::python;

typedef unsigned long long U64;
typedef unsigned int UINT;

extern const char* version;

int main();
const char* greet();
const char* getVersion();

#/**************************************************************************************************************/
#/**************************** General functions ****************************************************************/
#/**************************************************************************************************************/

// int max(const int& a, const int& b) {return a > b ? a : b;} 

UINT rowFromSquare(UINT square);
UINT colFromSquare(UINT square);
UINT rowColToSquare(UINT row, UINT col);
bool isDiagonal(UINT sq1, UINT sq2);
bool isSameRow(UINT sq1, UINT sq2);
bool isSameCol(UINT sq1, UINT sq2);
int distance(int sq1, int sq2);
str squareToAlgebraic(UINT square); 
UINT algebraicToSquare(const str& pgnSq);

#/**************************************************************************************************************/
#/**************************************************************************************************************/

#/**************************************************************************************************************/
#/**************************** Bitboard related ****************************************************************/
#/**************************************************************************************************************/

extern dict bbAttacks;

dict getBbAttacks();

class Bitboard {
    private:
        void __init();
    protected:
        U64 _rows;
    public:
        static U64 universalBoard;
        Bitboard();
        Bitboard(U64 init);
        UINT get(UINT square) {return UINT(bool(this->_rows & (U64(1) << square)));}
        void set(UINT square) {this->_rows |= (U64(1) << square);}
        void unset(UINT square) {this->_rows &= ~(U64(1) << square);}
        void setAll() {this->_rows = Bitboard::universalBoard;}
        void unsetAll() {this->_rows = U64(0);}
        bool any() {return this->_rows != 0;}
        bool all() {return this->_rows == Bitboard::universalBoard;}
        const str toString() const;
        U64 getRows() {return this->_rows;}
        void setRow(UINT row) {this->_rows |= (U64(255) << (8 * row));}
        void unsetRow(UINT row) {this->_rows &= ~(U64(255) << (8 * row));}
        void setCol(UINT col) {
            for (UINT i = col; i < 64; i += 8)
                this->_rows |= (U64(1) << i);
            }
        void unsetCol(UINT col) {
            for (UINT i = col; i < 64; i += 8)
                this->_rows &= ~(U64(1) << i);
            }

        void setDiag(UINT square) {
            for (int i = square; i < 64; i += 9)
                if (isDiagonal(square, i))
                    this->_rows |= (U64(1) << i);
            for (int i = square - 9; i > -1; i -= 9)
                if (isDiagonal(square, i))
                    this->_rows |= (U64(1) << i);
            }
            
        void unsetDiag(UINT square) {
            for (int i = square; i < 64; i += 9)
                if (isDiagonal(square, i))
                    this->_rows &= ~(U64(1) << i);
            for (int i = square - 9; i > -1; i -= 9)
                if (isDiagonal(square, i))
                    this->_rows &= ~(U64(1) << i);
            }
            
        void setAntiDiag(UINT square) {
            for (int i = square; i < 64; i += 7)
                if (isDiagonal(square, i))
                    this->_rows |= (U64(1) << i);
            for (int i = square - 7; i > -1; i -= 7)
                if (isDiagonal(square, i))
                    this->_rows |= (U64(1) << i);
            }
            
        void unsetAntiDiag(UINT square) {
            for (int i = square; i < 64; i += 7)
                if (isDiagonal(square, i))
                    this->_rows &= ~(U64(1) << i);
            for (int i = square - 7; i > -1; i -= 7)
                if (isDiagonal(square, i))
                    this->_rows &= ~(U64(1) << i);
            }
        
        UINT count() {
            UINT retval = 0;
            for (UINT i = 0; i < 64; i++)
                retval += this->get(i);
            return retval;
            }
        
        list bitsSet() {
            list retval;
            for (UINT i = 0; i < 64; i++)
                if (this->get(i))
                    retval.append(i);
            return retval;
            }
            
        static int getFirstSetBit(Bitboard& bitboard) {
            for (int i = 0; i < 64; i++)
                if (bitboard.get(UINT(i)))
                    return i;
            return -1;
            }

        static int getLastSetBit(Bitboard& bitboard) {
            for (int i = 63; i > -1; i--)
                if (bitboard.get(UINT(i)))
                    return i;
            return -1;
            }
        
        static Bitboard freeSqRank(Bitboard& bitboard, int origSq);
        static Bitboard freeSqFile(Bitboard& bitboard, int origSq);
        static Bitboard freeSqDiag(Bitboard& bitboard, int origSq);
        static Bitboard freeSqAntiDiag(Bitboard& bitboard, int origSq);
        static void fillAttacks();
        
//        friend Bitboard& operator|(const Bitboard& self, const Bitboard& other);
        Bitboard& operator|(const Bitboard& other) {return *(new Bitboard(this->_rows | other._rows));}
        Bitboard& operator&(const Bitboard& other) {return *(new Bitboard(this->_rows & other._rows));}
        Bitboard& operator^(const Bitboard& other) {return *(new Bitboard(this->_rows ^ other._rows));}
        Bitboard& operator~() {return *(new Bitboard(~this->_rows));}
        operator bool() {return this->any();}
        Bitboard& operator<<(U64 number) {return *(new Bitboard(this->_rows << number));}
        Bitboard& operator>>(U64 number) {return *(new Bitboard(this->_rows >> number));}
        bool operator==(const Bitboard& other) {return this->_rows == other._rows;}
    };


#/**************************************************************************************************************/
#/**************************************************************************************************************/


#/**************************************************************************************************************/
#/**************************** FEN related ****************************************************************/
#/**************************************************************************************************************/

extern const char* defaultFEN;
extern const char* defaultPP;
extern const char* defaultExpPP;

const char* getDefaultFEN() {return defaultFEN;}
std::string& expand_digits(char x);

class FEN {
private:

protected:
    
public:
    
    FEN(const char* fenStr = defaultFEN);
    const char* toString() {this->fenString.c_str();}

    void initBitboards();
    
    static const char* ppExpand(const char* compressedPP = defaultPP);
    static const char* ppCompress(const char* expandedPP = defaultExpPP);
    static char getSqColor(int sq);
    
    std::string fenString;

    std::string piecePlacement;
    std::string activeColor;
    std::string castlingAvail;
    std::string enPassant;
    std::string halfMoveClock;
    std::string fullMoveNumber;
    
    char boardArray[65];
    const char* boardArrayPtr;
    
    Bitboard bbBPawns;
    Bitboard bbBKnights;
    Bitboard bbBBishops;
    Bitboard bbBRooks;
    Bitboard bbBQueens;
    Bitboard bbBKing;
    Bitboard bbWPawns;
    Bitboard bbWKnights;
    Bitboard bbWBishops;
    Bitboard bbWRooks;
    Bitboard bbWQueens;
    Bitboard bbWKing;
    
    Bitboard bbBlack;
    Bitboard bbWhite;
    Bitboard bbAll;
    
    dict bbPseudoLegalMoves;
    
    Bitboard bbBAttacks;
    Bitboard bbBPawnMoves;
    Bitboard bbWAttacks;
    Bitboard bbWPawnMoves;
    
    dict flags;
    
    bool hasLegalMoves(char colour);
    bool isLegal();
    bool isCheck(char colour);
    bool isCheckMate(char colour);
    bool isStaleMate(char colour);
    bool canMove(int sqFrom, int sqTo);
    boost::python::object move(std::string arg1, bool strict = true);
    boost::python::object move(int arg1, int arg2, char crowning = '\0', bool strict = true);
    boost::python::object _pgnMove(std::string pgn, bool strict = true);
    object _move(int sqFrom, int sqTo, char crowning = '\0', bool strict = true);
    std::string genPgnMoveString(int sqFrom, int sqTo, char crowning = '\0', bool full = false);
    std::string asciiBoard();
    Bitboard getBitboardFromSquare(int sq);
    };

boost::python::object (FEN::*move1)(std::string, bool) = &FEN::move;
boost::python::object (FEN::*move2)(int, int, char, bool) = &FEN::move;

#/**************************************************************************************************************/
#/**************************************************************************************************************/

BOOST_PYTHON_FUNCTION_OVERLOADS(ppExpand_ol, FEN::ppExpand, 0, 1)
BOOST_PYTHON_FUNCTION_OVERLOADS(ppCompress_ol, FEN::ppCompress, 0, 1)
BOOST_PYTHON_MEMBER_FUNCTION_OVERLOADS(FEN__move_ol, FEN::_move, 2, 4)
BOOST_PYTHON_MEMBER_FUNCTION_OVERLOADS(FEN_move1_ol, FEN::move, 1, 2)
BOOST_PYTHON_MEMBER_FUNCTION_OVERLOADS(FEN_move2_ol, FEN::move, 2, 4)
BOOST_PYTHON_MEMBER_FUNCTION_OVERLOADS(FEN_pgnMove_ol, FEN::_pgnMove, 1, 2)
BOOST_PYTHON_MEMBER_FUNCTION_OVERLOADS(FEN_genPgnMoveString_ol, FEN::genPgnMoveString, 2, 4)
 
BOOST_PYTHON_MODULE(cppchessrules)
{
    def("getVersion", getVersion);
    def("abs", abs);
    def("rowFromSquare", rowFromSquare);
    def("colFromSquare", colFromSquare);
    def("rowColToSquare", rowColToSquare);
    def("isDiagonal", isDiagonal);
    def("isSameRow", isSameRow);
    def("isSameCol", isSameCol);
    def("distance", distance);
    def("squareToAlgebraic", squareToAlgebraic);
    def("algebraicToSquare", algebraicToSquare);
    def("getBbAttacks", getBbAttacks);
    def("getDefaultFEN", getDefaultFEN);
    
    class_<Bitboard>("Bitboard" , init<>() )
        .def(init<U64>())
        .def_readonly("universalBoard", &Bitboard::universalBoard)
        .def("get", &Bitboard::get)
        .def("set", &Bitboard::set)
        .def("unset", &Bitboard::unset)
        .def("setAll", &Bitboard::setAll)
        .def("unsetAll", &Bitboard::unsetAll)
        .def("any", &Bitboard::any)
        .def("all", &Bitboard::all)
        .def("__repr__", &Bitboard::toString)
        .def("getRows", &Bitboard::getRows)
        .def("setRow", &Bitboard::setRow)
        .def("unsetRow", &Bitboard::unsetRow)
        .def("setCol", &Bitboard::setCol)
        .def("unsetCol", &Bitboard::unsetCol)
        .def("setDiag", &Bitboard::setDiag)
        .def("unsetDiag", &Bitboard::unsetDiag)
        .def("setAntiDiag", &Bitboard::setAntiDiag)
        .def("unsetAntiDiag", &Bitboard::unsetAntiDiag)
        .def("count", &Bitboard::count)
        .def("bitsSet", &Bitboard::bitsSet)
        .def("getFirstSetBit", &Bitboard::getFirstSetBit)
        .staticmethod("getFirstSetBit")
        .def("getLastSetBit", &Bitboard::getLastSetBit)
        .staticmethod("getLastSetBit")
        .def("freeSqRank", &Bitboard::freeSqRank)
        .staticmethod("freeSqRank")
        .def("freeSqFile", &Bitboard::freeSqFile)
        .staticmethod("freeSqFile")
        .def("freeSqDiag", &Bitboard::freeSqDiag)
        .staticmethod("freeSqDiag")
        .def("freeSqAntiDiag", &Bitboard::freeSqAntiDiag)
        .staticmethod("freeSqAntiDiag")
        .def("fillAttacks", &Bitboard::fillAttacks)
        .staticmethod("fillAttacks")
        .def(self == self)
        .def(self | self)
        .def(self & self)
        .def(self ^ self)
        .def(~self)
        .def("__nonzero__", &Bitboard::any)
        .def(self << other<U64>())
        .def(self >> other<U64>())
    ;


    class_<FEN>("FEN" , init<>() )
        .def(init<const char*>())
        .def_readonly("fenString", &FEN::fenString)
        .def_readonly("piecePlacement", &FEN::piecePlacement)
        .def_readonly("activeColor", &FEN::activeColor)
        .def_readonly("castlingAvail", &FEN::castlingAvail)
        .def_readonly("enPassant", &FEN::enPassant)
        .def_readonly("halfMoveClock", &FEN::halfMoveClock)
        .def_readonly("fullMoveNumber", &FEN::fullMoveNumber)
        .def_readonly("boardArray", &FEN::boardArrayPtr)
        .def_readonly("bbBPawns", &FEN::bbBPawns)
        .def_readonly("bbBKnights", &FEN::bbBKnights)
        .def_readonly("bbBRooks", &FEN::bbBRooks)
        .def_readonly("bbBBishops", &FEN::bbBBishops)
        .def_readonly("bbBQueens", &FEN::bbBQueens)
        .def_readonly("bbBKing", &FEN::bbBKing)
        .def_readonly("bbWPawns", &FEN::bbWPawns)
        .def_readonly("bbWKnights", &FEN::bbWKnights)
        .def_readonly("bbWBishops", &FEN::bbWBishops)
        .def_readonly("bbWRooks", &FEN::bbWRooks)
        .def_readonly("bbWQueens", &FEN::bbWQueens)
        .def_readonly("bbWKing", &FEN::bbWKing)
        .def_readonly("bbBlack", &FEN::bbBlack)
        .def_readonly("bbWhite", &FEN::bbWhite)
        .def_readonly("bbAll", &FEN::bbAll)
        .def_readonly("bbPseudoLegalMoves", &FEN::bbPseudoLegalMoves)
        .def_readonly("bbBAttacks", &FEN::bbBAttacks)
        .def_readonly("bbBPawnMoves", &FEN::bbBPawnMoves)
        .def_readonly("bbWAttacks", &FEN::bbWAttacks)
        .def_readonly("bbWPawnMoves", &FEN::bbWPawnMoves)
        .def_readonly("flags", &FEN::flags)
        
        .def("__repr__", &FEN::toString)

        .def("initBitboards", &FEN::initBitboards)
        .def("ppExpand", &FEN::ppExpand, ppExpand_ol(args("compressedPP"), "Expands a FEN compressed piece placement string."))
        .staticmethod("ppExpand")
        .def("ppCompress", &FEN::ppCompress, ppCompress_ol(args("expandedPP"), "Compresses an expanded piece placement string."))
        .staticmethod("ppCompress")
        .def("getSqColor", &FEN::getSqColor)
        .staticmethod("getSqColor")
        .def("hasLegalMoves", &FEN::hasLegalMoves)
        .def("isLegal", &FEN::isLegal)
        .def("isCheck", &FEN::isCheck)
        .def("isCheckMate", &FEN::isCheckMate)
        .def("isStaleMate", &FEN::isStaleMate)
        .def("canMove", &FEN::canMove)
        .def("_move", &FEN::_move, FEN__move_ol(args("sqFrom", "sqTo", "crowning", "strict")))
        .def("move", move1, FEN_move1_ol(args("arg1", "strict")))
        .def("move", move2, FEN_move2_ol(args("arg1", "arg2", "crowning", "strict")))
        .def("_pgnMove", &FEN::_pgnMove, FEN_pgnMove_ol(args("pgn", "strict")))
        .def("genPgnMoveString", &FEN::genPgnMoveString, FEN_genPgnMoveString_ol(args("sqFrom", "sqTo", "crowning", "full")))
        .def("asciiBoard", &FEN::asciiBoard)
        .def("getBitboardFromSquare", &FEN::getBitboardFromSquare)
    ;
}

#endif
