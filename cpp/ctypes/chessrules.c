#include "chessrules.h"

/**************************************************************************************************************/
/**************************** General ****************************************************************/
/**************************************************************************************************************/

UINT rowFromSquare(UINT square) {return square >> 3;}
UINT colFromSquare(UINT square) {return square & 7;}
UINT rowColToSquare(UINT row, UINT col) {return row * 8 + col;}
int isDiagonal(UINT sq1, UINT sq2) {
    return abs(rowFromSquare(sq1) - rowFromSquare(sq2)) == abs(colFromSquare(sq1) - colFromSquare(sq2)) ? 1 : 0;
    }
int isSameRow(UINT sq1, UINT sq2) {return rowFromSquare(sq1) == rowFromSquare(sq2) ? 1 : 0;}
int isSameCol(UINT sq1, UINT sq2) {return colFromSquare(sq1) == colFromSquare(sq2) ? 1 : 0;}

int distance(int sq1, int sq2) {
    int file1 = sq1 & 7;
    int file2 = sq2 & 7;
    int rank1 = sq1 >> 3;
    int rank2 = sq2 >> 3;
    return max(abs(file1 - file2), abs(rank1 - rank2));
    }
/**************************************************************************************************************/
/**************************************************************************************************************/

/**************************************************************************************************************/
/**************************** Bitboard related ****************************************************************/
/**************************************************************************************************************/

U64 universalBoard = 18446744073709551615;

int getBitboard(U64 bb, int square) {
    return bb & ((U64)1 << square) ? 1 : 0;
    }

void setBitboard(U64 *bb, int square) {
    *bb |= (U64)1 << square;
    }

void unsetBitboard(U64 *bb, int square) {
    *bb &= ~((U64)1 << square);
    }

int anyBitboard(U64 bb) {
    return bb != 0;
    }

int allBitboard(U64 bb) {
    return bb == universalBoard;
    }
    
char *reprBitboard(U64 bb) {
    int y, x, counter = 0;
    U64 num;
    char *retval = (char *)malloc(73 * sizeof(char));
    for (y = 7; y > -1; y--) {
        num = bb >> (y * 8);
        for (x = 0; x < 8; x++) {
            if (num & (1 << x))
                retval[counter] = '1';
            else
                retval[counter] = '0';
            counter++;
            }
        retval[counter] = '\n';
        counter++;
        }
    retval[72] = '\0';
    return retval;
    }

void setRowBitboard(U64 *bb, int row) {
    *bb |= ((U64)255 << (row * 8));
    }

void unsetRowBitboard(U64 *bb, int row) {
    *bb &= ~((U64)255 << (row * 8));
    }

void setColBitboard(U64 *bb, int col) {
    int i;
    for (i = col; i < 64; i +=8 )
        *bb |= ((U64)1 << i);
    }

void unsetColBitboard(U64 *bb, int col) {
    int i;
    for (i = col; i < 64; i +=8 )
        *bb &= ~((U64)1 << i);
    }

void setDiagBitboard(U64 *bb, int square) {
    int i;
    for (i = square; i < 64; i += 9)
        if (isDiagonal(i, square))
            *bb |= ((U64)1 << i);
    for (i = square - 9; i > -1; i -= 9)
        if (isDiagonal(i, square))
            *bb |= ((U64)1 << i);
    }

void unsetDiagBitboard(U64 *bb, int square) {
    int i;
    for (i = square; i < 64; i += 9)
        if (isDiagonal(i, square))
            *bb &= ~((U64)1 << i);
    for (i = square - 9; i > -1; i -= 9)
        if (isDiagonal(i, square))
            *bb &= ~((U64)1 << i);
    }

void setAntiDiagBitboard(U64 *bb, int square) {
    int i;
    for (i = square; i < 64; i += 7)
        if (isDiagonal(i, square))
            *bb |= ((U64)1 << i);
    for (i = square - 7; i > -1; i -= 7)
        if (isDiagonal(i, square))
            *bb |= ((U64)1 << i);
    }

void unsetAntiDiagBitboard(U64 *bb, int square) {
    int i;
    for (i = square; i < 64; i += 7)
        if (isDiagonal(i, square))
            *bb &= ~((U64)1 << i);
    for (i = square - 7; i > -1; i -= 7)
        if (isDiagonal(i, square))
            *bb &= ~((U64)1 << i);
    }

int countBitboard(U64 bb) {
    int retval = 0;
    int counter;
    for (counter = 0; counter < 64; counter++)
        retval += (bb & ((U64)1 << counter)) ? 1 : 0;
    return retval;
    }

int getFirstSetBit(U64 bb) {
    int i;
    for (i = 0; i < 64; i++)
        if ((U64)1 << i & bb)
            return i;
    return -1;
    }
    
int getLastSetBit(U64 bb) {
    int i;
    for (i = 63; i >= 0; i--)
        if ((U64)1 << i & bb)
            return i;
    return -1;
    }

int *bitsSet(int *num, U64 bb) {
    int i[64];
    int loop;
    int counter;
    int *retval;

    counter = 0;    
    for (loop = 0; loop < 64; loop++) {
        if (bb & ((U64)1 << loop)) {
            i[counter++] = loop;
            }
        }
    retval = (int *)malloc(counter * sizeof(int));
    memcpy(retval, i, counter * sizeof(int));
    *num = counter;
    return retval;
    }
    
U64 freeSqRank(U64 bb, int origSq) {
        U64 retbb = 0;
        int i;
        if ((origSq & 7) > 0)
            for (i = origSq - 1; i > (origSq - (origSq & 7) -1); i--)
                if (!(bb & ((U64)1 << i)))
                    retbb |= ((U64)1 << i);
                else
                    break;
        if ((origSq & 7) < 7)
            for (i = origSq + 1; i < origSq + 8 - (origSq & 7); i++)
                if (!(bb & ((U64)1 << i)))
                    retbb |= ((U64)1 << i);
                else
                    break;
        retbb |= ((U64)1 << origSq);
        return retbb;
    }
    
U64 freeSqFile(U64 bb, int origSq) {
        U64 retbb = 0;
        int i;
        if ((origSq >> 3) > 0)
            for (i = origSq - 8; i > 0; i -= 8)
                if (!(bb & ((U64)1 << i)))
                    retbb |= ((U64)1 << i);
                else
                    break;
        if ((origSq >> 3) < 7)
            for (i = origSq + 8; i < 64; i += 8)
                if (!(bb & ((U64)1 << i)))
                    retbb |= ((U64)1 << i);
                else
                    break;
        retbb |= ((U64)1 << origSq);
        return retbb;
    }

U64 freeSqDiag(U64 bb, int origSq) {
        U64 retbb = 0;
        int i;
        for (i = origSq - 9; i > -1; i -= 9)
            if (isDiagonal(origSq, i))
                if (!(bb & ((U64)1 << i)))
                    retbb |= ((U64)1 << i);
                else
                    break;
            else
                break;
        for (i = origSq + 9; i < 64; i += 9)
            if (isDiagonal(origSq, i))
                if (!(bb & ((U64)1 << i)))
                    retbb |= ((U64)1 << i);
                else
                    break;
            else
                break;
        retbb |= ((U64)1 << origSq);
        return retbb;
    }

U64 freeSqAntiDiag(U64 bb, int origSq) {
        U64 retbb = 0;
        int i;
        for (i = origSq - 7; i > -1; i -= 7)
            if (isDiagonal(origSq, i))
                if (!(bb & ((U64)1 << i)))
                    retbb |= ((U64)1 << i);
                else
                    break;
            else
                break;
        for (i = origSq + 7; i < 64; i += 7)
            if (isDiagonal(origSq, i))
                if (!(bb & ((U64)1 << i)))
                    retbb |= ((U64)1 << i);
                else
                    break;
            else
                break;
        retbb |= ((U64)1 << origSq);
        return retbb;
    }


/**************************************************************************************************************/
/**************************************************************************************************************/

/**************************************************************************************************************/
/**************************** FEN related ****************************************************************/
/**************************************************************************************************************/



/**************************************************************************************************************/
/**************************************************************************************************************/

int main(int argc, char *argv[]) {
    U64 *bb = (U64 *) malloc(sizeof(U64));
    *bb = 0;
    setBitboard(bb, 63);
    unsetBitboard(bb, 63);
    if (allBitboard(*bb))
        printf("all\n");
    else
        printf("not all\n");
    printf("\nBB: %llu\n", *bb);
    printf("\nDistance 28, 55: %i\n", distance(28, 55)); 
    return 0;
    }
    
/**************************************************************************************************************/

    


