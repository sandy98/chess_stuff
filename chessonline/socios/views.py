# Create your views here.
from django.http import HttpResponse, Http404, HttpResponseRedirect


def index(request):
    return HttpResponse("SOCIOS", mimetype="text/plain")
