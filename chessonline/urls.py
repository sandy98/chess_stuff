from django.conf.urls.defaults import *
from chessonline import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    # (r'^chessonline/', include('chessonline.foo.urls')),
    (r'^gui/', include('chessonline.gui.urls')),
    (r'^socios/', include('chessonline.socios.urls')),
    (r'^comet/', include('chessonline.comet.urls')),
    (r'^$', 'django.views.generic.simple.redirect_to', {'url': 'gui'}),
    (r'^accounts/login/$', 'django.contrib.auth.views.login'),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    (r'^admin/', include(admin.site.urls)),
)

if settings.DEBUG:
    urlpatterns += patterns(
        '',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve',
         {'document_root': settings.MEDIA_ROOT, 'show_indexes': True}),
        (r'^favicon\.ico$', 'django.views.generic.simple.redirect_to', {'url': '/media/favicon.ico'})
    )
