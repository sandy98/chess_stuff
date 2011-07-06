#!/usr/bin/env python
# -*- coding:utf-8 -*-

import os, sys
import json
from PyQt4 import QtCore, QtGui
from clubclient import ClubClient, atob, btoa, smart_str

class MainWindow(QtGui.QDialog):
    def __init__(self, name, url, *args, **kw):
        super(MainWindow, self).__init__(*args, **kw)
        
        self.sendChatLabel = QtGui.QLabel(self, text = "Mensaje: ")
        self.sendChat = QtGui.QLineEdit(self)
	self.btnExit = QtGui.QPushButton(self, text = "&Salir")
        self.recvChat = QtGui.QTableWidget(self)
        self.recvChat.setColumnCount(2)
        self.recvChat.setHorizontalHeaderLabels(("Socio", "Mensaje"))
        self.recvChat.setColumnWidth(0, 140)
        self.recvChat.setColumnWidth(1, 690)
        #geo = self.recvChat.geometry()
        #geo.setHeight(geo.getRect()[3] * 4)
        #print geo
        #self.recvChat.setGeometry(geo)
        #self.recvChat.resize(geo.getRect()[2], geo.getRect()[3])
        #geo2 = self.recvChat.geometry()
        #print geo2
        
        self.recvChatLayout = QtGui.QVBoxLayout()
        self.sendChatLayout = QtGui.QHBoxLayout()
        self.btnLayout = QtGui.QHBoxLayout()
        
        self.mainLayout = QtGui.QVBoxLayout()
        
        self.mainLayout.addLayout(self.recvChatLayout)
#        self.mainLayout.addStretch()
        self.mainLayout.addLayout(self.sendChatLayout)
        self.mainLayout.addLayout(self.btnLayout)
        
        self.sendChatLayout.addWidget(self.sendChatLabel)
        self.sendChatLayout.addWidget(self.sendChat)
        self.recvChatLayout.addWidget(self.recvChat)
        self.btnLayout.addStretch()
        self.btnLayout.addWidget(self.btnExit)
        
        self.setLayout(self.mainLayout)
        
        self.btnExit.setAutoDefault(False)
#        self.btnExit.setDefault(False)
        self.btnExit.clicked.connect(QtGui.QApplication.exit)
        self.sendChat.returnPressed.connect(self.onSendChat)
        
#        self.setWindowTitle("Chat at Chess Club")
        self.setGeometry(100, 100, 900, 600)
        
        self.username = name
        self.url = url
        
        self.client = ClubClient(self.username, self.url)
        self.client.doConnect()
        self.setWindowTitle("Chat at Chess Club - {0}".format(self.client.username))
        
        self.timer = QtCore.QTimer(self)
        self.timer.timeout.connect(self.readIncoming)
        self.timer.setInterval(200)
        self.timer.start()
        
    
    def onSendChat(self):
        #print self.sendChat.text()
        self.client.sendMessage(smart_str(self.sendChat.text(), "latin-1"))
        self.sendChat.setText("")
        
    def readIncoming(self):
        data = None
        try:
            if not self.client.queue.empty():
                data = self.client.queue.get(False)
                if data:
                    msgs = data.split("\r\n")
                    msgs = [m for m in msgs if len(m)]
                    for m in msgs:
                        obj = json.loads(m)
                        if obj['type'].lower() == 'chat':
                            obj['value'] = atob(obj['value'])
                            #msg = "{sender}: {value}".format(**obj)
                            rows = self.recvChat.rowCount()
                            self.recvChat.insertRow(rows)
                            #print msg
                            #self.recvChat.setCurrentCell(0, rows)
                            self.recvChat.setItem(rows, 0, QtGui.QTableWidgetItem(obj['sender']))
                            self.recvChat.setItem(rows, 1, QtGui.QTableWidgetItem(obj['value']))
                            item = self.recvChat.item(rows, 0)
                            item.setForeground(QtGui.QBrush(QtCore.Qt.blue))
                            self.recvChat.scrollToBottom()
                            
        except Exception, exc:
            print "ERROR - {0}: {1}".format(exc.__class__.__name__, exc.message)
        
        
def main():
    name = 'ernesto'
    if len(sys.argv) > 1:
        name = sys.argv[1]
    url = 'savos.ods.org'
    if len(sys.argv) > 2:
        url = sys.argv[2]

    app = QtGui.QApplication(sys.argv)
    window = MainWindow(name, url)
    window.show()
    return sys.exit(app.exec_())
    
if __name__ == '__main__':
    main()
