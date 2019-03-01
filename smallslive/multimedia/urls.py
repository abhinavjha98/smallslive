from django.conf.urls import patterns, include, url


urlpatterns = patterns('multimedia.views',
    url(r"^media-redirect/(?P<recording_id>\d+)/$", 'media_redirect',
        name="media_redirect"),
    url(r"^update_media_viewcount/$", 'update_media_viewcount',
        name="update_media_viewcount"),
    url(r"^most-popular-videos/$", 'most_popular_videos',
        name="most_popular_videos"),
    url(r"^most-popular-weekly-videos/$", 'most_popular_weekly_videos',
        name="most_popular_weekly_videos"),
    url(r"^most-recent-videos/$", 'most_recent_videos',
        name="most_recent_videos"),
    url(r"^most-popular-audio/$", 'most_popular_audio',
        name="most_popular_audio"),
    url(r"^most-popular-weekly-audio/$", 'most_popular_weekly_audio',
        name="most_popular_weekly_audio"),
    url(r"^most-recent-audio/$", 'most_recent_audio',
        name="most_recent_audio"),
    url(r"^upload_track/$", 'upload_track',
        name="upload_track", kwargs={'category': 'track'}),
    url(r"^upload_track_preview/$", 'upload_track',
        name="upload_track_preview", kwargs={'category': 'preview'}),
    url(r'^upload_image_preview/$', 'upload_image_preview',
        name="upload_image_preview"),
    url(r"^my-downloads/$", 'new_downloads', name="my-downloads"),
    url(r"^new-downloads/$", 'new_downloads', name="new-downloads"),
    url(r'^library/(?P<pk>\d+)$', 'album_view', name='album_view'),
    url(r'^library/add-tracks$', 'add_tracks', name='add_tracks'),

)
