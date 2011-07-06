#!/usr/bin/env python
# -*- coding: utf-8 -*-


import os
import socket
import asyncore, asynchat

PORT = 6400

class ClubServer(asyncore.dispatcher):
    
    def __init__(self, port = PORT, numclients = 5):
#        super(MainServerSocket, self).__init__()
        asyncore.dispatcher.__init__(self)
        
        self.members = []
        
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.bind(('', port))
        self.listen(numclients)
    
    def handle_accept(self):
        newSocket, address = self.accept()
        print "Connected from", address
        self.members.append(MemberProxy(newSocket, self))

    def notify(self, who, msg):
        for m in self.members:
            m.push("%s\r\n%s" % ("Content-type: text/plain", msg))

class MemberProxy(asynchat.async_chat):

    def __init__(self, conn, club):
        asynchat.async_chat.__init__(self, conn)
        self.club = club
        self.set_terminator('\n')
        self.data = []

    def collect_incoming_data(self, data):
        self.data.append(data)
    
    def found_terminator(self):
        self.club.notify(self, "%s: %s%s" % (self.getpeername(), ''.join(self.data).upper(), "\n"))
        self.data = []
        
    def handle_close(self):
        print "Disconnected from", self.getpeername()
        self.club.members.remove(self)
        self.close()
       
        
def main():
    if len(os.sys.argv) > 1:
        try:
            port = int(os.sys.argv[1])
        except ValueError:
            port = PORT
    else:
            port = PORT
            
    print "Chess Club serving at port %d" % port
    
    try:
        server = ClubServer(port = port)
        asyncore.loop()
        
    except KeyboardInterrupt:
        print "\nBye...\n"


if __name__ == '__main__':
    main()



