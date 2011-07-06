#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef max
	#define max( a, b ) ( ((a) > (b)) ? (a) : (b) )
#endif

typedef unsigned long long U64;
typedef unsigned int UINT;

typedef struct {
    char *fenString;
    char *piecePlacement;
    char activeColor;
    char *castlingAvail;
    char *enPassant;
    char *halfMoveClock;
    char *fullMoveNumber;
    } FEN;

/**************************************************************************************************************/
/**************************** General ****************************************************************/
/**************************************************************************************************************/

UINT rowFromSquare(UINT square);
UINT colFromSquare(UINT square);
UINT rowColToSquare(UINT row, UINT col);
int isDiagonal(UINT sq1, UINT sq2);
int isSameRow(UINT sq1, UINT sq2);
int isSameCol(UINT sq1, UINT sq2);
int distance(int sq1, int sq2);

/**************************************************************************************************************/
/**************************************************************************************************************/

/**************************************************************************************************************/
/**************************** Bitboard related ****************************************************************/
/**************************************************************************************************************/

U64 universalBoard;

void setBitboard(U64 *bb, int square);
void unsetBitboard(U64 *bb, int square);
int allBitboard(U64 bb);
int anyBitboard(U64 bb);
int getBitboard(U64 bb, int square);
char *reprBitboard(U64 bb);
void setRowBitboard(U64 *bb, int row);
void unsetRowBitboard(U64 *bb, int row);
void setColBitboard(U64 *bb, int col);
void unsetColBitboard(U64 *bb, int col);
void setDiagBitboard(U64 *bb, int square);
void unsetDiagBitboard(U64 *bb, int square);
void setAntiDiagBitboard(U64 *bb, int square);
void unsetAntiDiagBitboard(U64 *bb, int square);
int countBitboard(U64 bb);
int getFirstSetBit(U64 bb);
int getLastSetBit(U64 bb);
U64 freeSqRank(U64 bb, int origSq);
U64 freeSqFile(U64 bb, int origSq);
U64 freeSqDiag(U64 bb, int origSq);
U64 freeSqAntiDiag(U64 bb, int origSq);
int *bitsSet(int *num, U64 bb);

/**************************************************************************************************************/
/**************************************************************************************************************/


/**************************************************************************************************************/
/**************************** FEN related ****************************************************************/
/**************************************************************************************************************/



/**************************************************************************************************************/
/**************************************************************************************************************/
