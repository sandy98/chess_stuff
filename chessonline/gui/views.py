# Create your views here.
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect, render_to_response
from django.utils.safestring import mark_safe


def index(request):
    response = HttpResponse()
    response.write("""
                   <html>
                   <head>
                        <title> .::. Chess Club .::.</title>
                   </head>
                   <body>
                   """)
    response.write("Terreno donde se va a construir el Club de Ajedrez<br/>")
    response.write("Acceda al <a href='testboard'>tablero de prueba.</a><br/>")
    response.write("Acceda al <a href='../comet'>sal&oacute;n de chat.</a><br/>")
    response.write("Dir&iacute;jase a la <a href='../admin'>Administraci&oacute;n.</a><br/>")
    response.write("</body></html>")
    return response

def testboard(request):
    return render_to_response("gui/test.html", {'titleinfo': "Tablero de Prueba"})
    
def testprogress(request):
    return render_to_response("gui/test_progress.html", {'titleinfo': "Prueba UI Progress Bar"})

def examples(request, number):
    return render_to_response("gui/example%s.html" % number)