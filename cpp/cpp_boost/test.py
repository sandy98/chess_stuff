#!/usr/bin/env python
# -*- coding: utf-8 -*-

from cppchessrules import FEN

#/**************************************************************************************************************/
#/**************************************************************************************************************/

def test():
    import time
    fens = [{'position': FEN(), 'move': ''}]
#   moves = ['f3', 'e6', 'g4', 'Qh4#', 'Nh3']
#    moves = ['e4', 'e5', 'Bc4', 'd6', 'Qf3', 'a6', 'Qxf7#', 'b5', 'Nf3', 'bxc4']
    moves = ['h4', 'd5', 'h5', 'Nd7', 'h6', 'N7f6', 'hxg7', 'Kd7', 'Rh6', 'Ne8', 'gxf8N#', 'Kd6']
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
