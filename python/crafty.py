#!/usr/bin/env python
# -*- coding: utf-8 -*-

from subprocess import Popen, PIPE
#import threading
import multiprocessing
#import Queue
import time
import sys
import random

class Engine(object):
    def __init__(self, engineName = "crafty"):
#        self.queue = Queue.Queue()
        self.queue = multiprocessing.Queue()
        self.engine = Popen(engineName, stdin = PIPE, stdout = PIPE)
#        self.listeningThread = threading.Thread(target = self.listen)
        self.listeningThread = multiprocessing.Process(target = self.listen)
        self.engine.stdin.write("xboard\n")
        self.listeningThread.daemon = True
        self.listeningThread.start()
    
    def listen(self):
        while True:
            data = self.engine.stdout.readline()
            if data.startswith('move') or data.startswith('My move is'):
                arrResp = data.replace("\n", "").split()
                self.queue.put("%s" % arrResp[len(arrResp) - 1])
            else:
                pass
                #print("Datos que no son un movimiento...%s" % data)
        
    def move(self, moveData):
        self.engine.stdin.write("%s\n" % moveData)
    
    def __del__(self):
        self.engine.stdin.write("quit\n")
        self.engine.kill()
        print "Chess engine says good bye"
        
def test():
    engine = random.choice(("crafty", "gnuchess"))
    if len(sys.argv) > 1:
        engine = sys.argv[1]
    if engine not in ("crafty", "gnuchess"):
        print "Unknown engine. Resetting..."
        engine = random.choice(("crafty", "gnuchess"))
    print "Starting %s\n" % engine.title() 
    crafty = Engine(engine)
    print "Please make a move.\n"
    while True:
        move = raw_input()
        if move.lower().startswith('x'):
            crafty.engine.stdin.write("quit\n")
            crafty.listeningThread.terminate()
            del crafty
            time.sleep(0)
            break
        crafty.move(move)
        print crafty.queue.get()
        

if __name__ == '__main__':
    test()
    
