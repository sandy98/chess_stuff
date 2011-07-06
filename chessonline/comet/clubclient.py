#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, sys
from multiprocessing import Queue, Process
import json
import select

curdir = os.path.abspath(os.path.dirname(__file__))
parentdir = os.path.split(curdir)[0]
django_settings_module = "settings"

sys.path.append(parentdir)
os.environ['DJANGO_SETTINGS_MODULE'] = django_settings_module

from settings import TCP_DATA_PORT
from django.contrib.auth.models import User
from django.utils.encoding import smart_str

from base64 import b64decode as atob
from base64 import b64encode as btoa

import socket

class ClubClient(socket.socket):
    def __init__(self, user_name = 'ernesto', cluburl = 'savos.ods.org'):
        super(ClubClient, self).__init__()
        
        #self.setblocking(0)
        #self.settimeout(1)
        
        self.listenLoop = None
        self.processMsg = None
        self.queue = Queue()
        try:
            self.user = User.objects.get(username = user_name);
            self.trueUser = True
        except:
            self.user = "Guest_{0}".format(user_name)
            self.trueUser = False
        
        if self.trueUser:    
            if self.user.first_name:
                self.username = self.user.first_name
            else:
                self.username = self.user.username
            self.uid = self.user.pk
        else:
            self.username = self.user
            self.uid = 0
        
        self.cluburl = cluburl
        
        self.connected = False
            
    def listenToPeer(self):
        while True:
            r, w, x = select.select([self], [], [self], 0.2)
            if x:
                print "Me desconectaron."
                self.doDisconnect()
                return
            if r:
                try:
                    data = self.recv(4096)
                    if data:
                        if self.processMsg:
                            self.processMsg(data)
                        else:
                            self.queue.put(data)
                except:
                    print "Desconexion inesperada...Se intenta reconexion."
                    self.connected = False
                    try:
                        self.doConnect()
                        if not self.connected:
                            print "Intento de reconexion fallido. Terminando programa."
                            return
                    except:
                        return
            
            
    def sendMessage(self, value, msgtype = 'CHAT'):
        if not self.connected:
            return
        if msgtype.lower() == 'chat':
            value = btoa(value)
        msg = dict(sender = self.username, type = msgtype, value = value)
        jmsg = json.dumps(msg)
        try:
            self.send(smart_str("%s\r\n" % jmsg))
        except Exception, exc:
            print "ERROR: {0} - {1}".format(exc.__class__.__name__, exc.message)
            self.doDisconnect()
            
    def doConnect(self):
        if self.connected:
            return not self.connected
        self.connected = not self.connect_ex((self.cluburl, TCP_DATA_PORT))
        if self.connected:
            self.listenLoop = Process(target = self.listenToPeer, args = ())
            self.listenLoop.daemon = True
            self.listenLoop.start()
            msg = {"type":"LOGIN","uid": self.uid, "username": self.username}
            jmsg = json.dumps(msg)
            self.send(smart_str(jmsg))
        return self.connected
    
    def doDisconnect(self):
        if not self.connected:
            return self.connected
        self.listenLoop.terminate()
        self.close()
        self.connected = False
        return not self.connected


def processIncomingData(data):
    msgs = [m for m in data.split("\r\n") if len(m)]
    for m in msgs:
        try:
            msg = json.loads(m, encoding = 'latin-1')
            if msg['type'].lower() == 'chat':
                print u"{0}: {1}".format(msg['sender'], unicode(atob(msg['value']), 'latin-1', 'ignore'))
            elif msg['type'].lower() == 'updateconnectedlist':
                list = msg['value']
                print "\nConnected List"
                print "========= ===="
                for m in list:
                    print m[0], m[1]
                print
        except Exception, exc:
            print "{0}: {1}".format(exc.__class__.name, exc.message if exc.message else "Error desconocido.")

def processOutgoingData(client):
    while True:
        try:
            chat_msg = raw_input()
        except KeyboardInterrupt:
            chat_msg = 'quit'
        finally:    
            if chat_msg.lower() == "quit":
                print "\nHasta luego. Vuelva pronto a chatear."
                client.doDisconnect()
                return
        client.sendMessage(chat_msg)
    
def main():
    name = 'ernesto'
    if len(sys.argv) > 1:
        name = sys.argv[1]
    url = 'savos.ods.org'
    if len(sys.argv) > 2:
        url = sys.argv[2]
    client = ClubClient(name, url)
    client.processMsg = processIncomingData
    client.doConnect()
    processOutgoingData(client)    
        
if __name__ == '__main__':
    main()