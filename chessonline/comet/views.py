# Create your views here.
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.shortcuts import redirect, render_to_response
import json
import random
from chessonline.settings import TCP_DATA_PORT, ORBITED_HTTP_PORT
from django.contrib.auth.models import User

def comet_start(request):
    hostname = request.get_host()
    if ":" in hostname:
        hostname = hostname.split(":")[0]
        
    resp_dic = dict(titleinfo = 'Chat Room', hostname = hostname)
    resp_dic['orbited_port'] = ORBITED_HTTP_PORT
    resp_dic['twisted_port'] = TCP_DATA_PORT
    if request.user.is_authenticated():
        resp_dic['username'] = request.user.username
        resp_dic['uid'] = request.user.pk
    else:
        resp_dic['username'] = 'Guest%0.5d' % random.randint(1, 10000)
        resp_dic['uid'] = 0
    return render_to_response('comet/index.html', resp_dic)
    
def sendchat(request):
    try:
        channel = request.POST.get('channel')
        realmsg = request.POST.get('msg')
        msg = json.decoder.JSONDecoder(encoding = 'latin-1').decode(realmsg)
        msgtype = msg['type']
        if msgtype != 'CHAT_GENERAL':
            #print ("BAD: Not a general chat message: %s" % msg['data'])
            return HttpResponse("BAD: Not a general chat message", mimetype='text/plain')    
        data = msg['data']
        amsg = [ord(x) for x in data]
        sender = request.user.get_full_name() if request.user.is_authenticated() else "Anonymous"
        if not sender and request.user.is_authenticated():
            sender = request.user.username
        obj = dict(sender = sender, 
                   data = amsg,
                   type = "CHAT")
        #stomp_conn.send(json.dumps(obj), destination = channel)
    except Exception, exc:
        print "Error(%s): %s" % (exc.__class__.__name__, exc.message)

    return HttpResponse("OK", mimetype='text/plain')