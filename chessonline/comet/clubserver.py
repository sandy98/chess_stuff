#!/usr/bin/env python

import os, sys
import multiprocessing
import json

curdir = os.path.abspath(os.path.dirname(__file__))
parentdir = os.path.split(curdir)[0]
django_settings_module = "settings"

sys.path.append(parentdir)
os.environ['DJANGO_SETTINGS_MODULE'] = django_settings_module

from settings import TCP_DATA_PORT
from django.contrib.auth.models import User
from django.utils.encoding import smart_str

from twisted.internet.protocol import Factory, Protocol
if 'linux' in sys.platform:
    from twisted.internet.epollreactor import EPollReactor as Reactor
else:
    from twisted.internet.selectreactor import SelectReactor as Reactor

from base64 import b64decode as atob
from base64 import b64encode as btoa

reactor = Reactor()


class ClubMember(Protocol):
    @staticmethod
    def arr2str(arr):
        resp = u""
        for num in arr:
            try:
                resp += unichr(num)
            except:
                resp += u'?'
        return resp
    
    def connectionMade(self):
        self.mark = "%s:%s" % (self.transport.getPeer().host, self.transport.getPeer().port)
        self.username = ''
        self.uid = 0
        self.factory.members[self.mark] = self

        for msg in self.factory.chatmsgs[-10:]:
            self.transport.write(smart_str("%s\r\n" % msg))
        
    def connectionLost(self, reason):
        del self.factory.members[self.mark]
        self.factory.updateConnectedMembersList()
        
    def dataReceived(self, data):
        print "Received:", data
        message = json.loads(data)
        self.processMessage(message)        
        
    def processMessage(self, message):
        if message['type'].lower() == 'login':
            self.doLogin(message)
        elif message['type'].lower() == 'chat':
            self.sendChat(message)
        elif message['type'].lower() == 'updateconnectedlist':
            self.refreshConnectedList(message)
    
    def refreshConnectedList(self, message):
        self.transport.write(smart_str("{0}\r\n".format(json.dumps(message))))
            
    def doLogin(self, message):
        self.username = message['username']
        self.uid = message['uid']
        self.factory.updateConnectedMembersList()
        
    def sendChat(self, message):
        strmsg = json.dumps(message)
        self.factory.chatmsgs.append(strmsg)
        for member in self.factory.members:
            self.factory.members[member].transport.write(smart_str("%s\r\n" % strmsg))
    
class ClubServer(Factory):
    protocol = ClubMember

    def __init__(self):
        #super(ClubServer, self).__init__()
        #Factory.__init__(self)
        self.members = {}
        self.chatmsgs = []
        
    def updateConnectedMembersList(self):
        message = dict(type = 'UPDATECONNECTEDLIST', value = [(m.username, m.uid) for m in self.members.values()])
        for member in self.members:
            try:
                self.members[member].processMessage(message)
            except Exception, exc:
                try:
                    print "{0}: {1}".format(exc.__class__.name, exc.message if exc.message else "Error desconocido.")
                except:
                    print "Error en \"updateConnectedMembersList\": {0}".format(exc)
    def get_members(self):
        return self.members
    
server = ClubServer()

def main():
    try:
        print "Serving at port %s" % (TCP_DATA_PORT, )
        reactor.listenTCP(TCP_DATA_PORT, server)
        reactor.run()
        print "\nService stopped."
    except:
        pass
    
serverproc = multiprocessing.Process(target = main, args = ())
serverproc.name = "serverproc"
serverproc.daemon = True

if __name__ == '__main__':
    main()