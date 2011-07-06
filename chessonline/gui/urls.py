
from django.conf.urls.defaults import *


urlpatterns = patterns('gui.views',
    (r'^$', 'index'),
    (r'^testboard$', 'testboard'),
    (r'^testprogress$', 'testprogress'),
    (r'^example(?P<number>\d+)','examples'),
)
