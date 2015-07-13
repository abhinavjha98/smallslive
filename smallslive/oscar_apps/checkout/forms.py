from django.conf import settings
import floppyforms
import stripe
from django import forms
from localflavor.us import forms as us_forms
from localflavor.us.us_states import STATE_CHOICES
from model_utils import Choices
from oscar.apps.checkout import forms as checkout_forms
from oscar.apps.payment import forms as payment_forms
from oscar.apps.order.models import BillingAddress


STATE_CHOICES_WITH_EMPTY = (('', ''),) + STATE_CHOICES
stripe.api_key = settings.STRIPE_SECRET_KEY


class ShippingAddressForm(checkout_forms.ShippingAddressForm):
    state = us_forms.USStateField(widget=floppyforms.Select(choices=STATE_CHOICES_WITH_EMPTY), required=False)


class PaymentForm(forms.Form):
    PAYMENT_CHOICES = Choices('paypal', 'credit-card')
    payment_method = forms.ChoiceField(required=True, choices=PAYMENT_CHOICES)
    number = forms.CharField(required=True, min_length=16, max_length=20)
    exp_month = forms.CharField(required=True, max_length=2)
    exp_year = forms.CharField(required=True, min_length=2, max_length=4)
    cvc = forms.CharField(required=True, min_length=3, max_length=4)
    name = forms.CharField(required=True)

    def clean(self):
        data = super(PaymentForm, self).clean()
        if not self.errors:
            try:
                token = stripe.Token.create(
                    card={
                        "number": data.get('number'),
                        "exp_month": data.get('exp_month'),
                        "exp_year": data.get('exp_year'),
                        "cvc": data.get('cvc'),
                        "name": data.get('name'),
                    },
                )
                self.token = token.id
            except stripe.error.CardError, e:
                error = e.json_body['error']
                self.add_error(error['param'], error['message'])
        return data


class BillingAddressForm(payment_forms.BillingAddressForm):
    """
    Extended version of the core billing address form that adds a field so
    customers can choose to re-use their shipping address.
    """
    SAME_AS_SHIPPING, NEW_ADDRESS = 'same-address', 'different-address'
    CHOICES = (
        (SAME_AS_SHIPPING, 'Use shipping address'),
        (NEW_ADDRESS, 'Enter a new address'),
    )
    billing_option = forms.ChoiceField(
        widget=forms.RadioSelect, choices=CHOICES, initial=SAME_AS_SHIPPING)
    state = us_forms.USStateField(widget=floppyforms.Select(choices=STATE_CHOICES_WITH_EMPTY), required=False)

    class Meta(payment_forms.BillingAddressForm):
        model = BillingAddress
        exclude = ('search_text',)

    def __init__(self, shipping_address, data=None, *args, **kwargs):
        # Store a reference to the shipping address
        self.shipping_address = shipping_address

        super(BillingAddressForm, self).__init__(data, *args, **kwargs)

        # If no shipping address (eg a download), then force the
        # 'same_as_shipping' field to have a certain value.
        if shipping_address is None:
            self.fields['billing_option'].choices = (
                (self.NEW_ADDRESS, 'Enter a new address'),)
            self.fields['billing_option'].initial = self.NEW_ADDRESS

        # If using same address as shipping, we don't need require any of the
        # required billing address fields.
        if data and data.get('billing_option', None) == self.SAME_AS_SHIPPING:
            for field in self.fields:
                if field != 'billing_option':
                    self.fields[field].required = False

    def _post_clean(self):
        # Don't run model validation if using shipping address
        if self.cleaned_data.get('billing_option') == self.SAME_AS_SHIPPING:
            return
        super(BillingAddressForm, self)._post_clean()

    def save(self, commit=True):
        if self.cleaned_data.get('billing_option') == self.SAME_AS_SHIPPING:
            # Convert shipping address into billing address
            billing_addr = BillingAddress()
            self.shipping_address.populate_alternative_model(billing_addr)
            if commit:
                billing_addr.save()
            return billing_addr
        return super(BillingAddressForm, self).save(commit)