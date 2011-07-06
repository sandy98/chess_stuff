
from django.conf.urls.defaults import *


urlpatterns = patterns('comet.views',
    (r'^$', 'comet_start'),
    (r'^sendchat$', 'sendchat'),
)
