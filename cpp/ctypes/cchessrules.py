#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Chess playing rules module.
"""


import os, ctypes, re

#/**************************************************************************************************************/
#/**************************** General ****************************************************************/
#/**************************************************************************************************************/

version = "0.0.1"

intArrPtr = ctypes.POINTER(ctypes.c_int)

dll = ctypes.CDLL(os.path.abspath("chessrules.so"))
dll.rowFromSquare.restype = ctypes.c_uint;
dll.colFromSquare.restype = ctypes.c_uint;
dll.rowColToSquare.restype = ctypes.c_uint;
dll.isDiagonal.restype = ctypes.c_bool;
dll.isSameRow.restype = ctypes.c_bool;
dll.isSameCol.restype = ctypes.c_bool;

dll.allBitboard.argtypes = [ctypes.c_ulonglong]
dll.anyBitboard.argtypes = [ctypes.c_ulonglong]
dll.allBitboard.restype = ctypes.c_bool
dll.anyBitboard.restype = ctypes.c_bool
dll.setBitboard.restype = None
dll.unsetBitboard.restype = None
dll.getBitboard.argtypes = [ctypes.c_ulonglong, ctypes.c_int]
dll.getBitboard.restype = ctypes.c_int
dll.reprBitboard.argtypes = [ctypes.c_ulonglong]
dll.reprBitboard.restype = ctypes.c_char_p
dll.countBitboard.argtypes = [ctypes.c_ulonglong]
dll.setRowBitboard.restype = None
dll.unsetRowBitboard.restype = None
dll.setColBitboard.restype = None
dll.unsetColBitboard.restype = None
dll.setDiagBitboard.restype = None
dll.unsetDiagBitboard.restype = None
dll.setAntiDiagBitboard.restype = None
dll.unsetAntiDiagBitboard.restype = None
dll.getFirstSetBit.argtypes = [ctypes.c_ulonglong]
dll.getLastSetBit.argtypes = [ctypes.c_ulonglong]
dll.freeSqRank.argtypes = [ctypes.c_ulonglong, ctypes.c_int]
dll.freeSqRank.restype = ctypes.c_ulonglong
dll.freeSqFile.argtypes = [ctypes.c_ulonglong, ctypes.c_int]
dll.freeSqFile.restype = ctypes.c_ulonglong
dll.freeSqDiag.argtypes = [ctypes.c_ulonglong, ctypes.c_int]
dll.freeSqDiag.restype = ctypes.c_ulonglong
dll.freeSqAntiDiag.argtypes = [ctypes.c_ulonglong, ctypes.c_int]
dll.freeSqAntiDiag.restype = ctypes.c_ulonglong
dll.bitsSet.argtypes = [intArrPtr, ctypes.c_ulonglong]
dll.bitsSet.restype = intArrPtr

def squareToAlgebraic(square): 
    row = dll.rowFromSquare(square) + 1
    col = dll.colFromSquare(square)
    return "%s%s" % (chr(97 + col), str(row))

def algebraicToSquare(pgnSq):
    col = ord(pgnSq[0]) - 97
    row = int(pgnSq[1]) - 1
    return dll.rowColToSquare(row, col)


#/**************************************************************************************************************/
#/**************************************************************************************************************/


#/**************************************************************************************************************/
#/**************************** Bitboard related ****************************************************************/
#/**************************************************************************************************************/

bbAttacks = {}

class Bitboard(object):
    "Represents a Bitboard object."
    
    universalBoard = 18446744073709551615
    
    def __init__(self, number = 0):
        if not bool(bbAttacks):
            Bitboard.fillAttacks()
        self._rows = ctypes.c_ulonglong(number)
        
    @staticmethod
    def fillAttacks():
        bbAttacks['rankAttacks'] = {}
        bbAttacks['fileAttacks'] = {}
        bbAttacks['diagAttacks'] = {}
        bbAttacks['antiDiagAttacks'] = {}
        bbAttacks['bpAttacks'] = {}
        bbAttacks['wpAttacks'] = {}
        bbAttacks['bpMoves'] = {}
        bbAttacks['wpMoves'] = {}
        bbAttacks['kMoves'] = {}
        bbAttacks['nMoves'] = {}
        
        for i in range(64):
            row = dll.rowFromSquare(i)
            col = dll.colFromSquare(i)
            
            if row < 7 and row > 0:
                bb = Bitboard()
                if col > 0:
                    bb.set(i - 9)
                if col < 7:
                    bb.set(i - 7)
                bbAttacks['bpAttacks'][i] = bb
                
                bb = Bitboard()
                bb.set(i - 8)
                if row == 6:
                    bb.set(i - 16)
                bbAttacks['bpMoves'][i] = bb
                
                bb = Bitboard()
                if col > 0:
                    bb.set(i + 7)
                if col < 7:
                    bb.set(i + 9)
                bbAttacks['wpAttacks'][i] = bb
                
                bb = Bitboard()
                bb.set(i + 8)
                if row == 1:
                    bb.set(i + 16)
                bbAttacks['wpMoves'][i] = bb
            
            bb = Bitboard()
            for y in range(row -1, row + 2):
                for x in range(col - 1, col + 2):
                    if y >= 0 and y < 8 and x >= 0 and x < 8:
                        bb.set(dll.rowColToSquare(y, x))
            bb.unset(i)
            bbAttacks['kMoves'][i] = bb
                
            bb = Bitboard()
            for y in range(row -2, row + 3):
                for x in range(col - 2, col + 3):
                    if y >= 0 and y < 8 and x >= 0 and x < 8:
                        if (abs(y - row) == 2 and abs(x - col) == 1) or (abs(y - row) == 1 and abs(x - col) == 2): 
                            bb.set(dll.rowColToSquare(y, x))
            bbAttacks['nMoves'][i] = bb

            bb = Bitboard()
            bb.setRow(row)
            bb.unset(i)
            bbAttacks['rankAttacks'][i] = bb
            
            bb = Bitboard()
            bb.setCol(col)
            bb.unset(i)
            bbAttacks['fileAttacks'][i] = bb
            
            bb = Bitboard()
            bb.setDiag(i)
            bb.unset(i)
            bbAttacks['diagAttacks'][i] = bb
            
            bb = Bitboard()
            bb.setAntiDiag(i)
            bb.unset(i)
            bbAttacks['antiDiagAttacks'][i] = bb
            
    @staticmethod
    def getFirstSetBit(Bitboard):
        return dll.getFirstSetBit(Bitboard._rows)
            
    @staticmethod
    def getLastSetBit(Bitboard):
        return dll.getLastSetBit(Bitboard._rows)
            
    @staticmethod
    def freeSqRank(Bitboard, origSq):
        return Bitboard(dll.freeSqRank(Bitboard._rows.value, origSq))
                    
    @staticmethod
    def freeSqFile(Bitboard, origSq):
        return Bitboard(dll.freeSqFile(Bitboard._rows.value, origSq))
                    
    @staticmethod
    def freeSqDiag(Bitboard, origSq):
        return Bitboard(dll.freeSqDiag(Bitboard._rows.value, origSq))
                    
    @staticmethod
    def freeSqAntiDiag(Bitboard, origSq):
        return Bitboard(dll.freeSqAntiDiag(Bitboard._rows.value, origSq))
                    
    def __repr__(self):
        return dll.reprBitboard(self._rows)
    
    def __cmp__(self, other):
        return self._rows == other._rows
    
    def __nonzero__(self):
        return self.any()
    
    def __invert__(self):
        return Bitboard(~self._rows.value)
    
    def __and__(self, other):
        if isinstance(other, Bitboard):
            oNum = other._rows.value
        else:
            oNum = other
        return Bitboard(self._rows.value & oNum)

    def __or__(self, other):
        if isinstance(other, Bitboard):
            oNum = other._rows.value
        else:
            oNum = other
        return Bitboard(self._rows.value | oNum)

    def __xor__(self, other):
        if isinstance(other, Bitboard):
            oNum = other._rows.value
        else:
            oNum = other
        return Bitboard(self._rows.value ^ oNum)
    
    def __lshift__(self, number):
        return Bitboard(self._rows.value << number)

    def __rshift__(self, number):
        return Bitboard(self._rows.value >> number)

    def set(self, square):
        dll.setBitboard(ctypes.byref(self._rows), square)

    def setAll(self):
        self._rows = ctypes.c_ulonglong(Bitboard.universalBoard)

    def unset(self, square):
        dll.unsetBitboard(ctypes.byref(self._rows), square)

    def unsetAll(self):
        self._rows = ctypes.c_ulonglong(0)

    def get(self, square):
        return bool(dll.getBitboard(self._rows.value, square))
    
    def any(self):
        return dll.anyBitboard(self._rows.value)
    
    def all(self):
        return dll.allBitboard(self._rows.value)
    
    def getRows(self):
        return self._rows.value
    
    def setRow(self, row):
        dll.setRowBitboard(ctypes.byref(self._rows), row)

    def unsetRow(self, row):
        dll.unsetRowBitboard(ctypes.byref(self._rows), row)

    def setCol(self, col):
        dll.setColBitboard(ctypes.byref(self._rows), col)

    def unsetCol(self, col):
        dll.unsetColBitboard(ctypes.byref(self._rows), col)

    def setDiag(self, square):
        dll.setDiagBitboard(ctypes.byref(self._rows), square)
            
    def unsetDiag(self, square):
        dll.unsetDiagBitboard(ctypes.byref(self._rows), square)
            
    def setAntiDiag(self, square):
        dll.setAntiDiagBitboard(ctypes.byref(self._rows), square)
            
    def unsetAntiDiag(self, square):
        dll.unsetAntiDiagBitboard(ctypes.byref(self._rows), square)
            
    def count(self):
        return dll.countBitboard(self._rows.value)

    def bitsSet(self):
        num = ctypes.c_int()
        intArr = dll.bitsSet(ctypes.byref(num), self._rows.value)
        retval = []
        for i in range(num.value):
            retval.append(intArr[i])
        return retval

#/**************************************************************************************************************/
#/**************************************************************************************************************/
                       

#/**************************************************************************************************************/
#/**************************** FEN related ****************************************************************/
#/**************************************************************************************************************/

defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"


class FEN(ctypes.Structure):
    """
    Chess board position in Forsythe Edwards notation
    """
    
    _fields_ = [("fenString", ctypes.c_char_p),
        ("piecePlacement", ctypes.c_char_p),
        ("activeColor", ctypes.c_char),
        ("castlingAvail", ctypes.c_char_p),
        ("enPassant", ctypes.c_char_p),
        ("halfMoveClock", ctypes.c_char_p),
        ("fullMoveNumber", ctypes.c_char_p)]

    def __init__(self, fenString = defaultFEN):
        self.fenString = fenString
        fenArray = re.split(r'\s+', self.fenString)

        self.piecePlacement = fenArray[0]
        self.activeColor = fenArray[1]
        self.castlingAvail = fenArray[2]
        self.enPassant = fenArray[3]
        self.halfMoveClock = fenArray[4]
        self.fullMoveNumber = fenArray[5]

        self.boardArray = [x for x in "0" * 64]
        for pos, x in enumerate(FEN.ppExpand(self.piecePlacement)):
            if x != "0":
                self.boardArray[pos ^ 56] = x

        self.bbBPawns = Bitboard()
        self.bbBKnights = Bitboard()
        self.bbBBishops = Bitboard()
        self.bbBRooks = Bitboard()
        self.bbBQueens = Bitboard()
        self.bbBKing = Bitboard()
        self.bbWPawns = Bitboard()
        self.bbWKnights = Bitboard()
        self.bbWBishops = Bitboard()
        self.bbWRooks = Bitboard()
        self.bbWQueens = Bitboard()
        self.bbWKing = Bitboard()

        self.bbBlack = None
        self.bbWhite = None
        self.bbAll = None

        self.bbPseudoLegalMoves = {}

        self.bbBAttacks = Bitboard()
        self.bbBPawnMoves = Bitboard()
        self.bbWAttacks = Bitboard()
        self.bbWPawnMoves = Bitboard()
 
        self.flags = {'check': {'w': -1, 'b': -1}, 'checkMate': {'w': -1, 'b': -1},
            'staleMate': {'w': -1, 'b': -1}, 'hasLegalMoves': {'w': -1, 'b': -1}}
       
        self.initBitboards()
        
    def initBitboards(self):
        for i in range(len(self.boardArray)):
            if self.boardArray[i] == 'p':
                self.bbBPawns.set(i)
            elif self.boardArray[i] == 'P':
                self.bbWPawns.set(i)
            elif self.boardArray[i] == 'n':
                self.bbBKnights.set(i)
            elif self.boardArray[i] == 'N':
                self.bbWKnights.set(i)
            elif self.boardArray[i] == 'b':
                self.bbBBishops.set(i)
            elif self.boardArray[i] == 'B':
                self.bbWBishops.set(i)
            elif self.boardArray[i] == 'r':
                self.bbBRooks.set(i)
            elif self.boardArray[i] == 'R':
                self.bbWRooks.set(i)
            elif self.boardArray[i] == 'q':
                self.bbBQueens.set(i)
            elif self.boardArray[i] == 'Q':
                self.bbWQueens.set(i)
            elif self.boardArray[i] == 'k':
                self.bbBKing.set(i)
            elif self.boardArray[i] == 'K':
                self.bbWKing.set(i)

        self.bbBlack = self.bbBPawns | self.bbBKnights | self.bbBBishops | \
        self.bbBRooks | self.bbBQueens | self.bbBKing        

        self.bbWhite = self.bbWPawns | self.bbWKnights | self.bbWBishops | \
        self.bbWRooks | self.bbWQueens | self.bbWKing

        self.bbAll = self.bbBlack | self.bbWhite
                
        for i in range(len(self.boardArray)):
            if self.boardArray[i] == 'p':
                bbMoves = (bbAttacks['bpMoves'][i] ^ self.bbAll) & bbAttacks['bpMoves'][i]
                if dll.rowFromSquare(i) == 6:
                    if not bbMoves.get(i - 8):
                        bbMoves.unset(i - 16)
                self.bbPseudoLegalMoves[i] = bbMoves
                self.bbBPawnMoves |= bbMoves
                bbAtts = bbAttacks['bpAttacks'][i] & self.bbWhite
                if self.enPassant != "-":
                    epSquare = algebraicToSquare(self.enPassant)
                    if dll.colFromSquare(i) > 0:
                       if epSquare == (i - 9):
                        bbAtts.set(epSquare)
                    if dll.colFromSquare(i) < 7:
                       if epSquare == (i - 7):
                        bbAtts.set(epSquare)
                self.bbBAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] |= bbAtts
            elif self.boardArray[i] == 'P':
                bbMoves = (bbAttacks['wpMoves'][i] ^ self.bbAll) & bbAttacks['wpMoves'][i]
                if dll.rowFromSquare(i) == 1:
                    if not bbMoves.get(i + 8):
                        bbMoves.unset(i + 16)
                self.bbPseudoLegalMoves[i] = bbMoves
                self.bbWPawnMoves |= bbMoves
                bbAtts = bbAttacks['wpAttacks'][i] & self.bbBlack
                if self.enPassant != "-":
                    epSquare = algebraicToSquare(self.enPassant)
                    if dll.colFromSquare(i) > 0:
                       if epSquare == (i + 7):
                        bbAtts.set(epSquare)
                    if dll.colFromSquare(i) < 7:
                       if epSquare == (i + 9):
                        bbAtts.set(epSquare)
                self.bbWAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] |= bbAtts
            elif self.boardArray[i] == 'n':
                bbAtts = (bbAttacks['nMoves'][i] ^ self.bbBlack) & bbAttacks['nMoves'][i]
                self.bbBAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
            elif self.boardArray[i] == 'N':
                bbAtts = (bbAttacks['nMoves'][i] ^ self.bbWhite) & bbAttacks['nMoves'][i]
                self.bbWAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
            elif self.boardArray[i] == 'k':
                bbAtts = (bbAttacks['kMoves'][i] ^ self.bbBlack) & bbAttacks['kMoves'][i]
                self.bbBAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
            elif self.boardArray[i] == 'K':
                bbAtts = (bbAttacks['kMoves'][i] ^ self.bbWhite) & bbAttacks['kMoves'][i]
                self.bbWAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
            elif self.boardArray[i] == 'b':
                bbD = Bitboard(dll.freeSqDiag(self.bbAll._rows.value, i))
                fD = dll.getFirstSetBit(bbD._rows.value)
                if dll.rowFromSquare(fD) > 0 and dll.colFromSquare(fD) > 0 and dll.isDiagonal(fD, fD - 9):
                    if self.boardArray[fD - 9] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbD.set(fD - 9)
                lD = dll.getLastSetBit(bbD._rows.value)
                if dll.rowFromSquare(lD) < 7 and dll.colFromSquare(lD) < 7 and dll.isDiagonal(lD, lD + 9):
                    if self.boardArray[lD + 9] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbD.set(lD + 9)
                bbAd = Bitboard(dll.freeSqAntiDiag(self.bbAll._rows.value, i))
                fD = dll.getFirstSetBit(bbAd._rows.value)
                if dll.rowFromSquare(fD) > 0 and dll.colFromSquare(fD) < 7 and dll.isDiagonal(fD, fD - 7):
                    if self.boardArray[fD - 7] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbAd.set(fD - 7)
                lD = dll.getLastSetBit(bbAd._rows.value)
                if dll.rowFromSquare(lD) < 7 and dll.colFromSquare(lD) > 0 and dll.isDiagonal(lD, lD + 7):
                    if self.boardArray[lD + 7] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbAd.set(lD + 7)
                bbD.unset(i)
                bbAd.unset(i)
                bbAtts = bbD | bbAd
                self.bbBAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
            elif self.boardArray[i] == 'B':
                bbD = Bitboard(dll.freeSqDiag(self.bbAll._rows.value, i))
                fD = dll.getFirstSetBit(bbD._rows.value)
                if dll.rowFromSquare(fD) > 0 and dll.colFromSquare(fD) > 0 and dll.isDiagonal(fD, fD - 9):
                    if self.boardArray[fD - 9] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbD.set(fD - 9)
                lD = dll.getLastSetBit(bbD._rows.value)
                if dll.rowFromSquare(lD) < 7 and dll.colFromSquare(lD) < 7 and dll.isDiagonal(lD, lD + 9):
                    if self.boardArray[lD + 9] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbD.set(lD + 9)
                bbAd = Bitboard(dll.freeSqAntiDiag(self.bbAll._rows.value, i))
                fD = dll.getFirstSetBit(bbAd._rows.value)
                if dll.rowFromSquare(fD) > 0 and dll.colFromSquare(fD) < 7 and dll.isDiagonal(fD, fD - 7):
                    if self.boardArray[fD - 7] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbAd.set(fD - 7)
                lD = dll.getLastSetBit(bbAd._rows.value)
                if dll.rowFromSquare(lD) < 7 and dll.colFromSquare(lD) > 0 and dll.isDiagonal(lD, lD +7):
                    if self.boardArray[lD + 7] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbAd.set(lD + 7)
                bbD.unset(i)
                bbAd.unset(i)
                bbAtts = bbD | bbAd
                self.bbWAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
            elif self.boardArray[i] == 'r':
                bbR = Bitboard(dll.freeSqRank(self.bbAll._rows.value, i))
                fR = dll.getFirstSetBit(bbR._rows.value)
                if dll.colFromSquare(fR) > 0 and dll.isSameRow(fR, fR -1):
                    if self.boardArray[fR - 1] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbR.set(fR - 1)
                lR = dll.getLastSetBit(bbR._rows.value)
                if dll.colFromSquare(lR) < 7 and dll.isSameRow(lR, lR + 1):
                    if self.boardArray[lR + 1] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbR.set(lR + 1)
                bbF = Bitboard(dll.freeSqFile(self.bbAll._rows.value, i))
                fF = dll.getFirstSetBit(bbF._rows.value)
                if fF > 7 and dll.isSameCol(fF, fF - 8):
                    if self.boardArray[fF - 8] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbF.set(fF - 8)
                lF = dll.getLastSetBit(bbF._rows.value)
                if lF < 56 and dll.isSameCol(lF, lF + 8):
                    if self.boardArray[lF + 8] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbF.set(lF + 8)
                bbR.unset(i)
                bbF.unset(i)
                bbAtts = bbF | bbR
                self.bbBAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
            elif self.boardArray[i] == 'R':
                bbR = Bitboard(dll.freeSqRank(self.bbAll._rows.value, i))
                fR = dll.getFirstSetBit(bbR._rows.value)
                if dll.colFromSquare(fR) > 0 and dll.isSameRow(fR, fR -1):
                    if self.boardArray[fR - 1] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbR.set(fR - 1)
                lR = dll.getLastSetBit(bbR._rows.value)
                if dll.colFromSquare(lR) < 7 and dll.isSameRow(lR, lR + 1):
                    if self.boardArray[lR + 1] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbR.set(lR + 1)
                bbF = Bitboard(dll.freeSqFile(self.bbAll._rows.value, i))
                fF = dll.getFirstSetBit(bbF._rows.value)
                if fF > 7 and dll.isSameCol(fF, fF - 8):
                    if self.boardArray[fF - 8] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbF.set(fF - 8)
                lF = dll.getLastSetBit(bbF._rows.value)
                if lF < 56 and dll.isSameCol(lF, lF + 8):
                    if self.boardArray[lF + 8] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbF.set(lF + 8)
                bbR.unset(i)
                bbF.unset(i)
                bbAtts = bbF | bbR
                self.bbWAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
            elif self.boardArray[i] == 'q':
                bbD = Bitboard(dll.freeSqDiag(self.bbAll._rows.value, i))
                fD = dll.getFirstSetBit(bbD._rows.value)
                if dll.rowFromSquare(fD) > 0 and dll.colFromSquare(fD) > 0 and dll.isDiagonal(fD, fD - 9):
                    if self.boardArray[fD - 9] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbD.set(fD - 9)
                lD = dll.getLastSetBit(bbD._rows.value)
                if dll.rowFromSquare(lD) < 7 and dll.colFromSquare(lD) < 7 and dll.isDiagonal(lD, lD + 9):
                    if self.boardArray[lD + 9] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbD.set(lD + 9)
                bbAd = Bitboard(dll.freeSqAntiDiag(self.bbAll._rows.value, i))
                fD = dll.getFirstSetBit(bbAd._rows.value)
                if dll.rowFromSquare(fD) > 0 and dll.colFromSquare(fD) < 7 and dll.isDiagonal(fD, fD - 7):
                    if self.boardArray[fD - 7] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbAd.set(fD - 7)
                lD = dll.getLastSetBit(bbAd._rows.value)
                if dll.rowFromSquare(lD) < 7 and dll.colFromSquare(lD) > 0 and dll.isDiagonal(lD, lD + 7):
                    if self.boardArray[lD + 7] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbAd.set(lD + 7)
                bbR = Bitboard(dll.freeSqRank(self.bbAll._rows.value, i))
                fR = dll.getFirstSetBit(bbR._rows.value)
                if dll.colFromSquare(fR) > 0 and dll.isSameRow(fR, fR -1):
                    if self.boardArray[fR - 1] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbR.set(fR - 1)
                lR = dll.getLastSetBit(bbR._rows.value)
                if dll.colFromSquare(lR) < 7 and dll.isSameRow(lR, lR + 1):
                    if self.boardArray[lR + 1] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbR.set(lR + 1)
                bbF = Bitboard(dll.freeSqFile(self.bbAll._rows.value, i))
                fF = dll.getFirstSetBit(bbF._rows.value)
                if fF > 7 and dll.isSameCol(fF, fF - 8):
                    if self.boardArray[fF - 8] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbF.set(fF - 8)
                lF = dll.getLastSetBit(bbF._rows.value)
                if lF < 56 and dll.isSameCol(lF, lF + 8):
                    if self.boardArray[lF + 8] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                        bbF.set(lF + 8)
                bbD.unset(i)
                bbAd.unset(i)
                bbR.unset(i)
                bbF.unset(i)
                bbAtts = bbD | bbAd | bbR | bbF
                self.bbBAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
            elif self.boardArray[i] == 'Q':
                bbD = Bitboard(dll.freeSqDiag(self.bbAll._rows.value, i))
                fD = dll.getFirstSetBit(bbD._rows.value)
                if dll.rowFromSquare(fD) > 0 and dll.colFromSquare(fD) > 0 and dll.isDiagonal(fD, fD - 9):
                    if self.boardArray[fD - 9] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbD.set(fD - 9)
                lD = dll.getLastSetBit(bbD._rows.value)
                if dll.rowFromSquare(lD) < 7 and dll.colFromSquare(lD) < 7 and dll.isDiagonal(lD, lD + 9):
                    if self.boardArray[lD + 9] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbD.set(lD + 9)
                bbAd = Bitboard(dll.freeSqAntiDiag(self.bbAll._rows.value, i))
                fD = dll.getFirstSetBit(bbAd._rows.value)
                if dll.rowFromSquare(fD) > 0 and dll.colFromSquare(fD) < 7 and dll.isDiagonal(fD, fD - 7):
                    if self.boardArray[fD - 7] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbAd.set(fD - 7)
                lD = dll.getLastSetBit(bbAd._rows.value)
                if dll.rowFromSquare(lD) < 7 and dll.colFromSquare(lD) > 0 and dll.isDiagonal(lD, lD +7):
                    if self.boardArray[lD + 7] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbAd.set(lD + 7)
                bbR = Bitboard(dll.freeSqRank(self.bbAll._rows.value, i))
                fR = dll.getFirstSetBit(bbR._rows.value)
                if dll.colFromSquare(fR) > 0 and dll.isSameRow(fR, fR -1):
                    if self.boardArray[fR - 1] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbR.set(fR - 1)
                lR = dll.getLastSetBit(bbR._rows.value)
                if dll.colFromSquare(lR) < 7 and dll.isSameRow(lR, lR + 1):
                    if self.boardArray[lR + 1] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbR.set(lR + 1)
                bbF = Bitboard(dll.freeSqFile(self.bbAll._rows.value, i))
                fF = dll.getFirstSetBit(bbF._rows.value)
                if fF > 7 and dll.isSameCol(fF, fF - 8):
                    if self.boardArray[fF - 8] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbF.set(fF - 8)
                lF = dll.getLastSetBit(bbF._rows.value)
                if lF < 56 and dll.isSameCol(lF, lF + 8):
                    if self.boardArray[lF + 8] in ('p', 'n', 'b', 'r', 'q', 'k'):
                        bbF.set(lF + 8)
                bbD.unset(i)
                bbAd.unset(i)
                bbR.unset(i)
                bbF.unset(i)
                bbAtts = bbD | bbAd | bbR | bbF
                self.bbWAttacks |= bbAtts
                self.bbPseudoLegalMoves[i] = bbAtts
        
        if self.bbBKing.get(60):
            if 'k' in self.castlingAvail:
                if not self.bbAll.get(61) and not self.bbAll.get(62):
                    bb = Bitboard()
                    bb.set(60)
                    bb.set(61)
                    bb.set(62)
                    if not bb & self.bbWAttacks:
                        self.bbPseudoLegalMoves[60].set(62)
                        self.bbBAttacks |= (1 << 62)
        
            if 'q' in self.castlingAvail:
                if not self.bbAll.get(58) and not self.bbAll.get(59):
                    bb = Bitboard()
                    bb.set(60)
                    bb.set(59)
                    bb.set(58)
                    if not bb & self.bbWAttacks:
                        self.bbPseudoLegalMoves[60].set(58)
                        self.bbBAttacks |= (1 << 58)
        
        if self.bbWKing.get(4):
            if 'K' in self.castlingAvail:
                if not self.bbAll.get(5) and not self.bbAll.get(6):
                    bb = Bitboard()
                    bb.set(4)
                    bb.set(5)
                    bb.set(6)
                    if not bb & self.bbBAttacks:
                        self.bbPseudoLegalMoves[4].set(6)
                        self.bbWAttacks |= (1 << 6)
        
            if 'Q' in self.castlingAvail:
                if not self.bbAll.get(2) and not self.bbAll.get(3):
                    bb = Bitboard()
                    bb.set(4)
                    bb.set(3)
                    bb.set(2)
                    if not bb & self.bbBAttacks:
                        self.bbPseudoLegalMoves[4].set(2)
                        self.bbWAttacks |= (1 << 2)

    def hasLegalMoves(self, colour):
        if self.flags['hasLegalMoves'][colour] != -1:
            return self.flags['hasLegalMoves'][colour]

        fenDest = None
        fromSq = -1

        bbKing = (self.bbBKing, self.bbWKing)[colour == 'w']
        fromSq = bbKing.bitsSet()[0]
        bbTo = self.bbPseudoLegalMoves[fromSq]
        if bbTo:
            for i in bbTo.bitsSet():
                fenDest = self._move(fromSq, i, strict = False)['position']
                if fenDest:
                    if fenDest.isLegal():
                        self.flags['hasLegalMoves'][colour] = True
                        return True
        
        bbOthers = (self.bbBQueens, self.bbWQueens)[colour == 'w']
        if bbOthers:
            for x in bbOthers.bitsSet():
                    fromSq = x
                    bbTo = self.bbPseudoLegalMoves[fromSq]
                    if bbTo:
                        for i in bbTo.bitsSet():
                            fenDest = self._move(fromSq, i, strict = False)['position']
                            if fenDest:
                                if fenDest.isLegal():
                                    self.flags['hasLegalMoves'][colour] = True
                                    return True

        bbOthers = (self.bbBRooks, self.bbWRooks)[colour == 'w']
        if bbOthers:
            for x in bbOthers.bitsSet():
                fromSq = x
                bbTo = self.bbPseudoLegalMoves[fromSq]
                if bbTo:
                    for i in bbTo.bitsSet():
                        fenDest = self._move(fromSq, i, strict = False)['position']
                        if fenDest:
                            if fenDest.isLegal():
                                self.flags['hasLegalMoves'][colour] = True
                                return True

        bbOthers = (self.bbBBishops, self.bbWBishops)[colour == 'w']
        if bbOthers:
            for x in bbOthers.bitsSet():
                fromSq = x
                bbTo = self.bbPseudoLegalMoves[fromSq]
                if bbTo:
                    for i in bbTo.bitsSet():
                        fenDest = self._move(fromSq, i, strict = False)['position']
                        if fenDest:
                            if fenDest.isLegal():
                                self.flags['hasLegalMoves'][colour] = True
                                return True

        bbOthers = (self.bbBKnights, self.bbWKnights)[colour == 'w']
        if bbOthers:
            for x in bbOthers.bitsSet():
                fromSq = x
                bbTo = self.bbPseudoLegalMoves[fromSq]
                if bbTo:
                    for i in bbTo.bitsSet():
                        fenDest = self._move(fromSq, i, strict = False)['position']
                        if fenDest:
                            if fenDest.isLegal():
                                self.flags['hasLegalMoves'][colour] = True
                                return True

        bbOthers = (self.bbBPawns, self.bbWPawns)[colour == 'w']
        if bbOthers:
            for x in bbOthers.bitsSet():
                fromSq = x
                bbTo = self.bbPseudoLegalMoves[fromSq]
                if bbTo:
                    for i in bbTo.bitsSet():
                        fenDest = self._move(fromSq, i, strict = False)['position']
                        if fenDest:
                            if fenDest.isLegal():
                                self.flags['hasLegalMoves'][colour] = True
                                return True
                    
        self.flags['hasLegalMoves'][colour] = False
        return False
        
    def isCheck(self, colour):
        if self.flags['check'][colour] != -1:
            return self.flags['check'][colour]
        
        if colour == 'w':
            bbFoes = self.bbBAttacks
            bbKing = self.bbWKing
        elif colour == 'b':
            bbFoes = self.bbWAttacks
            bbKing = self.bbBKing
        else:
            return False
        self.flags['check'][colour] = bool(bbKing & bbFoes)
        return bool(bbKing & bbFoes)
    
    def isCheckMate(self, colour):
        if self.flags['checkMate'][colour] != -1:
            return self.flags['checkMate'][colour]
        
        self.flags['checkMate'][colour] = self.isCheck(colour) and not self.hasLegalMoves(colour)
        return self.flags['checkMate'][colour]

    def isStaleMate(self, colour):
        if self.flags['staleMate'][colour] != -1:
            return self.flags['staleMate'][colour]
        
        self.flags['staleMate'][colour] = not self.isCheck(colour) and not self.hasLegalMoves(colour) and \
            self.activeColor == colour
        return self.flags['staleMate'][colour]
        
    def isLegal(self):
        if self.activeColor == 'w':
            return not self.isCheck('b')
        if self.activeColor == 'b':
            return not self.isCheck('w')
        
    def canMove(self, sqFrom, sqTo):
        return self.bbPseudoLegalMoves[sqFrom].get(sqTo)

    def move(self, *args, **kwargs):
        if 'strict' in kwargs:
            strict = kwargs['strict']
        else:
            strict = True
        if len(args) > 1:
            try:
                sqFrom = int(args[0])
                sqTo = int(args[1])
                if len(args) > 2:
                    crowning = args[2]
                else:
                    if 'crowning' in kwargs:
                        crowning = kwargs['crowning']
                    else:
                        crowning = None
                return self._move(sqFrom, sqTo, crowning, strict)
            except:
                return None
        if len(args) == 1:
            pat = r'^(?P<sqFrom>[a-h][1-8])-?(?P<sqTo>[a-h][1-8])=?(?P<crowning>[QRBN])?(?:(?P<check>\+)|(?P<mate>#))?$'
            m = re.match(pat, args[0])
            if not m:
                return self._pgnMove(args[0], strict)
            else:
                try:
                    sqFrom = algebraicToSquare(m.group('sqFrom'))
                    sqTo = algebraicToSquare(m.group('sqTo'))
                    return self._move(sqFrom, sqTo, m.group('crowning'), strict)
                except:
                    return None
    
    def _pgnMove(self, pgn, strict = True):
        patPawn = r"(?:(?P<pawn>[a-h])(?:(?P<pawncapture>x[a-h][1-8])|(?P<pawndestrow>[1-8]))(?:=?(?P<crowning>[NBRQ]))?)"
        patPiece = r"(?:(?P<piece>[NBRQK])(?P<origpiececol>[a-h])?(?P<origpiecerow>[1-8])?x?(?P<piecedestination>[a-h][1-8]))"
        patShortCastling = r"(?P<shortcastling>[0O]-[0O])"
        patLongCastling = r"(?P<longcastling>[0O]-[0O]-[0O])"
        pat = r"^(?:" + patPawn + "|" + patPiece + "|" + patShortCastling + "|" + patLongCastling + \
        ")(?:(?P<check>\+)|(?P<mate>#))?$"
        
        sqFrom = -1
        sqTo = -1
        m = re.match(pat, pgn)
        if not m:
            return None
        else:
            if m.group('shortcastling'):
                if self.activeColor == 'w':
                    sqFrom = 4
                    sqTo = 6
                else:
                    sqFrom = 60
                    sqTo = 62
                return self._move(sqFrom, sqTo, None, strict)
            if m.group('longcastling'):
                if self.activeColor == 'w':
                    sqFrom = 4
                    sqTo = 2
                else:
                    sqFrom = 60
                    sqTo = 58
                return self._move(sqFrom, sqTo, None, strict)
            if m.group('pawn'):
                if self.activeColor == 'w':
                    bbPawns = self.bbWPawns
                else:
                    bbPawns = self.bbBPawns
                origCol = ord(m.group('pawn')) - 97
                origRow = -1
                destRow = -1
                destCol = -1
                if m.group('pawndestrow'): #pawn move
                    destCol = origCol
                    destRow = int(m.group('pawndestrow')) - 1
                else: #pawncapture
                    destCol = ord(m.group('pawncapture')[1]) - 97
                    destRow = int(m.group('pawncapture')[2]) - 1
                if (destRow == 7 or destRow == 0) and not m.group('crowning'):
                    return None
                if (destRow != 7 and destRow != 0) and m.group('crowning'):
                    return None
                for i in bbPawns.bitsSet():
                    if dll.colFromSquare(i) == origCol:
                        bbMoves = self.bbPseudoLegalMoves[i]
                        if bbMoves.get(dll.rowColToSquare(destRow, destCol)):
                            sqFrom = i
                            sqTo = dll.rowColToSquare(destRow, destCol)
                            break
                if sqTo != -1 and sqFrom != -1:
                    return self._move(sqFrom, sqTo, m.group('crowning'), strict)
                else:
                    return None
            if m.group('piece'):
                if m.group('crowning'):
                    return None
                if m.group('piece') == 'N':
                    if self.activeColor == 'w':
                        bbPieces = self.bbWKnights
                    else:
                        bbPieces = self.bbBKnights
                elif m.group('piece') == 'B':
                    if self.activeColor == 'w':
                        bbPieces = self.bbWBishops
                    else:
                        bbPieces = self.bbBBishops
                elif m.group('piece') == 'R':
                    if self.activeColor == 'w':
                        bbPieces = self.bbWRooks
                    else:
                        bbPieces = self.bbBRooks
                elif m.group('piece') == 'Q':
                    if self.activeColor == 'w':
                        bbPieces = self.bbWQueens
                    else:
                        bbPieces = self.bbBQueens
                elif m.group('piece') == 'K':
                    if self.activeColor == 'w':
                        bbPieces = self.bbWKing
                    else:
                        bbPieces = self.bbBKing
                
                sqTo = algebraicToSquare(m.group('piecedestination'))
                candidates = []
                
                for i in bbPieces.bitsSet():
                    if self.bbPseudoLegalMoves[i].get(sqTo):
                        candidates.append(i)
                if not candidates:
                    return None
                if len(candidates) == 1:
                    sqFrom = candidates[0]
                else:
                    if m.group('origpiececol') and m.group('origpiecerow'):
                        oRow = int(m.group('origpiecerow')) - 1
                        oCol = ord(m.group('origpiececol')) - 97
                        oSq = dll.rowColToSquare(oRow, oCol)
                        for i in candidates:
                            if i == oSq:
                                sqFrom = i
                                break
                    elif m.group('origpiececol'):
                        oCol = ord(m.group('origpiececol')) - 97
                        for i in candidates:
                            if dll.colFromSquare(i) == oCol:
                                sqFrom = i
                                break
                    elif m.group('origpiecerow'):
                        oRow = int(m.group('origpiecerow')) - 1
                        for i in candidates:
                            if dll.rowFromSquare(i) == oRow:
                                sqFrom = i
                                break
                    else:
                        return None
                    
                if sqFrom == -1:
                    return None
                else:
                    return self._move(sqFrom, sqTo, m.group('crowning'), strict)
            
    def _move(self, sqFrom, sqTo, crowning = None, strict = True):
        if self.boardArray[sqFrom] == '0':
            return None
        if strict:
            if self.activeColor == 'w' and self.boardArray[sqFrom] in ('p', 'n', 'b', 'r', 'q', 'k'):
                return None
            if self.activeColor == 'b' and self.boardArray[sqFrom] in ('P', 'N', 'B', 'R', 'Q', 'K'):
                return None
        if not self.canMove(sqFrom, sqTo):
            return None
    
        newboardArray = self.boardArray[:]
        if not crowning:
            newboardArray[sqTo] = self.boardArray[sqFrom]
        else:
            if self.activeColor == 'b':
                crowning = crowning.lower()
            else:
                crowning = crowning.upper()
            newboardArray[sqTo] = crowning
        newboardArray[sqFrom] = '0'
        if self.enPassant != '-' and sqTo == algebraicToSquare(self.enPassant) and self.boardArray[sqFrom] in 'pP':
            if self.activeColor == 'w':
                newboardArray[sqTo - 8] = '0'
            else:
                newboardArray[sqTo + 8] = '0'
        if sqFrom == 60 and sqTo == 62:
            if self.boardArray[sqFrom] == 'k':
                newboardArray[61] = 'r'
                newboardArray[63] = '0'
        if sqFrom == 60 and sqTo == 58:
            if self.boardArray[sqFrom] == 'k':
                newboardArray[59] = 'r'
                newboardArray[56] = '0'
        if sqFrom == 4 and sqTo == 6:
            if self.boardArray[sqFrom] == 'K':
                newboardArray[5] = 'R'
                newboardArray[7] = '0'
        if sqFrom == 4 and sqTo == 2:
            if self.boardArray[sqFrom] == 'K':
                newboardArray[3] = 'R'
                newboardArray[0] = '0'
        
        invboardArray = ['0' for x in range(64)]
        for index, val in enumerate(newboardArray):
            invboardArray[index ^ 56] = val
        pp = "".join(invboardArray)
        pp = FEN.ppCompress(pp)
        activeColor = "wb"[self.activeColor == 'w']
        castlingAvail = self.castlingAvail
        if sqFrom == 0:
            castlingAvail = castlingAvail.replace('Q', '')
        if sqFrom == 7:
            castlingAvail = castlingAvail.replace('K', '')
        if sqFrom == 4:
            castlingAvail = castlingAvail.replace('K', '')
            castlingAvail = castlingAvail.replace('Q', '')
        if sqFrom == 56:
            castlingAvail = castlingAvail.replace('q', '')
        if sqFrom == 63:
            castlingAvail = castlingAvail.replace('k', '')
        if sqFrom == 60:
            castlingAvail = castlingAvail.replace('k', '')
            castlingAvail = castlingAvail.replace('q', '')
        if castlingAvail == "":
            castlingAvail = "-"
            
        enPassant = "-"
        if self.boardArray[sqFrom] == 'p' and sqTo == (sqFrom - 16):
            enPassant = squareToAlgebraic(sqFrom - 8)
        if self.boardArray[sqFrom] == 'P' and sqTo == (sqFrom + 16):
            enPassant = squareToAlgebraic(sqFrom + 8)
            
        halfMoveClock = self.halfMoveClock
        if self.boardArray[sqFrom] in "Pp" or self.boardArray[sqTo] != '0':
            halfMoveClock = '0'
        else:
            halfMoveClock = str(int(halfMoveClock) + 1)
            
        fullMoveNumber = self.fullMoveNumber
        if self.activeColor == 'b':
            fullMoveNumber = str(int(self.fullMoveNumber) + 1)
            
        fs = "%s %s %s %s %s %s" % (pp, activeColor, castlingAvail, enPassant, halfMoveClock, fullMoveNumber)
        f = FEN(fs)
        pgnmove = self.genPgnMoveString(sqFrom, sqTo, crowning)
        if f.isCheck(f.activeColor):
            if f.isCheckMate(f.activeColor):
                pgnmove += "#"
            else:
                pgnmove += "+"
                
        return {'position': f, 'move': pgnmove}
    
    def genPgnMoveString(self, sqFrom, sqTo, crowning = None, full = False):
        resp = {}
        if full:
            resp['prefix'] = "%s." % self.fullMoveNumber
            if self.activeColor == 'b':
                resp['prefix'] += '..'
        else:
            resp['prefix'] = ''
        resp['piece'] = self.boardArray[sqFrom].upper()
        if (sqFrom == 4 and sqTo == 6 and resp['piece'] == 'K') or (sqFrom == 60 and sqTo == 62 and resp['piece'] == 'K'):
            return "%s%s" % (resp['prefix'], '0-0')
        if (sqFrom == 4 and sqTo == 2 and resp['piece'] == 'K') or (sqFrom == 60 and sqTo == 58 and resp['piece'] == 'K'):
            return "%s%s" % (resp['prefix'], '0-0-0')
        if resp['piece'] == 'P':
            resp['piece'] = ''
        resp['disAmbigOrigin'] = ''
        bb = self.getBitboardFromSquare(sqFrom)
        if resp['piece'] != "" and bb.count() > 1:
            occupied = bb.bitsSet()
            for sq in occupied:
                if sq != sqFrom:
                    if self.bbPseudoLegalMoves[sq] & Bitboard(1 << sqTo):
                        if dll.colFromSquare(sqFrom) != dll.colFromSquare(sq):
                            resp['disAmbigOrigin'] += chr(97 + dll.colFromSquare(sqFrom))
                        else:
                            resp['disAmbigOrigin'] += str(dll.rowFromSquare(sqFrom) + 1)
                        break
        if self.boardArray[sqTo] != '0':
            resp['capture'] = 'x'
        else:
            resp['capture'] = ''
        if resp['piece'] == '' and (resp['capture'] == 'x' or dll.colFromSquare(sqFrom) != dll.colFromSquare(sqTo)):
            resp['capture'] = 'x'
            resp['piece'] = chr(97 + dll.colFromSquare(sqFrom))
            resp['destiny'] = squareToAlgebraic(sqTo)
        else:
            resp['destiny'] = squareToAlgebraic(sqTo)
        
        if crowning:
            resp['crowning'] = crowning
        else:
            resp['crowning'] = ""
                
        return "%(prefix)s%(piece)s%(disAmbigOrigin)s%(capture)s%(destiny)s%(crowning)s" % resp    

    def getBitboardFromSquare(self, sq):
        if self.boardArray[sq] == '0':
            return Bitboard()
        if self.boardArray[sq] == 'p':
            return self.bbBPawns
        if self.boardArray[sq] == 'P':
            return self.bbWPawns
        if self.boardArray[sq] == 'n':
            return self.bbBKnights
        if self.boardArray[sq] == 'N':
            return self.bbWKnights
        if self.boardArray[sq] == 'k':
            return self.bbBKing
        if self.boardArray[sq] == 'K':
            return self.bbWKing
        if self.boardArray[sq] == 'b':
            return self.bbBBishops
        if self.boardArray[sq] == 'B':
            return self.bbWBishops
        if self.boardArray[sq] == 'r':
            return self.bbBRooks
        if self.boardArray[sq] == 'R':
            return self.bbWRooks
        if self.boardArray[sq] == 'q':
            return self.bbBQueens
        if self.boardArray[sq] == 'Q':
            return self.bbWQueens

        return Bitboard()
    
    def __repr__(self):
        return self.fenString

    @staticmethod
    def getSqColor(sq):
        if not rowFromSquare(sq) % 2:
            return "bw"[sq % 2]
        else:
            return "wb"[sq % 2]
    
    @staticmethod
    def ppExpand(compressedPP = re.split(r'\s+', defaultFEN)[0]):
        return re.sub(r"\d", lambda matched : "0" * int(matched.group()), compressedPP.replace("/", ""))
    
    @staticmethod
    def ppCompress(expandedPP = None):
        if not expandedPP:
            expandedPP = FEN.ppExpand()
        compressedPP = re.sub(r'(\w{8})(?=\w)', r"\1/", expandedPP)
        compressedPP = re.sub(r'0{1,8}', lambda matched: str(len(matched.group())), compressedPP)
        return compressedPP
    
    def asciiBoard(self):
        return re.sub(r'(\w{8})', r'\1\n', FEN.ppExpand(self.piecePlacement))

#/**************************************************************************************************************/
#/**************************************************************************************************************/

def test():
    import time
    fens = [{'position': FEN(), 'move': ''}]
#   moves = ['f3', 'e6', 'g4', 'Qh4#', 'Nh3']
#    moves = ['e4', 'e5', 'Bc4', 'd6', 'Qf3', 'a6', 'Qxf7#', 'b5', 'Nf3', 'bxc4']
    moves = ['h4', 'd5', 'h5', 'Nd7', 'h6', 'Ndf6', 'hxg7', 'Kd7', 'Rh6', 'Ne8', 'gxf8N#', 'Kd6']
#    moves = ['e4', 'c5' , 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6',
#             'Be3', 'Bg7', 'f3', '0-0', 'Qd2', 'Nc6', '0-0-0']
#    moves = ['e4', 'e6', 'e5', 'd5', 'exd6']

    gtime1 = time.time()
    for index, move in enumerate(moves):
        fens.append(fens[index]['position'].move(move))
        if not fens[len(fens)-1]:
            print "Failed at move %s" % move
            break
        else:
            fen = fens[len(fens) - 1]['position']
            time1 = time.time()
            if fen.isCheck('w'):
                time2 = time.time()
                print "White is in check with move %s (%0.9f)" % (move, time2 - time1)
                time1 = time.time()
                if fen.isCheckMate('w'):
                    time2 = time.time()
                    print "Furthermore, white is checkmated! (%0.9f)\n" % (time2  - time1, )
                    break
            time1 = time.time()
            if fen.isCheck('b'):
                time2 = time.time()
                print "Black is in check with move %s (%0.9f)" % (move, time2 - time1)
                time1 = time.time()
                if fen.isCheckMate('b'):
                    time2 = time.time()
                    print "Furthermore, black is checkmated! (%0.9f)\n" % (time2  - time1, )
                    break

    gtime2 = time.time()
    if fen:
        print fen.asciiBoard()
        print fen
    print "Received Moves:   %s" % " ".join(moves)
    print "Generated Moves: %s" % " ".join([x['move'] for x in fens if x is not None])
    print "Ellapsed time: (%0.9f)" % (gtime2  - gtime1, )

#/**************************************************************************************************************/
#/**************************************************************************************************************/


if __name__ == '__main__':
    test()

#/**************************************************************************************************************/
#/**************************************************************************************************************/
