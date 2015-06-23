from oscar.apps.dashboard.catalogue import views as oscar_views
from multimedia.forms import TrackFileForm
from .forms import TrackFormSet


class ProductCreateUpdateView(oscar_views.ProductCreateUpdateView):
    def __init__(self, *args, **kwargs):
        super(ProductCreateUpdateView, self).__init__(*args, **kwargs)
        self.formsets['track_formset'] = TrackFormSet

    def get_context_data(self, **kwargs):
        if self.product_class.slug != 'album':
            del self.formsets['track_formset']
        context = super(ProductCreateUpdateView, self).get_context_data(**kwargs)
        return context
