from django.conf import settings
from django.core.urlresolvers import reverse
from artists.models import Artist
from oscar_apps.partner.strategy import Selector
from .models import Product, UserCatalogue, UserCatalogueProduct


class ProductMixin(object):

    def __init__(self):

        self.digital_album_list = []
        self.physical_album_list = []
        self.track_list = []
        self.album_list = []

    def get_products(self):

        self.get_purchased_products()
        self.artists_with_media = Artist.objects.exclude(artistproduct=None)
        if self.request.user.is_authenticated():
            self.active_card = self.request.user.get_active_card()

        # Clean basket
        # self.request.basket.flush()

        self.payment_info_url = reverse('payment_info')
        self.donation_preview_url = reverse('donation_preview')

        # TODO: create mixin for gifts so it can be used in become a supporter too.
        self.gifts = []
        self.costs = []
        selector = Selector()
        strategy = selector.strategy(
            request=self.request, user=self.request.user)

        self.album_product = self.object
        products = Product.objects.filter(parent=self.album_product, product_class__slug__in=[
            'physical-album',
            'digital-album'
        ])
        for product in products:
            self.gifts.append(product)
            if product.variants.count():
                stock = product.variants.first().stockrecords.first()
                self.costs.append(
                    stock.cost_price)
            else:
                stock = product.stockrecords.first()
                if stock:
                    self.costs.append(
                        stock.cost_price)

        variant = Product.objects.filter(parent=self.album_product, product_class__slug__in=[
            'physical-album',
            'digital-album'
        ]).first()

        self.is_full = None
        if variant and variant.product_class.slug == 'digital-album':
            for album in self.album_list:
                if self.object.pk == album['parent'].pk:
                    self.is_full = 'full_album'
        self.child_product = variant

        self.gifts.sort(
            key=lambda x: strategy.fetch_for_product(product=x).price.incl_tax)

        self.comma_separated_leaders = self.album_product.get_leader_strings()

    def get_purchased_products(self):
        """ Retrieve products purchased by current user:
            Tracks, CD, or Digital HD. Info comes from the order lines.
            Set up a list of all Albums with Tracks bought.
            CD and HD gives access to all Tracks.

        """
        current_user = self.request.user
        if not current_user.is_authenticated():
            self.album_list = []
        else:
            catalogue_access = UserCatalogue.objects.filter(user=self.request.user).first()
            if catalogue_access and catalogue_access.has_full_catalogue_access:
                self.digital_album_list = Product.objects.filter(product_class__slug='digital-album')
                self.physical_album_list = Product.objects.filter(product_class__slug='physical-album')
                self.track_list = []
            else:
                self.digital_album_list = Product.objects.filter(
                    product_class__slug='digital-album', access__user=self.request.user)
                self.physical_album_list = Product.objects.filter(
                    product_class__slug='physical-album', access__user=self.request.user)
                self.track_list = UserCatalogueProduct.objects.filter(
                    product__product_class__slug='track', user=self.request.user)
            self.album_list = []
            for album in list(self.digital_album_list) + list(self.physical_album_list):
                album_info = {
                    'parent': album.parent,
                    'bought_tracks': [track.pk for track in album.parent.tracks.all()],
                    'album_type': 'full_album',
                }
                # Avoid duplicates
                album = [a for a in self.album_list if a['parent'] == album.parent]
                if not album:
                    self.album_list.append(album_info)

            # Iterate tracks and accumulate for album
            for track in self.track_list:
                # Search album_list to see if already in list
                # Find the position of the album in the list, if it exists
                albums_matched = [a for a in enumerate(self.album_list)
                                  if a[1]['parent'] == track.product.album]
                if albums_matched:
                    index = albums_matched[0][0]
                    # Add the track to purchased tracks it's not there already.
                    album = albums_matched[0][1]
                    bought_tracks = album['bought_tracks']
                    if track.product.pk not in bought_tracks:
                        bought_tracks.append(track.product.pk)
                        # Update the bought track.
                        self.album_list[index]['bought_tracks'] = bought_tracks
                else:
                    album_info = {
                        'parent': track.product.album,
                        'bought_tracks': [track.product.pk],
                        'album_type': 'track_album',
                        'total_donation': current_user.get_project_donation_amount(track.product.album.pk)
                    }
                    self.album_list.append(album_info)

                self.album_list = sorted(self.album_list, key=lambda k: k['parent'].title)