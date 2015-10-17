from django.conf import settings
from django.contrib.sites.models import Site
from django.core.mail import EmailMultiAlternatives, EmailMessage
from oscar.apps.order.signals import order_placed
from oscar.apps.order.abstract_models import AbstractOrder
from oscar.core.loading import get_model, get_class

CommunicationEventType = get_model('customer', 'CommunicationEventType')



class Order(AbstractOrder):

    def has_physical_products(self):
        physical_count = self.lines.filter(product__product_class__requires_shipping=True).count()
        return physical_count > 0

    def has_digital_products(self):
        digital_count = self.lines.filter(product__product_class__requires_shipping=False).count()
        return digital_count > 0
    
    # signal receiving method to send email to fulfilment partner
    def send_fulfilment_request(sender, **kwargs):
        code = 'ORDER_PLACED'
        order = kwargs['order']
        user = kwargs['user']
        if order.has_physical_products():
            ctx = {
                'user': user,
                'order': order,
                'site': Site.objects.get_current(),
                'lines': order.lines.all()
            }
            messages = CommunicationEventType.objects.get_and_render(code, ctx)
            from_email = to_email = settings.OSCAR_FROM_EMAIL
            if messages['html']:
                email = EmailMultiAlternatives(messages['subject'],
                                               messages['body'],
                                               from_email=from_email,
                                               to=[to_email])
                email.attach_alternative(messages['html'], "text/html")
            else:
                email = EmailMessage(messages['subject'],
                                     messages['body'],
                                     from_email=from_email,
                                     to=[to_email])
            email.send()

    order_placed.connect(send_fulfilment_request)

# add import statement at the end, so that django imports overridden model names first
from oscar.apps.order.models import *