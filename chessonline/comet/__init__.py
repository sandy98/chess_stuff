
#import stomp
#
#class StompListener(object):
#    def on_error(self, headers, message):
#        pass
#        print u'Received an error: < %s >' % message
#
#    def on_message(self, headers, message):
#        pass
#        print u'Received a message: < %s >' % message
#
#stomp_conn = stomp.Connection()
#
#stomp_conn.set_listener('', StompListener())
#
#try:
#    stomp_conn.start()
#    stomp_conn.connect()
#    stomp_conn.subscribe(destination='/chat/general', ack='auto')
#
#except Exception, exc:
#    print "Exception: %s\nMensaje: %s" % (exc.__class__.__name__, exc.message)

#from clubserver import server
