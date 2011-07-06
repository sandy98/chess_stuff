
#import thread
#import os

#os.chdir(os.path.abspath(os.path.dirname(__file__)))
#
#from threading import Thread
#from orbited import start
#
#class OrbitedThread(Thread):
#    def run(self):
#        start.main()
#
##thread.start_new_thread(start.main, None)
#orbThread = OrbitedThread()
#orbThread.start()


from comet import clubserver

comet_server_started = False

if not comet_server_started:
    comet_server_started = True
    try:
        clubserver.serverproc.start()
    except:
        pass
