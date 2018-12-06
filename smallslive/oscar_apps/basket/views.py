from django.contrib import messages
from django.http import HttpResponse, HttpResponseRedirect
from oscar.apps.basket import views as basket_views
from oscar.apps.basket.views import apply_messages
from oscar_apps.partner.models import StockRecord


class BasketAddView(basket_views.BasketAddView):

    def _clean_basket(self, form):
        """If user is buying tickets, we need to clear up any previous items"""
        # TODO: handle different baskets if possible

        print '**************'
        print 'BasketAddView: '
        print form.product
        if form.product.product_class and 'ticket' in form.product.product_class.slug:
            print 'Ticket found -> clearing basket'
            self.request.basket.flush()

    def form_valid(self, form):
        print '****************************'
        print 'BasketAddView: form_valid'

        offers_before = self.request.basket.applied_offers()

        stockrecord_id = form.cleaned_data.get('stockrecord_id')
        try:
            stockrecord = StockRecord.objects.get(id=stockrecord_id)
        except StockRecord.DoesNotExist:
            stockrecord = None

        # Need to run some logic before adding
        self._clean_basket(form)

        self.request.basket.add_product(
            form.product, form.cleaned_data['quantity'],
            form.cleaned_options(), stockrecord)

        messages.success(self.request, self.get_success_message(form),
                         extra_tags='safe noicon')

        # Check for additional offer messages
        apply_messages(self.request, offers_before)

        # Send signal for basket addition
        self.add_signal.send(
            sender=self, product=form.product, user=self.request.user,
            request=self.request)

        if self.request.is_ajax():
            print 'return  200 (ajax)'
            return HttpResponse(status=200)
        else:
            return HttpResponseRedirect(self.get_success_url())
