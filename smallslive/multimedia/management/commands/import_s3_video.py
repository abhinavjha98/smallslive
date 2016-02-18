import logging
import os
import datetime
from django.conf import settings
from django.core.management.base import BaseCommand
from boto.s3.connection import S3Connection
from django.utils import timezone
from events.models import Recording, Event
from multimedia.models import MediaFile

logger = logging.getLogger('cron')


class Command(BaseCommand):
    help = 'Imports the newly added video files from S3 and assigns them to correct events'

    def handle(self, *args, **options):
        env = os.environ.get('CRON_ENV')
        now = timezone.now()
        # heroku scheduler launches the task every day, we make sure it only really does the import
        # twice a week
        if env == "heroku" and now.weekday() in (0,1,3,4,5):
            logger.info('Today is not importing day')
            return

        conn = S3Connection(settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY)
        self.bucket = conn.get_bucket("smallslivevid")
        self.files_imported = 0

        if len(args) == 2:
            month, year = int(args[0]), int(args[1])
            start_date = timezone.make_aware(timezone.datetime(year, month, 1), timezone.get_current_timezone())
        else:
            start_date = now - datetime.timedelta(days=30)
        for event in Event.objects.filter(start__gte=start_date, start__lte=now).order_by('start'):
            for set_num in range(1, 7):
                filename = '{0.year}-{0.month:02}-{0.day:02}/360p/{1}-{2}_360p.mp4'.format(
                    event.listing_date(), event.id, set_num)
                key = self.bucket.get_key(filename)
                print filename
                if key:
                    print "importing {0}".format(filename)
                    try:
                        recording = Recording.objects.get(event_id=event.id,
                                                          set_number=set_num,
                                                          media_file__category='set',
                                                          media_file__media_type='video')
                    except Recording.DoesNotExist:
                        recording = Recording(event_id=event.id, set_number=set_num)
                    if not recording.media_file_id:
                        media_file, created = MediaFile.objects.get_or_create(category='set',
                                                                              media_type="video",
                                                                              sd_video_file=filename,
                                                                              size=key.size)
                        recording.media_file = media_file
                        recording.save()
                        self.files_imported += 1

        self.stdout.write("{0} new files imported".format(self.files_imported))